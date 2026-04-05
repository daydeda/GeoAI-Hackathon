/// <reference types="node" />

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

function getAllowlistedAdminEmails(): string[] {
  const extraEmails = parseCsvEmails(process.env.ADMIN_EMAIL_ALLOWLIST)
  return Array.from(new Set([
    ...DEFAULT_ADMIN_EMAIL_ALLOWLIST.map(normalizeEmail),
    ...extraEmails,
  ]))
}

// Allow CLI override: --db-url=...
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--db-url=')) {
    process.env.DATABASE_URL = arg.split('=')[1]
  }
}

// If DATABASE_URL not present, try loading backend/.env
function tryLoadDotEnv() {
  if (process.env.DATABASE_URL) return
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const envPath = path.resolve(__dirname, '..', '.env')
  try {
    const raw = fs.readFileSync(envPath, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))\s*$/)
      if (m) {
        process.env.DATABASE_URL = m[1] ?? m[2] ?? m[3]
        break
      }
    }
  } catch {
    // ignore
  }
}

tryLoadDotEnv()

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error('ERROR: DATABASE_URL is not set. Set DATABASE_URL, pass `--db-url=...`, or ensure backend/.env exists with DATABASE_URL.')
  process.exit(1)
}

if (dbUrl.includes('@db:')) {
  console.warn('NOTE: DATABASE_URL points to host "db" — ensure docker-compose is running on the server (e.g. `docker-compose up -d db`) or override DATABASE_URL to a reachable DB.')
}

const prisma = new PrismaClient()

const emails = getAllowlistedAdminEmails()

function sanitizeSubject(email: string) {
  return `seed:${email.replace(/[^a-zA-Z0-9]/g, '_')}`
}

async function main() {
  console.log('🔧 Granting ADMIN role to emails...')

  if (emails.length === 0) {
    throw new Error('No allowlisted admin emails found. Configure ADMIN_EMAIL_ALLOWLIST or update roleByEmail.ts.')
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
  if (!adminRole) {
    throw new Error('ADMIN role not found. Run prisma/seed.ts or create roles first.')
  }

  for (const email of emails) {
    const subject = sanitizeSubject(email)

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        fullName: email,
        oauthProvider: 'google',
        oauthSubject: subject,
        avatarUrl: null,
      },
    })

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
      update: {},
      create: { userId: user.id, roleId: adminRole.id, assignedBy: null },
    })

    console.log(`✅ ${email} => ADMIN (userId=${user.id})`)
  }

  console.log('🎉 Done')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
