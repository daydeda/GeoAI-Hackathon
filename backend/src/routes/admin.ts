import { FastifyInstance } from 'fastify'
import { createReadStream, unlink } from 'fs'
import '@fastify/static'

import { z } from 'zod'
import { prisma } from '../plugins/prisma.js'
import { requireRole, JwtPayload } from '../middleware/auth.js'
import { writeAuditLog } from '../services/auditLog.js'
import { exportData } from '../services/exporter.js'
import { generatePermissionLetter } from '../services/pdfGenerator.js'
import { minioClient, BUCKET } from '../services/storage.js'
import { Prisma, TeamStatus, ExportType } from '@prisma/client'
import { getPhaseByKey } from '../services/phaseConfig.js'
import { sendAnnouncementEmail } from '../services/announcementMailer.js'

const AssignRoleSchema = z.object({ role: z.enum(['COMPETITOR', 'MODERATOR', 'JUDGE', 'ADMIN']) })
const TeamStatusSchema = z.object({ status: z.nativeEnum(TeamStatus), note: z.string().optional() })
const ExportSchema = z.object({ type: z.nativeEnum(ExportType) })
const SendAnnouncementSchema = z.object({
  projectName: z.string().trim().min(1).max(120).optional(),
  onlyGmail: z.boolean().optional(),
})

type DailyCountRow = {
  day: Date
  count: bigint
}

function getFinalResultStatus(status: TeamStatus): TeamStatus {
  return status === 'FINALIST' ? 'FINALIST' : 'REJECTED'
}

