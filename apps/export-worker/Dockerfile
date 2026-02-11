# Export Worker Dockerfile with Pandoc + TexLive
FROM debian:bookworm-slim AS base

# Install system dependencies for pandoc and texlive
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

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace and package files
COPY package.json bun.lock ./
COPY apps/export-worker/package.json ./apps/export-worker/

# Install dependencies
RUN bun install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/export-worker/node_modules ./apps/export-worker/node_modules

# Copy source
COPY apps/export-worker ./apps/export-worker
COPY package.json bun.lock ./

# Build the app
WORKDIR /app/apps/export-worker
RUN bun run build

# Production runtime stage
FROM base AS runner
WORKDIR /app

# Copy built app
COPY --from=builder /app/apps/export-worker/dist ./dist
COPY --from=builder /app/apps/export-worker/package.json ./package.json

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Run the worker
CMD ["bun", "run", "dist/index.js"]
