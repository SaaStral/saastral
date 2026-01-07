-- Add UUID generation defaults to BetterAuth tables
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE betterauth_sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE betterauth_accounts ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE betterauth_verifications ALTER COLUMN id SET DEFAULT gen_random_uuid();
