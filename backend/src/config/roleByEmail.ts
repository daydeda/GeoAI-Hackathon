import { RoleType } from '@prisma/client'

const DEFAULT_ADMIN_EMAIL_ALLOWLIST = [
  'daydedaa@gmail.com',
]

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function parseCsvEmails(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean)
}

function buildAdminEmailAllowlist(): Set<string> {
  const extraEmails = parseCsvEmails(process.env.ADMIN_EMAIL_ALLOWLIST)
  return new Set([
    ...DEFAULT_ADMIN_EMAIL_ALLOWLIST.map(normalizeEmail),
    ...extraEmails,
  ])
}

function buildJudgeEmailAllowlist(): Set<string> {
  return new Set(parseCsvEmails(process.env.JUDGE_EMAIL_ALLOWLIST))
}

function buildModeratorEmailAllowlist(): Set<string> {
  return new Set(parseCsvEmails(process.env.MODERATOR_EMAIL_ALLOWLIST))
}

export function getAllowlistedAdminEmails(): string[] {
  return Array.from(buildAdminEmailAllowlist())
}

export function isAllowlistedAdminEmail(email: string): boolean {
  return buildAdminEmailAllowlist().has(normalizeEmail(email))
}

export function getAutoGrantedRolesForEmail(email: string): RoleType[] {
  const roles: RoleType[] = ['COMPETITOR']
  const normalized = normalizeEmail(email)

  if (buildAdminEmailAllowlist().has(normalized)) {
    roles.push('ADMIN')
  }
  if (buildJudgeEmailAllowlist().has(normalized)) {
    roles.push('JUDGE')
  }
  if (buildModeratorEmailAllowlist().has(normalized)) {
    roles.push('MODERATOR')
  }

  return roles
}
