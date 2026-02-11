# Migration Checklist: Supabase → Postgres + Next.js

## Authentication
- [x] Email/Password login (Supabase Auth → Auth.js Credentials)
- [x] Google OAuth (Supabase Auth → Auth.js Google provider)
- [x] Session management (Supabase sessions → Auth.js JWT sessions)
- [x] Password change
- [x] User registration with profile creation
- [x] Auto-create user_settings and user_statistics on signup

## Database Tables (14 total)
- [x] profiles (Supabase → Drizzle)
- [x] user_settings (Supabase → Drizzle)
- [x] tasks (Supabase → Drizzle with soft delete)
- [x] task_sheets (Supabase → Drizzle)
- [x] sheet_versions (Supabase → Drizzle)
- [x] shared_sheets (Supabase → Drizzle)
- [x] task_submissions (Supabase → Drizzle)
- [x] sheet_submissions (Supabase → Drizzle)
- [x] user_statistics (Supabase → Drizzle)
- [x] user_progress (Supabase → Drizzle)
- [x] spaced_repetition (Supabase → Drizzle)
- [x] adaptive_metrics (Supabase → Drizzle)
- [x] study_groups (Supabase → Drizzle)
- [x] group_activities (Supabase → Drizzle)

## API Endpoints
- [x] GET/POST /api/tasks (replaces getTasks, saveTasks)
- [x] DELETE /api/tasks (replaces deleteTasks with soft delete)
- [x] GET/POST/DELETE /api/sheets (replaces getSheets, createSheet, deleteSheets)
- [x] GET/PUT/DELETE /api/sheets/[id] (replaces getSheetById, updateSheet)
- [x] POST /api/sheets/[id]/copy (replaces copySheet)
- [x] POST /api/sheets/[id]/share (replaces shareSheet)
- [x] GET/POST /api/sheets/[id]/versions (replaces sheet versioning)
- [x] GET/PUT /api/profile (replaces getProfile, updateProfile)
- [x] POST /api/profile/avatar (replaces Supabase Storage uploadAvatar)
- [x] GET/PUT /api/settings (replaces getUserSettings, updateUserSettings)
- [x] GET /api/statistics (replaces getUserStatistics)
- [x] GET /api/statistics/progress (replaces getProgressData)
- [x] POST /api/submissions/task (replaces saveTaskSubmission)
- [x] POST /api/submissions/sheet (replaces saveSheetSubmission)
- [x] GET /api/search (replaces searchQuestions with full-text search)
- [ ] Study groups endpoints (createStudyGroup, joinStudyGroup, etc.) — deferred
- [x] POST /api/openai/chat (proxy with Redis rate limiting)
- [x] POST /api/export (proxy to export worker with rate limiting)

## Storage
- [x] Avatar uploads (Supabase Storage → local disk volume via /api/profile/avatar)
- [x] Avatar serving (Next.js serves from public/uploads/avatars/ statically)

## Database Triggers → Application Code
- [x] update_user_statistics() trigger → TypeScript in task submission handler
- [x] update_sheet_statistics() trigger → TypeScript in sheet submission handler
- [ ] validate_task_ids() trigger → TypeScript validation in sheet create/update

## Frontend Files (old frontend/ directory deleted in Phase C.6)
- [x] services/supabase.ts → DELETED, replaced with api-client.ts
- [x] services/profile.ts → DELETED, moved to API routes
- [x] services/settings.ts → DELETED, moved to API routes
- [x] services/search.ts → DELETED, moved to API routes
- [x] services/studyGroup.ts → DELETED (study groups deferred)
- [x] services/userStatistics.ts → DELETED, moved to API routes
- [x] store/authStore.ts → DELETED, replaced with Auth.js useAuth hook
- [x] types/supabase.ts → DELETED, replaced with Drizzle inferred types
- [x] layouts/Navigation.tsx → Recreated with Auth.js session
- [x] pages/Profile.tsx → Recreated at /profile
- [x] pages/Settings.tsx → Recreated at /settings
- [x] pages/TaskLibrary.tsx → Recreated at /tasks
- [x] pages/TaskPreview.tsx → Deferred (AI generation flow)
- [x] pages/TaskForm.tsx → Deferred (AI generation flow)
- [x] pages/SheetsLibrary.tsx → Recreated at /sheets
- [x] pages/SheetView.tsx → Recreated at /sheets/[id]
- [x] pages/SheetEdit.tsx → Recreated at /sheets/[id]/edit
- [x] components/auth/Statistics.tsx → Recreated at /statistics
- [x] components/StudyGroups.tsx → Deferred
- [x] features/tasks/components/TaskSelectorModal.tsx → Recreated as TaskSelector
- [x] features/tasks/components/TaskSelectModal.tsx → Recreated as TaskSelector
- [x] features/tasks/components/TaskPreviewActions.tsx → Deferred (AI generation flow)
- [x] features/sheets/components/CreateSheet.tsx → Integrated into /sheets page

## Docker Services
- [x] PostgreSQL 16 container with volume
- [x] Redis 7 container with volume
- [x] Next.js web app container (Bun-based)
- [x] Export worker container (Pandoc + TexLive)

## Environment Variables
- [x] Remove: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (old frontend deleted)
- [x] Add: DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
- [x] Add: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- [x] Add: OPENAI_API_KEY, EXPORT_WORKER_URL

## Package Dependencies
- [x] Remove: @supabase/supabase-js, react-router-dom, axios, vite (old frontend deleted)
- [x] Add: drizzle-orm, postgres, drizzle-kit
- [x] Add: next-auth, @auth/drizzle-adapter, ioredis, bcryptjs, zod
