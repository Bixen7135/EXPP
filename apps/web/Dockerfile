# Multi-stage build for Next.js app with Bun
FROM oven/bun:1-alpine AS base

# Install dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace configuration and package files
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/

# Install dependencies using Bun
RUN bun install

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage (Bun hoists all deps to root node_modules)
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY apps/web ./apps/web
COPY packages/db ./packages/db
COPY package.json bun.lock ./

# Set build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Dummy build-time env vars (Next.js needs these to compile; real values come at runtime)
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV REDIS_URL="redis://localhost:6379"
ENV NEXTAUTH_SECRET="build-secret-not-used-at-runtime"
ENV NEXTAUTH_URL="http://localhost:3000"

# Build Next.js app
RUN cd apps/web && bun run build

# Production runtime stage
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built app from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Copy database package (needed at runtime for migrations and queries)
COPY --from=builder --chown=nextjs:nodejs /app/packages/db ./packages/db
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER nextjs

EXPOSE 3000

# Start Next.js server
CMD ["bun", "run", "apps/web/server.js"]
