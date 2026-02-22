# SaaStral Architecture & Development Guide

This document provides detailed technical instructions for developers and AI assistants working on the SaaStral codebase.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Critical Rules](#critical-rules)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Implementation Patterns](#implementation-patterns)
6. [Common Tasks](#common-tasks)
7. [Testing Guidelines](#testing-guidelines)
8. [Code Quality Standards](#code-quality-standards)

---

## Architecture Overview

SaaStral follows a **Hybrid Clean/Hexagonal Architecture** with strict separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                           │
│         (@saastral/infrastructure)                              │
│                                                                 │
│  Routers → Services → Repositories (implementations)            │
│  (tRPC)    (Core)     (Prisma)                                  │
│                                                                 │
│              ↓ Implements Interfaces ↓                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      CORE LAYER                                 │
│                   (@saastral/core)                              │
│                                                                 │
│  Services → Entities → Value Objects                            │
│  (Use Cases) (Domain)  (Email, Money)                           │
│      ↓                                                          │
│  Repository Interfaces (Ports)                                  │
│                                                                 │
│              Pure Business Logic                                │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principle:** Dependencies point INWARD. Infrastructure depends on Core, never the reverse.

---

## Critical Rules

### ❌ NEVER DO THIS

1. **Import Infrastructure in Core**
   ```typescript
   // ❌ WRONG - Core importing from Infrastructure
   // packages/core/src/employees/employee.service.ts
   import { PrismaClient } from '@prisma/client'
   ```

2. **Import Framework Code in Core**
   ```typescript
   // ❌ WRONG - Core importing framework
   // packages/core/src/employees/employee.service.ts
   import { TRPCError } from '@trpc/server'
   ```

3. **Business Logic in Routers**
   ```typescript
   // ❌ WRONG - Business logic in router
   export const employeeRouter = router({
     offboard: protectedProcedure.mutation(async ({ ctx, input }) => {
       const employee = await ctx.prisma.employee.findUnique({...})
       if (employee?.status === 'offboarded') {
         throw new TRPCError({...})
       }
       // More business logic here...
     })
   })
   ```

4. **Entities Performing I/O**
   ```typescript
   // ❌ WRONG - Entity doing database operations
   export class Employee {
     async save() {
       await db.employee.update({...})
     }
   }
   ```

5. **Using Concrete Types Instead of Interfaces**
   ```typescript
   // ❌ WRONG - Service depending on implementation
   export class EmployeeService {
     constructor(private prisma: PrismaClient) {}
   }
   ```

### ✅ ALWAYS DO THIS

1. **Core Defines Interfaces, Infrastructure Implements**
   ```typescript
   // ✅ CORRECT - Core defines interface
   // packages/core/src/employees/employee.repository.ts
   export interface EmployeeRepository {
     findById(id: string): Promise<Employee | null>
     save(employee: Employee): Promise<Employee>
   }

   // ✅ CORRECT - Infrastructure implements
   // packages/infrastructure/src/database/repositories/employee.repository.ts
   export class PrismaEmployeeRepository implements EmployeeRepository {
     constructor(private prisma: PrismaClient) {}
   }
   ```

2. **Business Logic in Services**
   ```typescript
   // ✅ CORRECT - Business logic in service
   export class EmployeeService {
     constructor(private employeeRepo: EmployeeRepository) {}

     async offboard(input: OffboardEmployeeInput) {
       const employee = await this.employeeRepo.findById(input.employeeId)
       employee.offboard() // Entity handles state change
       await this.employeeRepo.save(employee)
     }
   }
   ```

3. **Routers Delegate to Services**
   ```typescript
   // ✅ CORRECT - Router delegates to service
   export const employeeRouter = router({
     offboard: protectedProcedure.mutation(async ({ ctx, input }) => {
       const service = new EmployeeService(ctx.container.employeeRepo)
       try {
         return await service.offboard(input)
       } catch (error) {
         throw mapDomainError(error)
       }
     })
   })
   ```

---

## Project Structure

### Core Layer (`packages/core/src/`)

```
{module}/
├── index.ts                    # Public exports
├── {module}.entity.ts          # Domain entity with business rules
├── {module}.service.ts         # Use cases / orchestration
├── {module}.repository.ts      # Repository interface (PORT)
├── {module}.types.ts           # Input/Output DTOs
└── {module}.errors.ts          # Domain-specific errors
```

**Example:** `packages/core/src/employees/`

### Infrastructure Layer (`packages/infrastructure/src/`)

```
database/repositories/
└── {module}.repository.ts      # Prisma implementation (ADAPTER)

http/
├── routers/
│   └── {module}.router.ts      # tRPC endpoints
└── schemas/
    └── {module}.schema.ts      # Zod validation schemas

providers/
└── {provider}/
    └── {provider}.provider.ts  # External service integration
```

### Apps

```
apps/web/src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth pages (login, register)
│   ├── (dashboard)/            # Protected dashboard pages
│   └── api/                    # API routes (tRPC, webhooks)
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layouts/                # Layout components
│   └── features/               # Feature-specific components
│       └── {module}/
└── lib/
    └── trpc.ts                 # tRPC client setup

apps/worker/src/
├── index.ts                    # Worker entry point
├── crontab.ts                  # Cron job definitions
└── tasks/
    └── {task-name}.ts          # Background job implementations
```

---

## Development Workflow

### Adding a New Domain Module

Follow these steps to add a new domain module (e.g., "subscriptions"):

#### 1. Core Layer - Define Domain

```bash
# Create files in packages/core/src/subscriptions/
```

**File: `subscription.entity.ts`**
```typescript
export class Subscription {
  private props: SubscriptionProps

  private constructor(props: SubscriptionProps) {
    this.props = props
  }

  static create(props: Omit<SubscriptionProps, 'id' | 'createdAt' | 'updatedAt'>): Subscription {
    return new Subscription({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static reconstitute(props: SubscriptionProps): Subscription {
    return new Subscription(props)
  }

  // Getters
  get id(): string { return this.props.id }

  // Business methods
  renew(): void {
    // Business logic here
  }
}
```

**File: `subscription.repository.ts`** (Interface only!)
```typescript
export interface SubscriptionRepository {
  findById(id: string): Promise<Subscription | null>
  save(subscription: Subscription): Promise<Subscription>
}
```

**File: `subscription.service.ts`**
```typescript
export class SubscriptionService {
  constructor(
    private subscriptionRepo: SubscriptionRepository,
    private logger: LoggerInterface
  ) {}

  async create(input: CreateSubscriptionInput): Promise<Subscription> {
    // Orchestrate business logic
  }
}
```

**File: `subscription.types.ts`**
```typescript
export interface CreateSubscriptionInput {
  readonly organizationId: string
  readonly name: string
  // ... other fields
}
```

**File: `subscription.errors.ts`**
```typescript
export class SubscriptionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Subscription with id "${id}" not found`, 'SUBSCRIPTION_NOT_FOUND')
  }
}
```

**File: `index.ts`**
```typescript
export * from './subscription.entity'
export * from './subscription.service'
export * from './subscription.repository'
export * from './subscription.types'
export * from './subscription.errors'
```

#### 2. Infrastructure Layer - Implement Repository

**File: `packages/infrastructure/src/database/repositories/subscription.repository.ts`**
```typescript
import { PrismaClient } from '@prisma/client'
import { Subscription, SubscriptionRepository } from '@saastral/core'

export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Subscription | null> {
    const record = await this.prisma.subscription.findUnique({ where: { id } })
    return record ? this.toDomain(record) : null
  }

  async save(subscription: Subscription): Promise<Subscription> {
    const data = this.toPersistence(subscription)
    const record = await this.prisma.subscription.upsert({
      where: { id: subscription.id },
      create: data,
      update: data,
    })
    return this.toDomain(record)
  }

  private toDomain(record: PrismaSubscription): Subscription {
    return Subscription.reconstitute({
      id: record.id,
      // Map all fields
    })
  }

  private toPersistence(subscription: Subscription): any {
    const props = subscription.toJSON()
    return {
      id: props.id,
      // Map all fields
    }
  }
}
```

#### 3. Infrastructure Layer - Add tRPC Router

**File: `packages/infrastructure/src/http/schemas/subscription.schema.ts`**
```typescript
import { z } from 'zod'

