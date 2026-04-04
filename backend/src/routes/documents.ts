import { FastifyInstance } from 'fastify'
import { prisma } from '../plugins/prisma.js'
import { authenticate, requireRole, JwtPayload } from '../middleware/auth.js'
import { writeAuditLog } from '../services/auditLog.js'
import { generatePermissionLetter } from '../services/pdfGenerator.js'
import { minioClient, BUCKET } from '../services/storage.js'

export async function documentRoutes(app: FastifyInstance) {
  // POST /api/v1/teams/:teamId/documents/permission-letter/generate
  app.post('/teams/:teamId/documents/permission-letter/generate', { preHandler: [requireRole('ADMIN', 'MODERATOR')] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { teamId } = request.params as { teamId: string }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: { include: { user: true } }, leader: true },
    })

    if (!team) return reply.status(404).send({ error: 'Team not found' })
    if (team.currentStatus !== 'FINALIST') {
      return reply.status(403).send({ error: 'Team must be a Finalist to generate documents' })
    }

    // Generate PDF using pdf-lib
    const pdfBytes = await generatePermissionLetter({ team })
    const version = await prisma.document.count({ where: { teamId, type: 'PERMISSION_LETTER' } }) + 1
    const fileKey = `documents/${teamId}/permission-letter-v${version}.pdf`

    await minioClient.putObject(BUCKET, fileKey, Buffer.from(pdfBytes), pdfBytes.length, { 'Content-Type': 'application/pdf' })

    const doc = await prisma.document.create({
      data: { teamId, type: 'PERMISSION_LETTER', fileKey, version },
    })

    await writeAuditLog({
      actorId: actor.userId,
      action: 'DOCUMENT_GENERATED',
      entityType: 'document',
      entityId: doc.id,
      newValue: { teamId, version, fileKey },
    })

    return reply.status(201).send({ id: doc.id, version, generatedAt: doc.generatedAt })
  })

  // GET /api/v1/teams/:teamId/documents/permission-letter — get signed download URL
  app.get('/teams/:teamId/documents/permission-letter', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { teamId } = request.params as { teamId: string }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: { include: { user: true } }, leader: true },
    })

    if (!team) return reply.status(404).send({ error: 'Team not found' })

    // Access check: finalist team members or admin
    const isMember = team.members.some(m => m.userId === actor.userId)
    const userRoles = await prisma.userRole.findMany({ where: { userId: actor.userId }, include: { role: true } })
    const isPrivileged = userRoles.some(ur => ur.role.name === 'ADMIN' || ur.role.name === 'MODERATOR')

    if (!isPrivileged && (!isMember || team.currentStatus !== 'FINALIST')) {
      return reply.status(403).send({ error: 'Only finalist team members can download permission letters' })
    }

    let doc = await prisma.document.findFirst({
      where: { teamId, type: 'PERMISSION_LETTER' },
      orderBy: { version: 'desc' },
    })

    // Fail-safe: Auto-generate if missing for a Finalist
    if (!doc && team.currentStatus === 'FINALIST') {
      try {
        const pdfBytes = await generatePermissionLetter({ team })
        const fileKey = `documents/${teamId}/permission-letter-v1.pdf`
        await minioClient.putObject(BUCKET, fileKey, Buffer.from(pdfBytes), pdfBytes.length, { 'Content-Type': 'application/pdf' })
        doc = await prisma.document.create({ data: { teamId, type: 'PERMISSION_LETTER', fileKey, version: 1 } })
      } catch (err) {
        console.error('[DocumentService] Failsafe generation failed:', err)
        return reply.status(500).send({ error: 'Failed to generate document record' })
      }
    }

    if (!doc) return reply.status(404).send({ error: 'Document not yet generated' })

    const stream = await minioClient.getObject(BUCKET, doc.fileKey)
    
    reply.header('Content-Type', 'application/pdf')
    reply.header('Content-Disposition', `inline; filename="permission-letter-${team.name}.pdf"`)
    
    return reply.send(stream)
  })
}
