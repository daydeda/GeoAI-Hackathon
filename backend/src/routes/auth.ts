import { FastifyInstance } from 'fastify'
import { google } from 'googleapis'
import { prisma } from '../plugins/prisma.js'
import { RoleType } from '@prisma/client'
import { JwtPayload, authenticate } from '../middleware/auth.js'

const SCOPES = ['openid', 'email', 'profile']

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL,
  )
}

export async function authRoutes(app: FastifyInstance) {
  // GET /api/v1/auth/google/start
  app.get('/google/start', async (_req, reply) => {
    const oauth2 = getOAuth2Client()
    const url = oauth2.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'select_account',
    })
    return reply.redirect(url)
  })

  // GET /api/v1/auth/google/callback
  app.get('/google/callback', async (request, reply) => {
    const { code, error } = request.query as { code?: string; error?: string }

    if (error || !code) {
      return reply.redirect(
        `${process.env.FRONTEND_URL}/login?error=oauth_denied`
      )
    }

    const oauth2 = getOAuth2Client()
    const { tokens } = await oauth2.getToken(code)
    oauth2.setCredentials(tokens)

    // Fetch Google profile
    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 })
    const { data: profile } = await oauth2Api.userinfo.get()

    if (!profile.id || !profile.email) {
      return reply.redirect(`${process.env.FRONTEND_URL}/login?error=profile_missing`)
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { oauthSubject: `google:${profile.id}` },
      update: {
        fullName: profile.name ?? profile.email,
        avatarUrl: profile.picture ?? null,
      },
      create: {
        email: profile.email,
        fullName: profile.name ?? profile.email,
        avatarUrl: profile.picture ?? null,
        oauthProvider: 'google',
        oauthSubject: `google:${profile.id}`,
      },
    })

    // Ensure default COMPETITOR role
    const competitorRole = await prisma.role.findUnique({ where: { name: 'COMPETITOR' } })
    if (competitorRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: competitorRole.id } },
        update: {},
        create: { userId: user.id, roleId: competitorRole.id },
      })
    }

    // Fetch all user roles
    const userRoles = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true },
    })
    const roles = userRoles.map(ur => ur.role.name as RoleType)

    const payload: JwtPayload = { userId: user.id, email: user.email, roles }
    const token = await reply.jwtSign(payload)

    let target = '/dashboard'
    if (roles.includes('ADMIN')) target = '/admin'
    else if (roles.includes('JUDGE')) target = '/judge'
    else if (roles.includes('MODERATOR')) target = '/moderator'

    return reply
      .setCookie('geoai_token', token, {
        httpOnly: true,
        secure: false, // Changed for local testing/competition
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      .redirect(`${process.env.FRONTEND_URL}${target}`)
  })

  // POST /api/v1/auth/logout
  app.post('/logout', async (_req, reply) => {
    return reply
      .clearCookie('geoai_token', { path: '/' })
      .send({ message: 'Logged out' })
  })

  // GET /api/v1/auth/me
  app.get('/me', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const payload = request.user as JwtPayload

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        userRoles: { include: { role: true } },
        teamMembers: { include: { team: { include: { leader: true } } } },
      },
    })

    if (!user) return reply.status(404).send({ error: 'User not found' })

    const teamMembership = user.teamMembers[0] ?? null

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      roles: user.userRoles.map(ur => ur.role.name),
      team: teamMembership ? {
        id: teamMembership.team.id,
        name: teamMembership.team.name,
        track: teamMembership.team.track,
        status: teamMembership.team.currentStatus,
        isLeader: teamMembership.team.leaderId === user.id,
      } : null,
    }
  })
}
