# SaaStral - AI Agent Instructions

**SaaStral** is an open source SaaS management platform (Clean/Hexagonal Architecture, TypeScript monorepo).

## Critical Rules

These rules prevent bugs. Follow them on every task.

### Architecture

1. **Core never imports Infrastructure.** Define interfaces in `packages/core`, implement in `packages/infrastructure`.
2. **Import from `@saastral/database`**, never from `@prisma/client`.

### Frontend

3. **Use `OrganizationContext` for org ID**, never URL params:
   ```typescript
   const { selectedOrgId } = useOrganization()  // CORRECT
   const orgId = params?.orgId                   // WRONG
   ```

### Backend

4. **Validate org access in all tRPC endpoints** that accept `organizationId`:
   ```typescript
   await validateOrganizationAccess(ctx.userId, input.organizationId)
   ```

### Database

5. **Run Prisma commands from monorepo root only:**
   ```bash
   pnpm db:generate    # NOT: cd packages/database && prisma generate
   pnpm db:migrate
   ```

### Testing

6. **Always write tests.** See coverage rules in [docs/testing/guide.md](docs/testing/guide.md).

### Documentation

7. **Keep docs up to date.** When adding a new feature, changing an existing feature, or making significant structural changes, update the relevant files in `docs/`. If a change doesn't fit an existing doc, create a new one and add it to the Documentation Map below.

## Quick Commands

```bash
pnpm dev                                    # Start all apps
pnpm build                                  # Build all packages
pnpm test                                   # Run all tests
pnpm --filter @saastral/core test           # Core unit tests
pnpm --filter @saastral/infrastructure test # Infrastructure integration tests
pnpm db:generate                            # Generate Prisma Client
pnpm db:migrate                             # Run migrations
pnpm db:seed                                # Seed database
pnpm db:studio                              # Open Prisma Studio
pnpm lint                                   # Lint code
pnpm format                                 # Format with Prettier
docker compose up -d postgres               # Start PostgreSQL
```

## Documentation Map

**Read only the docs relevant to your current task.** Don't load all docs into context — use the table below to pick what you need.

| Doc | Description |
|-----|-------------|
| [docs/business/overview.md](docs/business/overview.md) | Business model, market, competitive positioning |
| [docs/domain/entities.md](docs/domain/entities.md) | Core entities & business rules |
| [docs/domain/glossary.md](docs/domain/glossary.md) | Domain language reference |
| [docs/architecture/overview.md](docs/architecture/overview.md) | Technical architecture & development guide |
| [docs/architecture/detailed-spec.md](docs/architecture/detailed-spec.md) | Original architecture specification |
| [docs/database/setup.md](docs/database/setup.md) | PostgreSQL & Docker setup |
| [docs/database/prisma.md](docs/database/prisma.md) | Prisma package structure, commands, troubleshooting |
| [docs/database/schema.md](docs/database/schema.md) | Database schema documentation |
| [docs/database/seeding.md](docs/database/seeding.md) | Database seeding reference |
| [docs/frontend/structure.md](docs/frontend/structure.md) | React frontend structure & design system |
| [docs/testing/guide.md](docs/testing/guide.md) | Testing patterns, setup, and best practices |
| [docs/integrations/google-oauth.md](docs/integrations/google-oauth.md) | Google OAuth setup guide |
| [docs/getting-started/setup.md](docs/getting-started/setup.md) | Initial project setup |

## When to Ask Questions

**Business Decisions:**
- "Should this feature be Community or Enterprise?"
- "What's the priority: X or Y?"

**Domain Rules:**
- "What happens when an employee is re-hired?"
- "Should we auto-cancel unused licenses?"

**Implementation:**
- "Should this be a real-time webhook or batch job?"
- "Where should this validation live: Entity or Service?"
