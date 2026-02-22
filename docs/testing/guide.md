# SaaStral - Testing Guide

## Overview

SaaStral uses a **Clean/Hexagonal Architecture** with strict layer separation. Our testing strategy reflects this:

- **Core Layer (Domain)**: Pure unit tests with mocked dependencies
- **Infrastructure Layer**: Integration tests with real PostgreSQL database
- **No cross-layer dependencies**: Core never imports Infrastructure

### Test Stack

- **Framework**: [Vitest](https://vitest.dev/)
- **Mocking**: [vitest-mock-extended](https://github.com/marchaos/vitest-mock-extended) for type-safe mocks
- **Test Data**: [@faker-js/faker](https://fakerjs.dev/) for realistic data generation
- **Database**: PostgreSQL 16 via [Testcontainers](https://node.testcontainers.org/) (automatic, Docker-based)
- **ORM**: Prisma v7 with PrismaPg adapter

### Prerequisites

The only requirement for integration tests is **Docker** running on your machine:

```bash
docker info   # Check if Docker is running
```

---

## Running Tests

```bash
# Run all tests in a package once
pnpm --filter @saastral/core test
pnpm --filter @saastral/infrastructure test

# Run specific test file
pnpm --filter @saastral/core test employee.entity.test.ts

# Watch mode during development
pnpm --filter @saastral/core test:watch

# Run all tests from monorepo root
pnpm test

# With coverage
pnpm test --coverage
```

---

## Test Coverage by Change Type

| Change Type | Required Tests |
| ----------- | -------------- |
| New entity or value object | Unit tests in `packages/core` (colocated with source) |
| New service method | Unit tests with mocked dependencies |
| New repository method | Integration test in `packages/infrastructure/src/database/repositories/` |
| New tRPC endpoint | Integration test in `packages/infrastructure/src/http/routers/` |
| Bug fix | Regression test proving the bug is fixed |
| Refactor | Existing tests must pass; add new tests if coverage drops |

---

## Test Locations

```text
packages/core/src/
  [domain]/[file].test.ts          # Unit tests colocated with source

packages/infrastructure/src/
  database/repositories/[repo].test.ts   # Integration tests (real DB)
  http/routers/[router].test.ts          # tRPC router integration tests

packages/infrastructure/test/
  setup.ts                         # Lifecycle hooks (beforeAll/afterAll)
  db-setup.ts                      # Test database setup
```

---

## Unit Tests (Core Layer)

Use for: entities, value objects, domain services (no DB, no framework).

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { MyEntity } from './my.entity'
import type { MyRepository } from './my.repository'

describe('MyEntity', () => {
  describe('create', () => {
    it('should create with valid props', () => {
      const entity = MyEntity.create({ name: 'Test' })
      expect(entity.name).toBe('Test')
    })

    it('should throw when name is empty', () => {
      expect(() => MyEntity.create({ name: '' })).toThrow('Name is required')
    })
  })
})
```

**Mocking dependencies:**

```typescript
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { MyRepository } from './my.repository'

let mockRepo: MockProxy<MyRepository>

beforeEach(() => {
  mockRepo = mock<MyRepository>()
  mockRepo.findById.mockResolvedValue(null)
})
```

---

## Integration Tests (Infrastructure Layer)

Use for: repositories and tRPC routers. Always use real PostgreSQL — never mock the database.

**Repository test pattern:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { getPrismaClient } from '../../test/db-setup'
import { PrismaMyRepository } from './prisma-my.repository'
import type { PrismaClient } from '@saastral/database'

describe('PrismaMyRepository', () => {
  let prisma: PrismaClient
  let repository: PrismaMyRepository
  let orgId: string

  beforeEach(async () => {
    prisma = getPrismaClient()
    repository = new PrismaMyRepository(prisma)

    const org = await prisma.organization.create({
      data: {
        id: `org-${Date.now()}-${Math.random()}`,
        name: 'Test Organization',
        slug: `test-org-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    orgId = org.id
  })

  describe('save', () => {
    it('should persist a new record', async () => {
      const entity = MyEntity.create({ organizationId: orgId, name: 'Test' })
      await repository.save(entity)

      const found = await repository.findById(entity.id, orgId)
      expect(found).not.toBeNull()
      expect(found!.name).toBe('Test')
    })
  })

  describe('findById', () => {
    it('should return null for different organization', async () => {
      const entity = MyEntity.create({ organizationId: orgId, name: 'Test' })
      await repository.save(entity)

      const found = await repository.findById(entity.id, 'other-org-id')
      expect(found).toBeNull()
    })
  })
})
```

**tRPC router test pattern:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { appRouter } from '../routers'
import { getPrismaClient } from '../../test/db-setup'
import type { PrismaClient } from '@saastral/database'

describe('myRouter', () => {
  let prisma: PrismaClient
  let userId: string
  let orgId: string
  let otherOrgId: string

  beforeEach(async () => {
    prisma = getPrismaClient()

    const user = await prisma.user.create({ data: { /* ... */ } })
    userId = user.id

    const org = await prisma.organization.create({ data: { /* ... */ } })
    orgId = org.id

    await prisma.organizationMember.create({
      data: { organizationId: orgId, userId, role: 'admin' },
    })

    const otherOrg = await prisma.organization.create({ data: { /* ... */ } })
    otherOrgId = otherOrg.id
  })

  it('should throw UNAUTHORIZED when not authenticated', async () => {
    const caller = appRouter.createCaller({})
    await expect(
      caller.my.endpoint({ organizationId: orgId })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('should throw FORBIDDEN for an org the user does not belong to', async () => {
    const caller = appRouter.createCaller({ userId })
    await expect(
      caller.my.endpoint({ organizationId: otherOrgId })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('should return data for authenticated user with access', async () => {
    const caller = appRouter.createCaller({ userId })
    const result = await caller.my.endpoint({ organizationId: orgId })
    expect(result).toBeDefined()
  })
})
```