export const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(255),
  monthlyCostCents: z.number().int().positive(),
  // ... other fields
})
```

**File: `packages/infrastructure/src/http/routers/subscription.router.ts`**
```typescript
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { SubscriptionService } from '@saastral/core'
import { createSubscriptionSchema } from '../schemas/subscription.schema'

export const subscriptionRouter = router({
  create: protectedProcedure
    .input(createSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new SubscriptionService(
        ctx.container.subscriptionRepo,
        ctx.container.logger
      )
      return await service.create({
        organizationId: ctx.session.organizationId,
        ...input,
      })
    }),
})
```

#### 4. Update Container

**File: `packages/infrastructure/src/container.ts`**
```typescript
import { PrismaSubscriptionRepository } from './database/repositories/subscription.repository'

export class Container {
  // ... existing code

  get subscriptionRepo(): PrismaSubscriptionRepository {
    return this.singleton('subscriptionRepo', () =>
      new PrismaSubscriptionRepository(this.prisma)
    )
  }

  get subscriptionService(): SubscriptionService {
    return this.singleton('subscriptionService', () =>
      new SubscriptionService(this.subscriptionRepo, this.logger)
    )
  }
}
```

#### 5. Add to Main Router

**File: `packages/infrastructure/src/http/routers/index.ts`**
```typescript
import { router } from '../trpc'
import { employeeRouter } from './employee.router'
import { subscriptionRouter } from './subscription.router'

