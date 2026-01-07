import type { PrismaClient } from '@saastral/database'
import { UserRepository, UserData } from '@saastral/core'

/**
 * Prisma implementation of UserRepository
 */
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async hasUsers(): Promise<boolean> {
    const count = await this.prisma.user.count()
    return count > 0
  }

  async count(): Promise<number> {
    return await this.prisma.user.count()
  }

  async findById(id: string): Promise<UserData | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    if (!user) return null

    return this.toDomain(user)
  }

  async findByEmail(email: string): Promise<UserData | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    if (!user) return null

    return this.toDomain(user)
  }

  /**
   * Map Prisma user to domain UserData
   */
  private toDomain(user: {
    id: string
    email: string
    name: string
    emailVerified: boolean
    createdAt: Date
    updatedAt: Date
  }): UserData {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