export async function adminRoutes(app: FastifyInstance) {
  // GET /api/v1/admin/stats/overview
  app.get('/stats/overview', { preHandler: [requireRole('ADMIN', 'MODERATOR')] }, async (request) => {
    const query = z.object({ days: z.coerce.number().int().min(7).max(365).optional() }).safeParse(request.query)
    const days = query.success ? query.data.days ?? 30 : 30

    const fromDate = new Date()
    fromDate.setHours(0, 0, 0, 0)
    fromDate.setDate(fromDate.getDate() - (days - 1))

    const [userRows, submissionRows, teamRows] = await Promise.all([
      prisma.$queryRaw<DailyCountRow[]>(Prisma.sql`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM "users"
        WHERE "createdAt" >= ${fromDate}
        GROUP BY 1
        ORDER BY 1 ASC
      `),
      prisma.$queryRaw<DailyCountRow[]>(Prisma.sql`
        SELECT date_trunc('day', "submittedAt") AS day, COUNT(*)::bigint AS count
        FROM "submissions"
        WHERE "submittedAt" >= ${fromDate}
        GROUP BY 1
        ORDER BY 1 ASC
      `),
      prisma.$queryRaw<DailyCountRow[]>(Prisma.sql`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM "teams"
        WHERE "createdAt" >= ${fromDate}
        GROUP BY 1
        ORDER BY 1 ASC
      `),
    ])

    const toMap = (rows: DailyCountRow[]) => {
      const map = new Map<string, number>()
      rows.forEach((row) => {
        const key = new Date(row.day).toISOString().slice(0, 10)
        map.set(key, Number(row.count))
      })
      return map
    }

    const userMap = toMap(userRows)
    const submissionMap = toMap(submissionRows)
    const teamMap = toMap(teamRows)

    const series: Array<{
      date: string
      registrations: number
      submissions: number
      teams: number
    }> = []

    for (let index = 0; index < days; index += 1) {
      const day = new Date(fromDate)
      day.setDate(fromDate.getDate() + index)
      const key = day.toISOString().slice(0, 10)

      series.push({
        date: key,
        registrations: userMap.get(key) ?? 0,
        submissions: submissionMap.get(key) ?? 0,
        teams: teamMap.get(key) ?? 0,
      })
    }

    return {
      days,
      from: fromDate.toISOString(),
      to: new Date().toISOString(),
      totals: {
        registrations: series.reduce((acc, item) => acc + item.registrations, 0),
        submissions: series.reduce((acc, item) => acc + item.submissions, 0),
        teams: series.reduce((acc, item) => acc + item.teams, 0),
      },
      series,
    }
  })

  // GET /api/v1/admin/tools-access
  // Used by Nginx auth_request to protect Prisma Studio / MinIO routes.
  app.get('/tools-access', { preHandler: [requireRole('ADMIN', 'MODERATOR')] }, async (_request, reply) => {
    return reply.code(204).send()
  })

  // GET /api/v1/admin/announcement-email/status
  app.get('/announcement-email/status', { preHandler: [requireRole('ADMIN')] }, async (_request, reply) => {
    const announcementPhase = await getPhaseByKey('announcement')
    if (!announcementPhase) {
      return reply.status(500).send({ error: 'Announcement phase is not configured' })
    }

    const announcementDate = new Date(announcementPhase.date)
    if (Number.isNaN(announcementDate.getTime())) {
      return reply.status(500).send({ error: 'Announcement phase date is invalid' })
    }

    const now = new Date()
    const [sentCount, failedCount] = await Promise.all([
      prisma.announcementEmailLog.count({
        where: { announcementDate, status: 'SENT' },
      }),
      prisma.announcementEmailLog.count({
        where: { announcementDate, status: 'FAILED' },
      }),
    ])

    return {
      announcementDate: announcementDate.toISOString(),
      enabled: now.getTime() >= announcementDate.getTime(),
      sentCount,
      failedCount,
    }
  })

  // POST /api/v1/admin/announcement-email/send
  app.post('/announcement-email/send', { preHandler: [requireRole('ADMIN')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const parsedBody = SendAnnouncementSchema.safeParse(request.body ?? {})
    if (!parsedBody.success) return reply.status(400).send({ error: parsedBody.error.flatten() })

    const onlyGmail = parsedBody.data.onlyGmail ?? false
    const projectName = parsedBody.data.projectName || 'GeoAI Hackathon'

    const announcementPhase = await getPhaseByKey('announcement')
    if (!announcementPhase) {
      return reply.status(500).send({ error: 'Announcement phase is not configured' })
    }

    const announcementDate = new Date(announcementPhase.date)
    if (Number.isNaN(announcementDate.getTime())) {
      return reply.status(500).send({ error: 'Announcement phase date is invalid' })
    }

    if (Date.now() < announcementDate.getTime()) {
      return reply.status(400).send({
        error: 'Announcement email is not available yet',
        announcementDate: announcementDate.toISOString(),
      })
    }

    const competitors = await prisma.user.findMany({
      where: {
        // Send to all users who are actually in a team, regardless of their current role.
        // Some members may have ADMIN/MODERATOR/JUDGE roles and would be skipped if we filter COMPETITOR only.
        teamMembers: { some: {} },
        announcementSent: false,
      },
      include: {
        teamMembers: {
          include: {
            team: {
              select: { id: true, name: true, currentStatus: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    })

    let sentCount = 0
    let failedCount = 0
    let skippedCount = 0
    const failures: Array<{ email: string; reason: string }> = []

    for (const competitor of competitors) {
      const email = competitor.email.trim().toLowerCase()
      const team = competitor.teamMembers[0]?.team

      if (!team) {
        skippedCount += 1
        continue
      }

      if (onlyGmail && !email.endsWith('@gmail.com')) {
        skippedCount += 1
        continue
      }

      const finalStatus = getFinalResultStatus(team.currentStatus)
      const result = finalStatus === 'FINALIST' ? 'QUALIFIED' : 'DISQUALIFIED'

      try {
        await sendAnnouncementEmail({
          to: email,
          recipientName: competitor.fullName,
          teamName: team.name,
          projectName,
          result,
        })

        await prisma.announcementEmailLog.upsert({
          where: {
            announcementDate_recipientEmail: {
              announcementDate,
              recipientEmail: email,
            },
          },
          update: {
            recipientUserId: competitor.id,
            teamId: team.id,
            teamName: team.name,
            result: finalStatus,
            status: 'SENT',
            errorMessage: null,
            sentAt: new Date(),
          },
          create: {
            announcementDate,
            recipientUserId: competitor.id,
            recipientEmail: email,
            teamId: team.id,
            teamName: team.name,
            result: finalStatus,
            status: 'SENT',
            sentAt: new Date(),
          },
        })

        await prisma.user.update({
          where: { id: competitor.id },
          data: { announcementSent: true },
        })

        sentCount += 1
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown email send error'

        await prisma.announcementEmailLog.upsert({
          where: {
            announcementDate_recipientEmail: {
              announcementDate,
              recipientEmail: email,
            },
          },
          update: {
            recipientUserId: competitor.id,
            teamId: team.id,
            teamName: team.name,
            result: finalStatus,
            status: 'FAILED',
            errorMessage,
            sentAt: new Date(),
          },
          create: {
            announcementDate,
            recipientUserId: competitor.id,
            recipientEmail: email,
            teamId: team.id,
            teamName: team.name,
            result: finalStatus,
            status: 'FAILED',
            errorMessage,
            sentAt: new Date(),
          },
        })

        failedCount += 1
        failures.push({ email, reason: errorMessage })
      }
    }

    await writeAuditLog({
      actorId: actor.userId,
      action: 'SUBMISSION_ANNOUNCEMENT_SENT',
      entityType: 'announcement',
      entityId: announcementDate.toISOString(),
      metadata: {
        sentCount,
        failedCount,
        skippedCount,
        onlyGmail,
        projectName,
      },
    })

    return {
      message: 'Announcement email task completed',
      announcementDate: announcementDate.toISOString(),
      sentCount,
      failedCount,
      skippedCount,
      failures,
    }
  })

  // GET /api/v1/admin/users — list all users with roles
  app.get('/users', { preHandler: [requireRole('ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const { search, role, page = '1', limit = '50' } = request.query as Record<string, string>

    const normalizedSearch = search?.trim()
    const normalizedRole = role?.trim().toUpperCase()
    const allowedRoles = new Set(['COMPETITOR', 'MODERATOR', 'JUDGE', 'ADMIN'])
    const roleFilter = normalizedRole && allowedRoles.has(normalizedRole) ? normalizedRole : null
    const looksLikeUuid = Boolean(normalizedSearch && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizedSearch))

    const where: Prisma.UserWhereInput = {
      ...(normalizedSearch
        ? {
            OR: [
              { email: { contains: normalizedSearch, mode: 'insensitive' as const } },
              { fullName: { contains: normalizedSearch, mode: 'insensitive' as const } },
              ...(looksLikeUuid ? [{ id: normalizedSearch }] : []),
            ],
          }
        : {}),
      ...(roleFilter
        ? {
            userRoles: {
              some: {
                role: {
                  name: roleFilter as never,
                },
              },
            },
          }
        : {}),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { userRoles: { include: { role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ])

    return { data: users.map(u => ({
      id: u.id, email: u.email, fullName: u.fullName, avatarUrl: u.avatarUrl,
      firstName: u.firstName,
      lastName: u.lastName,
      university: u.university,
      yearOfStudy: u.yearOfStudy,
      phoneNumber: u.phoneNumber,
      address: u.address,
      profileCompleted: Boolean(u.profileCompleted),
      idCardUploaded: Boolean(u.idCardFileKey),
      roles: u.userRoles.map(ur => ur.role.name), createdAt: u.createdAt,
    })), total }
  })

  // DELETE /api/v1/admin/users/:userId
  app.delete('/users/:userId', { preHandler: [requireRole('ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { userId } = request.params as { userId: string }

    if (actor.userId === userId) return reply.status(400).send({ error: 'You cannot delete your own account' })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ledTeams: { select: { id: true, name: true } },
      },
    })

    if (!user) return reply.status(404).send({ error: 'User not found' })
    if (user.ledTeams.length > 0) {
      return reply.status(409).send({
        error: 'User is currently a team leader. Delete or reassign their team before deleting this user.',
      })
    }

    try {
      await prisma.user.delete({ where: { id: userId } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return reply.status(409).send({
          error: 'Cannot delete this user because related scoring/review records still exist.',
        })
      }
      throw error
    }

    await writeAuditLog({
      actorId: actor.userId,
      action: 'USER_DELETED',
      entityType: 'user',
      entityId: userId,
      oldValue: { email: user.email, fullName: user.fullName },
    })

    return { message: 'User deleted', userId }
  })

  // POST /api/v1/admin/users/:userId/roles
  app.post('/users/:userId/roles', { preHandler: [requireRole('ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { userId } = request.params as { userId: string }
    const body = AssignRoleSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const role = await prisma.role.findUnique({ where: { name: body.data.role } })
    if (!role) return reply.status(404).send({ error: 'Role not found' })

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId } }),
      prisma.userRole.create({ data: { userId, roleId: role.id, assignedBy: actor.userId } })
    ])

    await writeAuditLog({ actorId: actor.userId, action: 'ROLE_ASSIGNED', entityType: 'user', entityId: userId, newValue: { role: body.data.role } })

    return { message: `Role ${body.data.role} assigned to user ${userId}` }
  })

  // DELETE /api/v1/admin/users/:userId/roles/:role
  app.delete('/users/:userId/roles/:role', { preHandler: [requireRole('ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { userId, role } = request.params as { userId: string; role: string }

    const roleRecord = await prisma.role.findUnique({ where: { name: role as never } })
    if (!roleRecord) return reply.status(404).send({ error: 'Role not found' })

    await prisma.userRole.delete({ where: { userId_roleId: { userId, roleId: roleRecord.id } } }).catch(() => null)

    await writeAuditLog({ actorId: actor.userId, action: 'ROLE_REVOKED', entityType: 'user', entityId: userId, oldValue: { role } })

    return { message: `Role ${role} revoked from user ${userId}` }
  })

  // GET /api/v1/admin/teams — list all teams with scores
  app.get('/teams', { preHandler: [requireRole('ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const { page = '1', limit = '20', track, search } = request.query as Record<string, string>
    const take = Math.min(100, Math.max(1, Number(limit) || 20))
    const currentPage = Math.max(1, Number(page) || 1)

    const normalizedTrack = track?.trim().toUpperCase()
    const allowedTracks = new Set(['SMART_AGRICULTURE', 'DISASTER_FLOOD_RESPONSE'])
    const trackFilter = normalizedTrack && allowedTracks.has(normalizedTrack) ? normalizedTrack : null
    const normalizedSearch = search?.trim()
    const where: Prisma.TeamWhereInput = {
      ...(trackFilter
        ? {
            track: trackFilter as never,
          }
        : {}),
      ...(normalizedSearch
        ? {
            name: {
              contains: normalizedSearch,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        leader: { select: { id: true, email: true, fullName: true, avatarUrl: true, idCardFileKey: true } },
        members: { include: { user: { select: { id: true, email: true, fullName: true, avatarUrl: true, idCardFileKey: true } } } },
        submissions: { where: { isActive: true }, include: { scoreAggregate: true, moderatorReview: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * take,
      take,
    })

    const total = await prisma.team.count({ where })

    return {
      data: teams.map((team) => ({
        ...team,
        leader: {
          ...team.leader,
          idCardUploaded: Boolean(team.leader.idCardFileKey),
        },
        members: team.members.map((member) => ({
          ...member,
          user: {
            ...member.user,
            idCardUploaded: Boolean(member.user.idCardFileKey),
          },
        })),
      })),
      total,
      page: currentPage,
      limit: take,
    }
  })

  // DELETE /api/v1/admin/teams/:teamId
  app.delete('/teams/:teamId', { preHandler: [requireRole('ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { teamId } = request.params as { teamId: string }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, leaderId: true, currentStatus: true },
    })
    if (!team) return reply.status(404).send({ error: 'Team not found' })

    try {
      await prisma.team.delete({ where: { id: teamId } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return reply.status(409).send({
          error: 'Cannot delete this team because related records still exist.',
        })
      }
      throw error
    }

    await writeAuditLog({
      actorId: actor.userId,
      action: 'TEAM_DELETED',
      entityType: 'team',
      entityId: teamId,
      oldValue: {
        name: team.name,
        leaderId: team.leaderId,
        status: team.currentStatus,
      },
    })

    return { message: 'Team deleted', teamId }
  })

  // GET /api/v1/admin/users/:userId/uploads/:type/view
  app.get('/users/:userId/uploads/:type/view', { preHandler: [requireRole('ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const { userId, type } = request.params as { userId: string; type: string }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    if (type === 'avatar') {
      if (!user.avatarUrl) return reply.status(404).send({ error: 'Avatar not found' })
      return reply.redirect(user.avatarUrl)
    }

    if (type === 'id-card') {
      if (!user.idCardFileKey) return reply.status(404).send({ error: 'ID card not found' })
      const stream = await minioClient.getObject(BUCKET, user.idCardFileKey)
      const fileName = user.idCardFileName || 'student-id'
      const lowered = fileName.toLowerCase()
      const contentType = lowered.endsWith('.pdf')
        ? 'application/pdf'
        : lowered.endsWith('.png')
          ? 'image/png'
          : 'image/jpeg'

      reply.header('Content-Type', contentType)
      reply.header('Content-Disposition', `inline; filename="${fileName}"`)
      return reply.send(stream)
    }

    return reply.status(400).send({ error: 'Unsupported upload type' })
  })

  // PATCH /api/v1/admin/teams/:teamId/status
  app.patch('/teams/:teamId/status', { preHandler: [requireRole('ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { teamId } = request.params as { teamId: string }
    const body = TeamStatusSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) return reply.status(404).send({ error: 'Team not found' })

    const oldStatus = team.currentStatus

    await prisma.$transaction([
      prisma.team.update({ where: { id: teamId }, data: { currentStatus: body.data.status } }),
      prisma.teamStatusHistory.create({
        data: { teamId, fromStatus: oldStatus, toStatus: body.data.status, actorId: actor.userId, note: body.data.note },
      }),
    ])

    if (body.data.status === 'FINALIST' && oldStatus !== 'FINALIST') {
      try {
        const fullTeam = await prisma.team.findUnique({
          where: { id: teamId },
          include: { members: { include: { user: true } }, leader: true },
        })
        if (fullTeam) {
          const pdfBytes = await generatePermissionLetter({ team: fullTeam })
          const version = await prisma.document.count({ where: { teamId, type: 'PERMISSION_LETTER' } }) + 1
          const fileKey = `documents/${teamId}/permission-letter-v${version}.pdf`
          await minioClient.putObject(BUCKET, fileKey, Buffer.from(pdfBytes), pdfBytes.length, { 'Content-Type': 'application/pdf' })
          await prisma.document.create({ data: { teamId, type: 'PERMISSION_LETTER', fileKey, version } })
        }
      } catch (err) {
        console.error('Failed to auto-generate permission letter:', err)
      }
    }

    await writeAuditLog({
      actorId: actor.userId,
      action: body.data.status === 'FINALIST' ? 'FINALIST_PROMOTED' : 'TEAM_STATUS_CHANGED',
      entityType: 'team',
      entityId: teamId,
      oldValue: { status: oldStatus },
      newValue: { status: body.data.status },
    })

    return { teamId, oldStatus, newStatus: body.data.status }
  })

  // GET /api/v1/admin/audit-logs
  app.get('/audit-logs', { preHandler: [requireRole('ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const { page = '1', limit = '50', entityType } = request.query as Record<string, string>

    const where = entityType ? { entityType } : {}
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { email: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.auditLog.count({ where }),
    ])

    return { data: logs, total }
  })

  // POST /api/v1/admin/exports
  app.post('/exports', { preHandler: [requireRole('ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const body = ExportSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const exportRecord = await prisma.export.create({
      data: { requestedBy: actor.userId, type: body.data.type, status: 'PENDING' },
    })

    // Run export synchronously for now (async queue optional with Redis)
    const { fileKey, filePath, mimeType } = await exportData(body.data.type)

    await prisma.export.update({ where: { id: exportRecord.id }, data: { status: 'COMPLETE', fileKey, completedAt: new Date() } })

    await writeAuditLog({ actorId: actor.userId, action: 'EXPORT_TRIGGERED', entityType: 'export', entityId: exportRecord.id, newValue: { type: body.data.type } })

    const stream = createReadStream(filePath)
    
    // Cleanup temp file after response
    stream.on('close', () => {
      unlink(filePath, (err) => {
        if (err) console.error(`Failed to delete temp export file: ${filePath}`, err)
      })
    })

    return reply
      .header('Content-Disposition', `attachment; filename="${fileKey}"`)
      .header('Content-Type', mimeType)
      .send(stream)
  })
}
