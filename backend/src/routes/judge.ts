import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../plugins/prisma.js'
import { requireRole, JwtPayload } from '../middleware/auth.js'
import { writeAuditLog } from '../services/auditLog.js'

// Score weights per SRS §4.5
const WEIGHTS = {
  nationalImpact: 0.40,
  technologyMethodology: 0.30,
  requirementCompliance: 0.15,
  feasibility: 0.15,
}

const ScoreSchema = z.object({
  nationalImpactScore: z.number().min(0).max(100),
  technologyMethodologyScore: z.number().min(0).max(100),
  requirementComplianceScore: z.number().min(0).max(100),
  feasibilityScore: z.number().min(0).max(100),
  comments: z.string().max(2000).optional(),
})

function calcWeighted(s: z.infer<typeof ScoreSchema>): number {
  return (
    s.nationalImpactScore * WEIGHTS.nationalImpact +
    s.technologyMethodologyScore * WEIGHTS.technologyMethodology +
    s.requirementComplianceScore * WEIGHTS.requirementCompliance +
    s.feasibilityScore * WEIGHTS.feasibility
  )
}

export async function judgeRoutes(app: FastifyInstance) {
  // GET /api/v1/judge/submissions — passed proposals only
  app.get('/submissions', { preHandler: [requireRole('JUDGE', 'ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { page = '1', limit = '20' } = request.query as Record<string, string>

    const submissions = await prisma.submission.findMany({
      where: {
        isActive: true,
        moderatorReview: { status: 'PASS' },
      },
      include: {
        team: true,
        files: { orderBy: { uploadedAt: 'desc' }, take: 1 },
        moderatorReview: true,
        judgeScores: { where: { judgeUserId: actor.userId } },
        scoreAggregate: true,
      },
      orderBy: { submittedAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    })

    const latestPerTeam = Array.from(
      new Map(submissions.map((submission) => [submission.teamId, submission])).values(),
    )

    const total = await prisma.submission.count({
      where: { isActive: true, moderatorReview: { status: 'PASS' } },
    })

    return { data: latestPerTeam, total, page: Number(page), limit: Number(limit) }
  })

  // POST /api/v1/judge/submissions/:submissionId/scores
  app.post('/submissions/:submissionId/scores', { preHandler: [requireRole('JUDGE', 'ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { submissionId } = request.params as { submissionId: string }
    const body = ScoreSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    // Verify submission passed pre-screen
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { moderatorReview: true },
    })
    if (!submission || submission.moderatorReview?.status !== 'PASS') {
      return reply.status(403).send({ error: 'Submission has not passed pre-screening' })
    }

    const existing = await prisma.judgeScore.findUnique({
      where: { submissionId_judgeUserId: { submissionId, judgeUserId: actor.userId } },
    })

    const score = await prisma.judgeScore.upsert({
      where: { submissionId_judgeUserId: { submissionId, judgeUserId: actor.userId } },
      update: {
        nationalImpactScore: body.data.nationalImpactScore,
        technologyMethodologyScore: body.data.technologyMethodologyScore,
        requirementComplianceScore: body.data.requirementComplianceScore,
        feasibilityScore: body.data.feasibilityScore,
        comments: body.data.comments,
      },
      create: {
        submissionId,
        judgeUserId: actor.userId,
        nationalImpactScore: body.data.nationalImpactScore,
        technologyMethodologyScore: body.data.technologyMethodologyScore,
        requirementComplianceScore: body.data.requirementComplianceScore,
        feasibilityScore: body.data.feasibilityScore,
        comments: body.data.comments,
      },
    })

    // Recalculate aggregate
    const allScores = await prisma.judgeScore.findMany({ where: { submissionId } })
    const judgeCount = allScores.length
    const avgNational = allScores.reduce((a, s) => a + s.nationalImpactScore, 0) / judgeCount
    const avgTech = allScores.reduce((a, s) => a + s.technologyMethodologyScore, 0) / judgeCount
    const avgCompliance = allScores.reduce((a, s) => a + s.requirementComplianceScore, 0) / judgeCount
    const avgFeasibility = allScores.reduce((a, s) => a + s.feasibilityScore, 0) / judgeCount

    const totalWeighted = calcWeighted({
      nationalImpactScore: avgNational,
      technologyMethodologyScore: avgTech,
      requirementComplianceScore: avgCompliance,
      feasibilityScore: avgFeasibility,
    })

    await prisma.scoreAggregate.upsert({
      where: { submissionId },
      update: { totalWeighted, judgeCount, calculatedAt: new Date() },
      create: { submissionId, teamId: submission.teamId, totalWeighted, judgeCount },
    })

    // Update team status to JUDGED
    await prisma.team.update({ where: { id: submission.teamId }, data: { currentStatus: 'JUDGED' } })

    await writeAuditLog({
      actorId: actor.userId,
      action: existing ? 'SCORE_UPDATED' : 'SCORE_SUBMITTED',
      entityType: 'judge_score',
      entityId: score.id,
      oldValue: existing,
      newValue: body.data,
      metadata: { totalWeighted },
    })

    return { score, aggregate: { totalWeighted, judgeCount } }
  })

  // GET /api/v1/judge/submissions/:submissionId/aggregate
  app.get('/submissions/:submissionId/aggregate', { preHandler: [requireRole('JUDGE', 'ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const { submissionId } = request.params as { submissionId: string }

    const [aggregate, scores] = await Promise.all([
      prisma.scoreAggregate.findUnique({ where: { submissionId }, include: { team: true } }),
      prisma.judgeScore.findMany({ where: { submissionId } }),
    ])

    if (!aggregate) return reply.status(404).send({ error: 'No scores yet' })

    const perCriterion = {
      nationalImpact: { weight: WEIGHTS.nationalImpact, avgScore: scores.reduce((a, s) => a + s.nationalImpactScore, 0) / scores.length },
      technologyMethodology: { weight: WEIGHTS.technologyMethodology, avgScore: scores.reduce((a, s) => a + s.technologyMethodologyScore, 0) / scores.length },
      requirementCompliance: { weight: WEIGHTS.requirementCompliance, avgScore: scores.reduce((a, s) => a + s.requirementComplianceScore, 0) / scores.length },
      feasibility: { weight: WEIGHTS.feasibility, avgScore: scores.reduce((a, s) => a + s.feasibilityScore, 0) / scores.length },
    }

    return { aggregate, perCriterion, judgeCount: scores.length }
  })
}
