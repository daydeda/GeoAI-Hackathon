import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../plugins/prisma.js'
import { requireRole, JwtPayload } from '../middleware/auth.js'
import { writeAuditLog } from '../services/auditLog.js'
import { ReviewStatus } from '@prisma/client'

const ReviewSchema = z.object({
  status: z.enum(['PASS', 'DISQUALIFIED', 'FAIL']),
  note: z.string().max(1000).optional(),
})

const ANNOUNCEMENT_DATE = process.env.ANNOUNCEMENT_DATE_ISO || '2026-05-08T00:00:00+07:00'

function normalizeReviewStatus(status: string | null | undefined): 'PASS' | 'DISQUALIFIED' | null {
  if (!status) return null
  if (status === 'PASS') return 'PASS'
  return 'DISQUALIFIED'
}

function canSendAnnouncement() {
  return Date.now() >= new Date(ANNOUNCEMENT_DATE).getTime()
}

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
    const normalizedFilterStatus = status === 'DISQUALIFIED' ? 'FAIL' : status
    if (normalizedFilterStatus) {
      filtered = filtered.filter(
        s => s.moderatorReview?.status === normalizedFilterStatus || (normalizedFilterStatus === 'PENDING' && !s.moderatorReview),
      )
    }
    if (track) filtered = filtered.filter(s => s.team.track === track)

    const total = await prisma.submission.count({ where })

    return {
      data: filtered.map((submission) => ({
        ...submission,
        moderatorReview: submission.moderatorReview
          ? {
              ...submission.moderatorReview,
              status: normalizeReviewStatus(submission.moderatorReview.status),
            }
          : null,
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      announcementDate: ANNOUNCEMENT_DATE,
      announcementOpen: canSendAnnouncement(),
    }
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

    const statusForDb: ReviewStatus = body.data.status === 'PASS' ? 'PASS' : 'FAIL'

    const review = await prisma.moderatorReview.upsert({
      where: { submissionId },
      update: { status: statusForDb, note: body.data.note, reviewerId: actor.userId, reviewedAt: new Date() },
      create: { submissionId, reviewerId: actor.userId, status: statusForDb, note: body.data.note },
    })

    // Update team status
    if (statusForDb === 'PASS') {
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
      newValue: { status: normalizeReviewStatus(statusForDb), note: body.data.note },
    })

    return {
      ...review,
      status: normalizeReviewStatus(review.status),
    }
  })

  // POST /api/v1/mod/submissions/:submissionId/announcement
  app.post('/submissions/:submissionId/announcement', { preHandler: [requireRole('MODERATOR', 'ADMIN')] }, async (request, reply) => {
    if (!canSendAnnouncement()) {
      return reply.status(403).send({ error: `Announcements are allowed after ${ANNOUNCEMENT_DATE}` })
    }

    const actor = request.user as JwtPayload
    const { submissionId } = request.params as { submissionId: string }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        team: {
          include: {
            members: { include: { user: true } },
          },
        },
        moderatorReview: true,
      },
    })

    if (!submission) return reply.status(404).send({ error: 'Submission not found' })
    if (!submission.moderatorReview) {
      return reply.status(400).send({ error: 'Submission has no review result yet' })
    }

    const announcementStatus = normalizeReviewStatus(submission.moderatorReview.status)
    const message = announcementStatus === 'PASS'
      ? `Congratulations. Your team ${submission.team.name} has PASSED the pre-screening stage.`
      : `Your team ${submission.team.name} is DISQUALIFIED in the pre-screening stage.`

    const recipients = submission.team.members.map((member) => ({
      userId: member.user.id,
      email: member.user.email,
      fullName: member.user.fullName,
    }))

    await writeAuditLog({
      actorId: actor.userId,
      action: 'SUBMISSION_ANNOUNCEMENT_SENT',
      entityType: 'submission',
      entityId: submissionId,
      newValue: {
        teamId: submission.teamId,
        status: announcementStatus,
        recipients: recipients.map((r) => r.email),
        message,
      },
    })

    return {
      submissionId,
      teamName: submission.team.name,
      status: announcementStatus,
      recipients,
      message,
    }
  })
}
