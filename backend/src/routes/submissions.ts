import { FastifyInstance } from 'fastify'
import { prisma } from '../plugins/prisma.js'
import { authenticate, JwtPayload } from '../middleware/auth.js'
import { writeAuditLog } from '../services/auditLog.js'
import { minioClient, BUCKET } from '../services/storage.js'
import { getPhaseByKey } from '../services/phaseConfig.js'

const MAX_SUBMISSION_UPLOAD_BYTES = Number(process.env.MAX_SUBMISSION_UPLOAD_BYTES) || 20 * 1024 * 1024

function isPdfUpload(mimetype: string, filename?: string): boolean {
  const normalizedMime = (mimetype || '').toLowerCase().trim()
  const normalizedName = (filename || '').toLowerCase().trim()
  const hasPdfExt = normalizedName.endsWith('.pdf')

  if (normalizedMime === 'application/pdf') return true

  const knownPdfMimes = new Set([
    'application/x-pdf',
    'application/acrobat',
    'applications/vnd.pdf',
    'text/pdf',
    'text/x-pdf',
  ])

  if (knownPdfMimes.has(normalizedMime)) return true

  // Some clients send octet-stream for PDFs; allow only with .pdf extension.
  if (normalizedMime === 'application/octet-stream' && hasPdfExt) return true

  return false
}

async function isDeadlinePassed(): Promise<boolean> {
  const phase = await getPhaseByKey('proposal-submission')
  const deadline = phase?.date || process.env.SUBMISSION_DEADLINE_ISO || '2026-04-29T23:59:59+07:00'
  return new Date() > new Date(deadline)
}

async function isSubmissionLockedByScoring(teamId: string): Promise<boolean> {
  const activeSubmission = await prisma.submission.findFirst({
    where: { teamId, isActive: true },
    select: {
      scoreAggregate: { select: { id: true } },
      judgeScores: { select: { id: true }, take: 1 },
    },
  })

  if (!activeSubmission) return false
  return Boolean(activeSubmission.scoreAggregate || activeSubmission.judgeScores.length > 0)
}

async function ensureCompetitorProfileCompleted(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } } },
  })
  if (!user) return { ok: false as const, error: 'User not found', code: 404 }

  const isCompetitor = user.userRoles.some((ur) => ur.role.name === 'COMPETITOR')
  const hasElevatedRole = user.userRoles.some((ur) => ur.role.name === 'ADMIN' || ur.role.name === 'MODERATOR' || ur.role.name === 'JUDGE')
  if (isCompetitor && !hasElevatedRole && !user.profileCompleted) {
    return { ok: false as const, error: 'Profile setup required before submissions', code: 428 }
  }

  return { ok: true as const }
}

async function getMembersMissingStudentId(teamId: string): Promise<Array<{ userId: string; fullName: string; email: string }>> {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          idCardFileKey: true,
          idCardFileName: true,
        },
      },
    },
  })

  return members
    .filter((member) => {
      const key = (member.user.idCardFileKey || '').trim()
      const legacyName = (member.user.idCardFileName || '').trim()
      return key.length === 0 && legacyName.length === 0
    })
    .map((member) => ({
      userId: member.user.id,
      fullName: member.user.fullName,
      email: member.user.email,
    }))
}

