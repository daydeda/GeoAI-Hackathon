import { FastifyInstance } from 'fastify'
import { google } from 'googleapis'
import { prisma } from '../plugins/prisma.js'
import { RoleType } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { JwtPayload, authenticate } from '../middleware/auth.js'
import { getAutoGrantedRolesForEmail } from '../config/roleByEmail.js'

const SCOPES = ['openid', 'email', 'profile']

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL,
  )
}

async function upsertOAuthUser(input: {
  subject: string
  email: string
  fullName: string
  avatarUrl: string | null
}) {
  const { subject, email, fullName, avatarUrl } = input

  return prisma.$transaction(async (tx) => {
    const existingBySubject = await tx.user.findUnique({
      where: { oauthSubject: subject },
    })

    if (existingBySubject) {
      return tx.user.update({
        where: { id: existingBySubject.id },
        data: { email, fullName, avatarUrl, oauthProvider: 'google' },
      })
    }

    const existingByEmail = await tx.user.findUnique({ where: { email } })
    if (existingByEmail) {
      return tx.user.update({
        where: { id: existingByEmail.id },
        data: {
          fullName,
          avatarUrl,
          oauthProvider: 'google',
          oauthSubject: subject,
        },
      })
    }

    return tx.user.create({
      data: {
        email,
        fullName,
        avatarUrl,
        oauthProvider: 'google',
        oauthSubject: subject,
      },
    })
  })
}

async function recoverUserFromUniqueConflict(subject: string, email: string) {
  const existingByEmail = await prisma.user.findUnique({ where: { email } })
  if (existingByEmail) {
    // Best-effort link for legacy/local rows that predate OAuth subject mapping.
    if (existingByEmail.oauthSubject !== subject) {
      try {
        await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { oauthProvider: 'google', oauthSubject: subject },
        })
      } catch {
        // If linking fails due another conflict, continue with existing account.
      }
    }
    return existingByEmail
  }

  return prisma.user.findUnique({ where: { oauthSubject: subject } })
}

async function syncUserProfileSafely(input: {
  userId: string
  email: string
  fullName: string
  avatarUrl: string | null
}) {
  const { userId, email, fullName, avatarUrl } = input

  const emailOwner = await prisma.user.findUnique({ where: { email } })
  const canSetEmail = !emailOwner || emailOwner.id === userId

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(canSetEmail ? { email } : {}),
      fullName,
      avatarUrl,
      oauthProvider: 'google',
    },
  })
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
    try {
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

      const subject = `google:${profile.id}`
      const fullName = profile.name ?? profile.email

      let user
      try {
        // Resolve user by subject first, then by email, to avoid unique conflicts.
        user = await upsertOAuthUser({
          subject,
          email: profile.email,
          fullName,
          avatarUrl: profile.picture ?? null,
        })
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          const recovered = await recoverUserFromUniqueConflict(subject, profile.email)
          if (!recovered) throw err
          user = recovered
        } else {
          throw err
        }
      }

      // Keep profile data fresh while avoiding unique email conflicts.
      user = await syncUserProfileSafely({
        userId: user.id,
        email: profile.email,
        fullName,
        avatarUrl: profile.picture ?? null,
      })

      // Auto-grant roles based on email policy at login.
      const autoGrantedRoles = getAutoGrantedRolesForEmail(user.email)
      const dbRoles = await prisma.role.findMany({
        where: { name: { in: autoGrantedRoles } },
      })
      const roleByName = new Map(dbRoles.map(role => [role.name, role]))

      for (const roleName of autoGrantedRoles) {
        const role = roleByName.get(roleName)
        if (!role) continue

        await prisma.userRole.upsert({
          where: { userId_roleId: { userId: user.id, roleId: role.id } },
          update: {},
          create: { userId: user.id, roleId: role.id },
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
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
        .redirect(`${process.env.FRONTEND_URL}${target}`)
    } catch (err) {
      request.log.error({ err }, 'Google OAuth callback failed')
      return reply.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`)
    }
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
