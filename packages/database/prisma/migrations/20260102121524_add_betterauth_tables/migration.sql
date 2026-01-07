-- Add BetterAuth fields to users table
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "image" TEXT,
  ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT false;

-- Create BetterAuth sessions table
CREATE TABLE IF NOT EXISTS "betterauth_sessions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "token" TEXT NOT NULL,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "betterauth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for betterauth_sessions
CREATE UNIQUE INDEX IF NOT EXISTS "betterauth_sessions_token_key" ON "betterauth_sessions"("token");
CREATE INDEX IF NOT EXISTS "betterauth_sessions_user_id_idx" ON "betterauth_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "betterauth_sessions_token_idx" ON "betterauth_sessions"("token");
CREATE INDEX IF NOT EXISTS "betterauth_sessions_expires_at_idx" ON "betterauth_sessions"("expires_at");

-- Create BetterAuth accounts table
CREATE TABLE IF NOT EXISTS "betterauth_accounts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "account_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "id_token" TEXT,
  "access_token_expires_at" TIMESTAMP(3),
  "refresh_token_expires_at" TIMESTAMP(3),
  "scope" TEXT,
  "password" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "betterauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for betterauth_accounts
CREATE UNIQUE INDEX IF NOT EXISTS "betterauth_accounts_provider_id_account_id_key" ON "betterauth_accounts"("provider_id", "account_id");
CREATE INDEX IF NOT EXISTS "betterauth_accounts_user_id_idx" ON "betterauth_accounts"("user_id");

-- Create BetterAuth verifications table
CREATE TABLE IF NOT EXISTS "betterauth_verifications" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

-- Create indexes for betterauth_verifications
CREATE INDEX IF NOT EXISTS "betterauth_verifications_identifier_idx" ON "betterauth_verifications"("identifier");
CREATE INDEX IF NOT EXISTS "betterauth_verifications_expires_at_idx" ON "betterauth_verifications"("expires_at");
