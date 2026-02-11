-- Add full-text search support for tasks table
ALTER TABLE "tasks" ADD COLUMN "text_tsv" tsvector GENERATED ALWAYS AS (to_tsvector('english', COALESCE("text", ''))) STORED;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_text_tsv_idx" ON "tasks" USING GIN ("text_tsv");
