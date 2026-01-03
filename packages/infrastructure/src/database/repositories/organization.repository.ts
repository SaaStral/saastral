import { PrismaClient } from '@prisma/client'
import {
  OrganizationRepository,
  OrganizationData,
  CreateOrganizationData,
  UpdateOrganizationData,
  OrganizationSettings,
} from '@saastral/core'

/**
 * Prisma implementation of OrganizationRepository
 */
export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<OrganizationData | null> {
    const org = await this.prisma.organization.findUnique({
      where: { id },
    })

    if (!org) return null

    return this.toDomain(org)
  }

  async findBySlug(slug: string): Promise<OrganizationData | null> {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
    })

    if (!org) return null

    return this.toDomain(org)
  }

  async create(input: CreateOrganizationData): Promise<OrganizationData> {
    const org = await this.prisma.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        plan: input.plan,
        planStartedAt: input.planStartedAt,
        settings: input.settings as any, // Prisma Json type
      },
    })

    return this.toDomain(org)
  }

  async update(
    id: string,
    input: UpdateOrganizationData
  ): Promise<OrganizationData> {
    const org = await this.prisma.organization.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.slug && { slug: input.slug }),
        ...(input.plan && { plan: input.plan }),
        ...(input.planStartedAt && { planStartedAt: input.planStartedAt }),
        ...(input.settings && { settings: input.settings as any }),
      },
    })

    return this.toDomain(org)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  /**
   * Map Prisma organization to domain OrganizationData
   */
  private toDomain(org: {
    id: string
    name: string
    slug: string
    plan: string
    planStartedAt: Date | null
    settings: any
    createdAt: Date
    updatedAt: Date
  }): OrganizationData {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      planStartedAt: org.planStartedAt,
      settings: org.settings as OrganizationSettings,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    }
  }
}