---

## Test Database (Testcontainers)

Integration tests use [Testcontainers](https://node.testcontainers.org/) to automatically spin up a real PostgreSQL container per test run. No manual database setup needed.

### How It Works

1. **Container startup** — Testcontainers pulls `postgres:16-alpine`, starts a container on a random port, and waits for readiness.
2. **Schema setup** — Runs `prisma db push` against the container to create all tables.
3. **Test execution** — Tests run against the real database. Data is cleared between tests via `clearDatabase()`.
4. **Cleanup** — Prisma disconnects, connection pool closes, container stops and is removed.

### Configuration

Located in `packages/infrastructure/test/`:

- **`db-setup.ts`** — Container lifecycle, schema setup, database clearing
- **`setup.ts`** — Vitest global hooks (beforeAll, afterEach, afterAll)

```typescript
// Container configuration (db-setup.ts)
container = await new PostgreSqlContainer('postgres:16-alpine')
  .withExposedPorts(5432)
  .withDatabase('saastral_test')
  .withUsername('test_user')
  .withPassword('test_password')
  .start()
```

Timeouts in `vitest.config.ts`:

```typescript
{
  test: {
    hookTimeout: 60000, // 60s for container startup
    testTimeout: 10000, // 10s per test
  }
}
```

### Lifecycle Hooks

```typescript
beforeAll(async () => {
  await setupTestDatabase()    // Start container, apply schema
})

afterEach(async () => {
  await clearDatabase()         // Delete all data in reverse dependency order
})

afterAll(async () => {
  await teardownTestDatabase()  // Disconnect, stop container
})
```

### Key Points

- **Single-threaded execution**: Database tests run in `singleThread` mode to avoid race conditions
- **Shared PrismaClient**: Use `getPrismaClient()` instead of creating new instances
- **Real database**: No in-memory or SQLite — uses actual PostgreSQL via Docker
- **Schema sync**: Uses `prisma db push` (not migrations) for test schema
- **No manual setup**: Docker is the only prerequisite

### Performance

- **First run**: ~20-25 seconds (downloads Docker image)
- **Subsequent runs**: ~20 seconds (cached image)
- **Per test file**: ~2-3 seconds (includes container startup + schema push)

---

## Mocking Guidelines

### Core Layer: Mock Everything External

```typescript
import { mock } from 'vitest-mock-extended'
import type { EmployeeRepository } from './employee.repository'

const mockRepo = mock<EmployeeRepository>()
mockRepo.findById.mockResolvedValue(employee)
mockRepo.save.mockImplementation(async (emp) => emp)
```

### Infrastructure Layer: Use Real Database

```typescript
// CORRECT - Use real Prisma client
const prisma = getPrismaClient()
const repository = new PrismaEmployeeRepository(prisma)

// INCORRECT - Don't mock Prisma in integration tests
const mockPrisma = mock<PrismaClient>()
```

---

## Test Naming Convention

- `it('should [expected outcome]')` for success cases
- `it('should throw when [condition]')` for error cases
- `it('should return null when [condition]')` for not-found cases

---

## Coverage Goals

| Package | Target | Focus |
|---------|--------|-------|
| **Core** | 90%+ | Business logic is critical |
| **Infrastructure** | 80%+ | Some integration code harder to test |
| **Overall** | 85%+ | Project-wide coverage |

---

## Best Practices

1. **Arrange-Act-Assert** pattern in every test
2. **Use factories** for complex test data setup
3. **Test one thing per test** - focused, independent assertions
4. **No test interdependencies** - each test gets fresh setup via `beforeEach`
5. **Descriptive test names** that explain the scenario

---

## CI/CD Integration

Testcontainers works out-of-the-box in CI/CD environments with Docker.

**GitHub Actions:**

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm test
```

No additional database setup needed — the runner already has Docker installed.

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Cannot find module '../generated/prisma'" | Prisma Client not generated | `pnpm db:generate` |
| "The datasource.url property is required" | DATABASE_URL not set | Ensure `.env` exists with `DATABASE_URL` |
| Type errors after schema changes | Prisma Client not regenerated | `pnpm db:generate` then restart TS server |
| Foreign key violations in tests | Wrong cleanup order | Delete in reverse dependency order |
| "PrismaClient needs to be constructed with adapter" | Creating new PrismaClient | Use `getPrismaClient()` instead |
| Tests timeout during setup | Docker slow or image not cached | Pre-pull: `docker pull postgres:16-alpine`. Increase `hookTimeout` in vitest config |
| "Docker is not running" error | Docker daemon not started | Start Docker Desktop or `sudo systemctl start docker` |
| Port binding errors | Leftover containers from interrupted tests | `docker ps -a \| grep postgres \| awk '{print $1}' \| xargs docker rm -f` |
| Schema push fails | Prisma client/schema mismatch | `pnpm db:generate` |
