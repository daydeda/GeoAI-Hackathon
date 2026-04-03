import { FastifyRequest, FastifyReply } from 'fastify'
import { RoleType } from '@prisma/client'
import { prisma } from '../plugins/prisma.js'

export interface JwtPayload {
  userId: string
  email: string
  roles: RoleType[]
}

/**
 * Ensures the request is authenticated with a valid JWT.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify()
  } catch (err) {
    return reply.status(401).send({ 
      error: 'Unauthorized',
      message: 'Authentication required. Please login.'
    })
  }
}

/**
 * Factory for role-based access control middleware.
 * Verifies the user has at least one of the required roles.
 */
export function authorize(...allowedRoles: RoleType[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    // First, ensure they are authenticated
    try {
      await request.jwtVerify()
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const payload = request.user as JwtPayload
    
    // We can trust the roles in the JWT payload if we trust our signing secret,
    // but a fresh database check is safer if roles change frequently.
    // However, for performance, using roles from payload is common.
    // The existing implementation in plugins/rbac.ts does a DB check.
    const userRoleEntries = await prisma.userRole.findMany({
      where: { userId: payload.userId },
      include: { role: true },
    })

    const roleNames = userRoleEntries.map(ur => ur.role.name)
    const hasRole = allowedRoles.some(role => roleNames.includes(role)) || roleNames.includes('ADMIN')

    if (!hasRole) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      })
    }
  }
}

/**
 * Alias for authorize to support existing codebase imports.
 */
export const requireRole = authorize

/**
 * Specialized middleware for Admin-only routes.
 */
export const isAdmin = authorize('ADMIN')

/**
 * Specialized middleware for Judges.
 */
export const isJudge = authorize('JUDGE', 'ADMIN')

/**
 * Specialized middleware for Moderators.
 */
export const isModerator = authorize('MODERATOR', 'ADMIN')
