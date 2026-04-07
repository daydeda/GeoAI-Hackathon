import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyMultipart from '@fastify/multipart'
import fastifyRateLimit from '@fastify/rate-limit'

import { prisma } from './plugins/prisma.js'
import { authRoutes } from './routes/auth.js'
import { teamRoutes } from './routes/teams.js'
import { submissionRoutes } from './routes/submissions.js'
import { moderatorRoutes } from './routes/moderator.js'
import { judgeRoutes } from './routes/judge.js'
import { adminRoutes } from './routes/admin.js'
import { documentRoutes } from './routes/documents.js'
import { phaseRoutes } from './routes/phases.js'
import { ensureBucket } from './services/storage.js'
import { globalErrorHandler } from './middleware/error.js'
import fastifyStatic from '@fastify/static'
import path from 'path'
import os from 'os'

const PORT = Number(process.env.PORT) || 4000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const DB_CONNECT_RETRIES = Number(process.env.DB_CONNECT_RETRIES) || 30
const DB_CONNECT_DELAY_MS = Number(process.env.DB_CONNECT_DELAY_MS) || 2000

async function connectPrismaWithRetry() {
  let lastError: unknown

  for (let attempt = 1; attempt <= DB_CONNECT_RETRIES; attempt++) {
    try {
      await prisma.$connect()
      return
    } catch (err) {
      lastError = err
      console.error(`[DB] Connection attempt ${attempt}/${DB_CONNECT_RETRIES} failed`)

      if (attempt < DB_CONNECT_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, DB_CONNECT_DELAY_MS))
      }
    }
  }

  throw lastError
}

export async function buildServer() {
  const app = Fastify({
    trustProxy: true,
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  })

  // ── Security ───────────────────────────────────────────────
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // handled by Next.js frontend
    frameguard: false,
    crossOriginResourcePolicy: false,
  })

  await app.register(fastifyCors, {
    origin: [FRONTEND_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(fastifyRateLimit, {
    max: 200,
    timeWindow: '1 minute',
  })

  // ── Cookies & JWT ──────────────────────────────────────────
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || 'fallback-cookie-secret-change-me',
    hook: 'onRequest',
  })

  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'fallback-jwt-secret-change-me',
    cookie: { cookieName: 'geoai_token', signed: false },
    sign: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  })

  // ── File Uploads ───────────────────────────────────────────
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: Number(process.env.MAX_SUBMISSION_UPLOAD_BYTES) || 20 * 1024 * 1024, // 20 MB for proposal uploads
      files: 1,
    },
  })

  // ── Static Plugin ──────────────────────────────────────────
  // Required for reply.sendFile in admin exports
  await app.register(fastifyStatic, {
    root: os.tmpdir(),
    prefix: '/tmp-files/',
    serve: false,
  })

  // ── Error Handling ────────────────────────────────────────
  app.setErrorHandler(globalErrorHandler)

  // ── Prisma lifecycle ───────────────────────────────────────
  app.addHook('onClose', async () => {
    await prisma.$disconnect()
  })

  // ── Decorators ─────────────────────────────────────────────
  app.decorate('prisma', prisma)

  // ── Health check ───────────────────────────────────────────
  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

  // ── Routes (all under /api/v1) ────────────────────────────
  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.register(teamRoutes, { prefix: '/api/v1' })
  await app.register(submissionRoutes, { prefix: '/api/v1' })
  await app.register(moderatorRoutes, { prefix: '/api/v1/mod' })
  await app.register(judgeRoutes, { prefix: '/api/v1/judge' })
  await app.register(adminRoutes, { prefix: '/api/v1/admin' })
  await app.register(documentRoutes, { prefix: '/api/v1' })
  await app.register(phaseRoutes, { prefix: '/api/v1' })

  return app
}

async function start() {
  try {
    await connectPrismaWithRetry()
    await ensureBucket()
    const app = await buildServer()
    await app.listen({ port: PORT, host: '0.0.0.0' })
    app.log.info(`🚀 GEOAI API running on port ${PORT}`)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

start()
