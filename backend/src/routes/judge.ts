import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../plugins/prisma.js'
import { requireRole, JwtPayload } from '../middleware/auth.js'
import { writeAuditLog } from '../services/auditLog.js'
import { minioClient, BUCKET } from '../services/storage.js'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import JSZip from 'jszip'
import { Readable } from 'stream'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// First Round Criteria Points: 5, 5, 30, 10. Total 50.

const ScoreSchema = z.object({
  problemDefinitionScore: z.number().min(0).max(5),
  dataSpatialArchitectureScore: z.number().min(0).max(5),
  methodologicalFrameworkScore: z.number().min(0).max(30),
  outputDecisionUseScore: z.number().min(0).max(10),
  comments: z.string().max(2000).optional(),
})

const FinalStatusSchema = z.object({
  status: z.enum(['FINALIST', 'REJECTED']),
})

function calcTotal(s: any): number {
  return (
    (s.problemDefinitionScore || 0) +
    (s.dataSpatialArchitectureScore || 0) +
    (s.methodologicalFrameworkScore || 0) +
    (s.outputDecisionUseScore || 0)
  )
}

export async function judgeRoutes(app: FastifyInstance) {
  // GET /api/v1/judge/submissions — passed proposals only
  app.get('/submissions', { preHandler: [requireRole('JUDGE', 'ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { page = '1', limit = '20' } = request.query as Record<string, string>

    const orderedForDisplay = await prisma.submission.findMany({
      where: {
        isActive: true,
        moderatorReview: { is: { status: 'PASS' } },
      },
      select: { id: true },
      orderBy: [
        { submittedAt: 'asc' },
        { id: 'asc' },
      ],
    })

    const displayIdMap = new Map<string, number>(
      orderedForDisplay.map((row, index) => [row.id, index + 1]),
    )

    const submissions = await prisma.submission.findMany({
      where: {
        isActive: true,
        moderatorReview: { is: { status: 'PASS' } },
      },
      include: {
        team: true,
        files: { orderBy: { uploadedAt: 'desc' }, take: 1 },
        moderatorReview: true,
        judgeScores: { include: { judge: { select: { id: true, fullName: true } } } },
        scoreAggregate: true,
      },
      orderBy: { submittedAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    })

    const latestPerTeam = Array.from(
      new Map(submissions.map((submission) => [submission.teamId, submission])).values(),
    ).map((submission) => ({
      ...submission,
      displayId: displayIdMap.get(submission.id) || null,
    }))

    const total = await prisma.submission.count({
      where: { isActive: true, moderatorReview: { is: { status: 'PASS' } } },
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
        problemDefinitionScore: body.data.problemDefinitionScore,
        dataSpatialArchitectureScore: body.data.dataSpatialArchitectureScore,
        methodologicalFrameworkScore: body.data.methodologicalFrameworkScore,
        outputDecisionUseScore: body.data.outputDecisionUseScore,
        comments: body.data.comments,
      },
      create: {
        submissionId,
        judgeUserId: actor.userId,
        problemDefinitionScore: body.data.problemDefinitionScore,
        dataSpatialArchitectureScore: body.data.dataSpatialArchitectureScore,
        methodologicalFrameworkScore: body.data.methodologicalFrameworkScore,
        outputDecisionUseScore: body.data.outputDecisionUseScore,
        comments: body.data.comments,
      },
    })

    // Recalculate aggregate
    const allScores = await prisma.judgeScore.findMany({ where: { submissionId } })
    const judgeCount = allScores.length
    const avgProb = allScores.reduce((a, s) => a + s.problemDefinitionScore, 0) / judgeCount
    const avgData = allScores.reduce((a, s) => a + s.dataSpatialArchitectureScore, 0) / judgeCount
    const avgFramework = allScores.reduce((a, s) => a + s.methodologicalFrameworkScore, 0) / judgeCount
    const avgOutput = allScores.reduce((a, s) => a + s.outputDecisionUseScore, 0) / judgeCount

    const totalWeighted = calcTotal({
      problemDefinitionScore: avgProb,
      dataSpatialArchitectureScore: avgData,
      methodologicalFrameworkScore: avgFramework,
      outputDecisionUseScore: avgOutput,
    })

    await prisma.scoreAggregate.upsert({
      where: { submissionId },
      update: { totalWeighted, judgeCount, calculatedAt: new Date() },
      create: { submissionId, teamId: submission.teamId, totalWeighted, judgeCount },
    })

    // Update team status to JUDGED only if it's not already in a final state (FINALIST/REJECTED)
    const currentTeam = await prisma.team.findUnique({ where: { id: submission.teamId }, select: { currentStatus: true } })
    if (currentTeam && currentTeam.currentStatus !== 'FINALIST' && currentTeam.currentStatus !== 'REJECTED') {
      await prisma.team.update({ where: { id: submission.teamId }, data: { currentStatus: 'JUDGED' } })
    }

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
      problemDefinition: { max: 5, avgScore: scores.reduce((a, s) => a + s.problemDefinitionScore, 0) / scores.length },
      dataSpatialArchitecture: { max: 5, avgScore: scores.reduce((a, s) => a + s.dataSpatialArchitectureScore, 0) / scores.length },
      methodologicalFramework: { max: 30, avgScore: scores.reduce((a, s) => a + s.methodologicalFrameworkScore, 0) / scores.length },
      outputDecisionUse: { max: 10, avgScore: scores.reduce((a, s) => a + s.outputDecisionUseScore, 0) / scores.length },
    }

    return { aggregate, perCriterion, judgeCount: scores.length }
  })

  // PATCH /api/v1/judge/submissions/:submissionId/final-status
  app.patch('/submissions/:submissionId/final-status', { preHandler: [requireRole('JUDGE', 'ADMIN')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { submissionId } = request.params as { submissionId: string }
    const parsed = FinalStatusSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        teamId: true,
        team: { select: { currentStatus: true } },
        moderatorReview: { select: { status: true } },
        scoreAggregate: { select: { judgeCount: true } },
      },
    })

    if (!submission) return reply.status(404).send({ error: 'Submission not found' })
    if (submission.moderatorReview?.status !== 'PASS') {
      return reply.status(409).send({ error: 'Submission has not passed pre-screening' })
    }

    if (!submission.scoreAggregate || submission.scoreAggregate.judgeCount < 1) {
      return reply.status(409).send({ error: 'At least one judge score is required before final qualification update' })
    }

    const voteStatus = parsed.data.status

    await prisma.teamStatusHistory.create({
      data: {
        teamId: submission.teamId,
        fromStatus: submission.team.currentStatus,
        toStatus: voteStatus,
        actorId: actor.userId,
        note: 'JUDGE_FINAL_VOTE',
      },
    })

    const voteHistory = await prisma.teamStatusHistory.findMany({
      where: {
        teamId: submission.teamId,
        actorId: { not: null },
        note: 'JUDGE_FINAL_VOTE',
        toStatus: { in: ['FINALIST', 'REJECTED'] },
      },
      orderBy: { changedAt: 'desc' },
      select: { actorId: true, toStatus: true },
    })

    const latestVoteByJudge = new Map<string, 'FINALIST' | 'REJECTED'>()
    for (const row of voteHistory) {
      if (!row.actorId || latestVoteByJudge.has(row.actorId)) continue
      latestVoteByJudge.set(row.actorId, row.toStatus as 'FINALIST' | 'REJECTED')
    }

    let finalistVotes = 0
    let disqualifiedVotes = 0
    for (const vote of latestVoteByJudge.values()) {
      if (vote === 'FINALIST') finalistVotes += 1
      if (vote === 'REJECTED') disqualifiedVotes += 1
    }

    const winningStatus = finalistVotes > disqualifiedVotes
      ? 'FINALIST'
      : disqualifiedVotes > finalistVotes
        ? 'REJECTED'
        : submission.team.currentStatus

    if (winningStatus !== submission.team.currentStatus) {
      await prisma.team.update({
        where: { id: submission.teamId },
        data: { currentStatus: winningStatus },
      })
    }

    await writeAuditLog({
      actorId: actor.userId,
      action: 'JUDGE_FINAL_STATUS_UPDATED',
      entityType: 'team',
      entityId: submission.teamId,
      oldValue: { currentStatus: submission.team.currentStatus },
      newValue: {
        submissionId,
        voteStatus,
        appliedStatus: winningStatus,
        votes: {
          finalist: finalistVotes,
          disqualified: disqualifiedVotes,
        },
      },
    })

    return {
      submissionId,
      teamId: submission.teamId,
      status: winningStatus,
      vote: voteStatus,
      votes: {
        finalist: finalistVotes,
        disqualified: disqualifiedVotes,
      },
    }
  })

  // GET /api/v1/judge/export/proposals
  app.get('/export/proposals', { preHandler: [requireRole('JUDGE', 'ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    
    // 1. Fetch all submissions that have passed moderation
    const allPassSubmissions = await prisma.submission.findMany({
      where: {
        isActive: true,
        moderatorReview: { is: { status: 'PASS' } },
      },
      include: {
        team: true,
        files: { orderBy: { uploadedAt: 'desc' }, take: 1 },
      },
      orderBy: [
        { submittedAt: 'asc' },
        { id: 'asc' },
      ],
    })

    // Calculate display IDs (1, 2, 3...) matching the dashboard's chronological order
    const displayIdMap = new Map<string, number>(
      allPassSubmissions.map((row, index) => [row.id, index + 1])
    )

    // Group by teamId but keep only the LATEST one (the one with the highest version/latest date)
    // We sort by submittedAt DESC to ensure the first one we pick per team is the latest.
    const sortedForGrouping = [...allPassSubmissions].sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )
    
    const submissions = Array.from(
      new Map(sortedForGrouping.map((s) => [s.teamId, s])).values()
    )

    if (submissions.length === 0) {
      return reply.status(404).send({ error: 'No proposals found to export' })
    }

    const zip = new JSZip()
    const now = new Date()
    const timestampStr = now.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok'
    }).replace(',', '') // DD/MM/YYYY HH:mm

    // 2. Process each submission
    for (const sub of submissions) {
      const file = sub.files[0]
      if (!file) continue

      const displayId = displayIdMap.get(sub.id) || '?'
      const safeTeamName = sub.team.name.replace(/[/\\?%*:|"<>]/g, '-')
      const zipFileName = `ID_${displayId}_${safeTeamName}_${file.originalName}`

      try {
        // Download from MinIO
        const dataStream = await minioClient.getObject(BUCKET, file.fileKey)
        const chunks: Buffer[] = []
        for await (const chunk of dataStream) {
          chunks.push(chunk as Buffer)
        }
        const pdfBuffer = Buffer.concat(chunks)

        // Modify PDF with watermark/text (ignore encryption to prevent loading failures)
        const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true })
        
        // Load Thai-compatible font with multiple path fallbacks
        let font;
        try {
          // Fallback 1: Root /app/fonts (Docker)
          // Fallback 2: Local relative to this file
          const fontPaths = [
            path.resolve(process.cwd(), 'fonts', 'Sarabun-Regular.ttf'),
            path.join(__dirname, '..', '..', 'fonts', 'Sarabun-Regular.ttf'),
            path.join(__dirname, '..', 'fonts', 'Sarabun-Regular.ttf')
          ]
          
          let fontBuffer = null
          for (const p of fontPaths) {
            try {
              fontBuffer = await fs.readFile(p)
              if (fontBuffer) break
            } catch { continue }
          }

          if (!fontBuffer) throw new Error('Font file not found in any search path')
          font = await pdfDoc.embedFont(fontBuffer)
        } catch (fontErr) {
          const msg = fontErr instanceof Error ? fontErr.message : String(fontErr)
          request.log.warn(`Font load failed: ${msg}. Falling back to Helvetica.`)
          font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        }

        const pages = pdfDoc.getPages()

        for (const page of pages) {
          const { width } = page.getSize()
          
          // Use a safe team name if using Helvetica (which doesn't support Thai)
          const isThaiFont = font.name !== 'Helvetica'
          const safeName = (isThaiFont || /^[\x00-\x7F]*$/.test(sub.team.name))
            ? sub.team.name
            : 'Team'

          // Left: Team Name (ID: X)
          page.drawText(`Team: ${safeName} (ID: ${displayId})`, {
            x: 40,
            y: 20,
            size: 10,
            font,
            color: rgb(0.3, 0.3, 0.3),
          })

          // Right: Exported Date & Time
          page.drawText(`Exported: ${timestampStr}`, {
            x: width - 200,
            y: 20,
            size: 10,
            font,
            color: rgb(0.3, 0.3, 0.3),
          })
        }

        const modifiedPdf = await pdfDoc.save()
        zip.file(zipFileName, modifiedPdf)

      } catch (err) {
        request.log.error(err, `Watermarking failed for submission ${sub.id}, including original file instead`)
        
        // If watermarking/PDF processing fails, still try to include the raw file in the ZIP
        try {
          const dataStream = await minioClient.getObject(BUCKET, file.fileKey)
          const chunks: Buffer[] = []
          for await (const chunk of dataStream) {
            chunks.push(chunk as Buffer)
          }
          zip.file(zipFileName, Buffer.concat(chunks))
        } catch (innerErr) {
          request.log.error(innerErr, `Total failure to include file for submission ${sub.id}`)
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    await writeAuditLog({
      actorId: actor.userId,
      action: 'BULK_PROPOSAL_EXPORT',
      entityType: 'submission',
      entityId: 'multiple',
      metadata: { count: submissions.length },
    })

    reply
      .header('Content-Type', 'application/zip')
      .header('Content-Disposition', `attachment; filename="GeoAI_Proposals_Export_${now.getTime()}.zip"`)
      .send(zipBuffer)
  })
}
