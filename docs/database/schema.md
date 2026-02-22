# SaaStral Database Schema Documentation

## Overview

This document describes the PostgreSQL database schema designed for SaaStral, an open-source SaaS management platform. The schema is designed with flexibility, scalability, and multi-tenancy in mind.

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Multi-tenancy** | All core tables include `organization_id` for data isolation |
| **Soft deletes** | `deleted_at` column instead of physical deletion |
| **Audit trails** | `created_at`, `updated_at`, `created_by`, `updated_by` columns |
| **Flexibility** | JSONB columns for extensible metadata and configurations |
| **Performance** | Strategic indexes for common query patterns |
| **Type safety** | PostgreSQL ENUMs for fixed value sets |

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SAASTRAL DATABASE                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  organizations   │ ◄─────────────────────────────────────────────────────────────┐
│  (tenant root)   │                                                               │
└────────┬─────────┘                                                               │
         │                                                                         │
         │ 1:N                                                                     │
         ▼                                                                         │
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐     │
│      users       │◄──────►│ org_members      │        │   departments    │◄────┤
│  (platform)      │  N:M   │  (junction)      │        │                  │     │
└──────────────────┘        └──────────────────┘        └────────┬─────────┘     │
                                                                  │               │
                                                                  │ 1:N           │
                                                                  ▼               │
                                                        ┌──────────────────┐     │
                                                        │    employees     │◄────┤
                                                        │  (from IdP)      │     │
                                                        └────────┬─────────┘     │
                                                                  │               │
                              ┌───────────────────────────────────┼───────────────┤
                              │                                   │               │
                              ▼                                   ▼               │
                    ┌──────────────────┐              ┌──────────────────┐       │
                    │  subscriptions   │◄────────────►│ subscription_    │       │
                    │  (SaaS tools)    │     N:M      │ users (licenses) │       │
                    └────────┬─────────┘              └────────┬─────────┘       │
                              │                                 │                 │
                              │                                 │                 │
         ┌────────────────────┼─────────────────────────────────┼─────────────────┤
         │                    │                                 │                 │
         ▼                    ▼                                 ▼                 │
┌──────────────────┐ ┌──────────────────┐            ┌──────────────────┐       │
│     alerts       │ │   documents      │            │  login_events    │       │
│                  │ │  (attachments)   │            │   (from SSO)     │       │
└──────────────────┘ └──────────────────┘            └──────────────────┘       │
                                                                                  │
         ┌────────────────────────────────────────────────────────────────────────┤
         │                                                                        │
         ▼                                                                        │
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐     │
│  integrations    │◄──────►│   sync_logs      │        │  cost_history    │◄────┘
│  (Google/Okta)   │   1:N  │                  │        │  (monthly)       │
└──────────────────┘        └──────────────────┘        └──────────────────┘

                    ┌──────────────────┐        ┌──────────────────┐
                    │   audit_logs     │        │  notifications   │
                    │  (enterprise)    │        │                  │
                    └──────────────────┘        └──────────────────┘

                    ┌──────────────────┐
                    │  saas_catalog    │ (standalone reference table)
                    │  (known tools)   │
                    └──────────────────┘
