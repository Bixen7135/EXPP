# EXPP - Full Stack Application

A unified Next.js (App Router) React TypeScript application using Bun, PostgreSQL, Redis, and Docker Compose.

## Tech Stack

- **Frontend & Backend**: Next.js 14+ (App Router) with TypeScript
- **Runtime**: Bun
- **Database**: PostgreSQL 16
- **Cache/Sessions**: Redis 7
- **Authentication**: Auth.js (NextAuth v5)
- **ORM**: Drizzle ORM
- **Containerization**: Docker Compose
- **Export Worker**: Pandoc + TexLive (separate service)

## Project Structure

```
.
├── apps/
│   ├── web/              # Next.js web application
│   └── export-worker/    # PDF export service (Pandoc + TexLive)
├── packages/
│   └── db/              # Shared database package (Drizzle ORM)
├── docker-compose.yml    # Production Docker setup
├── docker-compose.dev.yml # Development Docker override
└── .env                  # Environment variables
```

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- [Docker](https://www.docker.com/) and Docker Compose
- [Git](https://git-scm.com/)

### 1. Clone and Install

```bash
git clone <repository-url>
cd project
bun install
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

**Required variables to update in `.env`:**

```bash
# Generate a secret: openssl rand -base64 32
NEXTAUTH_SECRET=your_generated_secret_here

# Strong passwords
POSTGRES_PASSWORD=your_strong_postgres_password
REDIS_PASSWORD=your_strong_redis_password

# OpenAI API key (if using AI features)
OPENAI_API_KEY=sk-your_openai_api_key

# OAuth (optional - for Google login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Choose Your Development Mode

#### Option A: Full Docker Development (Hot Reload)

Run everything in Docker with source code mounted for hot reload:

```bash
# Start all services in development mode
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Or run in detached mode
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

# View logs
docker compose logs -f web

# Stop all services
docker compose down
```

Access the app at [http://localhost:3000](http://localhost:3000)

#### Option B: Hybrid Development (Recommended)

Run infrastructure in Docker, Next.js locally for faster iteration:

```bash
# Terminal 1: Start infrastructure (Postgres + Redis)
docker compose up postgres redis

# Terminal 2: Run database migrations
bun run db:migrate

# Terminal 3: Run web app locally
bun run dev

# Terminal 4 (optional): Run export worker locally
bun run worker:dev
```

Access the app at [http://localhost:3000](http://localhost:3000)

#### Option C: Production Mode

Run the full production build:

```bash
docker compose up --build
```

## Available Commands

```bash
# Development
bun run dev              # Start Next.js dev server (port 3000)
bun run worker:dev       # Start export worker dev server (port 3001)

# Building
bun run build            # Build Next.js for production

# Code Quality
bun run typecheck        # Run TypeScript type checking
bun run lint             # Run ESLint

# Database
bun run db:generate      # Generate Drizzle migrations
bun run db:migrate       # Run database migrations
bun run db:studio        # Open Drizzle Studio (database GUI)

# Docker
docker compose up --build                              # Production mode
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build  # Dev mode
docker compose down                                    # Stop all containers
docker compose down -v                                 # Stop and remove volumes
docker compose logs -f [service]                       # View logs
```

## Database Migrations

After first setup or when pulling new changes:

```bash
# If using Docker (hybrid mode)
docker compose up postgres redis -d
bun run db:migrate

# If using full Docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker compose exec web bun run db:migrate
```

## Services and Ports

| Service        | Port | URL                        |
|----------------|------|----------------------------|
| Web App        | 3000 | http://localhost:3000      |
| Export Worker  | 3001 | http://localhost:3001      |
| PostgreSQL     | 5432 | postgresql://localhost:5432|
| Redis          | 6379 | redis://localhost:6379     |

## Development Workflow

1. **Make code changes** - Files are watched for hot reload
2. **Run type checking** - `bun run typecheck`
3. **Run linting** - `bun run lint`
4. **Test manually** - Check key routes and features
5. **Create migration** (if schema changed) - `bun run db:generate`
6. **Apply migration** - `bun run db:migrate`
7. **Commit changes** - Follow commit message conventions

## Project Commands Reference

### Database Operations

```bash
# Create a new migration after schema changes
bun run db:generate

# Apply pending migrations
bun run db:migrate

# Open Drizzle Studio to view/edit data
bun run db:studio

# Reset database (⚠️ destructive)
docker compose down -v
docker compose up postgres -d
bun run db:migrate
```

### Docker Operations

```bash
# View running containers
docker compose ps

# View logs for specific service
docker compose logs -f web
docker compose logs -f postgres

# Restart a specific service
docker compose restart web

# Rebuild a specific service
docker compose up --build web

# Execute command in running container
docker compose exec web bun run typecheck

# Clean up everything (⚠️ removes volumes)
docker compose down -v
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Then kill the process or change the port in .env
WEB_PORT=3001
```

### Database Connection Issues

```bash
# Check if Postgres is running
docker compose ps postgres

# Check Postgres logs
docker compose logs postgres

# Verify DATABASE_URL in .env matches docker-compose.yml
```

### Hot Reload Not Working in Docker

Make sure you're using the dev override:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Clear Build Cache

```bash
# Remove all containers and volumes
docker compose down -v

# Remove Docker build cache
docker builder prune

# Rebuild from scratch
docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
```

### NEXTAUTH_SECRET Not Set

```bash
# Generate a secret
openssl rand -base64 32

# Add to .env
NEXTAUTH_SECRET=<generated-secret>
```

## API Conventions

- All API routes enforce server-side authentication
- Never trust client-provided userId
- Validate inputs with Zod schemas
- Use database transactions for multi-step writes
- Rate limiting on `/api/openai/chat` and `/api/export` via Redis

## Git Workflow

- Commit after each phase with descriptive messages
- Don't bundle unrelated refactors
- Update progress.txt with changes and command outputs
- Follow the checklist in migration_checklist.md

## Environment Variables

See [.env.example](.env.example) for all available environment variables and their descriptions.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Bun Documentation](https://bun.sh/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Auth.js Documentation](https://authjs.dev)
- [Docker Compose Documentation](https://docs.docker.com/compose)

## License

[Add your license here]

## Contributing

[Add contributing guidelines here]
