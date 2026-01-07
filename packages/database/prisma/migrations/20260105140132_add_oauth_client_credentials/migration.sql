-- Add OAuth Client Credentials to Integration table
-- These fields allow each organization to configure their own Google OAuth app
-- Values are encrypted before storage for security

ALTER TABLE "integrations" ADD COLUMN "oauth_client_id" TEXT;
ALTER TABLE "integrations" ADD COLUMN "oauth_client_secret" TEXT;
