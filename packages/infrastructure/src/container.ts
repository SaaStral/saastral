import { PrismaClient } from '@prisma/client'
import { prisma } from './database/prisma/client'
import { PinoLogger } from './logger/pino.adapter'

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

  // Repositories will be added as they are implemented
  // get employeeRepo(): PrismaEmployeeRepository { ... }
  // get subscriptionRepo(): PrismaSubscriptionRepository { ... }
  // etc.

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
