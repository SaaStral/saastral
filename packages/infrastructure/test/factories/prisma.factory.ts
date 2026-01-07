import { faker } from '@faker-js/faker'
import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'

/**
 * Test data factory for creating database records with realistic fake data
 */
export class PrismaFactory {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a user
   */
  async createUser(data?: Partial<Prisma.UserCreateInput>) {
    return await this.prisma.user.create({
      data: {
        id: data?.id || faker.string.uuid(),
        email: data?.email || faker.internet.email(),
        name: data?.name || faker.person.fullName(),
        emailVerified: data?.emailVerified ?? false,
        image: data?.image || null,
        createdAt: data?.createdAt || new Date(),
        updatedAt: data?.updatedAt || new Date(),
        ...data,
      },
    })
  }

  /**
   * Create an organization
   */
  async createOrganization(data?: Partial<Prisma.OrganizationCreateInput>) {
    return await this.prisma.organization.create({
      data: {
        id: data?.id || faker.string.uuid(),
        name: data?.name || faker.company.name(),
        slug: data?.slug || faker.helpers.slugify(faker.company.name()).toLowerCase(),
        logo: data?.logo || null,
        createdAt: data?.createdAt || new Date(),
        updatedAt: data?.updatedAt || new Date(),
        ...data,
      },
    })
  }

  /**
   * Create an organization member
   */
  async createOrganizationMember(
    userId: string,
    organizationId: string,
    role: 'owner' | 'admin' | 'member' = 'member',
    data?: Partial<Prisma.OrganizationMemberCreateInput>
  ) {
    return await this.prisma.organizationMember.create({
      data: {
        id: data?.id || faker.string.uuid(),
        userId,
        organizationId,
        role,
        createdAt: data?.createdAt || new Date(),
        updatedAt: data?.updatedAt || new Date(),
        ...data,
      },
    })
  }

  /**
   * Create an employee
   */
  async createEmployee(organizationId: string, data?: Partial<Prisma.EmployeeCreateInput>) {
    return await this.prisma.employee.create({
      data: {
        id: data?.id || faker.string.uuid(),
        organizationId,
        name: data?.name || faker.person.fullName(),
        email: data?.email || faker.internet.email(),
        status: data?.status || 'active',
        title: data?.title,
        phone: data?.phone,
        avatarUrl: data?.avatarUrl,
        departmentId: data?.departmentId,
        managerId: data?.managerId,
        hiredAt: data?.hiredAt,
        offboardedAt: data?.offboardedAt,
        externalId: data?.externalId,
        externalProvider: data?.externalProvider,
        metadata: data?.metadata || {},
        createdAt: data?.createdAt || new Date(),
        updatedAt: data?.updatedAt || new Date(),
        ...data,
      },
    })
  }

  /**
   * Create a department
   */
  async createDepartment(organizationId: string, data?: Partial<Prisma.DepartmentCreateInput>) {
    return await this.prisma.department.create({
      data: {
        id: data?.id || faker.string.uuid(),
        organizationId,
        name: data?.name || faker.commerce.department(),
        description: data?.description,
        parentId: data?.parentId,
        externalId: data?.externalId,
        externalProvider: data?.externalProvider,
        metadata: data?.metadata || {},
        createdAt: data?.createdAt || new Date(),
        updatedAt: data?.updatedAt || new Date(),
        ...data,
      },
    })
  }

  /**
   * Create an integration
   */
  async createIntegration(organizationId: string, data?: Partial<Prisma.IntegrationCreateInput>) {
    return await this.prisma.integration.create({
      data: {
        id: data?.id || faker.string.uuid(),
        organizationId,
        provider: data?.provider || 'google_workspace',
        config: data?.config || {},
        status: data?.status || 'active',
        lastSyncAt: data?.lastSyncAt,
        lastSyncStatus: data?.lastSyncStatus,
        lastSyncError: data?.lastSyncError,
        createdAt: data?.createdAt || new Date(),
        updatedAt: data?.updatedAt || new Date(),
        ...data,
      },
    })
  }

  /**
   * Create a subscription
   */
  async createSubscription(organizationId: string, data?: Partial<Prisma.SubscriptionCreateInput>) {
    return await this.prisma.subscription.create({
      data: {
        id: data?.id || faker.string.uuid(),
        organizationId,
        name: data?.name || faker.company.name() + ' Subscription',
        provider: data?.provider || faker.company.name(),
        category: data?.category,
        status: data?.status || 'active',
        billingCycle: data?.billingCycle || 'monthly',
        monthlyCostCents: data?.monthlyCostCents || faker.number.int({ min: 1000, max: 50000 }),
        currency: data?.currency || 'BRL',
        totalSeats: data?.totalSeats || faker.number.int({ min: 1, max: 100 }),
        usedSeats: data?.usedSeats || faker.number.int({ min: 0, max: 50 }),
        nextRenewalAt: data?.nextRenewalAt || faker.date.future(),
        metadata: data?.metadata || {},
        createdAt: data?.createdAt || new Date(),
        updatedAt: data?.updatedAt || new Date(),
        ...data,
      },
    })
  }

  /**
   * Create a subscription user (link between employee and subscription)
   */
  async createSubscriptionUser(
    employeeId: string,
    subscriptionId: string,
    data?: Partial<Prisma.SubscriptionUserCreateInput>
  ) {
    return await this.prisma.subscriptionUser.create({
      data: {
        id: data?.id || faker.string.uuid(),
        employeeId,
        subscriptionId,
        status: data?.status || 'active',
        lastUsedAt: data?.lastUsedAt,
        metadata: data?.metadata || {},
        createdAt: data?.createdAt || new Date(),
        updatedAt: data?.updatedAt || new Date(),
        ...data,
      },
    })
  }

  /**
   * Create an alert
   */
  async createAlert(organizationId: string, data?: Partial<Prisma.AlertCreateInput>) {
    return await this.prisma.alert.create({
      data: {
        id: data?.id || faker.string.uuid(),
        organizationId,
        type: data?.type || 'offboarding',
        severity: data?.severity || 'medium',
        status: data?.status || 'pending',
        title: data?.title || faker.lorem.sentence(),
        description: data?.description,
        employeeId: data?.employeeId,
        subscriptionId: data?.subscriptionId,
        alertKey: data?.alertKey,
        potentialSavingsCents: data?.potentialSavingsCents,
        metadata: data?.metadata || {},
        snoozedUntil: data?.snoozedUntil,
        createdAt: data?.createdAt || new Date(),
        updatedAt: data?.updatedAt || new Date(),
        ...data,
      },
    })
  }
}
