# Migration Checklist: Supabase → Postgres + Next.js

## Authentication
- [x] Email/Password login (Supabase Auth → Auth.js Credentials)
- [x] Google OAuth (Supabase Auth → Auth.js Google provider)
- [x] Session management (Supabase sessions → Auth.js database sessions)
- [x] Password change
- [x] User registration with profile creation
- [x] Auto-create user_settings and user_statistics on signup

## Database Tables (14 total)
- [ ] profiles (Supabase → Drizzle)
- [ ] user_settings (Supabase → Drizzle)
- [ ] tasks (Supabase → Drizzle with soft delete)
- [ ] task_sheets (Supabase → Drizzle)
- [ ] sheet_versions (Supabase → Drizzle)
- [ ] shared_sheets (Supabase → Drizzle)
- [ ] task_submissions (Supabase → Drizzle)
- [ ] sheet_submissions (Supabase → Drizzle)
- [ ] user_statistics (Supabase → Drizzle)
- [ ] user_progress (Supabase → Drizzle)
- [ ] spaced_repetition (Supabase → Drizzle)
- [ ] adaptive_metrics (Supabase → Drizzle)
- [ ] study_groups (Supabase → Drizzle)
- [ ] group_activities (Supabase → Drizzle)

## API Endpoints
- [x] GET/POST /api/tasks (replaces getTasks, saveTasks)
- [x] DELETE /api/tasks (replaces deleteTasks with soft delete)
- [x] GET/POST/DELETE /api/sheets (replaces getSheets, createSheet, deleteSheets)
- [x] GET/PUT/DELETE /api/sheets/[id] (replaces getSheetById, updateSheet)
- [x] POST /api/sheets/[id]/copy (replaces copySheet)
- [x] POST /api/sheets/[id]/share (replaces shareSheet)
- [x] GET/POST /api/sheets/[id]/versions (replaces sheet versioning)
- [ ] GET/PUT /api/profile (replaces getProfile, updateProfile)
- [ ] POST /api/upload (replaces Supabase Storage uploadAvatar)
- [ ] GET/PUT /api/settings (replaces getUserSettings, updateUserSettings)
- [ ] GET /api/statistics (replaces getUserStatistics)
- [ ] GET /api/statistics/progress (replaces getProgressData)
- [ ] POST /api/submissions/task (replaces saveTaskSubmission)
- [ ] POST /api/submissions/sheet (replaces saveSheetSubmission)
- [ ] GET /api/search (replaces searchQuestions with full-text search)
- [ ] Study groups endpoints (createStudyGroup, joinStudyGroup, etc.)
- [ ] POST /api/openai/chat (proxy with Redis rate limiting)
- [ ] POST /api/export (proxy to export worker with rate limiting)

## Storage
- [ ] Avatar uploads (Supabase Storage → local disk volume)
- [ ] Avatar serving (public URLs → /api/avatars/[file])

## Database Triggers → Application Code
- [ ] update_user_statistics() trigger → TypeScript in task submission handler
- [ ] update_sheet_statistics() trigger → TypeScript in sheet submission handler
- [ ] validate_task_ids() trigger → TypeScript validation in sheet create/update

## Frontend Files (23 with Supabase imports)
- [ ] services/supabase.ts → DELETE, replace with services/api.ts
- [ ] services/profile.ts → DELETE, moved to API routes
- [ ] services/settings.ts → DELETE, moved to API routes
- [ ] services/search.ts → DELETE, moved to API routes
- [ ] services/studyGroup.ts → DELETE, moved to API routes
- [ ] services/userStatistics.ts → DELETE, moved to API routes
- [ ] store/authStore.ts → DELETE, replaced with Auth.js
- [ ] types/supabase.ts → DELETE, replaced with types/database.ts (Drizzle inferred)
- [ ] layouts/Navigation.tsx → Update to use Auth.js session
- [ ] pages/Profile.tsx → Update to use API routes
- [ ] pages/Settings.tsx → Update to use API routes
- [ ] pages/TaskLibrary.tsx → Update to use API routes
- [ ] pages/TaskPreview.tsx → Update to use API routes
- [ ] pages/TaskForm.tsx → Update to use API routes
- [ ] pages/SheetsLibrary.tsx → Update to use API routes
- [ ] pages/SheetView.tsx → Update to use API routes
- [ ] pages/SheetEdit.tsx → Update to use API routes
- [ ] components/auth/Statistics.tsx → Update to use API routes
- [ ] components/StudyGroups.tsx → Update to use API routes
- [ ] features/tasks/components/TaskSelectorModal.tsx → Update to use API routes
- [ ] features/tasks/components/TaskSelectModal.tsx → Update to use API routes
- [ ] features/tasks/components/TaskPreviewActions.tsx → Update to use API routes
- [ ] features/sheets/components/CreateSheet.tsx → Update to use API routes

## Docker Services
- [x] PostgreSQL 16 container with volume
- [x] Redis 7 container with volume
- [x] Next.js web app container (Bun-based)
- [x] Export worker container (Pandoc + TexLive)

## Environment Variables
- [ ] Remove: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- [x] Add: DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
- [x] Add: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- [x] Add: OPENAI_API_KEY, EXPORT_WORKER_URL

## Package Dependencies
- [ ] Remove: @supabase/supabase-js, react-router-dom, axios, vite
- [ ] Add: drizzle-orm, postgres, drizzle-kit
- [ ] Add: next-auth, @auth/drizzle-adapter, ioredis, bcryptjs, zod
