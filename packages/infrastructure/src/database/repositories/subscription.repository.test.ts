import { describe, it, expect, beforeEach } from 'vitest'
import type { PrismaClient } from '@saastral/database'
import { PrismaSubscriptionRepository } from './subscription.repository'
import { Subscription } from '@saastral/core'
import { getPrismaClient } from '../../../test/db-setup'

describe('PrismaSubscriptionRepository', () => {
  let prisma: PrismaClient
  let repository: PrismaSubscriptionRepository
  let orgId: string

  beforeEach(async () => {
    prisma = getPrismaClient()
    repository = new PrismaSubscriptionRepository(prisma)

    // Create test organization
    const org = await prisma.organization.create({
      data: {
        id: `org-${Date.now()}-${Math.random()}`,
        name: 'Test Organization',
        slug: `test-org-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    orgId = org.id
  })

  describe('save', () => {
    it('should create new subscription in database', async () => {
      const subscription = Subscription.create({
        organizationId: orgId,
        name: 'Slack',
        category: 'communication',
        billingCycle: 'monthly',
        pricingModel: 'per_seat',
        currency: 'BRL',
        totalMonthlyCost: 50000n,
        totalSeats: 10,
        seatsUnlimited: false,
        autoRenew: true,
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2025-01-01'),
        tags: [],
        reminderDays: [30, 15, 7],
      })

      const saved = await repository.save(subscription)

      expect(saved.id).toBe(subscription.id)
      expect(saved.name).toBe('Slack')
      expect(saved.category).toBe('communication')
      expect(saved.totalMonthlyCost).toBe(50000n)

      // Verify in database
      const dbRecord = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      })
      expect(dbRecord).not.toBeNull()
      expect(dbRecord!.name).toBe('Slack')
      expect(dbRecord!.totalMonthlyCost).toBe(50000n)
    })

    it('should update existing subscription (upsert)', async () => {
      const subscription = Subscription.create({
        organizationId: orgId,
        name: 'Slack',
        category: 'communication',
        billingCycle: 'monthly',
        pricingModel: 'per_seat',
        currency: 'BRL',
        totalMonthlyCost: 50000n,
        totalSeats: 10,
        seatsUnlimited: false,
        autoRenew: true,
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2025-01-01'),
        tags: [],
        reminderDays: [30, 15, 7],
      })

      await repository.save(subscription)

      // Update the subscription
      subscription.updateCost(75000n)
      const updated = await repository.save(subscription)

      expect(updated.totalMonthlyCost).toBe(75000n)

      // Verify in database
      const dbRecord = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      })
      expect(dbRecord!.totalMonthlyCost).toBe(75000n)
    })
  })

  describe('findById', () => {
    it('should return subscription when found', async () => {
      const subscription = Subscription.create({
        organizationId: orgId,
        name: 'GitHub',
        category: 'development',
        billingCycle: 'annual',
        pricingModel: 'per_seat',
        currency: 'USD',
        totalMonthlyCost: 4000n,
        totalSeats: 5,
        seatsUnlimited: false,
        autoRenew: true,
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2025-01-01'),
        tags: ['dev', 'source-control'],
        reminderDays: [30, 15, 7],
      })

      await repository.save(subscription)

      const found = await repository.findById(subscription.id, orgId)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(subscription.id)
      expect(found!.name).toBe('GitHub')
      expect(found!.category).toBe('development')
    })

    it('should return null when subscription not found', async () => {
      const found = await repository.findById('non-existent-id', orgId)
      expect(found).toBeNull()
    })

    it('should return null when subscription belongs to different organization', async () => {
      const subscription = Subscription.create({
        organizationId: orgId,
        name: 'Figma',
        category: 'design',
        billingCycle: 'monthly',
        pricingModel: 'per_seat',
        currency: 'BRL',
        totalMonthlyCost: 12000n,
        totalSeats: 3,
        seatsUnlimited: false,
        autoRenew: true,
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2025-01-01'),
        tags: [],
        reminderDays: [30, 15, 7],
      })

      await repository.save(subscription)

      const found = await repository.findById(subscription.id, 'other-org-id')
      expect(found).toBeNull()
    })
  })

  describe('findBySsoAppId', () => {
    it('should return subscription by SSO app ID', async () => {
      const subscription = Subscription.create({
        organizationId: orgId,
        name: 'Salesforce',
        category: 'sales_marketing',
        billingCycle: 'annual',
        pricingModel: 'per_seat',
        currency: 'USD',
        totalMonthlyCost: 150000n,
        totalSeats: 20,
        seatsUnlimited: false,
        autoRenew: true,
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2025-01-01'),
        tags: [],
        reminderDays: [30, 15, 7],
        ssoAppId: 'salesforce-sso-123',
      })

      await repository.save(subscription)

      const found = await repository.findBySsoAppId('salesforce-sso-123', orgId)

      expect(found).not.toBeNull()
      expect(found!.ssoAppId).toBe('salesforce-sso-123')
    })

    it('should return null when SSO app ID not found', async () => {
      const found = await repository.findBySsoAppId('non-existent-sso-id', orgId)
      expect(found).toBeNull()
    })
  })

  describe('list', () => {
    beforeEach(async () => {
      // Create several subscriptions for testing
      const subscriptions = [
        Subscription.create({
          organizationId: orgId,
          name: 'Slack',
          category: 'communication',
          billingCycle: 'monthly',
          pricingModel: 'per_seat',
          currency: 'BRL',
          totalMonthlyCost: 50000n,
          totalSeats: 10,
          seatsUnlimited: false,
          autoRenew: true,
          startDate: new Date('2024-01-01'),
          renewalDate: new Date('2025-01-01'),
          tags: [],
          reminderDays: [30, 15, 7],
        }),
        Subscription.create({
          organizationId: orgId,
          name: 'GitHub',
          category: 'development',
          billingCycle: 'annual',
          pricingModel: 'per_seat',
          currency: 'USD',
          totalMonthlyCost: 4000n,
          totalSeats: 5,
          seatsUnlimited: false,
          autoRenew: true,
          startDate: new Date('2024-01-01'),
          renewalDate: new Date('2025-01-01'),
          tags: [],
          reminderDays: [30, 15, 7],
        }),
        Subscription.create({
          organizationId: orgId,
          name: 'Figma',
          category: 'design',
          billingCycle: 'monthly',
          pricingModel: 'per_seat',
          currency: 'BRL',
          totalMonthlyCost: 12000n,
          totalSeats: 3,
          seatsUnlimited: false,
          autoRenew: true,
          startDate: new Date('2024-01-01'),
          renewalDate: new Date('2025-01-01'),
          tags: [],
          reminderDays: [30, 15, 7],
          status: 'trial',
        }),
      ]

      for (const sub of subscriptions) {
        await repository.save(sub)
      }
    })

    it('should list all subscriptions without filters', async () => {
      const result = await repository.list(orgId, {}, { page: 1, pageSize: 10 })

      expect(result.subscriptions).toHaveLength(3)
      expect(result.totalCount).toBe(3)
    })

    it('should filter by status', async () => {
      const result = await repository.list(
        orgId,
        { status: 'active' },
        { page: 1, pageSize: 10 }
      )

      expect(result.subscriptions).toHaveLength(2)
      expect(result.subscriptions.every(s => s.status === 'active')).toBe(true)
    })

    it('should filter by category', async () => {
      const result = await repository.list(
        orgId,
        { category: 'development' },
        { page: 1, pageSize: 10 }
      )

      expect(result.subscriptions).toHaveLength(1)
      expect(result.subscriptions[0]!.name).toBe('GitHub')
    })

    it('should filter by search term', async () => {
      const result = await repository.list(
        orgId,
        { search: 'slack' },
        { page: 1, pageSize: 10 }
      )

      expect(result.subscriptions).toHaveLength(1)
      expect(result.subscriptions[0]!.name).toBe('Slack')
    })

    it('should paginate results', async () => {
      const page1 = await repository.list(orgId, {}, { page: 1, pageSize: 2 })
      const page2 = await repository.list(orgId, {}, { page: 2, pageSize: 2 })

      expect(page1.subscriptions).toHaveLength(2)
      expect(page2.subscriptions).toHaveLength(1)
      expect(page1.totalCount).toBe(3)
    })
  })

  describe('countByStatus', () => {
    beforeEach(async () => {
      const activeSubscription = Subscription.create({
        organizationId: orgId,
        name: 'Slack',
        category: 'communication',
        billingCycle: 'monthly',
        pricingModel: 'per_seat',
        currency: 'BRL',
        totalMonthlyCost: 50000n,
        totalSeats: 10,
        seatsUnlimited: false,
        autoRenew: true,
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2025-01-01'),
        tags: [],
        reminderDays: [30, 15, 7],
      })

      const trialSubscription = Subscription.create({
        organizationId: orgId,
        name: 'Figma',
        category: 'design',
        billingCycle: 'monthly',
        pricingModel: 'per_seat',
        currency: 'BRL',
        totalMonthlyCost: 12000n,
        totalSeats: 3,
        seatsUnlimited: false,
        autoRenew: true,
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2025-01-01'),
        tags: [],
        reminderDays: [30, 15, 7],
        status: 'trial',
      })

      await repository.save(activeSubscription)
      await repository.save(trialSubscription)
    })

    it('should count all subscriptions when no status specified', async () => {
      const count = await repository.countByStatus(orgId)
      expect(count).toBe(2)
    })

    it('should count subscriptions by status', async () => {
      const activeCount = await repository.countByStatus(orgId, 'active')
      const trialCount = await repository.countByStatus(orgId, 'trial')

      expect(activeCount).toBe(1)
      expect(trialCount).toBe(1)
    })
  })

  describe('getTotalMonthlyCost', () => {
    it('should return total monthly cost of active subscriptions', async () => {
      const subscriptions = [
        Subscription.create({
          organizationId: orgId,
          name: 'Slack',
          category: 'communication',
          billingCycle: 'monthly',
          pricingModel: 'per_seat',
          currency: 'BRL',
          totalMonthlyCost: 50000n,
          totalSeats: 10,
          seatsUnlimited: false,
          autoRenew: true,
          startDate: new Date('2024-01-01'),
          renewalDate: new Date('2025-01-01'),
          tags: [],
          reminderDays: [30, 15, 7],
        }),
        Subscription.create({
          organizationId: orgId,
          name: 'GitHub',
          category: 'development',
          billingCycle: 'annual',
          pricingModel: 'per_seat',
          currency: 'USD',
          totalMonthlyCost: 4000n,
          totalSeats: 5,
          seatsUnlimited: false,
          autoRenew: true,
          startDate: new Date('2024-01-01'),
          renewalDate: new Date('2025-01-01'),
          tags: [],
          reminderDays: [30, 15, 7],
        }),
      ]

      for (const sub of subscriptions) {
        await repository.save(sub)
      }

      const total = await repository.getTotalMonthlyCost(orgId)
      expect(total).toBe(54000n)
    })

    it('should return 0 when no active subscriptions', async () => {
      const total = await repository.getTotalMonthlyCost(orgId)
      expect(total).toBe(0n)
    })
  })

  describe('getSeatsStats', () => {
    it('should return total and used seats', async () => {
      const subscription = Subscription.create({
        organizationId: orgId,
        name: 'Slack',
        category: 'communication',
        billingCycle: 'monthly',
        pricingModel: 'per_seat',
        currency: 'BRL',
        totalMonthlyCost: 50000n,
        totalSeats: 10,
        seatsUnlimited: false,
        autoRenew: true,
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2025-01-01'),
        tags: [],
        reminderDays: [30, 15, 7],
      })

      subscription.incrementUsedSeats(5)
      await repository.save(subscription)

      const stats = await repository.getSeatsStats(orgId)
      expect(stats.total).toBe(10)
      expect(stats.used).toBe(5)
    })
  })

  describe('delete', () => {
    it('should soft delete subscription', async () => {
      const subscription = Subscription.create({
        organizationId: orgId,
        name: 'Slack',
        category: 'communication',
        billingCycle: 'monthly',
        pricingModel: 'per_seat',
        currency: 'BRL',
        totalMonthlyCost: 50000n,
        totalSeats: 10,
        seatsUnlimited: false,
        autoRenew: true,
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2025-01-01'),
        tags: [],
        reminderDays: [30, 15, 7],
      })

      await repository.save(subscription)
      await repository.delete(subscription.id, orgId)

      // Should not be found via repository (respects soft delete)
      const found = await repository.findById(subscription.id, orgId)
      expect(found).toBeNull()

      // But should still exist in database with deletedAt set
      const dbRecord = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      })
      expect(dbRecord).not.toBeNull()
      expect(dbRecord!.deletedAt).not.toBeNull()
    })
  })

  describe('getCategoryBreakdown', () => {
    it('should return breakdown by category', async () => {
      const subscriptions = [
        Subscription.create({
          organizationId: orgId,
          name: 'Slack',
          category: 'communication',
          billingCycle: 'monthly',
          pricingModel: 'per_seat',
          currency: 'BRL',
          totalMonthlyCost: 50000n,
          totalSeats: 10,
          seatsUnlimited: false,
          autoRenew: true,
          startDate: new Date('2024-01-01'),
          renewalDate: new Date('2025-01-01'),
          tags: [],
          reminderDays: [30, 15, 7],
        }),
        Subscription.create({
          organizationId: orgId,
          name: 'Zoom',
          category: 'communication',
          billingCycle: 'monthly',
          pricingModel: 'per_seat',
          currency: 'BRL',
          totalMonthlyCost: 30000n,
          totalSeats: 10,
          seatsUnlimited: false,
          autoRenew: true,
          startDate: new Date('2024-01-01'),
          renewalDate: new Date('2025-01-01'),
          tags: [],
          reminderDays: [30, 15, 7],
        }),
        Subscription.create({
          organizationId: orgId,
          name: 'GitHub',
          category: 'development',
          billingCycle: 'annual',
          pricingModel: 'per_seat',
          currency: 'USD',
          totalMonthlyCost: 20000n,
          totalSeats: 5,
          seatsUnlimited: false,
          autoRenew: true,
          startDate: new Date('2024-01-01'),
          renewalDate: new Date('2025-01-01'),
          tags: [],
          reminderDays: [30, 15, 7],
        }),
      ]

      for (const sub of subscriptions) {
        await repository.save(sub)
      }

      const breakdown = await repository.getCategoryBreakdown(orgId)

      expect(breakdown).toHaveLength(2)

      const commBreakdown = breakdown.find(b => b.category === 'communication')
      expect(commBreakdown).toBeDefined()
      expect(commBreakdown!.count).toBe(2)
      expect(commBreakdown!.monthlyCost).toBe(80000)

      const devBreakdown = breakdown.find(b => b.category === 'development')
      expect(devBreakdown).toBeDefined()
      expect(devBreakdown!.count).toBe(1)
      expect(devBreakdown!.monthlyCost).toBe(20000)
    })
  })
})
