#!/bin/sh
set -e

echo "Running database migrations..."
cd /app && bun run --cwd packages/db migrate

echo "Starting Next.js server..."
exec node /app/apps/web/server.js
