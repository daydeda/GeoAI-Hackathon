import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { prisma } from '../plugins/prisma.js'
import { authenticate, JwtPayload } from '../middleware/auth.js'
import { writeAuditLog } from '../services/auditLog.js'
import { Track } from '@prisma/client'

const MAX_TEAM_SIZE = Number(process.env.MAX_TEAM_SIZE) || 4

const CreateTeamSchema = z.object({
  name: z.string().min(2).max(80),
  institution: z.string().min(2).max(120),
  track: z.enum(['SMART_AGRICULTURE', 'DISASTER_FLOOD_RESPONSE']),
})

async function ensureCompetitorProfileCompleted(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } } },
  })
  if (!user) return { ok: false as const, error: 'User not found' }

  const isCompetitor = user.userRoles.some((ur) => ur.role.name === 'COMPETITOR')
  const hasElevatedRole = user.userRoles.some((ur) => ur.role.name === 'ADMIN' || ur.role.name === 'MODERATOR' || ur.role.name === 'JUDGE')
  if (isCompetitor && !hasElevatedRole && !user.profileCompleted) {
    return {
      ok: false as const,
      error: 'Profile setup required before team operations',
      code: 428,
    }
  }

  return { ok: true as const }
}

export async function teamRoutes(app: FastifyInstance) {
  // POST /api/v1/teams — create team (leader only, must not be in a team)
  app.post('/teams', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const profileCheck = await ensureCompetitorProfileCompleted(actor.userId)
    if (!profileCheck.ok) return reply.status((profileCheck as { code?: number }).code || 400).send({ error: profileCheck.error })

    const body = CreateTeamSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    // Check if user already in a team
    const existing = await prisma.teamMember.findFirst({ where: { userId: actor.userId } })
    if (existing) return reply.status(409).send({ error: 'You are already in a team' })

    const team = await prisma.team.create({
      data: {
        name: body.data.name,
        institution: body.data.institution,
        track: body.data.track as Track,
        leaderId: actor.userId,
        members: { create: { userId: actor.userId } },
        invites: { create: { code: nanoid(10) } }
      },
      include: { members: true },
    })

    await writeAuditLog({
      actorId: actor.userId,
      action: 'TEAM_CREATED',
      entityType: 'team',
      entityId: team.id,
      newValue: { name: team.name, track: team.track },
    })

    return reply.status(201).send(team)
  })

  // GET /api/v1/teams/my
  app.get('/teams/my', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const membership = await prisma.teamMember.findFirst({
      where: { userId: actor.userId },
      include: {
        team: {
          include: {
            members: { include: { user: { select: { id: true, email: true, fullName: true, avatarUrl: true } } } },
            leader: { select: { id: true, email: true, fullName: true } },
            invites: { where: { revoked: false } },
            submissions: { where: { isActive: true }, orderBy: { version: 'desc' }, take: 1 },
          },
        },
      },
    })

    if (!membership) return reply.status(404).send({ error: 'Not in a team' })

    const team = membership.team
    const activeInvite = team.invites[0] ?? null

    return {
      id: team.id,
      name: team.name,
      institution: team.institution,
      track: team.track,
      status: team.currentStatus,
      isLeader: team.leaderId === actor.userId,
      memberCount: team.members.length,
      maxMembers: MAX_TEAM_SIZE,
      members: team.members.map(m => ({
        userId: m.user.id,
        email: m.user.email,
        fullName: m.user.fullName,
        avatarUrl: m.user.avatarUrl,
        isLeader: m.userId === team.leaderId,
        joinedAt: m.joinedAt,
      })),
      inviteCode: activeInvite?.code ?? null,
      activeSubmission: team.submissions[0] ?? null,
    }
  })

  // POST /api/v1/teams/:teamId/invites — generate invite code
  app.post('/teams/:teamId/invites', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { teamId } = request.params as { teamId: string }

    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) return reply.status(404).send({ error: 'Team not found' })
    if (team.leaderId !== actor.userId) return reply.status(403).send({ error: 'Only team leader can generate invites' })

    const memberCount = await prisma.teamMember.count({ where: { teamId } })
    if (memberCount >= MAX_TEAM_SIZE) return reply.status(409).send({ error: 'Team is full' })

    // Revoke all existing invites
    await prisma.invite.updateMany({ where: { teamId, revoked: false }, data: { revoked: true } })

    const invite = await prisma.invite.create({
      data: { teamId, code: nanoid(10) },
    })

    await writeAuditLog({ actorId: actor.userId, action: 'INVITE_CREATED', entityType: 'invite', entityId: invite.id, newValue: { teamId, code: invite.code } })

    return reply.status(201).send({ code: invite.code, inviteUrl: `${process.env.FRONTEND_URL}/invite/${invite.code}` })
  })

  // POST /api/v1/invites/:code/join
  app.post('/invites/:code/join', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const profileCheck = await ensureCompetitorProfileCompleted(actor.userId)
    if (!profileCheck.ok) return reply.status((profileCheck as { code?: number }).code || 400).send({ error: profileCheck.error })

    const { code } = request.params as { code: string }

    const invite = await prisma.invite.findUnique({ where: { code }, include: { team: true } })
    if (!invite || invite.revoked) return reply.status(404).send({ error: 'Invite not found or revoked' })
    if (invite.expiresAt && invite.expiresAt < new Date()) return reply.status(410).send({ error: 'Invite expired' })

    const memberCount = await prisma.teamMember.count({ where: { teamId: invite.teamId } })
    if (memberCount >= MAX_TEAM_SIZE) return reply.status(409).send({ error: 'Team is full' })

    const existing = await prisma.teamMember.findFirst({ where: { userId: actor.userId } })
    if (existing) return reply.status(409).send({ error: 'Already in a team' })

    const member = await prisma.teamMember.create({
      data: { teamId: invite.teamId, userId: actor.userId },
    })

    await writeAuditLog({ actorId: actor.userId, action: 'INVITE_USED', entityType: 'team', entityId: invite.teamId, newValue: { userId: actor.userId } })

    return reply.status(201).send({ teamId: invite.teamId, teamName: invite.team.name, memberId: member.id })
  })

  // POST /api/v1/teams/join (Body: { inviteCode }) — Frontend alias
  app.post('/teams/join', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const profileCheck = await ensureCompetitorProfileCompleted(actor.userId)
    if (!profileCheck.ok) return reply.status((profileCheck as { code?: number }).code || 400).send({ error: profileCheck.error })

    const { inviteCode } = request.body as { inviteCode: string }

    if (!inviteCode) return reply.status(400).send({ error: 'Invite code required' })

    const invite = await prisma.invite.findUnique({ where: { code: inviteCode }, include: { team: true } })
    if (!invite || invite.revoked) return reply.status(404).send({ error: 'Invite code is invalid or has been revoked' })
    if (invite.expiresAt && invite.expiresAt < new Date()) return reply.status(410).send({ error: 'Invite code has expired' })

    const memberCount = await prisma.teamMember.count({ where: { teamId: invite.teamId } })
    if (memberCount >= MAX_TEAM_SIZE) return reply.status(409).send({ error: 'This team has reached its maximum size' })

    const existing = await prisma.teamMember.findFirst({ where: { userId: actor.userId } })
    if (existing) return reply.status(409).send({ error: 'You are already registered with another team' })

    const member = await prisma.teamMember.create({
      data: { teamId: invite.teamId, userId: actor.userId },
    })

    await writeAuditLog({
      actorId: actor.userId,
      action: 'INVITE_USED',
      entityType: 'team',
      entityId: invite.teamId,
      newValue: { userId: actor.userId, method: 'code' },
    })

    return reply.status(201).send({ teamId: invite.teamId, teamName: invite.team.name, memberId: member.id })
  })

  // DELETE /api/v1/teams/:teamId/members/:userId
  app.delete('/teams/:teamId/members/:userId', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { teamId, userId } = request.params as { teamId: string; userId: string }

    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) return reply.status(404).send({ error: 'Team not found' })
    if (team.leaderId !== actor.userId) return reply.status(403).send({ error: 'Only team leader can remove members' })
    if (userId === actor.userId) return reply.status(400).send({ error: 'Leader cannot remove themselves' })

    await prisma.teamMember.delete({ where: { teamId_userId: { teamId, userId } } })

    await writeAuditLog({ actorId: actor.userId, action: 'MEMBER_REMOVED', entityType: 'team', entityId: teamId, newValue: { removedUserId: userId } })

    return { message: 'Member removed' }
  })
}
