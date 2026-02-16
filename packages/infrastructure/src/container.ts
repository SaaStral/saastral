import type { PrismaClient } from '@saastral/database'
import { PinoLogger } from './logger/pino.adapter'
import { PrismaEmployeeRepository } from './database/repositories/employee.repository'
import { PrismaUserRepository } from './database/repositories/user.repository'
import { PrismaOrganizationRepository } from './database/repositories/organization.repository'
import { PrismaOrganizationMemberRepository } from './database/repositories/organization-member.repository'
import { PrismaIntegrationRepository } from './database/repositories/integration.repository'
import { PrismaAlertRepository } from './database/repositories/alert.repository'
import { PrismaDepartmentRepository } from './database/repositories/department.repository'
import { EncryptionService } from './utils/encryption.service'
import {
  EmployeeService,
  UserService,
  OrganizationService,
  AlertService,
  DepartmentService,
} from '@saastral/core'
import { prisma } from '@saastral/database'

/**
 * Dependency Injection Container
 * Manages singleton instances of repositories, services, and adapters
 */
export class Container {
  private instances = new Map<string, unknown>()
  private _prisma: PrismaClient

  constructor(prismaClient?: PrismaClient) {
    this._prisma = prismaClient ?? prisma
  }

  get prisma(): PrismaClient {
    return this._prisma
  }

  get logger(): PinoLogger {
    return this.singleton('logger', () => new PinoLogger())
  }

  // Repositories
  get employeeRepo(): PrismaEmployeeRepository {
    return this.singleton('employeeRepo', () => new PrismaEmployeeRepository(this.prisma))
  }

  get userRepo(): PrismaUserRepository {
    return this.singleton('userRepo', () => new PrismaUserRepository(this.prisma))
  }

  get organizationRepo(): PrismaOrganizationRepository {
    return this.singleton('organizationRepo', () => new PrismaOrganizationRepository(this.prisma))
  }

  get organizationMemberRepo(): PrismaOrganizationMemberRepository {
    return this.singleton('organizationMemberRepo', () => new PrismaOrganizationMemberRepository(this.prisma))
  }

  get integrationRepo(): PrismaIntegrationRepository {
    return this.singleton('integrationRepo', () => new PrismaIntegrationRepository(this.prisma))
  }

  get alertRepo(): PrismaAlertRepository {
    return this.singleton('alertRepo', () => new PrismaAlertRepository(this.prisma))
  }

  get departmentRepo(): PrismaDepartmentRepository {
    return this.singleton('departmentRepo', () => new PrismaDepartmentRepository(this.prisma))
  }

  // Utilities
  get encryptionService(): EncryptionService {
    return this.singleton('encryptionService', () => new EncryptionService())
  }

  // Services
  get employeeService(): EmployeeService {
    return this.singleton('employeeService', () => new EmployeeService(this.employeeRepo, this.logger))
  }

  get userService(): UserService {
    return this.singleton('userService', () => new UserService(this.userRepo, this.logger))
  }

  get organizationService(): OrganizationService {
    return this.singleton('organizationService', () => new OrganizationService(this.organizationRepo, this.organizationMemberRepo, this.logger))
  }

  get alertService(): AlertService {
    return this.singleton('alertService', () => new AlertService({
      alertRepository: this.alertRepo,
      employeeRepository: this.employeeRepo,
    }))
  }

  get departmentService(): DepartmentService {
    return this.singleton('departmentService', () => new DepartmentService({
      departmentRepository: this.departmentRepo,
    }))
  }

  // Note: IntegrationService and DirectorySyncService require DirectoryProvider
  // which is created at runtime based on the integration type
  // These should be instantiated in the route handlers or background jobs

  private singleton<T>(key: string, factory: () => T): T {
    if (!this.instances.has(key)) {
      this.instances.set(key, factory())
    }
    return this.instances.get(key) as T
  }

  /**
   * Clear all cached instances (useful for testing)
   */
  clear(): void {
    this.instances.clear()
  }
}

let container: Container | null = null

export function getContainer(): Container {
  if (!container) {
    container = new Container()
  }
  return container
}

/**
 * Set the global container (useful for testing)
 */
export function setContainer(newContainer: Container): void {
  container = newContainer
}

/**
 * Reset the global container (useful for testing)
 */
export function resetContainer(): void {
  container = null
}
