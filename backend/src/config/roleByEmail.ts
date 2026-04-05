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

export function getAllowlistedAdminEmails(): string[] {
  return Array.from(buildAdminEmailAllowlist())
}

export function isAllowlistedAdminEmail(email: string): boolean {
  return buildAdminEmailAllowlist().has(normalizeEmail(email))
}

export function getAutoGrantedRolesForEmail(email: string): RoleType[] {
  const roles: RoleType[] = ['COMPETITOR']

  if (isAllowlistedAdminEmail(email)) {
    roles.push('ADMIN')
  }

  return roles
}
