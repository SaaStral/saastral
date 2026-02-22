# SaaStral — Architecture

## Table of Contents

1. [Overview](#overview)
2. [Architectural Principles](#architectural-principles)
3. [Project Structure](#project-structure)
4. [Core Layer (Domain)](#core-layer-domain)
5. [Infrastructure Layer](#infrastructure-layer)
6. [Naming Conventions](#naming-conventions)
7. [Dependency Rules](#dependency-rules)
8. [Implementation Guide](#implementation-guide)
9. [Testing Strategy](#testing-strategy)
10. [Common Pitfalls](#common-pitfalls)

---

## Overview

This document describes the SaaStral architecture, based on a **hybrid approach** that pragmatically combines principles from Clean Architecture and Hexagonal Architecture.

### Why Hybrid Architecture?

| Benefit | Description |
|---------|-------------|
| **Simplicity** | Fewer files, less ceremony, more productivity |
| **Testability** | Isolated business logic, easy to test |
| **Flexibility** | Easy to swap implementations (database, APIs) |
| **Fast onboarding** | New contributors understand it in minutes |
| **Evolutionary** | Can grow to full hexagonal if needed |

### Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      External Systems                           │
│            (HTTP, Database, Queue, APIs, etc.)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                           │
│         (@saastral/infrastructure)                              │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Routers   │  │Repositories│  │ Providers  │  │  Queue   │ │
│  │  (tRPC)    │  │  (Prisma)  │  │(Google/Okta)│  │(Graphile)│ │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └────┬─────┘ │
│         └────────────────┴───────────────┴─────────────┘       │
│                           │                                     │
│              Implements Interfaces from Core                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      CORE LAYER                                 │
│                   (@saastral/core)                              │
│                                                                 │
│  ┌──────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Services │  │  Entities  │  │ Interfaces │  │   Types    │ │
│  │(Use Cases)│  │  (Domain)  │  │   (Ports)  │  │   (DTOs)   │ │
│  └──────────┘  └────────────┘  └────────────┘  └────────────┘ │
│                                                                 │
│              Pure Business Logic (Framework Free)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architectural Principles

### 1. Dependency Rule

**Dependencies always point inward**: Infrastructure depends on Core, never the other way around.

```
✅ ALLOWED:
Infrastructure → Core     (Infrastructure imports from Core)
Core → Core              (Core imports from Core)

❌ FORBIDDEN:
Core → Infrastructure    (Core CANNOT import from Infrastructure)
Core → Framework         (Core CANNOT import Next.js, Prisma, etc.)
```

### 2. Dependency Inversion

External dependencies are abstracted by interfaces defined in the Core layer.

```typescript
// ✅ Correct: Interface defined in Core
// packages/core/src/employees/employee.repository.ts
export interface EmployeeRepository {
  findById(id: string): Promise<Employee | null>
  save(employee: Employee): Promise<Employee>
}

// ✅ Correct: Implementation in Infrastructure
// packages/infrastructure/src/database/repositories/employee.repository.ts
import { EmployeeRepository } from '@saastral/core'

export class PrismaEmployeeRepository implements EmployeeRepository {
  // Uses Prisma to implement the interface
}
```

### 3. Single Responsibility

Each class/file has a single reason to change:

| Component | Responsibility |
|-----------|----------------|
| **Entity** | Represent business concept + state rules |
| **Service** | Orchestrate business operations (use cases) |
| **Repository (interface)** | Define persistence contract |
| **Repository (impl)** | Implement persistence with specific technology |
| **Router** | Receive HTTP, validate, call service, return response |

---

## Project Structure

```
saastral/
├── apps/
│   ├── web/                                # Next.js Application
│   │   ├── src/
│   │   │   ├── app/                        # App Router (pages and API)
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── register/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx            # Dashboard
│   │   │   │   │   ├── employees/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── subscriptions/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── alerts/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── integrations/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── settings/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   └── api/
│   │   │   │       ├── trpc/
│   │   │   │       │   └── [trpc]/
│   │   │   │       │       └── route.ts
│   │   │   │       └── webhooks/
│   │   │   │           ├── google/
│   │   │   │           │   └── route.ts
│   │   │   │           └── okta/
│   │   │   │               └── route.ts
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ui/                     # shadcn/ui
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   └── ...
│   │   │   │   │
│   │   │   │   ├── layouts/
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   ├── header.tsx
│   │   │   │   │   └── dashboard-layout.tsx
│   │   │   │   │
│   │   │   │   └── features/
│   │   │   │       ├── employees/
│   │   │   │       │   ├── employee-table.tsx
│   │   │   │       │   ├── employee-form.tsx
│   │   │   │       │   └── employee-details.tsx
│   │   │   │       ├── subscriptions/
│   │   │   │       │   └── ...
│   │   │   │       └── alerts/
│   │   │   │           └── ...
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── use-employees.ts
│   │   │   │   └── use-subscriptions.ts
│   │   │   │
│   │   │   └── lib/
│   │   │       ├── trpc.ts                 # tRPC client
│   │   │       └── utils.ts
│   │   │
│   │   ├── public/
│   │   ├── tailwind.config.ts
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   └── worker/                             # Background Jobs
│       ├── src/
│       │   ├── index.ts                    # Entry point
│       │   ├── crontab.ts                  # Cron schedules
│       │   └── tasks/
│       │       ├── sync-google-directory.ts
│       │       ├── poll-okta-events.ts
│       │       ├── check-renewals.ts
│       │       ├── check-unused-licenses.ts
│       │       ├── check-orphaned-licenses.ts
│       │       └── send-alert-email.ts
│       │
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   │
│   ├── core/                               # @saastral/core
│   │   ├── src/
│   │   │   ├── index.ts                    # Public exports
│   │   │   │
│   │   │   ├── employees/
│   │   │   │   ├── index.ts
│   │   │   │   ├── employee.entity.ts
│   │   │   │   ├── employee.service.ts
│   │   │   │   ├── employee.repository.ts  # Interface
│   │   │   │   ├── employee.types.ts
│   │   │   │   └── employee.errors.ts
│   │   │   │
│   │   │   ├── subscriptions/
│   │   │   │   ├── index.ts
│   │   │   │   ├── subscription.entity.ts
│   │   │   │   ├── subscription.service.ts
│   │   │   │   ├── subscription.repository.ts
│   │   │   │   ├── subscription.types.ts
│   │   │   │   └── subscription.errors.ts
│   │   │   │
│   │   │   ├── alerts/
│   │   │   │   ├── index.ts
│   │   │   │   ├── alert.entity.ts
│   │   │   │   ├── alert.service.ts
│   │   │   │   ├── alert.repository.ts
│   │   │   │   ├── alert.types.ts
│   │   │   │   └── alert.errors.ts
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   ├── index.ts
│   │   │   │   ├── savings-calculator.ts
│   │   │   │   ├── usage-analyzer.ts
│   │   │   │   ├── dashboard.service.ts
│   │   │   │   └── analytics.types.ts
│   │   │   │
│   │   │   ├── integrations/
│   │   │   │   ├── index.ts
│   │   │   │   ├── integration.entity.ts
│   │   │   │   ├── integration.service.ts
│   │   │   │   ├── integration.repository.ts
│   │   │   │   ├── integration.types.ts
│   │   │   │   ├── directory-provider.ts   # Interface
│   │   │   │   ├── identity-provider.ts    # Interface
│   │   │   │   └── login-event.entity.ts
│   │   │   │
│   │   │   └── shared/
│   │   │       ├── index.ts
│   │   │       ├── value-objects/
│   │   │       │   ├── email.ts
│   │   │       │   ├── money.ts
│   │   │       │   └── billing-cycle.ts
│   │   │       ├── interfaces/
│   │   │       │   ├── logger.ts
│   │   │       │   ├── job-queue.ts
│   │   │       │   └── email-sender.ts
│   │   │       ├── errors/
│   │   │       │   └── base.error.ts
│   │   │       └── utils/
│   │   │           └── date.ts
│   │   │
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── infrastructure/                     # @saastral/infrastructure
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   │
│   │   │   ├── database/
│   │   │   │   ├── prisma/
│   │   │   │   │   ├── schema.prisma
│   │   │   │   │   ├── migrations/
│   │   │   │   │   ├── client.ts
│   │   │   │   │   └── seed.ts
│   │   │   │   │
│   │   │   │   └── repositories/
│   │   │   │       ├── employee.repository.ts
│   │   │   │       ├── subscription.repository.ts
│   │   │   │       ├── alert.repository.ts
│   │   │   │       ├── integration.repository.ts
│   │   │   │       └── login-event.repository.ts
│   │   │   │
│   │   │   ├── providers/
│   │   │   │   ├── google/
│   │   │   │   │   ├── google-directory.provider.ts
│   │   │   │   │   ├── google-oauth.ts
│   │   │   │   │   └── google.types.ts
│   │   │   │   │
│   │   │   │   ├── okta/
│   │   │   │   │   ├── okta-identity.provider.ts
│   │   │   │   │   └── okta.types.ts
│   │   │   │   │
│   │   │   │   └── email/
│   │   │   │       ├── resend.provider.ts
│   │   │   │       └── email.templates.ts
│   │   │   │
│   │   │   ├── http/
│   │   │   │   ├── trpc.ts                 # tRPC setup
│   │   │   │   ├── context.ts              # Request context
│   │   │   │   │
│   │   │   │   ├── routers/
│   │   │   │   │   ├── index.ts            # App router
│   │   │   │   │   ├── employee.router.ts
│   │   │   │   │   ├── subscription.router.ts
│   │   │   │   │   ├── alert.router.ts
│   │   │   │   │   ├── dashboard.router.ts
│   │   │   │   │   └── integration.router.ts
│   │   │   │   │
│   │   │   │   ├── schemas/
│   │   │   │   │   ├── employee.schema.ts
│   │   │   │   │   ├── subscription.schema.ts
│   │   │   │   │   └── alert.schema.ts
│   │   │   │   │
│   │   │   │   └── middleware/
│   │   │   │       ├── auth.ts
│   │   │   │       └── tenant.ts
│   │   │   │
│   │   │   ├── queue/
│   │   │   │   └── graphile.adapter.ts
│   │   │   │
│   │   │   ├── logger/
│   │   │   │   └── pino.adapter.ts
│   │   │   │
│   │   │   └── container.ts                # Dependency Injection
│   │   │
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── shared/                             # @saastral/shared
│       ├── src/
│       │   ├── index.ts
│       │   ├── types/
│       │   │   └── index.ts
│       │   ├── constants.ts
│       │   └── utils/
│       │       ├── string.ts
│       │       └── date.ts
│       │
│       ├── tsconfig.json
│       └── package.json
│
├── tests/
│   ├── unit/
│   │   └── core/
│   │       ├── employees/
│   │       │   ├── employee.entity.test.ts
│   │       │   └── employee.service.test.ts
│   │       └── analytics/
│   │           └── savings-calculator.test.ts
│   │
│   ├── integration/
│   │   └── infrastructure/
│   │       └── repositories/
│   │           └── employee.repository.test.ts
│   │
│   └── e2e/
│       └── api/
│           └── employees.test.ts
│
├── docker/
│   └── nginx/
│       └── nginx.conf
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   └── API.md
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── turbo.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Core Layer (Domain)

The Core layer contains **pure business logic** with no framework dependencies.

### Module Structure

```
core/src/{module}/
├── index.ts                    # Public exports
├── {module}.entity.ts          # Domain entity
├── {module}.service.ts         # Use cases / business logic
├── {module}.repository.ts      # Persistence interface
├── {module}.types.ts           # DTOs and types
└── {module}.errors.ts          # Domain exceptions
```

### Components

#### 1. Entity

**File:** `{module}.entity.ts`

**Purpose:** Represent a business concept with identity and behavior.

**Responsibilities:**
- Encapsulate data and state rules
- Validate business invariants
- Expose behaviors (methods)
- Be framework-independent

**Rules:**
- ✅ Must have static `create()` method for creation
- ✅ Must have static `reconstitute()` method for database reconstruction
- ✅ Must use getters to expose properties
- ✅ Must encapsulate state change rules
- ❌ MUST NOT depend on framework classes
- ❌ MUST NOT perform I/O (database, API, etc.)

**Example:**

```typescript
// packages/core/src/employees/employee.entity.ts

import { Email } from '../shared/value-objects/email'

export type EmployeeStatus = 'active' | 'offboarded'

export interface EmployeeProps {
  id: string
  organizationId: string
  name: string
  email: Email
  departmentId?: string
  status: EmployeeStatus
  externalId?: string
  hiredAt: Date
  offboardedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export class Employee {
  private props: EmployeeProps

  private constructor(props: EmployeeProps) {
    this.props = props
  }

  /**
   * Creates a new employee
   */
  static create(
    props: Omit<EmployeeProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Employee {
    return new Employee({
      ...props,
      id: crypto.randomUUID(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Reconstitutes an employee from the database
   */
  static reconstitute(props: EmployeeProps): Employee {
    return new Employee(props)
  }

  // ─── Getters ───────────────────────────────────────────────

  get id(): string {
    return this.props.id
  }

  get organizationId(): string {
    return this.props.organizationId
  }

  get name(): string {
    return this.props.name
  }

  get email(): Email {
    return this.props.email
  }

  get status(): EmployeeStatus {
    return this.props.status
  }

  get departmentId(): string | undefined {
    return this.props.departmentId
  }

  get externalId(): string | undefined {
    return this.props.externalId
  }

  get hiredAt(): Date {
    return this.props.hiredAt
  }

  get offboardedAt(): Date | undefined {
    return this.props.offboardedAt
  }

  // ─── Computed Properties ───────────────────────────────────

  isActive(): boolean {
    return this.props.status === 'active'
  }

  isOffboarded(): boolean {
    return this.props.status === 'offboarded'
  }

  hasExternalId(): boolean {
    return this.props.externalId !== undefined
  }

  // ─── Behaviors ─────────────────────────────────────────────

  /**
   * Marks the employee as offboarded
   * @throws Error if already offboarded
   */
  offboard(): void {
    if (this.isOffboarded()) {
      throw new Error('Employee is already offboarded')
    }
    this.props.status = 'offboarded'
    this.props.offboardedAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * Updates the employee's name
   */
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty')
    }
    this.props.name = name.trim()
    this.props.updatedAt = new Date()
  }

  /**
   * Links external ID (Google/Microsoft)
   */
  linkExternalId(externalId: string): void {
    this.props.externalId = externalId
    this.props.updatedAt = new Date()
  }

  // ─── Serialization ─────────────────────────────────────────

  toJSON(): EmployeeProps {
    return { ...this.props }
  }
}
```

---

#### 2. Service

**File:** `{module}.service.ts`

**Purpose:** Orchestrate business operations (use cases).

**Responsibilities:**
- Coordinate operation flow
- Use repositories and other services
- Apply cross-entity business rules
- Log execution
- Handle domain errors

**Rules:**
- ✅ Must receive dependencies via constructor (DI)
- ✅ Must have methods representing use cases
- ✅ Must validate business rules
- ✅ Must use interfaces (not concrete implementations)
- ❌ MUST NOT contain presentation logic
- ❌ MUST NOT depend on framework classes

**Example:**

```typescript
// packages/core/src/employees/employee.service.ts

import { Employee } from './employee.entity'
import { EmployeeRepository } from './employee.repository'
import {
  CreateEmployeeInput,
  OffboardEmployeeInput,
  OffboardEmployeeOutput,
} from './employee.types'
import {
  EmployeeNotFoundError,
  EmployeeAlreadyExistsError,
  EmployeeAlreadyOffboardedError,
} from './employee.errors'
import { SubscriptionRepository } from '../subscriptions/subscription.repository'
import { AlertService } from '../alerts/alert.service'
import { LoggerInterface } from '../shared/interfaces/logger'
import { Email } from '../shared/value-objects/email'

export class EmployeeService {
  constructor(
    private employeeRepo: EmployeeRepository,
    private subscriptionRepo: SubscriptionRepository,
    private alertService: AlertService,
    private logger: LoggerInterface
  ) {}

  /**
   * Finds employee by ID
   */
  async getById(id: string, organizationId: string): Promise<Employee> {
    const employee = await this.employeeRepo.findById(id)

    if (!employee || employee.organizationId !== organizationId) {
      throw new EmployeeNotFoundError(id)
    }

    return employee
  }

  /**
   * Creates a new employee
   */
  async create(input: CreateEmployeeInput): Promise<Employee> {
    this.logger.info('[EmployeeService.create] Starting', {
      email: input.email,
    })

    // Check if already exists
    const existing = await this.employeeRepo.findByEmail(
      input.email,
      input.organizationId
    )

    if (existing) {
      throw new EmployeeAlreadyExistsError(input.email)
    }

    // Create entity
    const employee = Employee.create({
      organizationId: input.organizationId,
      name: input.name,
      email: Email.create(input.email),
      departmentId: input.departmentId,
      hiredAt: input.hiredAt ?? new Date(),
    })

    // Persist
    const saved = await this.employeeRepo.save(employee)

    this.logger.info('[EmployeeService.create] Completed', {
      employeeId: saved.id,
    })

    return saved
  }

  /**
   * Offboards an employee
   */
  async offboard(input: OffboardEmployeeInput): Promise<OffboardEmployeeOutput> {
    this.logger.info('[EmployeeService.offboard] Starting', {
      employeeId: input.employeeId,
    })

    // 1. Find employee
    const employee = await this.getById(input.employeeId, input.organizationId)

    // 2. Validate state
    if (employee.isOffboarded()) {
      throw new EmployeeAlreadyOffboardedError(input.employeeId)
    }

    // 3. Offboard
    employee.offboard()
    await this.employeeRepo.save(employee)

    // 4. Check active subscriptions
    const subscriptions = await this.subscriptionRepo.findByEmployeeId(
      input.employeeId
    )

    // 5. Create alert if has subscriptions
    let alertCreated = false
    if (subscriptions.length > 0) {
      await this.alertService.createOffboardingAlert(employee, subscriptions)
      alertCreated = true
    }

    this.logger.info('[EmployeeService.offboard] Completed', {
      employeeId: employee.id,
      subscriptionsCount: subscriptions.length,
      alertCreated,
    })

    return {
      employee,
      activeSubscriptionsCount: subscriptions.length,
      alertCreated,
    }
  }
}
```

---

#### 3. Repository (Interface)

**File:** `{module}.repository.ts`

**Purpose:** Define persistence contract. This is the **PORT** in the architecture.

**Responsibilities:**
- Declare data access methods
- Use domain types (entities)
- Be technology-agnostic

**Rules:**
- ✅ Must be an interface (not a class)
- ✅ Must use only domain types
- ✅ Must be generic enough for different implementations
- ❌ MUST NOT expose implementation details (SQL, ORM)

**Example:**

```typescript
// packages/core/src/employees/employee.repository.ts

import { Employee } from './employee.entity'

export interface EmployeeFilters {
  status?: 'active' | 'offboarded'
  departmentId?: string
  search?: string
}

export interface EmployeeRepository {
  findById(id: string): Promise<Employee | null>
  findByEmail(email: string, organizationId: string): Promise<Employee | null>
  findByExternalId(externalId: string, organizationId: string): Promise<Employee | null>
  findByOrganizationId(organizationId: string, filters?: EmployeeFilters): Promise<Employee[]>
  save(employee: Employee): Promise<Employee>
  delete(id: string): Promise<void>
  countByStatus(organizationId: string, status: 'active' | 'offboarded'): Promise<number>
}
```

---

#### 4. Types (DTOs)

**File:** `{module}.types.ts`

**Purpose:** Define input/output types for use cases.

**Example:**

```typescript
// packages/core/src/employees/employee.types.ts

import { Employee } from './employee.entity'

// ─── Inputs ──────────────────────────────────────────────────

export interface CreateEmployeeInput {
  readonly organizationId: string
  readonly name: string
  readonly email: string
  readonly departmentId?: string
  readonly hiredAt?: Date
}

export interface OffboardEmployeeInput {
  readonly organizationId: string
  readonly employeeId: string
}

export interface ListEmployeesInput {
  readonly organizationId: string
  readonly status?: 'active' | 'offboarded'
  readonly departmentId?: string
  readonly search?: string
}

// ─── Outputs ─────────────────────────────────────────────────

export interface OffboardEmployeeOutput {
  readonly employee: Employee
  readonly activeSubscriptionsCount: number
  readonly alertCreated: boolean
}
```

---

#### 5. Errors

**File:** `{module}.errors.ts`

**Purpose:** Define domain-specific exceptions.

**Example:**

```typescript
// packages/core/src/employees/employee.errors.ts

import { DomainError } from '../shared/errors/base.error'

export class EmployeeNotFoundError extends DomainError {
  constructor(employeeId: string) {
    super(`Employee with id "${employeeId}" not found`, 'EMPLOYEE_NOT_FOUND')
  }
}

export class EmployeeAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`Employee with email "${email}" already exists`, 'EMPLOYEE_ALREADY_EXISTS')
  }
}

export class EmployeeAlreadyOffboardedError extends DomainError {
  constructor(employeeId: string) {
    super(`Employee "${employeeId}" is already offboarded`, 'EMPLOYEE_ALREADY_OFFBOARDED')
  }
}
```

```typescript
// packages/core/src/shared/errors/base.error.ts

export abstract class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = this.constructor.name
  }
}
```

---

#### 6. Value Objects

**File:** `shared/value-objects/{name}.ts`

**Purpose:** Represent immutable values without identity.

**Example:**

```typescript
// packages/core/src/shared/value-objects/email.ts

export class Email {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string): Email {
    const normalized = value.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(normalized)) {
      throw new Error(`Invalid email format: ${value}`)
    }

    return new Email(normalized)
  }

  static reconstitute(value: string): Email {
    return new Email(value)
  }

  getValue(): string {
    return this.value
  }

  getDomain(): string {
    return this.value.split('@')[1]
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
```

```typescript
// packages/core/src/shared/value-objects/money.ts

export class Money {
  private constructor(
    private readonly cents: number,
    private readonly currency: string = 'BRL'
  ) {
    if (cents < 0) throw new Error('Amount cannot be negative')
  }

  static fromCents(cents: number, currency = 'BRL'): Money {
    return new Money(Math.round(cents), currency)
  }

  static fromDecimal(decimal: number, currency = 'BRL'): Money {
    return new Money(Math.round(decimal * 100), currency)
  }

  static zero(currency = 'BRL'): Money {
    return new Money(0, currency)
  }

  getCents(): number {
    return this.cents
  }

  getDecimal(): number {
    return this.cents / 100
  }

  add(other: Money): Money {
    this.assertSameCurrency(other)
    return new Money(this.cents + other.cents, this.currency)
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.cents * factor), this.currency)
  }

  format(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
    }).format(this.getDecimal())
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot operate on different currencies`)
    }
  }
}
```

---

#### 7. Interfaces (Shared)

**File:** `shared/interfaces/{name}.ts`

**Purpose:** Define contracts for cross-cutting dependencies.

**Example:**

```typescript
// packages/core/src/shared/interfaces/logger.ts

export interface LoggerInterface {
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
  debug(message: string, context?: Record<string, unknown>): void
}

// packages/core/src/shared/interfaces/job-queue.ts

export interface JobQueueInterface {
  enqueue(taskName: string, payload: Record<string, unknown>): Promise<void>
  enqueueAt(taskName: string, payload: Record<string, unknown>, runAt: Date): Promise<void>
}

// packages/core/src/shared/interfaces/email-sender.ts

export interface EmailSenderInterface {
  send(options: SendEmailOptions): Promise<void>
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
}
```

---

## Infrastructure Layer

The Infrastructure layer contains **framework-specific** code that implements the Core interfaces.

### Components

#### 1. Repository (Implementation)

**File:** `database/repositories/{module}.repository.ts`

**Purpose:** Implement persistence interface using Prisma.

**Example:**

```typescript
// packages/infrastructure/src/database/repositories/employee.repository.ts

import { PrismaClient, Employee as PrismaEmployee } from '@prisma/client'
import { Employee, EmployeeRepository, EmployeeFilters, Email } from '@saastral/core'

export class PrismaEmployeeRepository implements EmployeeRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Employee | null> {
    const record = await this.prisma.employee.findUnique({ where: { id } })
    return record ? this.toDomain(record) : null
  }

  async findByEmail(email: string, organizationId: string): Promise<Employee | null> {
    const record = await this.prisma.employee.findFirst({
      where: { email: email.toLowerCase(), organizationId },
    })
    return record ? this.toDomain(record) : null
  }

  async findByOrganizationId(
    organizationId: string,
    filters?: EmployeeFilters
  ): Promise<Employee[]> {
    const records = await this.prisma.employee.findMany({
      where: {
        organizationId,
        status: filters?.status,
        departmentId: filters?.departmentId,
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
    })
    return records.map((r) => this.toDomain(r))
  }

  async save(employee: Employee): Promise<Employee> {
    const data = this.toPersistence(employee)
    const record = await this.prisma.employee.upsert({
      where: { id: employee.id },
      create: data,
      update: data,
    })
    return this.toDomain(record)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.employee.delete({ where: { id } })
  }

  async countByStatus(organizationId: string, status: 'active' | 'offboarded'): Promise<number> {
    return this.prisma.employee.count({ where: { organizationId, status } })
  }

  // ─── Mappers ───────────────────────────────────────────────

  private toDomain(record: PrismaEmployee): Employee {
    return Employee.reconstitute({
      id: record.id,
      organizationId: record.organizationId,
      name: record.name,
      email: Email.reconstitute(record.email),
      departmentId: record.departmentId ?? undefined,
      status: record.status as 'active' | 'offboarded',
      externalId: record.externalId ?? undefined,
      hiredAt: record.hiredAt,
      offboardedAt: record.offboardedAt ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  private toPersistence(employee: Employee): any {
    const props = employee.toJSON()
    return {
      id: props.id,
      organizationId: props.organizationId,
      name: props.name,
      email: props.email.toString(),
      departmentId: props.departmentId ?? null,
      status: props.status,
      externalId: props.externalId ?? null,
      hiredAt: props.hiredAt,
      offboardedAt: props.offboardedAt ?? null,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    }
  }
}
```

---

#### 2. Router (Controller)

**File:** `http/routers/{module}.router.ts`

**Purpose:** Receive HTTP requests, validate, call service, return response.

**Rules:**
- ✅ Must use Zod schemas for validation
- ✅ Must get dependencies from container
- ✅ Must handle domain errors and convert to HTTP errors
- ❌ MUST NOT contain business logic

**Example:**

```typescript
// packages/infrastructure/src/http/routers/employee.router.ts

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import {
  EmployeeService,
  EmployeeNotFoundError,
  EmployeeAlreadyExistsError,
  EmployeeAlreadyOffboardedError,
  Employee,
} from '@saastral/core'
import { createEmployeeSchema, listEmployeesSchema } from '../schemas/employee.schema'

export const employeeRouter = router({
  list: protectedProcedure
    .input(listEmployeesSchema)
    .query(async ({ ctx, input }) => {
      const service = new EmployeeService(
        ctx.container.employeeRepo,
        ctx.container.subscriptionRepo,
        ctx.container.alertService,
        ctx.container.logger
      )

      const employees = await service.list({
        organizationId: ctx.session.organizationId,
        ...input,
      })

      return { employees: employees.map(formatEmployee) }
    }),

  create: protectedProcedure
    .input(createEmployeeSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new EmployeeService(
        ctx.container.employeeRepo,
        ctx.container.subscriptionRepo,
        ctx.container.alertService,
        ctx.container.logger
      )

      try {
        const employee = await service.create({
          organizationId: ctx.session.organizationId,
          ...input,
        })
        return formatEmployee(employee)
      } catch (error) {
        throw mapDomainError(error)
      }
    }),

  offboard: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const service = new EmployeeService(
        ctx.container.employeeRepo,
        ctx.container.subscriptionRepo,
        ctx.container.alertService,
        ctx.container.logger
      )

      try {
        const result = await service.offboard({
          organizationId: ctx.session.organizationId,
          employeeId: input.id,
        })

        return {
          employee: formatEmployee(result.employee),
          activeSubscriptionsCount: result.activeSubscriptionsCount,
          alertCreated: result.alertCreated,
        }
      } catch (error) {
        throw mapDomainError(error)
      }
    }),
})

// ─── Helpers ─────────────────────────────────────────────────

function formatEmployee(employee: Employee) {
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email.toString(),
    status: employee.status,
    departmentId: employee.departmentId,
    hiredAt: employee.hiredAt.toISOString(),
    offboardedAt: employee.offboardedAt?.toISOString(),
  }
}

function mapDomainError(error: unknown): TRPCError {
  if (error instanceof EmployeeNotFoundError) {
    return new TRPCError({ code: 'NOT_FOUND', message: error.message })
  }
  if (error instanceof EmployeeAlreadyExistsError) {
    return new TRPCError({ code: 'CONFLICT', message: error.message })
  }
  if (error instanceof EmployeeAlreadyOffboardedError) {
    return new TRPCError({ code: 'BAD_REQUEST', message: error.message })
  }
  return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected error' })
}
```

---

#### 3. Schemas (Validation)

**File:** `http/schemas/{module}.schema.ts`

**Example:**

```typescript
// packages/infrastructure/src/http/schemas/employee.schema.ts

import { z } from 'zod'

export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email'),
  departmentId: z.string().uuid().optional(),
  hiredAt: z.coerce.date().optional(),
})

export const listEmployeesSchema = z.object({
  status: z.enum(['active', 'offboarded']).optional(),
  departmentId: z.string().uuid().optional(),
  search: z.string().optional(),
})
```

---

#### 4. Container (Dependency Injection)

**File:** `container.ts`

**Example:**

```typescript
// packages/infrastructure/src/container.ts

import { PrismaClient } from '@prisma/client'
import { PrismaEmployeeRepository } from './database/repositories/employee.repository'
import { PrismaSubscriptionRepository } from './database/repositories/subscription.repository'
import { PrismaAlertRepository } from './database/repositories/alert.repository'
import { GraphileJobQueue } from './queue/graphile.adapter'
import { PinoLogger } from './logger/pino.adapter'
import { AlertService } from '@saastral/core'

export class Container {
  private prisma: PrismaClient
  private instances = new Map<string, unknown>()

  constructor() {
    this.prisma = new PrismaClient()
  }

  get employeeRepo(): PrismaEmployeeRepository {
    return this.singleton('employeeRepo', () => new PrismaEmployeeRepository(this.prisma))
  }

  get subscriptionRepo(): PrismaSubscriptionRepository {
    return this.singleton('subscriptionRepo', () => new PrismaSubscriptionRepository(this.prisma))
  }

  get alertRepo(): PrismaAlertRepository {
    return this.singleton('alertRepo', () => new PrismaAlertRepository(this.prisma))
  }

  get alertService(): AlertService {
    return this.singleton('alertService', () =>
      new AlertService(this.alertRepo, this.jobQueue, this.logger)
    )
  }

  get jobQueue(): GraphileJobQueue {
    return this.singleton('jobQueue', () => new GraphileJobQueue(this.prisma))
  }

  get logger(): PinoLogger {
    return this.singleton('logger', () => new PinoLogger())
  }

  private singleton<T>(key: string, factory: () => T): T {
    if (!this.instances.has(key)) {
      this.instances.set(key, factory())
    }
    return this.instances.get(key) as T
  }
}

let container: Container | null = null

export function getContainer(): Container {
  if (!container) {
    container = new Container()
  }
  return container
}
```

---

## Naming Conventions

### Files

| Type | Pattern | Example |
|------|---------|---------|
| Entity | `{module}.entity.ts` | `employee.entity.ts` |
| Service | `{module}.service.ts` | `employee.service.ts` |
| Repository (interface) | `{module}.repository.ts` | `employee.repository.ts` |
| Types | `{module}.types.ts` | `employee.types.ts` |
| Errors | `{module}.errors.ts` | `employee.errors.ts` |
| Router | `{module}.router.ts` | `employee.router.ts` |
| Schema | `{module}.schema.ts` | `employee.schema.ts` |
| Provider | `{provider}.provider.ts` | `google-directory.provider.ts` |
| Value Object | `{name}.ts` | `email.ts`, `money.ts` |

### Classes and Interfaces

| Type | Pattern | Example |
|------|---------|---------|
| Entity | `PascalCase` | `Employee` |
| Service | `{Module}Service` | `EmployeeService` |
| Repository (interface) | `{Module}Repository` | `EmployeeRepository` |
| Repository (impl) | `Prisma{Module}Repository` | `PrismaEmployeeRepository` |
| Error | `{Context}Error` | `EmployeeNotFoundError` |
| Value Object | `PascalCase` | `Email`, `Money` |
| Input DTO | `{Action}{Module}Input` | `CreateEmployeeInput` |
| Output DTO | `{Action}{Module}Output` | `OffboardEmployeeOutput` |

### Methods

| Type | Pattern | Example |
|------|---------|---------|
| Query | present tense verb | `list`, `getById`, `findByEmail` |
| Command | infinitive verb | `create`, `update`, `offboard` |
| Boolean getter | `is` or `has` | `isActive()`, `hasExternalId()` |
| Factory | `create` | `Employee.create()` |
| Reconstitution | `reconstitute` | `Employee.reconstitute()` |

---

## Dependency Rules

```
┌─────────────────────────────────────────────────────────────┐
│                        apps/web                             │
│                     (Next.js pages)                         │
│                           │                                 │
│                           ▼                                 │
│              @saastral/infrastructure                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  routers ──▶ services ──▶ repositories (interface)  │   │
│  │     │            │              │                    │   │
│  │     ▼            ▼              ▼                    │   │
│  │  schemas    entities      repositories (impl)        │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│                    @saastral/core                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   services ──▶ entities ──▶ value-objects            │   │
│  │      │                                               │   │
│  │      ▼                                               │   │
│  │  repositories (interfaces)                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

| From | To | Allowed? |
|------|-----|----------|
| `apps/web` | `@saastral/infrastructure` | ✅ Yes |
| `apps/web` | `@saastral/core` | ✅ Yes (types) |
| `@saastral/infrastructure` | `@saastral/core` | ✅ Yes |
| `@saastral/core` | `@saastral/infrastructure` | ❌ **No** |
| `@saastral/core` | `apps/*` | ❌ **No** |

---

## Testing Strategy

### Unit Tests (Core)

```typescript
// tests/unit/core/employees/employee.service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmployeeService, Employee, Email, EmployeeNotFoundError } from '@saastral/core'

describe('EmployeeService', () => {
  let service: EmployeeService
  let mockEmployeeRepo: any
  let mockSubscriptionRepo: any
  let mockAlertService: any
  let mockLogger: any

  beforeEach(() => {
    mockEmployeeRepo = {
      findById: vi.fn(),
      save: vi.fn((e) => Promise.resolve(e)),
    }
    mockSubscriptionRepo = { findByEmployeeId: vi.fn() }
    mockAlertService = { createOffboardingAlert: vi.fn() }
    mockLogger = { info: vi.fn(), error: vi.fn() }

    service = new EmployeeService(
      mockEmployeeRepo,
      mockSubscriptionRepo,
      mockAlertService,
      mockLogger
    )
  })

  describe('offboard', () => {
    it('should offboard and create alert when has subscriptions', async () => {
      const employee = Employee.create({
        organizationId: 'org-1',
        name: 'John',
        email: Email.create('john@test.com'),
        hiredAt: new Date(),
      })

      mockEmployeeRepo.findById.mockResolvedValue(employee)
      mockSubscriptionRepo.findByEmployeeId.mockResolvedValue([{ id: 'sub-1' }])

      const result = await service.offboard({
        organizationId: 'org-1',
        employeeId: employee.id,
      })

      expect(result.employee.isOffboarded()).toBe(true)
      expect(result.alertCreated).toBe(true)
    })
  })
})
```

---

## Common Pitfalls

### ❌ Business logic in Router

```typescript
// ❌ Wrong
offboard: protectedProcedure.mutation(async ({ ctx, input }) => {
  const employee = await ctx.prisma.employee.findUnique({...})
  if (employee?.status === 'offboarded') throw new TRPCError({...})
  await ctx.prisma.employee.update({...})
})

// ✅ Correct
offboard: protectedProcedure.mutation(async ({ ctx, input }) => {
  const service = new EmployeeService(...)
  return service.offboard({ employeeId: input.id, ... })
})
```

### ❌ Service depending on Prisma

```typescript
// ❌ Wrong
import { PrismaClient } from '@prisma/client'
export class EmployeeService {
  constructor(private prisma: PrismaClient) {}
}

// ✅ Correct
import { EmployeeRepository } from './employee.repository'
export class EmployeeService {
  constructor(private employeeRepo: EmployeeRepository) {}
}
```

### ❌ Entity performing I/O

```typescript
// ❌ Wrong
export class Employee {
  async save() { await db.employee.update({...}) }
}

// ✅ Correct
export class Employee {
  offboard() { this.props.status = 'offboarded' }
}
// Service handles I/O
```

---

## Summary

| Benefit | How |
|---------|-----|
| **Testability** | Services testable with mocks |
| **Maintainability** | Single responsibility |
| **Flexibility** | Interfaces allow swapping implementations |
| **Simplicity** | Fewer files than pure hexagonal |
| **Productivity** | Clear structure |

---

*Last updated: December 2024*
