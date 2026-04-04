import { prisma } from '../plugins/prisma.js'

type AuditAction =
  | 'ROLE_ASSIGNED'
  | 'ROLE_REVOKED'
  | 'TEAM_CREATED'
  | 'TEAM_STATUS_CHANGED'
  | 'MEMBER_REMOVED'
  | 'SUBMISSION_UPLOADED'
  | 'SUBMISSION_REVIEWED'
  | 'SCORE_SUBMITTED'
  | 'SCORE_UPDATED'
  | 'FINALIST_PROMOTED'
  | 'DOCUMENT_GENERATED'
  | 'EXPORT_TRIGGERED'
  | 'INVITE_CREATED'
  | 'INVITE_REVOKED'
  | 'INVITE_USED'
  | 'PROFILE_COMPLETED'
  | 'PROFILE_UPDATED'
  | 'SUBMISSION_ANNOUNCEMENT_SENT'

interface AuditParams {
  actorId?: string
  action: AuditAction
  entityType: string
  entityId: string
  oldValue?: unknown
  newValue?: unknown
  metadata?: Record<string, unknown>
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue: params.oldValue !== undefined ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue !== undefined ? JSON.stringify(params.newValue) : null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    })
  } catch (err) {
    // Audit log failure should never crash a request
    console.error('[AuditLog] Failed to write:', err)
  }
}
