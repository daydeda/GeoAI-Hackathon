import { FastifyInstance } from 'fastify'
import { prisma } from '../plugins/prisma.js'
import { authenticate, JwtPayload } from '../middleware/auth.js'
import { writeAuditLog } from '../services/auditLog.js'
import { minioClient, BUCKET } from '../services/storage.js'

function isDeadlinePassed(): boolean {
  const deadline = process.env.SUBMISSION_DEADLINE_ISO
  if (!deadline) return false
  return new Date() > new Date(deadline)
}

export async function submissionRoutes(app: FastifyInstance) {
  // GET /api/v1/submissions — get current team submission history
  app.get('/submissions', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const membership = await prisma.teamMember.findFirst({ where: { userId: actor.userId } })
    if (!membership) return reply.status(404).send({ error: 'Team not found for user' })

    const history = await prisma.submission.findMany({
      where: { teamId: membership.teamId },
      orderBy: { version: 'desc' },
      include: { moderatorReview: { select: { status: true, note: true } } }
    })

    return { data: history }
  })

  // POST /api/v1/submissions/upload — simple upload wrapper
  app.post('/submissions/upload', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const membership = await prisma.teamMember.findFirst({ where: { userId: actor.userId }, include: { team: true } })
    if (!membership) return reply.status(404).send({ error: 'Team not found' })
    if (membership.team.leaderId !== actor.userId) return reply.status(403).send({ error: 'Only team leader can submit' })

    if (isDeadlinePassed()) {
      return reply.status(423).send({ error: 'Submission deadline has passed' })
    }

    // Reuse logic below or implement
    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'No file uploaded' })
    if (data.mimetype !== 'application/pdf') return reply.status(415).send({ error: 'Only PDF accepted' })

    const gistdaDeclared = (request.body as Record<string, string>)?.gistdaDeclared === 'true'

    const last = await prisma.submission.findFirst({ where: { teamId: membership.teamId }, orderBy: { version: 'desc' } })
    const nextVersion = (last?.version ?? 0) + 1

    await prisma.submission.updateMany({ where: { teamId: membership.teamId, isActive: true }, data: { isActive: false } })

    const buffers: Buffer[] = []
    let totalSize = 0
    for await (const chunk of data.file) {
      totalSize += chunk.length
      buffers.push(chunk)
    }

    const fileKey = `submissions/${membership.teamId}/v${nextVersion}_${Date.now()}.pdf`
    await minioClient.putObject(BUCKET, fileKey, Buffer.concat(buffers), totalSize, { 'Content-Type': 'application/pdf' })

    const submission = await prisma.submission.create({
      data: {
        teamId: membership.teamId,
        version: nextVersion,
        gistdaDeclared,
        files: { create: { fileKey, fileSizeBytes: totalSize, originalName: data.filename } }
      }
    })

    await prisma.team.update({ where: { id: membership.teamId }, data: { currentStatus: 'SUBMITTED' } })
    await writeAuditLog({ actorId: actor.userId, action: 'SUBMISSION_UPLOADED', entityType: 'submission', entityId: submission.id })

    return reply.status(201).send({ message: 'Upload successful', id: submission.id })
  })

  // POST /api/v1/teams/:teamId/submissions — legacy direct upload
  app.post('/teams/:teamId/submissions', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { teamId } = request.params as { teamId: string }

    if (isDeadlinePassed()) {
      return reply.status(423).send({ error: 'Submission deadline has passed' })
    }

    // Verify leader
    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) return reply.status(404).send({ error: 'Team not found' })
    if (team.leaderId !== actor.userId) return reply.status(403).send({ error: 'Only team leader can submit' })

    // Parse multipart
    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'No file uploaded' })

    // MIME validation
    if (data.mimetype !== 'application/pdf') {
      return reply.status(415).send({ error: 'Only PDF files are accepted' })
    }

    // GISTDA declaration
    const gistdaDeclared = (request.body as Record<string, string>)?.gistda_declared === 'true'

    // Get current version
    const lastSubmission = await prisma.submission.findFirst({
      where: { teamId },
      orderBy: { version: 'desc' },
    })
    const nextVersion = (lastSubmission?.version ?? 0) + 1

    // Mark old as inactive
    await prisma.submission.updateMany({ where: { teamId, isActive: true }, data: { isActive: false } })

    // Read file into buffer
    const buffers: Buffer[] = []
    let totalSize = 0
    const MAX = Number(process.env.MAX_UPLOAD_BYTES) || 20 * 1024 * 1024

    for await (const chunk of data.file) {
      totalSize += chunk.length
      if (totalSize > MAX) {
        return reply.status(413).send({ error: 'File too large (max 20 MB)' })
      }
      buffers.push(chunk)
    }

    const fileBuffer = Buffer.concat(buffers)
    const fileKey = `submissions/${teamId}/v${nextVersion}_${Date.now()}.pdf`

    // Upload to MinIO
    await minioClient.putObject(BUCKET, fileKey, fileBuffer, fileBuffer.length, { 'Content-Type': 'application/pdf', 'x-team-id': teamId })

    // Create submission record
    const submission = await prisma.submission.create({
      data: {
        teamId,
        version: nextVersion,
        gistdaDeclared,
        files: {
          create: {
            fileKey,
            fileSizeBytes: totalSize,
            mimeType: 'application/pdf',
            originalName: data.filename,
          },
        },
      },
      include: { files: true },
    })

    // Update team status to SUBMITTED
    await prisma.team.update({ where: { id: teamId }, data: { currentStatus: 'SUBMITTED' } })

    await writeAuditLog({
      actorId: actor.userId,
      action: 'SUBMISSION_UPLOADED',
      entityType: 'submission',
      entityId: submission.id,
      newValue: { version: nextVersion, fileKey, gistdaDeclared },
    })

    return reply.status(201).send({
      id: submission.id,
      version: submission.version,
      gistdaDeclared: submission.gistdaDeclared,
      submittedAt: submission.submittedAt,
      file: {
        name: data.filename,
        sizeBytes: totalSize,
        key: fileKey,
      },
    })
  })

  // GET /api/v1/submissions/:submissionId
  app.get('/submissions/:submissionId', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { submissionId } = request.params as { submissionId: string }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { files: true, team: { include: { members: true } } },
    })

    if (!submission) return reply.status(404).send({ error: 'Not found' })

    // Access check: team member, or mod/judge/admin via role check handled by caller routes
    const isMember = submission.team.members.some(m => m.userId === actor.userId)
    if (!isMember) return reply.status(403).send({ error: 'Forbidden' })

    // Generate signed URL (valid 15 min)
    const file = submission.files[0]
    let signedUrl: string | null = null
    if (file) {
      // Return a backend-proxied URL instead of a direct MinIO link
      signedUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/v1/submissions/${submissionId}/view`
    }

    return { ...submission, signedUrl }
  })

  // GET /api/v1/submissions/:submissionId/download
  app.get('/submissions/:submissionId/download', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { submissionId } = request.params as { submissionId: string }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { files: true, team: { include: { members: true } } }
    })

    if (!submission) return reply.status(404).send({ error: 'Not found' })
    const isMember = submission.team.members.some(m => m.userId === actor.userId) || actor.roles.includes('ADMIN') || actor.roles.includes('MODERATOR') || actor.roles.includes('JUDGE')
    if (!isMember) return reply.status(403).send({ error: 'Forbidden' })

    const file = submission.files[0]
    if (!file) return reply.status(404).send({ error: 'File not found' })

    const url = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/v1/submissions/${submissionId}/view`
    return { url }
  })

  // GET /api/v1/submissions/:submissionId/view — Proxied download
  app.get('/submissions/:submissionId/view', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const { submissionId } = request.params as { submissionId: string }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { files: true, team: { include: { members: true } } }
    })

    if (!submission) return reply.status(404).send({ error: 'Not found' })
    const isMember = submission.team.members.some(m => m.userId === actor.userId) || actor.roles.includes('ADMIN') || actor.roles.includes('MODERATOR') || actor.roles.includes('JUDGE')
    if (!isMember) return reply.status(403).send({ error: 'Forbidden' })

    const file = submission.files[0]
    if (!file) return reply.status(404).send({ error: 'File not found' })

    // Fetch from MinIO and stream to response
    const stream = await minioClient.getObject(BUCKET, file.fileKey)
    
    reply.header('Content-Type', 'application/pdf')
    reply.header('Content-Disposition', `inline; filename="${file.originalName}"`)
    
    return reply.send(stream)
  })
}
