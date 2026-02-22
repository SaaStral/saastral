/**
 * Integration Tests for Subscription tRPC Router
 *
 * Tests API layer with real database, focusing on:
 * - Authentication (UNAUTHORIZED when not logged in)
 * - Authorization (FORBIDDEN when no org access)
 * - Input validation
 * - Business logic integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { PrismaClient } from '@saastral/database'
import { appRouter } from './index'
import { getPrismaClient } from '../../../test/db-setup'
import type { Context } from '../trpc'
import { Container, setContainer, resetContainer } from '../../container'

describe('Subscription Router', () => {
  let prisma: PrismaClient
  let container: Container
  let userId: string
  let otherUserId: string
  let orgId: string
  let otherOrgId: string

  /**
   * Create a caller with the given context
   */
  function createCaller(context: Context) {
    return appRouter.createCaller(context)
  }

  beforeEach(async () => {
    prisma = getPrismaClient()

    // Create container with test Prisma client and set it as global
    container = new Container(prisma)
    setContainer(container)

    // Create test users
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    userId = user.id

    const otherUser = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Other User',
        email: `other-${Date.now()}@example.com`,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    otherUserId = otherUser.id

    // Create test organizations
    const org = await prisma.organization.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Test Organization',
        slug: `test-org-${Date.now()}`,
        plan: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    orgId = org.id

    const otherOrg = await prisma.organization.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Other Organization',
        slug: `other-org-${Date.now()}`,
        plan: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    otherOrgId = otherOrg.id

    // Create organization memberships
    await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId,
        role: 'admin',
        acceptedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    await prisma.organizationMember.create({
      data: {
        organizationId: otherOrgId,
        userId: otherUserId,
        role: 'admin',
        acceptedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  })

  afterEach(() => {
    resetContainer()
  })

  describe('getKPIs', () => {
    it('should return UNAUTHORIZED when not authenticated', async () => {
      const caller = createCaller({})

      await expect(caller.subscription.getKPIs({ organizationId: orgId })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    })

    it('should return FORBIDDEN when user does not have access to organization', async () => {
      const caller = createCaller({ userId })

      await expect(
        caller.subscription.getKPIs({ organizationId: otherOrgId })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })

    it('should return KPIs for authenticated user with access', async () => {
      const caller = createCaller({ userId })

      const result = await caller.subscription.getKPIs({ organizationId: orgId })

      expect(result).toHaveProperty('totalSubscriptions')
      expect(result).toHaveProperty('totalMonthlyCost')
      expect(result).toHaveProperty('totalAnnualValue')
      expect(result.totalSubscriptions).toBe(0)
    })
  })

  describe('list', () => {
    it('should return UNAUTHORIZED when not authenticated', async () => {
      const caller = createCaller({})

      await expect(
        caller.subscription.list({ organizationId: orgId, page: 1, pageSize: 10 })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    })

    it('should return FORBIDDEN when user does not have access to organization', async () => {
      const caller = createCaller({ userId })

      await expect(
        caller.subscription.list({ organizationId: otherOrgId, page: 1, pageSize: 10 })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })

    it('should return paginated list for authenticated user', async () => {
      const caller = createCaller({ userId })

      const result = await caller.subscription.list({
        organizationId: orgId,
        page: 1,
        pageSize: 10,
      })

      expect(result).toHaveProperty('subscriptions')
      expect(result).toHaveProperty('pagination')
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.pageSize).toBe(10)
    })

    it('should filter by status', async () => {
      const caller = createCaller({ userId })

      const result = await caller.subscription.list({
        organizationId: orgId,
        status: 'active',
        page: 1,
        pageSize: 10,
      })

      expect(result.subscriptions).toBeInstanceOf(Array)
    })
  })

  describe('create', () => {
    it('should return UNAUTHORIZED when not authenticated', async () => {
      const caller = createCaller({})

      await expect(
        caller.subscription.create({
          organizationId: orgId,
          name: 'Slack',
          category: 'communication',
          billingCycle: 'monthly',
          pricingModel: 'per_seat',
          totalMonthlyCost: 50000,
          startDate: new Date().toISOString(),
          renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    })

    it('should return FORBIDDEN when user does not have access to organization', async () => {
      const caller = createCaller({ userId })

      await expect(
        caller.subscription.create({
          organizationId: otherOrgId,
          name: 'Slack',
          category: 'communication',
          billingCycle: 'monthly',
          pricingModel: 'per_seat',
          totalMonthlyCost: 50000,
          startDate: new Date().toISOString(),
          renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })

    it('should create subscription for authenticated user with access', async () => {
      const caller = createCaller({ userId })

      const result = await caller.subscription.create({
        organizationId: orgId,
        name: 'Slack',
        category: 'communication',
        billingCycle: 'monthly',
        pricingModel: 'per_seat',
        totalMonthlyCost: 50000,
        startDate: new Date().toISOString(),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        totalSeats: 10,
        autoRenew: true,
      })

      expect(result).toHaveProperty('id')
      expect(result.name).toBe('Slack')
      expect(result.category).toBe('communication')
    })
  })

  describe('update', () => {
    let subscriptionId: string

    beforeEach(async () => {
      const caller = createCaller({ userId })
      const created = await caller.subscription.create({
        organizationId: orgId,
        name: 'Slack',
        category: 'communication',
        billingCycle: 'monthly',
        pricingModel: 'per_seat',
        totalMonthlyCost: 50000,
        startDate: new Date().toISOString(),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      subscriptionId = created.id
    })

    it('should update subscription for authenticated user with access', async () => {
      const caller = createCaller({ userId })

      const result = await caller.subscription.update({
        id: subscriptionId,
        organizationId: orgId,
        name: 'Slack Enterprise',
        totalMonthlyCost: 75000,
      })

      expect(result.name).toBe('Slack Enterprise')
    })

    it('should return FORBIDDEN when user does not have access to organization', async () => {
      const caller = createCaller({ userId })

      await expect(
        caller.subscription.update({
          id: subscriptionId,
          organizationId: otherOrgId,
          name: 'Slack Enterprise',
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })
  })

  describe('cancel', () => {
    let subscriptionId: string

    beforeEach(async () => {
      const caller = createCaller({ userId })
      const created = await caller.subscription.create({
        organizationId: orgId,
        name: 'Slack',
        category: 'communication',
        billingCycle: 'monthly',
        pricingModel: 'per_seat',
        totalMonthlyCost: 50000,
        startDate: new Date().toISOString(),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      subscriptionId = created.id
    })

    it('should cancel subscription for authenticated user with access', async () => {
      const caller = createCaller({ userId })

      const result = await caller.subscription.cancel({
        id: subscriptionId,
        organizationId: orgId,
      })

      expect(result.status).toBe('cancelled')
    })

    it('should return UNAUTHORIZED when not authenticated', async () => {
      const caller = createCaller({})

      await expect(
        caller.subscription.cancel({
          id: subscriptionId,
          organizationId: orgId,
        })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    })
  })

  describe('getById', () => {
    let subscriptionId: string

    beforeEach(async () => {
      const caller = createCaller({ userId })
      const created = await caller.subscription.create({
        organizationId: orgId,
        name: 'GitHub',
        category: 'development',
        billingCycle: 'annual',
        pricingModel: 'per_seat',
        totalMonthlyCost: 4000,
        startDate: new Date().toISOString(),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      subscriptionId = created.id
    })

    it('should return subscription for authenticated user with access', async () => {
      const caller = createCaller({ userId })

      const result = await caller.subscription.getById({
        id: subscriptionId,
        organizationId: orgId,
      })

      expect(result.id).toBe(subscriptionId)
      expect(result.name).toBe('GitHub')
    })

    it('should return NOT_FOUND when subscription does not exist', async () => {
      const caller = createCaller({ userId })

      await expect(
        caller.subscription.getById({
          id: '00000000-0000-0000-0000-000000000000', // Valid UUID that doesn't exist
          organizationId: orgId,
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('should return FORBIDDEN when user does not have access to organization', async () => {
      const caller = createCaller({ userId })

      await expect(
        caller.subscription.getById({
          id: subscriptionId,
          organizationId: otherOrgId,
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })
  })

  describe('getCategoryBreakdown', () => {
    it('should return category breakdown for authenticated user', async () => {
      const caller = createCaller({ userId })

      // Create some subscriptions
      await caller.subscription.create({
        organizationId: orgId,
        name: 'Slack',
        category: 'communication',
        billingCycle: 'monthly',
        pricingModel: 'per_seat',
        totalMonthlyCost: 50000,
        startDate: new Date().toISOString(),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })

      await caller.subscription.create({
        organizationId: orgId,
        name: 'GitHub',
        category: 'development',
        billingCycle: 'annual',
        pricingModel: 'per_seat',
        totalMonthlyCost: 4000,
        startDate: new Date().toISOString(),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const result = await caller.subscription.getCategoryBreakdown({ organizationId: orgId })

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)

      const commBreakdown = result.find(b => b.category === 'communication')
      expect(commBreakdown).toBeDefined()
      expect(commBreakdown!.count).toBe(1)
    })
  })

  describe('getUpcomingRenewals', () => {
    it('should return upcoming renewals for authenticated user', async () => {
      const caller = createCaller({ userId })

      // Create subscription with upcoming renewal
      await caller.subscription.create({
        organizationId: orgId,
        name: 'Slack',
        category: 'communication',
        billingCycle: 'monthly',
        pricingModel: 'per_seat',
        totalMonthlyCost: 50000,
        startDate: new Date().toISOString(),
        renewalDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
      })

      const result = await caller.subscription.getUpcomingRenewals({
        organizationId: orgId,
        withinDays: 30,
      })

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBe(1)
      expect(result[0]!.name).toBe('Slack')
    })
  })
})
