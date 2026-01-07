import type { PrismaClient } from '@saastral/database'
import {
  OrganizationMemberRepository,
  OrganizationMemberData,
  CreateOrganizationMemberData,
  OrganizationRole,
  UserOrganizationData,
} from '@saastral/core'

/**
 * Prisma implementation of OrganizationMemberRepository
 */
export class PrismaOrganizationMemberRepository
  implements OrganizationMemberRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    input: CreateOrganizationMemberData
  ): Promise<OrganizationMemberData> {
    const member = await this.prisma.organizationMember.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        role: input.role,
        acceptedAt: input.acceptedAt ?? null,
      },
    })

    return this.toDomain(member)
  }

  async findByOrganizationAndUser(
    organizationId: string,
    userId: string
  ): Promise<OrganizationMemberData | null> {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    })

    if (!member) return null

    return this.toDomain(member)
  }

  async listByOrganization(
    organizationId: string
  ): Promise<OrganizationMemberData[]> {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
    })

    return members.map((m) => this.toDomain(m))
  }

  async updateRole(
    organizationId: string,
    userId: string,
    role: OrganizationRole
  ): Promise<OrganizationMemberData> {
    const member = await this.prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      data: { role },
    })

    return this.toDomain(member)
  }

  async remove(organizationId: string, userId: string): Promise<void> {
    await this.prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    })
  }

  async listOrganizationsByUser(userId: string): Promise<UserOrganizationData[]> {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role as OrganizationRole,
    }))
  }

  /**
   * Map Prisma organization member to domain OrganizationMemberData
   */
  private toDomain(member: {
    organizationId: string
    userId: string
    role: string
    acceptedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }): OrganizationMemberData {
    return {
      organizationId: member.organizationId,
      userId: member.userId,
      role: member.role as OrganizationRole,
      acceptedAt: member.acceptedAt,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    }
  }
}
