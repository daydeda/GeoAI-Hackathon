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
import { TeamStatus, ExportType } from '@prisma/client'

const AssignRoleSchema = z.object({ role: z.enum(['COMPETITOR', 'MODERATOR', 'JUDGE', 'ADMIN']) })
const TeamStatusSchema = z.object({ status: z.nativeEnum(TeamStatus), note: z.string().optional() })
const ExportSchema = z.object({ type: z.nativeEnum(ExportType) })

export async function adminRoutes(app: FastifyInstance) {
  // GET /api/v1/admin/users — list all users with roles
  app.get('/users', { preHandler: [requireRole('ADMIN')] }, async (request, reply) => {
    const { search, page = '1', limit = '50' } = request.query as Record<string, string>

    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { fullName: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}

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
      roles: u.userRoles.map(ur => ur.role.name), createdAt: u.createdAt,
    })), total }
  })

  // POST /api/v1/admin/users/:userId/roles
  app.post('/users/:userId/roles', { preHandler: [requireRole('ADMIN')] }, async (request, reply) => {
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
  app.delete('/users/:userId/roles/:role', { preHandler: [requireRole('ADMIN')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { userId, role } = request.params as { userId: string; role: string }

    const roleRecord = await prisma.role.findUnique({ where: { name: role as never } })
    if (!roleRecord) return reply.status(404).send({ error: 'Role not found' })

    await prisma.userRole.delete({ where: { userId_roleId: { userId, roleId: roleRecord.id } } }).catch(() => null)

    await writeAuditLog({ actorId: actor.userId, action: 'ROLE_REVOKED', entityType: 'user', entityId: userId, oldValue: { role } })

    return { message: `Role ${role} revoked from user ${userId}` }
  })

  // GET /api/v1/admin/teams — list all teams with scores
  app.get('/teams', { preHandler: [requireRole('ADMIN')] }, async (_req, reply) => {
    const teams = await prisma.team.findMany({
      include: {
        leader: { select: { id: true, email: true, fullName: true } },
        members: { include: { user: { select: { id: true, email: true, fullName: true } } } },
        submissions: { where: { isActive: true }, include: { scoreAggregate: true, moderatorReview: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return teams
  })

  // PATCH /api/v1/admin/teams/:teamId/status
  app.patch('/teams/:teamId/status', { preHandler: [requireRole('ADMIN')] }, async (request, reply) => {
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
  app.get('/audit-logs', { preHandler: [requireRole('ADMIN')] }, async (request, reply) => {
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
  app.post('/exports', { preHandler: [requireRole('ADMIN')] }, async (request, reply) => {
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
