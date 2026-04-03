import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../plugins/prisma.js'
import { requireRole, JwtPayload } from '../middleware/auth.js'
import { writeAuditLog } from '../services/auditLog.js'
import { ReviewStatus } from '@prisma/client'

const ReviewSchema = z.object({
  status: z.enum(['PASS', 'FAIL']),
  note: z.string().max(1000).optional(),
})

export async function moderatorRoutes(app: FastifyInstance) {
  // GET /api/v1/mod/submissions
  app.get('/submissions', { preHandler: [requireRole('MODERATOR', 'ADMIN')] }, async (request, reply) => {
    const { status, track, page = '1', limit = '20' } = request.query as Record<string, string>

    const where: Record<string, unknown> = { isActive: true }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        team: true,
        files: true,
        moderatorReview: { include: { reviewer: { select: { fullName: true, email: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    })

    // Apply filters
    let filtered = submissions
    if (status) filtered = filtered.filter(s => s.moderatorReview?.status === status || (status === 'PENDING' && !s.moderatorReview))
    if (track) filtered = filtered.filter(s => s.team.track === track)

    const total = await prisma.submission.count({ where })

    return { data: filtered, total, page: Number(page), limit: Number(limit) }
  })

  // POST /api/v1/mod/submissions/:submissionId/review
  app.post('/submissions/:submissionId/review', { preHandler: [requireRole('MODERATOR', 'ADMIN')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { submissionId } = request.params as { submissionId: string }
    const body = ReviewSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const submission = await prisma.submission.findUnique({ where: { id: submissionId }, include: { moderatorReview: true } })
    if (!submission) return reply.status(404).send({ error: 'Submission not found' })

    const oldStatus = submission.moderatorReview?.status ?? null

    const review = await prisma.moderatorReview.upsert({
      where: { submissionId },
      update: { status: body.data.status as ReviewStatus, note: body.data.note, reviewerId: actor.userId, reviewedAt: new Date() },
      create: { submissionId, reviewerId: actor.userId, status: body.data.status as ReviewStatus, note: body.data.note },
    })

    // Update team status
    if (body.data.status === 'PASS') {
      await prisma.team.update({ where: { id: submission.teamId }, data: { currentStatus: 'PRE_SCREEN_PASSED' } })
    } else {
      await prisma.team.update({ where: { id: submission.teamId }, data: { currentStatus: 'REJECTED' } })
    }

    await writeAuditLog({
      actorId: actor.userId,
      action: 'SUBMISSION_REVIEWED',
      entityType: 'submission',
      entityId: submissionId,
      oldValue: { status: oldStatus },
      newValue: { status: body.data.status, note: body.data.note },
    })

    return review
  })
}
