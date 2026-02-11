CREATE TABLE IF NOT EXISTS "accounts" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "adaptive_metrics" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"question_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"topic_mastery" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"learning_style" jsonb DEFAULT '{"preferred_difficulty":"medium","optimal_time_per_question":300,"topic_engagement":{}}'::jsonb NOT NULL,
	"overall_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"improvement_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"weak_areas" text[] DEFAULT '{}'::text[] NOT NULL,
	"strong_areas" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"activity_type" text NOT NULL,
	"username" text,
	"details" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shared_sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"shared_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sheet_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sheet_id" uuid,
	"total_tasks" integer NOT NULL,
	"correct_tasks" integer NOT NULL,
	"accuracy" numeric(5, 2) NOT NULL,
	"total_time_spent" integer NOT NULL,
	"average_time_per_task" numeric(10, 2),
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sheet_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"tasks" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spaced_repetition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"topic" text NOT NULL,
	"difficulty" text NOT NULL,
	"last_reviewed" timestamp with time zone DEFAULT now() NOT NULL,
	"next_review" timestamp with time zone NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"ease_factor" numeric(4, 2) DEFAULT '2.5' NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"incorrect_count" integer DEFAULT 0 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "study_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"subject" text NOT NULL,
	"topics" text[] DEFAULT '{}'::text[],
	"members" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"stats" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_sheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"tasks" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"tags" text[] DEFAULT '{}'::text[],
	"is_template" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid,
	"sheet_id" uuid,
	"is_correct" boolean NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"time_spent" integer NOT NULL,
	"user_answer" text,
	"user_solution" text,
	"difficulty" text,
	"topic" text,
	"question_type" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"text" text NOT NULL,
	"type" text NOT NULL,
	"topic" text NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"answer" text,
	"solution" text,
	"explanation" text,
	"context" text,
	"instructions" text,
	"learning_outcome" text,
	"tags" text[] DEFAULT '{}'::text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"sheets_completed" integer DEFAULT 0 NOT NULL,
	"time_spent" integer DEFAULT 0 NOT NULL,
	"accuracy" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'light' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_statistics" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"solved_tasks" integer DEFAULT 0 NOT NULL,
	"total_task_attempts" integer DEFAULT 0 NOT NULL,
	"solved_sheets" integer DEFAULT 0 NOT NULL,
	"total_sheet_attempts" integer DEFAULT 0 NOT NULL,
	"success_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"average_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"total_time_spent" integer DEFAULT 0 NOT NULL,
	"tasks_by_difficulty" jsonb DEFAULT '{"easy":0,"medium":0,"hard":0}'::jsonb NOT NULL,
	"tasks_by_topic" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tasks_by_type" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recent_activity" integer DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp with time zone,
	"image" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_is_admin_idx" ON "profiles" ("is_admin");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sheet_submissions_user_id_idx" ON "sheet_submissions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sheet_submissions_sheet_id_idx" ON "sheet_submissions" ("sheet_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sheet_submissions_submitted_at_idx" ON "sheet_submissions" ("submitted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spaced_repetition_user_id_idx" ON "spaced_repetition" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spaced_repetition_question_id_idx" ON "spaced_repetition" ("question_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spaced_repetition_next_review_idx" ON "spaced_repetition" ("next_review");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spaced_repetition_user_next_review_idx" ON "spaced_repetition" ("user_id","next_review");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "spaced_repetition_user_question_idx" ON "spaced_repetition" ("user_id","question_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_sheets_user_id_idx" ON "task_sheets" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_sheets_tasks_gin_idx" ON "task_sheets" ("tasks");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_sheets_tags_idx" ON "task_sheets" ("tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_sheets_created_at_idx" ON "task_sheets" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_submissions_user_id_idx" ON "task_submissions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_submissions_task_id_idx" ON "task_submissions" ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_submissions_sheet_id_idx" ON "task_submissions" ("sheet_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_submissions_submitted_at_idx" ON "task_submissions" ("submitted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_submissions_topic_idx" ON "task_submissions" ("topic");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_submissions_difficulty_idx" ON "task_submissions" ("difficulty");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_user_id_idx" ON "tasks" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_type_idx" ON "tasks" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_topic_idx" ON "tasks" ("topic");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_difficulty_idx" ON "tasks" ("difficulty");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_created_at_idx" ON "tasks" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_tags_idx" ON "tasks" ("tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_progress_user_id_idx" ON "user_progress" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_progress_date_idx" ON "user_progress" ("date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_progress_user_date_idx" ON "user_progress" ("user_id","date");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "adaptive_metrics" ADD CONSTRAINT "adaptive_metrics_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_activities" ADD CONSTRAINT "group_activities_group_id_study_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "study_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shared_sheets" ADD CONSTRAINT "shared_sheets_sheet_id_task_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "task_sheets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shared_sheets" ADD CONSTRAINT "shared_sheets_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shared_sheets" ADD CONSTRAINT "shared_sheets_recipient_id_profiles_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sheet_submissions" ADD CONSTRAINT "sheet_submissions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sheet_submissions" ADD CONSTRAINT "sheet_submissions_sheet_id_task_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "task_sheets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sheet_versions" ADD CONSTRAINT "sheet_versions_sheet_id_task_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "task_sheets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sheet_versions" ADD CONSTRAINT "sheet_versions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spaced_repetition" ADD CONSTRAINT "spaced_repetition_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spaced_repetition" ADD CONSTRAINT "spaced_repetition_question_id_tasks_id_fk" FOREIGN KEY ("question_id") REFERENCES "tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_sheets" ADD CONSTRAINT "task_sheets_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_sheet_id_task_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "task_sheets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_statistics" ADD CONSTRAINT "user_statistics_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