export async function submissionRoutes(app: FastifyInstance) {
  const parseGistdaDeclaration = (body: unknown, fields?: unknown): boolean => {
    const fieldRecord = fields as Record<string, unknown> | undefined
    const fieldCandidate = fieldRecord?.gistdaDeclared ?? fieldRecord?.gistda_declared

    const unwrapFieldValue = (candidate: unknown): unknown => {
      if (candidate && typeof candidate === 'object' && 'value' in candidate) {
        return (candidate as { value?: unknown }).value
      }
      return candidate
    }

    const value = (body as Record<string, unknown> | undefined)?.gistdaDeclared
      ?? (body as Record<string, unknown> | undefined)?.gistda_declared
      ?? unwrapFieldValue(fieldCandidate)

    if (typeof value === 'boolean') return value
    if (typeof value === 'string') return value.trim().toLowerCase() === 'true'
    return false
  }

  // GET /api/v1/submissions — get current team submission history
  app.get('/submissions', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const membership = await prisma.teamMember.findFirst({ where: { userId: actor.userId } })
    if (!membership) return reply.status(404).send({ error: 'Team not found for user' })

    const history = await prisma.submission.findMany({
      where: { teamId: membership.teamId },
      orderBy: { version: 'desc' },
      include: {
        team: { select: { currentStatus: true } },
        moderatorReview: { select: { status: true, note: true } },
        scoreAggregate: { select: { totalWeighted: true, judgeCount: true, calculatedAt: true } },
        judgeScores: {
          orderBy: { scoredAt: 'asc' },
          select: {
            judgeUserId: true,
            comments: true,
            nationalImpactScore: true,
            technologyMethodologyScore: true,
            requirementComplianceScore: true,
            feasibilityScore: true,
            judge: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      }
    })

    const data = history.map((submission) => ({
      ...submission,
      judgeEvaluations: submission.judgeScores.map((score) => {
        return {
          comment: score.comments,
        }
      }),
    }))

    return { data }
  })

  // POST /api/v1/submissions/upload — simple upload wrapper
  app.post('/submissions/upload', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = request.user as JwtPayload
    const profileCheck = await ensureCompetitorProfileCompleted(actor.userId)
    if (!profileCheck.ok) return reply.status(profileCheck.code).send({ error: profileCheck.error })

    const membership = await prisma.teamMember.findFirst({ where: { userId: actor.userId }, include: { team: true } })
    if (!membership) return reply.status(404).send({ error: 'Team not found' })
    if (membership.team.leaderId !== actor.userId) return reply.status(403).send({ error: 'Only team leader can submit' })

    if (await isDeadlinePassed()) {
      return reply.status(423).send({ error: 'Submission deadline has passed' })
    }

    const missingMembers = await getMembersMissingStudentId(membership.teamId)
    if (missingMembers.length > 0) {
      return reply.status(409).send({
        error: 'Submission blocked: all team members must upload Student ID before proposal upload',
        missingMembers,
      })
    }

    if (await isSubmissionLockedByScoring(membership.teamId)) {
      return reply.status(423).send({ error: 'Editing Disabled: Judges have already begun the scoring process for this submission.' })
    }

    // Reuse logic below or implement
    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'No file uploaded' })
    if (!isPdfUpload(data.mimetype, data.filename)) return reply.status(415).send({ error: 'Only PDF accepted' })

    const gistdaDeclared = parseGistdaDeclaration(request.body, data.fields)

    const last = await prisma.submission.findFirst({ where: { teamId: membership.teamId }, orderBy: { version: 'desc' } })
    const nextVersion = (last?.version ?? 0) + 1

    await prisma.submission.updateMany({ where: { teamId: membership.teamId, isActive: true }, data: { isActive: false } })

    const buffers: Buffer[] = []
    let totalSize = 0
    for await (const chunk of data.file) {
      totalSize += chunk.length
      if (totalSize > MAX_SUBMISSION_UPLOAD_BYTES) {
        return reply.status(413).send({ error: 'File too large (max 20 MB)' })
      }
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
    const profileCheck = await ensureCompetitorProfileCompleted(actor.userId)
    if (!profileCheck.ok) return reply.status(profileCheck.code).send({ error: profileCheck.error })

    const { teamId } = request.params as { teamId: string }

    if (await isDeadlinePassed()) {
      return reply.status(423).send({ error: 'Submission deadline has passed' })
    }

    if (await isSubmissionLockedByScoring(teamId)) {
      return reply.status(423).send({ error: 'Editing Disabled: Judges have already begun the scoring process for this submission.' })
    }

    // Verify leader
    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) return reply.status(404).send({ error: 'Team not found' })
    if (team.leaderId !== actor.userId) return reply.status(403).send({ error: 'Only team leader can submit' })

    const missingMembers = await getMembersMissingStudentId(teamId)
    if (missingMembers.length > 0) {
      return reply.status(409).send({
        error: 'Submission blocked: all team members must upload Student ID before proposal upload',
        missingMembers,
      })
    }

    // Parse multipart
    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'No file uploaded' })

    // MIME validation
    if (!isPdfUpload(data.mimetype, data.filename)) {
      return reply.status(415).send({ error: 'Only PDF files are accepted' })
    }

    // GISTDA declaration
    const gistdaDeclared = parseGistdaDeclaration(request.body, data.fields)

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

    for await (const chunk of data.file) {
      totalSize += chunk.length
      if (totalSize > MAX_SUBMISSION_UPLOAD_BYTES) {
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
