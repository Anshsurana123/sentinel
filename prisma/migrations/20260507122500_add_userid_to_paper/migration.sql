-- Add nullable ownership column for existing papers without backfill.
ALTER TABLE "Paper" ADD COLUMN IF NOT EXISTS "userId" TEXT;

CREATE INDEX IF NOT EXISTS "Paper_userId_idx" ON "Paper"("userId");
