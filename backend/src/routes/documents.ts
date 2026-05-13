import { FastifyInstance } from 'fastify'
import { prisma } from '../plugins/prisma.js'
import { authenticate, requireRole, JwtPayload } from '../middleware/auth.js'
import { writeAuditLog } from '../services/auditLog.js'
import { minioClient, BUCKET } from '../services/storage.js'

export async function documentRoutes(app: FastifyInstance) {
  // POST /api/v1/teams/:teamId/documents/confirmation — upload signed confirmation
    const actor = request.user as JwtPayload
    const { teamId } = request.params as { teamId: string }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    })

    if (!team) return reply.status(404).send({ error: 'Team not found' })

    const isMember = team.members.some(m => m.userId === actor.userId)
    if (!isMember) return reply.status(403).send({ error: 'Only team members can upload confirmation' })

    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'No file uploaded' })

    const normalizedMime = (data.mimetype || '').toLowerCase().trim()
    const normalizedName = (data.filename || '').toLowerCase().trim()
    if (normalizedMime !== 'application/pdf' && !normalizedName.endsWith('.pdf')) {
      return reply.status(415).send({ error: 'Only PDF files are accepted' })
    }

    const buffers: Buffer[] = []
    let totalSize = 0
    for await (const chunk of data.file) {
      totalSize += chunk.length
      if (totalSize > 10 * 1024 * 1024) { // 10MB limit
        return reply.status(413).send({ error: 'File too large (max 10 MB)' })
      }
      buffers.push(chunk)
    }

    const version = await prisma.document.count({ where: { teamId, type: 'CONFIRMATION_JOIN' } }) + 1
    const fileKey = `documents/${teamId}/confirmation-join-v${version}.pdf`

    await minioClient.putObject(BUCKET, fileKey, Buffer.concat(buffers), totalSize, { 'Content-Type': 'application/pdf' })

    const doc = await prisma.document.create({
      data: { teamId, type: 'CONFIRMATION_JOIN', fileKey, version },
    })

    await writeAuditLog({
      actorId: actor.userId,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'document',
      entityId: doc.id,
      newValue: { teamId, type: 'CONFIRMATION_JOIN', version, fileKey },
    })

    return reply.status(201).send({ message: 'Confirmation document uploaded successfully', id: doc.id })
  })
}
