# Running SaaStral in Preview/Dev Mode (AI Agent Guide)

Step-by-step instructions for AI agents to start the project locally and reach the dashboard. Every command is tested and includes pitfall notes.

## Prerequisites

| Tool | Minimum version | Check command |
|------|----------------|---------------|
| Node.js | 20+ | `node --version` |
| pnpm | 8+ | `pnpm --version` |
| PostgreSQL | 14+ | `pg_lsclusters` or `psql --version` |

Docker is **not required** — PostgreSQL can run directly on the host.

## Step 1: Start PostgreSQL

### Option A: System PostgreSQL (no Docker)

```bash
# Start the cluster (common in CI / cloud dev environments)
pg_ctlcluster 16 main start   # adjust version number as needed

# Verify it's running
pg_isready
# Expected: /var/run/postgresql:5432 - accepting connections

# Set the postgres user password
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# Create the dev database
sudo -u postgres psql -c "CREATE DATABASE saastral_dev;"

# Verify connection works with password auth
PGPASSWORD=postgres psql -h localhost -U postgres -d saastral_dev -c "SELECT 1;"
```

### Option B: Docker Compose

```bash
docker compose -f docker-compose.dev.yml up -d
# Starts PostgreSQL on port 5432 and Redis on port 6379
# Database `saastral_dev` is created automatically
```

## Step 2: Create the `.env` file

Copy from the root of the repository:

```bash
cp .env.example .env
```

**Critical: Remove surrounding quotes from all values.** The `dotenv` library in this project includes literal quote characters in the parsed value. The `.env` file must look like:

```env
# CORRECT - no quotes
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saastral_dev
LOG_LEVEL=info

# WRONG - quotes become part of the value and break pino/prisma
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saastral_dev"
LOG_LEVEL="info"
```

**Do NOT set `NODE_ENV` in `.env`.** Next.js manages it internally; setting it causes a "non-standard NODE_ENV" warning and can cause issues.

Minimal `.env` for dev mode:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saastral_dev
REDIS_URL=redis://localhost:6379
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key-for-local-development-only
ENCRYPTION_KEY=dev-encryption-key-32chars-min!!
LOG_LEVEL=info
```

## Step 3: Install dependencies

```bash
pnpm install
```

## Step 4: Generate Prisma client

```bash
pnpm db:generate
```

**Important:** Always run Prisma commands from the **monorepo root**, never from `packages/database/`.

## Step 5: Run database migrations

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saastral_dev pnpm db:migrate
```

**Pitfall:** `prisma migrate dev` is interactive — it may prompt for a migration name if it detects schema drift. If running non-interactively, use `pnpm --filter @saastral/database db:deploy` instead (applies existing migrations without prompting).

To verify migrations applied:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saastral_dev pnpm db:migrate:status
# Expected: "Database schema is up to date!"
```

## Step 6: Seed the database

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saastral_dev pnpm db:seed
```

This creates:
- 7 organizations
- 12 platform users (password: `12345678`)
- 45 departments, 344+ employees
- 8 subscriptions, alerts, cost history, etc.

## Step 7: Start the dev server

**Critical:** Pass `DATABASE_URL` and `LOG_LEVEL` explicitly to avoid inheriting stale/quoted values from the shell:

```bash
env -u LOG_LEVEL -u NODE_ENV \
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saastral_dev \
  LOG_LEVEL=info \
  pnpm dev
```

Wait for `web:dev: ✓ Ready in X.Xs` in the output.

The server runs at **http://localhost:3000**.

## Step 8: Verify the app is working

### 8a. Check the homepage

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected: 200
```

### 8b. Check the tRPC API

```bash
curl -s http://localhost:3000/api/trpc/user.hasUsers
# Expected: {"result":{"data":{"json":{"hasUsers":true}}}}
```

If you get a pino error (`default level:"info" must be included in custom levels`), it means `LOG_LEVEL` has literal quote characters. Fix the `.env` file and restart with `env -u LOG_LEVEL LOG_LEVEL=info pnpm dev`.

### 8c. Log in and access the dashboard

The dashboard requires authentication. Log in via the BetterAuth API:

```bash
curl -s -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"maria.mendes@acme.com","password":"12345678"}' \
  -c /tmp/saastral-cookies.txt
```

Then access the dashboard with the session cookie:

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -b /tmp/saastral-cookies.txt \
  http://localhost:3000/en-US/dashboard
# Expected: 200
```

### 8d. Take a screenshot (if Playwright is available)

```bash
SESSION_TOKEN=$(grep "better-auth.session_token" /tmp/saastral-cookies.txt | awk '{print $NF}')

NODE_PATH=/opt/node22/lib/node_modules node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies([{
    name: 'better-auth.session_token',
    value: '$SESSION_TOKEN',
    domain: 'localhost',
    path: '/'
  }]);
  const page = await context.newPage();
  await page.goto('http://localhost:3000/en-US/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/dashboard.png', fullPage: true });
  await browser.close();
})();
"
```

## URL Reference

| Page | URL |
|------|-----|
| Homepage | http://localhost:3000 |
| Auth/Login | http://localhost:3000/en-US/auth |
| Dashboard | http://localhost:3000/en-US/dashboard |
| Employees | http://localhost:3000/en-US/employees |
| Subscriptions | http://localhost:3000/en-US/subscriptions |
| Alerts | http://localhost:3000/en-US/alerts |
| Reports | http://localhost:3000/en-US/reports |
| Settings | http://localhost:3000/en-US/settings |

**Note:** All routes require the locale prefix (`en-US` or `pt-BR`). The middleware enforces `localePrefix: 'always'`.

## Seeded User Accounts

All seeded users share the password **`12345678`**. To find available emails:

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d saastral_dev \
  -c "SELECT email, name FROM users LIMIT 5;"
```

The first user for each organization is the **owner**. Larger organizations also have an **admin** user.

## Stopping the Dev Server

```bash
pkill -f "turbo dev"
pkill -f "next dev"
pkill -f "tsx watch"
pkill -f "tsc --watch"
```

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `Cannot find module '../generated/prisma'` | Prisma client not generated | `pnpm db:generate` |
| `default level:"info" must be included in custom levels` | `LOG_LEVEL` has literal quote chars | Remove quotes from `.env`, restart with `env -u LOG_LEVEL LOG_LEVEL=info pnpm dev` |
| `The scheme is not recognized in database URL` | `DATABASE_URL` has literal quote chars | Remove quotes from `.env` |
| `non-standard NODE_ENV` warning | `NODE_ENV` set in `.env` or shell | Remove from `.env`; don't export `NODE_ENV` before `pnpm dev` |
| Dashboard shows "Loading..." forever | tRPC API error (check browser console) | `curl http://localhost:3000/api/trpc/user.hasUsers` to diagnose |
| Dashboard redirects to auth page | No session cookie | Log in via `/api/auth/sign-in/email` first |
| `prisma migrate dev` prompts for input | Schema drift detected | Use `pnpm --filter @saastral/database db:deploy` for non-interactive migration |
| Port 5432 already in use | Another PostgreSQL instance | `lsof -i :5432` to find, then stop it |
