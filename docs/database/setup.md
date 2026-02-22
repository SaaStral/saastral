# SaaStral Database Setup Guide

This guide explains how to set up the PostgreSQL database for SaaStral using Docker and Prisma.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ and pnpm installed
- Git (for version control)

## Quick Start

### 1. Start PostgreSQL with Docker

```bash
# Start PostgreSQL and Redis containers
docker-compose up -d postgres redis

# Check if containers are running
docker ps
```

The PostgreSQL container will be available at:
- Host: `localhost`
- Port: `5432`
- Database: `saastral_dev`
- User: `postgres`
- Password: `postgres`

### 2. Generate Prisma Client

```bash
# From the root directory
pnpm prisma:generate
```

Or from the infrastructure package:
```bash
cd packages/infrastructure
pnpm prisma:generate
```

### 3. Run Initial Migration

```bash
# From the root directory
pnpm prisma:migrate

# Or create a named migration
pnpm --filter @saastral/infrastructure prisma migrate dev --name init
```

This will:
- Create all database tables
- Set up enums
- Create indexes
- Apply constraints

### 4. Seed the Database (Optional)

```bash
pnpm prisma:seed
```

This will populate:
- Sample organizations
- Sample users
- SaaS catalog with popular tools
- Test data for development

## Database Structure

### Core Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant root - each company using SaaStral |
| `users` | Platform users (admins who manage the organization) |
| `organization_members` | Junction table linking users to organizations |
| `departments` | Company departments (hierarchical) |
| `employees` | Company employees synced from Google/Microsoft |
| `subscriptions` | SaaS tools the company pays for |
| `subscription_users` | License assignments (employees ↔ subscriptions) |

### Integration Tables

| Table | Purpose |
|-------|---------|
| `integrations` | External service configurations (Google, Okta, etc.) |
| `login_events` | SSO login activity from Okta/Keycloak |
| `sync_logs` | History of integration syncs |

### Alert & Notification Tables

| Table | Purpose |
|-------|---------|
| `alerts` | System-generated alerts (offboarding, renewals, etc.) |
| `notifications` | Scheduled and sent notifications |

### Analytics Tables

| Table | Purpose |
|-------|---------|
| `cost_history` | Monthly cost snapshots for trends |
| `audit_logs` | Change tracking (Enterprise feature) |
| `documents` | File attachments for contracts/invoices |

### Reference Tables

| Table | Purpose |
|-------|---------|
| `saas_catalog` | Pre-populated list of known SaaS tools |

## Database Migrations

### Creating a New Migration

When you modify the Prisma schema:

```bash
# Generate migration files
pnpm --filter @saastral/infrastructure prisma migrate dev --name descriptive_name

# Examples:
pnpm --filter @saastral/infrastructure prisma migrate dev --name add_employee_notes
pnpm --filter @saastral/infrastructure prisma migrate dev --name add_subscription_tags
```

### Applying Migrations in Production

```bash
# Deploy migrations (doesn't prompt for confirmation)
pnpm --filter @saastral/infrastructure prisma migrate deploy
```

### Rolling Back Migrations

Prisma doesn't have built-in rollback. To undo:

1. Manually revert the schema changes
2. Create a new migration
3. Or restore from a database backup

## Common Tasks

### View Database in Prisma Studio

```bash
pnpm prisma:studio
```

This opens a GUI at `http://localhost:5555` to browse and edit data.

### Reset Database (Development Only)

```bash
# WARNING: Deletes all data!
pnpm --filter @saastral/infrastructure prisma migrate reset
```

This will:
1. Drop the database
2. Recreate it
3. Apply all migrations
4. Run seed script

### Check Migration Status

```bash
pnpm --filter @saastral/infrastructure prisma migrate status
```

### Generate Prisma Client After Schema Changes

```bash
pnpm prisma:generate
```

## Environment Variables

Required in `.env`:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saastral_dev"