export const appRouter = router({
  employee: employeeRouter,
  subscription: subscriptionRouter,
})

export type AppRouter = typeof appRouter
```

#### 6. Create UI Components (Web App)

**File: `apps/web/src/app/(dashboard)/subscriptions/page.tsx`**
```typescript
import { SubscriptionList } from '@/components/features/subscriptions/subscription-list'

export default function SubscriptionsPage() {
  return (
    <div>
      <h1>Subscriptions</h1>
      <SubscriptionList />
    </div>
  )
}
```

**File: `apps/web/src/components/features/subscriptions/subscription-list.tsx`**
```typescript
'use client'

import { trpc } from '@/lib/trpc'

export function SubscriptionList() {
  const { data, isLoading } = trpc.subscription.list.useQuery()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {data?.subscriptions.map((sub) => (
        <div key={sub.id}>{sub.name}</div>
      ))}
    </div>
  )
}
```

---

## Implementation Patterns

### Entity Pattern

```typescript
export class Employee {
  private props: EmployeeProps

  private constructor(props: EmployeeProps) {
    this.props = props
  }

  // Factory for new instances
  static create(props: Omit<EmployeeProps, 'id' | 'createdAt' | 'updatedAt'>): Employee {
    // Validation can happen here
    return new Employee({
      ...props,
      id: crypto.randomUUID(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Factory for database reconstruction
  static reconstitute(props: EmployeeProps): Employee {
    return new Employee(props)
  }

  // Getters (read-only access)
  get id(): string {
    return this.props.id
  }

  // Computed properties
  isActive(): boolean {
    return this.props.status === 'active'
  }

  // Business methods (state changes)
  offboard(): void {
    if (this.isOffboarded()) {
      throw new Error('Employee is already offboarded')
    }
    this.props.status = 'offboarded'
    this.props.offboardedAt = new Date()
    this.props.updatedAt = new Date()
  }

  // Serialization
  toJSON(): EmployeeProps {
    return { ...this.props }
  }
}
```

### Service Pattern

```typescript
export class EmployeeService {
  constructor(
    private employeeRepo: EmployeeRepository,
    private subscriptionRepo: SubscriptionRepository,
    private alertService: AlertService,
    private logger: LoggerInterface
  ) {}

  async offboard(input: OffboardEmployeeInput): Promise<OffboardEmployeeOutput> {
    this.logger.info('[EmployeeService.offboard] Starting', {
      employeeId: input.employeeId,
    })

    // 1. Fetch entity
    const employee = await this.employeeRepo.findById(input.employeeId)
    if (!employee) {
      throw new EmployeeNotFoundError(input.employeeId)
    }

    // 2. Validate business rules
    if (employee.isOffboarded()) {
      throw new EmployeeAlreadyOffboardedError(input.employeeId)
    }

    // 3. Execute business logic
    employee.offboard()
    await this.employeeRepo.save(employee)

    // 4. Cross-entity operations
    const subscriptions = await this.subscriptionRepo.findByEmployeeId(input.employeeId)

    if (subscriptions.length > 0) {
      await this.alertService.createOffboardingAlert(employee, subscriptions)
    }

    this.logger.info('[EmployeeService.offboard] Completed')

    return {
      employee,
      activeSubscriptionsCount: subscriptions.length,
    }
  }
}
```

### Value Object Pattern

```typescript
export class Email {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string): Email {
    const normalized = value.trim().toLowerCase()
    if (!this.isValid(normalized)) {
      throw new Error(`Invalid email: ${value}`)
    }
    return new Email(normalized)
  }

  static reconstitute(value: string): Email {
    return new Email(value)
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  getValue(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
```

### Repository Pattern

**Interface (Core):**
```typescript
export interface EmployeeRepository {
  findById(id: string): Promise<Employee | null>
  findByEmail(email: string, organizationId: string): Promise<Employee | null>
  findByOrganizationId(organizationId: string, filters?: EmployeeFilters): Promise<Employee[]>
  save(employee: Employee): Promise<Employee>
  delete(id: string): Promise<void>
}
```

**Implementation (Infrastructure):**
```typescript
export class PrismaEmployeeRepository implements EmployeeRepository {
  constructor(private prisma: PrismaClient) {}

  async save(employee: Employee): Promise<Employee> {
    const data = this.toPersistence(employee)
    const record = await this.prisma.employee.upsert({
      where: { id: employee.id },
      create: data,
      update: data,
    })
    return this.toDomain(record)
  }

  private toDomain(record: PrismaEmployee): Employee {
    return Employee.reconstitute({
      id: record.id,
      organizationId: record.organizationId,
      name: record.name,
      email: Email.reconstitute(record.email),
      status: record.status as EmployeeStatus,
      // ... map all fields
    })
  }

  private toPersistence(employee: Employee): any {
    const props = employee.toJSON()
    return {
      id: props.id,
      organizationId: props.organizationId,
      name: props.name,
      email: props.email.toString(),
      // ... map all fields
    }
  }
}
```

---

## Common Tasks

### Adding a New Alert Type

1. **Update Prisma Schema** (`packages/infrastructure/src/database/prisma/schema.prisma`):
   ```prisma
   enum AlertType {
     offboarding
     renewal_soon
     unused_license
     your_new_type  // Add here
   }
   ```

2. **Run Migration**:
   ```bash
   pnpm db:migrate
   ```

3. **Update Core Types** (`packages/core/src/alerts/alert.types.ts`):
   ```typescript
   export type AlertType = 'offboarding' | 'renewal_soon' | 'unused_license' | 'your_new_type'
   ```

4. **Add Business Logic** (`packages/core/src/alerts/alert.service.ts`):
   ```typescript
   async createYourNewTypeAlert(...) {
     // Implementation
   }
   ```

### Adding a New Background Task

1. **Create Task File** (`apps/worker/src/tasks/your-task.ts`):
   ```typescript
   import { Task } from 'graphile-worker'
   import { getContainer } from '@saastral/infrastructure'

   export const yourTask: Task = async (payload) => {
     const container = getContainer()
     const service = container.yourService

     await service.doSomething(payload)
   }
   ```

2. **Register in Worker** (`apps/worker/src/index.ts`):
   ```typescript
   taskList: {
     'your-task': () => import('./tasks/your-task'),
   }
   ```

3. **Add to Cron** (if periodic) (`apps/worker/src/crontab.ts`):
   ```typescript
   {
     name: 'your-task',
     pattern: '0 * * * *',  // Every hour
     task: 'your-task',
     payload: {},
   }
   ```

### Adding a New Integration Provider

1. **Define Interface in Core** (`packages/core/src/integrations/directory-provider.ts`):
   ```typescript
   export interface DirectoryProvider {
     syncEmployees(): Promise<Employee[]>
   }
   ```

2. **Implement in Infrastructure** (`packages/infrastructure/src/providers/your-provider/`):
   ```typescript
   export class YourDirectoryProvider implements DirectoryProvider {
     async syncEmployees(): Promise<Employee[]> {
       // Implementation
     }
   }
   ```

3. **Add to Container** if needed

---

## Testing Guidelines

### Unit Tests (Core Layer)

Test business logic in isolation with mocked dependencies.

**Example:** `tests/unit/core/employees/employee.service.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmployeeService, Employee, Email } from '@saastral/core'

describe('EmployeeService', () => {
  let service: EmployeeService
  let mockEmployeeRepo: any
  let mockLogger: any

  beforeEach(() => {
    mockEmployeeRepo = {
      findById: vi.fn(),
      save: vi.fn((e) => Promise.resolve(e)),
    }
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    }

    service = new EmployeeService(
      mockEmployeeRepo,
      mockSubscriptionRepo,
      mockAlertService,
      mockLogger
    )
  })

  it('should offboard employee successfully', async () => {
    const employee = Employee.create({
      organizationId: 'org-1',
      name: 'John Doe',
      email: Email.create('john@test.com'),
      hiredAt: new Date(),
    })

    mockEmployeeRepo.findById.mockResolvedValue(employee)

    const result = await service.offboard({
      organizationId: 'org-1',
      employeeId: employee.id,
    })

    expect(result.employee.isOffboarded()).toBe(true)
    expect(mockEmployeeRepo.save).toHaveBeenCalled()
  })
})
```

### Integration Tests (Infrastructure Layer)

Test repository implementations with real database.

**Example:** `tests/integration/infrastructure/repositories/employee.repository.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { PrismaEmployeeRepository } from '@saastral/infrastructure'
import { Employee, Email } from '@saastral/core'

describe('PrismaEmployeeRepository', () => {
  let prisma: PrismaClient
  let repository: PrismaEmployeeRepository

  beforeAll(async () => {
    prisma = new PrismaClient()
    repository = new PrismaEmployeeRepository(prisma)
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should save and retrieve employee', async () => {
    const employee = Employee.create({
      organizationId: 'test-org',
      name: 'Test User',
      email: Email.create('test@example.com'),
      hiredAt: new Date(),
    })

    await repository.save(employee)
    const retrieved = await repository.findById(employee.id)

    expect(retrieved?.id).toBe(employee.id)
    expect(retrieved?.name).toBe('Test User')
  })
})
```

---

## Code Quality Standards

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Entities | PascalCase | `Employee`, `Subscription` |
| Services | `{Module}Service` | `EmployeeService` |
| Repositories (interface) | `{Module}Repository` | `EmployeeRepository` |
| Repositories (impl) | `Prisma{Module}Repository` | `PrismaEmployeeRepository` |
| Value Objects | PascalCase | `Email`, `Money` |
| Errors | `{Context}Error` | `EmployeeNotFoundError` |
| Input DTOs | `{Action}{Module}Input` | `CreateEmployeeInput` |
| Output DTOs | `{Action}{Module}Output` | `OffboardEmployeeOutput` |
| Files | kebab-case | `employee.service.ts` |

### Method Naming

| Type | Convention | Example |
|------|-----------|---------|
| Queries | Present tense verb | `list()`, `getById()`, `findByEmail()` |
| Commands | Infinitive verb | `create()`, `update()`, `offboard()` |
| Boolean getters | `is` or `has` | `isActive()`, `hasExternalId()` |
| Factory methods | `create` | `Employee.create()` |
| Reconstitution | `reconstitute` | `Employee.reconstitute()` |

### File Organization

**Always use this module structure:**
```
{module}/
├── index.ts                    # Barrel export
├── {module}.entity.ts
├── {module}.service.ts
├── {module}.repository.ts
├── {module}.types.ts
└── {module}.errors.ts
```

### Import Order

```typescript
// 1. External dependencies
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

// 2. Internal packages (@saastral/*)
import { Employee, EmployeeRepository, Email } from '@saastral/core'
import { PrismaEmployeeRepository } from '@saastral/infrastructure'

// 3. Relative imports
import { formatEmployee } from './utils'
```

### Code Comments

- ✅ Use JSDoc for public APIs
- ✅ Comment complex business logic
- ❌ Don't comment obvious code
- ❌ Don't leave commented-out code

```typescript
/**
 * Offboards an employee and creates alerts for active subscriptions
 *
 * @param input - Contains employeeId and organizationId
 * @returns Offboarding result with alert status
 * @throws EmployeeNotFoundError if employee doesn't exist
 * @throws EmployeeAlreadyOffboardedError if already offboarded
 */
async offboard(input: OffboardEmployeeInput): Promise<OffboardEmployeeOutput> {
  // Implementation
}
```

---

## Quick Reference Checklist

When implementing a new feature, ask yourself:

- [ ] Is this business logic in the Core layer?
- [ ] Are repository interfaces in Core, implementations in Infrastructure?
- [ ] Does the Core layer import ONLY from Core?
- [ ] Do entities use `create()` and `reconstitute()` factories?
- [ ] Are services receiving interfaces, not concrete types?
- [ ] Are routers delegating to services?
- [ ] Are value objects immutable?
- [ ] Is error handling using domain-specific errors?
- [ ] Are DTOs defined for service inputs/outputs?
- [ ] Are Zod schemas used for HTTP validation?
- [ ] Is the dependency injection container updated?
- [ ] Are tests written for new business logic?

---

## Resources

- **Full Architecture Spec:** [detailed-spec.md](./detailed-spec.md)
- **Business Context:** [../business/overview.md](../business/overview.md)
- **Setup Guide:** [../getting-started/setup.md](../getting-started/setup.md)
- **Product Spec:** [../business/product-spec.md](../business/product-spec.md)

---

**Remember:** When in doubt, check existing implementations (like the Employee module) as reference examples. The architecture prioritizes:

1. **Separation of Concerns** - Clear boundaries between layers
2. **Testability** - Easy to test with mocked dependencies
3. **Maintainability** - Single responsibility, clear structure
4. **Flexibility** - Easy to swap implementations

Last Updated: December 2024
