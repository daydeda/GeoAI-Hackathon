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

    const statusResult = body.data.status
    const isReject = statusResult !== 'PASS'

    // If rejecting, a reason note is mandatory
    if (isReject && (!body.data.note || body.data.note.trim().length === 0)) {
      return reply.status(400).send({
        error: 'A rejection reason is required when marking a submission as Incorrect/Disqualified.',
      })
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        moderatorReview: true,
        team: {
          include: {
            members: { include: { user: { select: { id: true } } } },
            leader: { select: { id: true } },
          },
        },
      },
    })
    if (!submission) return reply.status(404).send({ error: 'Submission not found' })

    const oldStatus = submission.moderatorReview?.status ?? null

    const statusForDb: ReviewStatus = statusResult === 'PASS' ? 'PASS' : 'FAIL'
    const noteToSave = body.data.note?.trim() || null

    const review = await prisma.moderatorReview.upsert({
      where: { submissionId },
      update: { status: statusForDb, note: noteToSave, reviewerId: actor.userId, reviewedAt: new Date() },
      create: { submissionId, reviewerId: actor.userId, status: statusForDb, note: noteToSave },
    })

    // Collect all user IDs in the team (leader + members)
    const teamUserIds = [
      submission.team.leaderId,
      ...submission.team.members.map((m) => m.user.id),
    ].filter((id, idx, arr) => arr.indexOf(id) === idx)

    if (statusForDb === 'PASS') {
      // Team passes pre-screen → team status changes, members become VERIFIED_COMPETITOR
      await prisma.team.update({
        where: { id: submission.teamId },
        data: { currentStatus: 'PRE_SCREEN_PASSED' },
      })
      await (prisma.user as any).updateMany({
        where: { id: { in: teamUserIds } },
        data: { competitorStatus: 'VERIFIED_COMPETITOR', moderatorNote: null },
      })
    } else {
      // Submission rejected → team REJECTED, members become INCORRECT_COMPETITOR with note
      await prisma.team.update({
        where: { id: submission.teamId },
        data: { currentStatus: 'REJECTED' },
      })
      await (prisma.user as any).updateMany({
        where: { id: { in: teamUserIds } },
        data: { competitorStatus: 'INCORRECT_COMPETITOR', moderatorNote: noteToSave },
      })
    }

    await writeAuditLog({
      actorId: actor.userId,
      action: 'SUBMISSION_REVIEWED',
      entityType: 'submission',
      entityId: submissionId,
      oldValue: { status: oldStatus },
      newValue: { status: normalizeReviewStatus(statusForDb), note: noteToSave },
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

  // GET /api/v1/mod/users
  app.get('/users', { preHandler: [requireRole('MODERATOR', 'ADMIN')] }, async (request, reply) => {
    const { status, search, page = '1', limit = '20' } = request.query as Record<string, string>
    
    const where: any = {}
    if (status && status !== 'ALL' && status !== '') {
      if (status === 'QUALIFIED') {
        where.competitorStatus = { in: ['QUALIFIED', 'VERIFIED_COMPETITOR'] }
      } else if (status === 'DISQUALIFIED') {
        where.competitorStatus = { in: ['DISQUALIFIED', 'INCORRECT_COMPETITOR'] }
      } else {
        where.competitorStatus = status
      }
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      (prisma.user as any).findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          competitorStatus: true,
          moderatorNote: true,
          idCardFileKey: true,
          university: true,
          yearOfStudy: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      (prisma.user as any).count({ where }),
    ])

    return { data: users, total, page: Number(page), limit: Number(limit) }
  })

  // POST /api/v1/mod/users/:userId/verify
  app.post('/users/:userId/verify', { preHandler: [requireRole('MODERATOR', 'ADMIN')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { userId } = request.params as { userId: string }
    const body = z.object({
      status: z.enum(['VERIFIED_COMPETITOR', 'INCORRECT_COMPETITOR']),
      note: z.string().max(1000).optional(),
    }).safeParse(request.body)

    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { status, note } = body.data

    if (status === 'INCORRECT_COMPETITOR' && (!note || note.trim().length === 0)) {
      return reply.status(400).send({ error: 'A rejection reason is required.' })
    }

    const user = await (prisma.user as any).findUnique({ where: { id: userId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const updatedUser = await (prisma.user as any).update({
      where: { id: userId },
      data: {
        competitorStatus: status,
        moderatorNote: note || null,
      },
    })

    await writeAuditLog({
      actorId: actor.userId,
      action: 'USER_VERIFIED' as any,
      entityType: 'user',
      entityId: userId,
      oldValue: { competitorStatus: user.competitorStatus },
      newValue: { competitorStatus: status, moderatorNote: note },
    })

    return updatedUser
  })
}