# For production, use connection pooling:
# DATABASE_URL="postgresql://user:password@host:5432/db?pgbouncer=true&connection_limit=10"
```

## Docker Configuration

### Using docker-compose.yml

For production deployment:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL
- Redis
- Web app
- Worker (background jobs)
- Nginx (reverse proxy)

### Using docker-compose.dev.yml

For local development:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This starts only:
- PostgreSQL
- Redis

And you run the app locally with `pnpm dev`.

## Database Access

### psql CLI

```bash
# Connect to PostgreSQL container
docker exec -it saastral-postgres psql -U postgres -d saastral_dev

# Useful commands:
\dt                  # List tables
\d table_name        # Describe table
\du                  # List users
\l                   # List databases
\q                   # Quit
```

### pgAdmin / GUI Tools

You can connect using any PostgreSQL client:

- **Host:** localhost
- **Port:** 5432
- **Database:** saastral_dev
- **Username:** postgres
- **Password:** postgres

## Backup & Restore

### Backup

```bash
# Backup to file
docker exec saastral-postgres pg_dump -U postgres saastral_dev > backup.sql

# Backup with compression
docker exec saastral-postgres pg_dump -U postgres saastral_dev | gzip > backup.sql.gz
```

### Restore

```bash
# From SQL file
docker exec -i saastral-postgres psql -U postgres -d saastral_dev < backup.sql

# From compressed file
gunzip -c backup.sql.gz | docker exec -i saastral-postgres psql -U postgres -d saastral_dev
```

## Production Considerations

### Connection Pooling

Use PgBouncer for connection pooling:

```dockerfile
# docker-compose.yml
pgbouncer:
  image: pgbouncer/pgbouncer
  environment:
    DATABASE_URL: "postgres://postgres:postgres@postgres:5432/saastral"
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 1000
    DEFAULT_POOL_SIZE: 20
```

Then update `DATABASE_URL`:
```
DATABASE_URL="postgresql://postgres:postgres@pgbouncer:6432/saastral"
```

### Monitoring

Monitor with:
- **pg_stat_statements** - Query performance
- **pgBadger** - Log analysis
- **Prometheus + Grafana** - Metrics and dashboards

### Performance Tuning

Key PostgreSQL settings for production:

```ini
# postgresql.conf
shared_buffers = 256MB          # 25% of RAM
effective_cache_size = 1GB      # 50-75% of RAM
maintenance_work_mem = 64MB
work_mem = 16MB
```

### Table Partitioning

For high-volume tables, consider partitioning:

```sql
-- Partition login_events by month
CREATE TABLE login_events_2024_01 PARTITION OF login_events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs saastral-postgres

# Common issue: Port 5432 already in use
lsof -i :5432
# Kill the process or change the port in docker-compose.yml
```

### Migration fails

```bash
# Check what migrations are pending
pnpm --filter @saastral/infrastructure prisma migrate status

# Mark migration as applied (if you manually ran it)
pnpm --filter @saastral/infrastructure prisma migrate resolve --applied migration_name

# Mark migration as rolled back
pnpm --filter @saastral/infrastructure prisma migrate resolve --rolled-back migration_name
```

### Connection issues

```bash
# Test connection
docker exec saastral-postgres pg_isready -U postgres

# Check if database exists
docker exec saastral-postgres psql -U postgres -c "\l"

# Recreate database
docker exec saastral-postgres psql -U postgres -c "DROP DATABASE IF EXISTS saastral_dev;"
docker exec saastral-postgres psql -U postgres -c "CREATE DATABASE saastral_dev;"
```

### Prisma Client out of sync

```bash
# Regenerate Prisma Client
pnpm prisma:generate

# If still issues, clear node_modules
rm -rf node_modules/.prisma
pnpm prisma:generate
```

## Schema Documentation

For detailed schema documentation, see:
- [schema.md](./schema.md) - Database schema documentation
- [schema.prisma](./packages/infrastructure/src/database/prisma/schema.prisma) - Prisma schema

## Next Steps

After setting up the database:

1. Start the development server: `pnpm dev`
2. Access the app at `http://localhost:3000`
3. Create your first organization
4. Set up Google Workspace integration
5. Set up Okta integration
6. Start importing employees and subscriptions

## Support

For issues or questions:
- Check [../getting-started/setup.md](../getting-started/setup.md) for general setup
- Check [../architecture/overview.md](../architecture/overview.md) for architecture details
- Open an issue on GitHub
