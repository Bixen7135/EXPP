# Export Worker Dockerfile with Pandoc + TexLive
# Using pinned version for reproducible builds (Docker best practice Rule 2)
# Debian 12.13 Bookworm released January 2026
FROM debian:bookworm-20260202-slim AS base

# Install system dependencies for pandoc and texlive
# Combined in single RUN to minimize layers (Docker best practice Rule 5)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    wget \
    curl \
    unzip \
    pandoc \
    texlive-xetex \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-lang-cyrillic \
  && rm -rf /var/lib/apt/lists/*

# Install Bun system-wide for non-root access (Docker best practice Rule 9)
# Installing Bun 1.3.9 to match web app version
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.9" && \
    mv /root/.bun /opt/bun && \
    ln -s /opt/bun/bin/bun /usr/local/bin/bun && \
    chmod -R 755 /opt/bun

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace and package files
COPY package.json bun.lock ./
COPY apps/export-worker/package.json ./apps/export-worker/

# Install dependencies
RUN bun install

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies (Bun hoists all deps to root node_modules)
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY apps/export-worker ./apps/export-worker
COPY package.json bun.lock ./

# Build the app
WORKDIR /app/apps/export-worker
RUN bun run build

# Production runtime stage
FROM base AS runner
WORKDIR /app

# Create non-root user for security (Docker best practice Rule 9)
RUN groupadd -r app && useradd -r -g app app

# Copy built app with correct ownership
COPY --from=builder --chown=app:app /app/apps/export-worker/dist ./dist
COPY --from=builder --chown=app:app /app/apps/export-worker/package.json ./package.json

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Switch to non-root user
USER app

EXPOSE 3001

# Health check to verify service is responding (Docker best practice Rule 12)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Run the worker
CMD ["bun", "run", "dist/index.js"]
