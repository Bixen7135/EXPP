# Mission
Migrate this repo from Vite React + Supabase + Express to a unified Next.js (App Router) React TypeScript app using Bun, Postgres, Redis, and Docker Compose for the full stack. Preserve existing user facing behavior. Avoid UI redesign.

# Hard rules
- Never claim you inspected a file unless you opened it.
- No speculation. If unknown, find it in the repo or say you do not know.
- Make changes in small, runnable increments.
- Do not delete large directories or rewrite history without asking.
- Prefer server side access to Postgres. Browser must not connect to Postgres directly.

# Required verification
After each phase, run and record results in progress.txt:
- bun run typecheck (or equivalent)
- bun run lint (if configured)
- docker compose build
- docker compose up (smoke test key routes and APIs)

If tests exist, run them. If not, create a minimal smoke script and run it.

# Working artifacts you must maintain
- progress.txt
  - summary of changes
  - commands run and outputs
  - remaining blockers and next steps
- migration_checklist.md
  - list each Supabase dependent feature and its Postgres replacement
  - mark status per feature

# Workflow
1) Explore, then plan, then implement. Keep planning concise.
2) Prefer minimal diffs and frequent commits.
3) If a change spans multiple subsystems, create a checklist and check items off.

# Target architecture decisions
- Package manager: Bun. Use a single lockfile. Remove npm lockfiles.
- Web app: Next.js App Router, TypeScript.
- DB: Postgres with migrations (Prisma or Drizzle). Pick one and stick to it.
- Auth: server side sessions (Auth.js preferred unless blocked). No client side Supabase auth.
- Redis: use for rate limiting (OpenAI and export) and optionally sessions and caching.
- Export: prefer separate worker container for pandoc/texlive. Web calls it over internal network.

# Commands (edit if different)
- Install: bun install
- Dev (web): bun run dev
- Typecheck: bun run typecheck
- Lint: bun run lint
- Build: bun run build
- Docker: docker compose up --build

# API and security conventions
- All API routes enforce auth server side. Never trust client provided userId.
- Validate inputs with a schema validator (zod or equivalent).
- Use transactions for multi step DB writes (sheets, versions, submissions).
- Rate limit /api/openai/chat and /api/export with Redis.

# Git hygiene
- Commit after each phase with a descriptive message.
- Do not bundle unrelated refactors.
- Update README if the dev workflow changes.

# Notes
- When compacting context, preserve the list of modified files, all commands executed, and all environment variables introduced or removed.