```

---

## Tables Reference

### Core Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `organizations` | Root tenant table | `id`, `name`, `slug`, `plan`, `settings` |
| `users` | SaaStral platform users | `id`, `email`, `name`, `password_hash` |
| `organization_members` | User-Org junction | `user_id`, `organization_id`, `role` |
| `departments` | Company departments | `id`, `name`, `parent_id` (hierarchical) |
| `employees` | Company employees (synced) | `id`, `name`, `email`, `status`, `external_id` |
| `subscriptions` | SaaS subscriptions | `id`, `name`, `category`, `total_monthly_cost` |
| `subscription_users` | License assignments | `subscription_id`, `employee_id`, `status` |

### Integration Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `integrations` | External service configs | `provider`, `encrypted_credentials`, `status` |
| `login_events` | SSO activity events | `employee_id`, `app_name`, `event_at` |
| `sync_logs` | Integration sync history | `integration_id`, `status`, `stats` |

### Alert & Notification Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `alerts` | System-generated alerts | `type`, `severity`, `status`, `potential_savings` |
| `notifications` | Scheduled notifications | `channel`, `scheduled_for`, `status` |

### Analytics & Audit Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `cost_history` | Monthly cost snapshots | `year_month`, `total_cost`, `cost_by_category` |
| `audit_logs` | Change tracking (Enterprise) | `action`, `entity_type`, `old_values`, `new_values` |
| `documents` | File attachments | `entity_type`, `entity_id`, `storage_key` |

### Reference Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `saas_catalog` | Known SaaS tools | `name`, `category`, `website`, `aliases` |

---

## ENUM Types

### Employee Lifecycle

```sql
CREATE TYPE employee_status AS ENUM ('active', 'suspended', 'offboarded');
```

### Subscription Categories

```sql
CREATE TYPE subscription_category AS ENUM (
    'productivity',      -- Slack, Notion, Asana
    'development',       -- GitHub, GitLab, Jira
    'design',           -- Figma, Adobe, Canva
    'infrastructure',   -- AWS, GCP, Azure, Vercel
    'sales_marketing',  -- HubSpot, Salesforce, Mailchimp
    'communication',    -- Zoom, Meet, Teams
    'finance',          -- QuickBooks, Conta Azul
    'hr',               -- Gupy, Factorial, BambooHR
    'security',         -- 1Password, Okta, Crowdstrike
    'analytics',        -- Mixpanel, Amplitude
    'support',          -- Zendesk, Intercom
    'other'
);
```

### Billing Cycles

```sql
CREATE TYPE billing_cycle AS ENUM (
    'monthly', 'quarterly', 'semiannual', 
    'annual', 'biennial', 'usage_based', 'one_time'
);
```

### Pricing Models

```sql
CREATE TYPE pricing_model AS ENUM (
    'per_seat', 'per_active_user', 'flat_rate',
    'tiered', 'usage_based', 'freemium', 'hybrid'
);
```

### Alert Types

```sql
CREATE TYPE alert_type AS ENUM (
    'offboarding',        -- Employee left, has active licenses
    'renewal_upcoming',   -- Subscription renewal approaching
    'unused_license',     -- License not used for X days
    'low_utilization',    -- Less than threshold% usage
    'duplicate_tool',     -- Similar tools in same category
    'cost_anomaly',       -- Unusual cost increase
    'seat_shortage',      -- Running out of seats
    'trial_ending'        -- Trial period ending
);
```

---

## Key Relationships

### Organizations → Everything

All core tables reference `organization_id` to enable multi-tenancy. This allows complete data isolation between different companies using SaaStral.

### Employees ↔ Subscriptions (N:M via subscription_users)

```sql
-- An employee can have multiple subscriptions
-- A subscription can have multiple employees (license holders)

SELECT e.name, s.name AS subscription
FROM employees e
JOIN subscription_users su ON su.employee_id = e.id
JOIN subscriptions s ON s.id = su.subscription_id
WHERE su.status = 'active';
```

### Subscriptions → Integrations

Subscriptions can be linked to SSO integrations (Okta/Keycloak) via `integration_id` and `sso_app_id` to automatically track usage.

### Employees → Departments (Hierarchical)

Departments can have parent departments, enabling organizational hierarchy:

```sql
-- Get full department hierarchy
WITH RECURSIVE dept_tree AS (
    SELECT id, name, parent_id, 0 AS level
    FROM departments
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT d.id, d.name, d.parent_id, dt.level + 1
    FROM departments d
    JOIN dept_tree dt ON d.parent_id = dt.id
)
SELECT * FROM dept_tree;
```

---

## JSONB Columns for Flexibility

### organizations.settings

```json
{
    "timezone": "America/Sao_Paulo",
    "currency": "BRL",
    "alertDefaults": {
        "unusedLicenseDays": 30,
        "lowUtilizationThreshold": 50,
        "renewalReminderDays": [30, 15, 7]
    }
}
```

### integrations.config

```json
{
    "syncEnabled": true,
    "syncIntervalMinutes": 60
}
```

### integrations.provider_config

```json
// Google
{ "domain": "company.com", "adminEmail": "admin@company.com" }

// Okta
{ "orgUrl": "https://company.okta.com" }

// Microsoft
{ "tenantId": "abc-123-def" }
```

### alerts.data

```json
// Offboarding alert
{
    "licenseCount": 5,
    "subscriptions": ["Slack", "Figma", "GitHub"],
    "totalMonthlyCost": 500.00
}

// Renewal reminder
{
    "daysUntilRenewal": 7,
    "cost": 2340.00,
    "lastYearCost": 2000.00
}

// Unused license
{
    "daysSinceLastUse": 45,
    "employeeName": "John Doe"
}
```

### cost_history.cost_by_category

```json
{
    "productivity": 5000.00,
    "development": 3000.00,
    "infrastructure": 8000.00,
    "communication": 1500.00
}
```

---

## Indexes Strategy

### Primary Query Patterns

| Query Pattern | Index |
|---------------|-------|
| Find by org + status | `idx_employees_status`, `idx_subscriptions_status` |
| Find upcoming renewals | `idx_subscriptions_renewal` |
| Find by external ID (sync) | `idx_employees_external`, `idx_departments_external` |
| Pending alerts | `idx_alerts_status` |
| Login events timeline | `idx_login_events_org_date`, `idx_login_events_employee` |
| Unused licenses | `idx_sub_users_inactive` |
| Filter by tags | `idx_subscriptions_tags` (GIN) |

### Soft Delete Pattern

All indexes include `WHERE deleted_at IS NULL` to ensure soft-deleted records are excluded from normal queries:

```sql
CREATE INDEX idx_employees_org ON employees(organization_id) 
    WHERE deleted_at IS NULL;
