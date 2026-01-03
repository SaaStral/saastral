import { PrismaClient } from '@prisma/client'
import { PinoLogger } from './logger/pino.adapter'
import { PrismaEmployeeRepository } from './database/repositories/employee.repository'
import { PrismaUserRepository } from './database/repositories/user.repository'
import { PrismaOrganizationRepository } from './database/repositories/organization.repository'
import { PrismaOrganizationMemberRepository } from './database/repositories/organization-member.repository'
import { EmployeeService, UserService, OrganizationService } from '@saastral/core'
import { prisma } from './database/client'

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
 * Reset the global container (useful for testing)
 */
export function resetContainer(): void {
  container = null
}
