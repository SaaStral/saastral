# SaaStral - Prisma & Database Package

SaaStral uses **Prisma ORM** in a dedicated `@saastral/database` package following Turborepo best practices.

## Package Structure

```text
packages/database/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── prisma.config.ts       # Prisma 7 configuration
│   ├── migrations/            # Migration history
│   └── seed.ts                # Database seeding script
├── src/
│   ├── client.ts              # PrismaClient singleton with PrismaPg adapter
│   └── index.ts               # Main export
└── generated/
    └── prisma/                # Generated Prisma Client (gitignored)
```

## Running Prisma Commands

**IMPORTANT:** All Prisma commands must be run from the **monorepo root** using the provided npm scripts.

```bash
pnpm db:generate          # Generate Prisma Client (run after schema changes)
pnpm db:migrate           # Create and apply migrations
pnpm db:migrate:status    # Check migration status
pnpm db:seed              # Seed the database with test data
pnpm db:studio            # Open Prisma Studio (GUI for database)
```

**Do NOT run Prisma commands directly from packages/database** - they will fail due to environment variable and path issues.

## How It Works

The root `package.json` delegates to the database package:

```json
{
  "scripts": {
    "db:migrate": "pnpm --filter @saastral/database db:migrate",
    "db:generate": "pnpm --filter @saastral/database db:generate"
  }
}
```

The database `package.json` uses `--config` flag:

```json
{
  "scripts": {
    "db:generate": "prisma generate --config=./prisma/prisma.config.ts",
    "db:migrate": "prisma migrate dev --config=./prisma/prisma.config.ts"
  }
}
```

The `prisma.config.ts` loads environment variables:

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "schema.prisma",
  migrations: { path: "migrations" },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saastral',
  },
});
```

## Turborepo Integration

The `turbo.json` ensures proper task orchestration:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build", "^db:generate"]
    },
    "dev": {
      "dependsOn": ["^db:generate"]
    }
  }
}
```

This ensures Prisma Client is generated before any package builds.

## Importing the Prisma Client

All packages should import from `@saastral/database`:

```typescript
// CORRECT
import { prisma, type User, type Organization } from '@saastral/database'

// INCORRECT - Don't import from @prisma/client
import { PrismaClient } from '@prisma/client'  // WRONG!
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Cannot find module '../generated/prisma'" | Prisma Client not generated | `pnpm db:generate` |
| "The datasource.url property is required" | DATABASE_URL not set | Ensure `.env` exists with `DATABASE_URL` |
| Type errors after schema changes | Prisma Client not regenerated | `pnpm db:generate` then restart TS server |
| Migration fails with connection error | PostgreSQL not running | `docker compose up -d postgres` |