```

---

## Automatic Calculations (Triggers)

### Update Subscription Used Seats

When `subscription_users` changes, automatically update `subscriptions.used_seats`:

```sql
CREATE TRIGGER trg_subscription_users_update_seats
    AFTER INSERT OR UPDATE OF status OR DELETE ON subscription_users
    FOR EACH ROW EXECUTE FUNCTION update_subscription_used_seats();
```

### Update Employee SaaS Cost

When `subscription_users` changes, automatically recalculate `employees.monthly_saas_cost`:

```sql
CREATE TRIGGER trg_subscription_users_update_employee_cost
    AFTER INSERT OR UPDATE OF status OR DELETE ON subscription_users
    FOR EACH ROW EXECUTE FUNCTION update_employee_saas_cost();
```

---

## Views for Common Queries

### v_subscriptions_with_usage

Pre-joined subscription data with owner, department, and usage metrics:

```sql
SELECT * FROM v_subscriptions_with_usage
WHERE organization_id = $1
ORDER BY total_monthly_cost DESC;
```

### v_employees_with_licenses

Employee data with active and unused license counts:

```sql
SELECT * FROM v_employees_with_licenses
WHERE organization_id = $1
AND unused_licenses > 0;
```

### v_dashboard_metrics

Aggregated metrics for the main dashboard:

```sql
SELECT * FROM v_dashboard_metrics
WHERE organization_id = $1;
```

### v_upcoming_renewals

Subscriptions renewing in the next 90 days:

```sql
SELECT * FROM v_upcoming_renewals
WHERE organization_id = $1
AND days_until_renewal <= 30;
```

---

## Row-Level Security (RLS)

For additional security, RLS is enabled on all tenant-scoped tables:

```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
-- etc.
```

**Note:** You need to create RLS policies based on your authentication strategy:

```sql
-- Example policy using app.current_org_id session variable
CREATE POLICY employees_org_isolation ON employees
    USING (organization_id = current_setting('app.current_org_id')::uuid);
```

---

## Migration Strategy

### Prisma Schema

This SQL schema can be converted to Prisma schema using:

```bash
npx prisma db pull
```

Or you can write Prisma migrations that generate this SQL:

```bash
npx prisma migrate dev --name init
```

### Version Control

- Keep the `.sql` file as the source of truth
- Use `prisma migrate` for incremental changes
- Or use a migration tool like `golang-migrate`, `Flyway`, or `Sqitch`

---

## Future Extensibility

### Adding New Alert Types

Simply add to the ENUM:

```sql
ALTER TYPE alert_type ADD VALUE 'budget_exceeded';
```

### Adding New Integrations

Add to provider ENUM and create new records:

```sql
ALTER TYPE integration_provider ADD VALUE 'onelogin';
```

### Custom Fields

Use the `metadata` JSONB columns present on most tables:

```sql
UPDATE subscriptions
SET metadata = metadata || '{"customField": "value"}'::jsonb
WHERE id = $1;
```

### New Entity Types

The `documents` and `audit_logs` tables use polymorphic `entity_type` + `entity_id` pattern for easy extension to new entities.

---

## Performance Considerations

### Partitioning (Recommended for Production)

For high-volume tables, consider table partitioning:

```sql
-- Partition login_events by month
CREATE TABLE login_events (
    -- columns
) PARTITION BY RANGE (event_at);

CREATE TABLE login_events_2024_01 PARTITION OF login_events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Archiving Old Data

Consider archiving old `login_events` and `audit_logs` data:

```sql
-- Move old login events to archive table
INSERT INTO login_events_archive
SELECT * FROM login_events
WHERE event_at < NOW() - INTERVAL '1 year';

DELETE FROM login_events
WHERE event_at < NOW() - INTERVAL '1 year';
```

### Connection Pooling

Use PgBouncer or similar for connection pooling in production.

---

## Summary

This schema provides:

- ✅ Full multi-tenancy support
- ✅ Complete subscription and license management
- ✅ Employee sync from external directories
- ✅ SSO login event tracking
- ✅ Flexible alert system
- ✅ Cost analytics and history
- ✅ Audit logging for compliance
- ✅ Extensibility via JSONB columns
- ✅ Performance optimizations via strategic indexes
- ✅ Security via RLS

The schema supports all MVP features and is designed to easily accommodate future Enterprise features like multi-tenant (multiple CNPJs), advanced reporting, and additional integrations.
