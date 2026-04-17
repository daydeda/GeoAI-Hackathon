# ─── Stage 1: Dependencies ──────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --prefer-offline

# ─── Stage 2: Builder ────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Stage 3: Runner ─────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Security: non-root user
RUN addgroup --system --gid 1001 geoai && \
    adduser --system --uid 1001 geoai

# Only production artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/fonts ./fonts

# Prisma Studio may need to write engine artifacts at runtime.
RUN mkdir -p /app/data && chown -R geoai:geoai /app

USER geoai

EXPOSE 4000

# Run schema push (no-migration-folder mode) then start the API
CMD ["sh", "-c", "node node_modules/.bin/prisma db push --accept-data-loss && node dist/server.js"]
