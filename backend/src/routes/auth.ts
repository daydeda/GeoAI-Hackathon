import { FastifyInstance } from 'fastify'
import { google } from 'googleapis'
import { prisma } from '../plugins/prisma.js'
import { RoleType } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { JwtPayload, authenticate } from '../middleware/auth.js'
import { getAutoGrantedRolesForEmail } from '../config/roleByEmail.js'
import { z } from 'zod'
import { minioClient, BUCKET } from '../services/storage.js'
import { writeAuditLog } from '../services/auditLog.js'

const SCOPES = ['openid', 'email', 'profile']
const PROFILE_ID_MAX_BYTES = 5 * 1024 * 1024

const ProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  university: z.string().trim().min(2).max(160),
  yearOfStudy: z.coerce.number().int().min(1).max(12),
  phoneNumber: z.string().trim().min(6).max(30),
  address: z.string().trim().min(8).max(500),
})

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

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
  const existingUser = await prisma.user.findUnique({ where: { id: userId } }) as {
    profileCompleted?: boolean
    firstName?: string | null
    lastName?: string | null
  } | null
  const shouldKeepCustomName = Boolean(existingUser?.profileCompleted && existingUser?.firstName && existingUser?.lastName)

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(canSetEmail ? { email } : {}),
      ...(shouldKeepCustomName ? {} : { fullName }),
      avatarUrl,
      oauthProvider: 'google',
    },
  })
}

export async function authRoutes(app: FastifyInstance) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  const cookieSecureOverride = process.env.COOKIE_SECURE
  const useSecureCookie =
    cookieSecureOverride === 'true' ||
    (cookieSecureOverride !== 'false' && frontendUrl.startsWith('https://'))

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
      // If a user has no roles yet (fresh account), default to COMPETITOR.
      const existingUserRoles = await prisma.userRole.findMany({ where: { userId: user.id } })
      const autoGrantedRoles = getAutoGrantedRolesForEmail(user.email)
      const desiredRoles = new Set<RoleType>(autoGrantedRoles)
      if (existingUserRoles.length === 0 && desiredRoles.size === 0) {
        desiredRoles.add('COMPETITOR')
      }

      // DB reset can leave role rows missing before seed runs; bootstrap required roles here.
      for (const roleName of desiredRoles) {
        await prisma.role.upsert({
          where: { name: roleName },
          update: {},
          create: { name: roleName },
        })
      }

      const dbRoles = await prisma.role.findMany({
        where: { name: { in: Array.from(desiredRoles) } },
      })
      const roleByName = new Map(dbRoles.map(role => [role.name, role]))

      for (const roleName of desiredRoles) {
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

      const isCompetitorOnboardingRequired = Boolean(roles.includes('COMPETITOR') && !user.profileCompleted)

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        roles,
        profileCompleted: Boolean(user.profileCompleted),
      }
      const token = await reply.jwtSign(payload)

      let target = '/dashboard'
      if (roles.includes('ADMIN')) target = '/admin'
      else if (roles.includes('JUDGE')) target = '/judge'
      else if (roles.includes('MODERATOR')) target = '/moderator'
      else if (isCompetitorOnboardingRequired) target = '/team'
      else if (roles.length === 0) target = '/team'

      return reply
        .setCookie('geoai_token', token, {
          httpOnly: true,
          secure: useSecureCookie,
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

  // PUT /api/v1/auth/profile
  app.put('/profile', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const existingUser = await prisma.user.findUnique({ where: { id: actor.userId } }) as {
      id: string
      profileCompleted?: boolean
      idCardFileKey?: string | null
      idCardFileName?: string | null
    } | null
    if (!existingUser) return reply.status(404).send({ error: 'User not found' })

    const rawProfileBody: Record<string, string> = {}
    let uploadedFile:
      | {
          mimetype: string
          filename: string
          size: number
          buffer: Buffer
        }
      | null = null

    for await (const part of request.parts()) {
      if (part.type === 'file') {
        const chunks: Buffer[] = []
        let totalSize = 0
        for await (const chunk of part.file) {
          totalSize += chunk.length
          if (totalSize > PROFILE_ID_MAX_BYTES) {
            return reply.status(413).send({ error: 'Student ID file exceeds 5MB limit' })
          }
          chunks.push(chunk)
        }

        if (!uploadedFile) {
          uploadedFile = {
            mimetype: part.mimetype,
            filename: part.filename || 'student-id',
            size: totalSize,
            buffer: Buffer.concat(chunks),
          }
        }
      } else {
        rawProfileBody[part.fieldname] = String(part.value ?? '').trim()
      }
    }

    const parsed = ProfileSchema.safeParse(rawProfileBody)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    if (!uploadedFile && !existingUser.idCardFileKey) {
      return reply.status(400).send({ error: 'Student ID file is required for first-time profile setup' })
    }

    let idCardFileKey = existingUser.idCardFileKey
    let idCardFileName = existingUser.idCardFileName

    if (uploadedFile) {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!allowedMimeTypes.includes(uploadedFile.mimetype)) {
        return reply.status(415).send({ error: 'Student ID must be JPG, PNG, or PDF' })
      }

      const safeName = safeFileName(uploadedFile.filename)
      idCardFileKey = `profiles/${actor.userId}/student-id-${Date.now()}-${safeName}`
      idCardFileName = uploadedFile.filename
      await minioClient.putObject(BUCKET, idCardFileKey, uploadedFile.buffer, uploadedFile.size, {
        'Content-Type': uploadedFile.mimetype,
      })
    }

    const profile = parsed.data
    const fullName = `${profile.firstName} ${profile.lastName}`.trim()

    const updatedUser = await prisma.user.update({
      where: { id: actor.userId },
      data: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        university: profile.university,
        yearOfStudy: profile.yearOfStudy,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        idCardFileKey,
        idCardFileName,
        fullName,
        profileCompleted: true,
      },
    }) as {
      university?: string | null
      yearOfStudy?: number | null
    }

    await writeAuditLog({
      actorId: actor.userId,
      action: existingUser.profileCompleted ? 'PROFILE_UPDATED' : 'PROFILE_COMPLETED',
      entityType: 'user',
      entityId: actor.userId,
      newValue: {
        fullName,
        university: updatedUser.university,
        yearOfStudy: updatedUser.yearOfStudy,
      },
    })

    return {
      message: existingUser.profileCompleted ? 'Profile updated' : 'Profile completed',
      profileCompleted: true,
    }
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
    }) as ({
      profileCompleted?: boolean
      firstName?: string | null
      lastName?: string | null
      university?: string | null
      yearOfStudy?: number | null
      phoneNumber?: string | null
      address?: string | null
      idCardFileKey?: string | null
    } & Awaited<ReturnType<typeof prisma.user.findUnique>>)

    if (!user) return reply.status(404).send({ error: 'User not found' })

    const u = user as any
    const teamMembership = u.teamMembers[0] ?? null

    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl,
      roles: u.userRoles.map((ur: any) => ur.role.name),
      profileCompleted: u.profileCompleted,
      profile: {
        firstName: u.firstName,
        lastName: u.lastName,
        university: u.university,
        yearOfStudy: u.yearOfStudy,
        phoneNumber: u.phoneNumber,
        address: u.address,
        idCardFileUploaded: Boolean(u.idCardFileKey),
      },
      team: teamMembership ? {
        id: teamMembership.team.id,
        name: teamMembership.team.name,
        track: teamMembership.team.track,
        status: teamMembership.team.currentStatus,
        isLeader: teamMembership.team.leaderId === u.id,
      } : null,
    }
  })
}
