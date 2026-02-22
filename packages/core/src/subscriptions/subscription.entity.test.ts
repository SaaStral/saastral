import { describe, it, expect } from 'vitest'
import { Subscription } from './subscription.entity'
import { SubscriptionFactory } from '../../test/factories/subscription.factory'
import {
  SubscriptionAlreadyCancelledError,
  SubscriptionAlreadyExpiredError,
  InvalidSubscriptionStatusError,
  SeatLimitExceededError,
  InvalidSeatsConfigurationError,
} from './subscription.errors'

describe('Subscription Entity', () => {
  describe('create', () => {
    it('should create subscription with auto-generated ID and timestamps', () => {
      const subscription = SubscriptionFactory.create()

      expect(subscription.id).toBeDefined()
      expect(subscription.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
      expect(subscription.createdAt).toBeInstanceOf(Date)
      expect(subscription.updatedAt).toBeInstanceOf(Date)
    })

    it('should default to active status', () => {
      const subscription = SubscriptionFactory.create()

      expect(subscription.status).toBe('active')
      expect(subscription.isActive()).toBe(true)
    })

    it('should initialize with zero usedSeats', () => {
      const subscription = SubscriptionFactory.create()

      expect(subscription.usedSeats).toBe(0)
    })

    it('should initialize with empty metadata', () => {
      const subscription = SubscriptionFactory.create()

      expect(subscription.metadata).toEqual({})
    })

    it('should create with all required fields', () => {
      const startDate = new Date('2024-01-01')
      const renewalDate = new Date('2024-12-31')

      const subscription = Subscription.create({
        organizationId: 'org-123',
        name: 'Slack',
        category: 'communication',
        billingCycle: 'monthly',
        pricingModel: 'per_seat',
        currency: 'BRL',
        totalMonthlyCost: 50000n,
        totalSeats: 10,
        seatsUnlimited: false,
        startDate,
        renewalDate,
        tags: ['chat', 'collaboration'],
        autoRenew: true,
        reminderDays: [30, 15, 7],
      })

      expect(subscription.name).toBe('Slack')
      expect(subscription.category).toBe('communication')
      expect(subscription.billingCycle).toBe('monthly')
      expect(subscription.pricingModel).toBe('per_seat')
      expect(subscription.currency).toBe('BRL')
      expect(subscription.totalMonthlyCost).toBe(50000n)
      expect(subscription.totalSeats).toBe(10)
      expect(subscription.seatsUnlimited).toBe(false)
      expect(subscription.startDate).toEqual(startDate)
      expect(subscription.renewalDate).toEqual(renewalDate)
      expect(subscription.tags).toEqual(['chat', 'collaboration'])
      expect(subscription.autoRenew).toBe(true)
      expect(subscription.reminderDays).toEqual([30, 15, 7])
    })

    it('should create with optional fields', () => {
      const subscription = SubscriptionFactory.create({
        vendor: 'Salesforce',
        description: 'CRM platform',
        website: 'https://salesforce.com',
        logoUrl: 'https://salesforce.com/logo.png',
        contractType: 'enterprise',
        licenseType: 'named',
        paymentMethod: 'invoice',
        billingEmail: 'billing@company.com',
        costCenter: 'CC-001',
        budgetCode: 'BUD-2024',
        ownerId: 'emp-123',
        departmentId: 'dept-456',
        notes: 'Enterprise agreement',
      })

      expect(subscription.vendor).toBe('Salesforce')
      expect(subscription.description).toBe('CRM platform')
      expect(subscription.website).toBe('https://salesforce.com')
      expect(subscription.logoUrl).toBe('https://salesforce.com/logo.png')
      expect(subscription.contractType).toBe('enterprise')
      expect(subscription.licenseType).toBe('named')
      expect(subscription.paymentMethod).toBe('invoice')
      expect(subscription.billingEmail).toBe('billing@company.com')
      expect(subscription.costCenter).toBe('CC-001')
      expect(subscription.budgetCode).toBe('BUD-2024')
      expect(subscription.ownerId).toBe('emp-123')
      expect(subscription.departmentId).toBe('dept-456')
      expect(subscription.notes).toBe('Enterprise agreement')
    })
  })

  describe('reconstitute', () => {
    it('should reconstitute subscription from database props', () => {
      const props = {
        id: 'sub-123',
        organizationId: 'org-123',
        name: 'GitHub',
        category: 'development' as const,
        status: 'active' as const,
        billingCycle: 'monthly' as const,
        pricingModel: 'per_seat' as const,
        currency: 'BRL',
        totalMonthlyCost: 100000n,
        totalSeats: 20,
        usedSeats: 15,
        seatsUnlimited: false,
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2024-12-31'),
        tags: [],
        autoRenew: true,
        reminderDays: [30, 15, 7],
        metadata: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      }

      const subscription = Subscription.reconstitute(props)

      expect(subscription.id).toBe('sub-123')
      expect(subscription.name).toBe('GitHub')
      expect(subscription.status).toBe('active')
      expect(subscription.usedSeats).toBe(15)
      expect(subscription.createdAt).toEqual(props.createdAt)
      expect(subscription.updatedAt).toEqual(props.updatedAt)
    })
  })

  describe('status transitions', () => {
    describe('cancel', () => {
      it('should cancel active subscription', () => {
        const subscription = SubscriptionFactory.create()

        subscription.cancel()

        expect(subscription.status).toBe('cancelled')
        expect(subscription.isCancelled()).toBe(true)
      })

      it('should cancel trial subscription', () => {
        const subscription = SubscriptionFactory.createTrial()

        subscription.cancel()

        expect(subscription.status).toBe('cancelled')
      })

      it('should cancel suspended subscription', () => {
        const subscription = SubscriptionFactory.createSuspended()

        subscription.cancel()

        expect(subscription.status).toBe('cancelled')
      })

      it('should throw when already cancelled', () => {
        const subscription = SubscriptionFactory.createCancelled()

        expect(() => subscription.cancel()).toThrow(SubscriptionAlreadyCancelledError)
      })

      it('should throw when expired', () => {
        const subscription = SubscriptionFactory.createExpired()

        expect(() => subscription.cancel()).toThrow(SubscriptionAlreadyExpiredError)
      })

      it('should update updatedAt timestamp', () => {
        const subscription = SubscriptionFactory.create()
        const beforeCancel = new Date()

        subscription.cancel()

        expect(subscription.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCancel.getTime())
      })
    })

    describe('suspend', () => {
      it('should suspend active subscription', () => {
        const subscription = SubscriptionFactory.create()

        subscription.suspend()

        expect(subscription.status).toBe('suspended')
        expect(subscription.isSuspended()).toBe(true)
      })

      it('should suspend trial subscription', () => {
        const subscription = SubscriptionFactory.createTrial()

        subscription.suspend()

        expect(subscription.status).toBe('suspended')
      })

      it('should throw when already suspended', () => {
        const subscription = SubscriptionFactory.createSuspended()

        expect(() => subscription.suspend()).toThrow(InvalidSubscriptionStatusError)
      })

      it('should throw when cancelled', () => {
        const subscription = SubscriptionFactory.createCancelled()

        expect(() => subscription.suspend()).toThrow(InvalidSubscriptionStatusError)
      })

      it('should throw when expired', () => {
        const subscription = SubscriptionFactory.createExpired()

        expect(() => subscription.suspend()).toThrow(InvalidSubscriptionStatusError)
      })
    })

    describe('reactivate', () => {
      it('should reactivate suspended subscription', () => {
        const subscription = SubscriptionFactory.createSuspended()

        subscription.reactivate()

        expect(subscription.status).toBe('active')
        expect(subscription.isActive()).toBe(true)
      })

      it('should reactivate cancelled subscription', () => {
        const subscription = SubscriptionFactory.createCancelled()

        subscription.reactivate()

        expect(subscription.status).toBe('active')
      })

      it('should throw when already active', () => {
        const subscription = SubscriptionFactory.create()

        expect(() => subscription.reactivate()).toThrow(InvalidSubscriptionStatusError)
      })

      it('should throw when trial', () => {
        const subscription = SubscriptionFactory.createTrial()

        expect(() => subscription.reactivate()).toThrow(InvalidSubscriptionStatusError)
      })

      it('should throw when expired', () => {
        const subscription = SubscriptionFactory.createExpired()

        expect(() => subscription.reactivate()).toThrow(InvalidSubscriptionStatusError)
      })
    })

    describe('expire', () => {
      it('should expire active subscription', () => {
        const subscription = SubscriptionFactory.create()

        subscription.expire()

        expect(subscription.status).toBe('expired')
        expect(subscription.isExpired()).toBe(true)
      })

      it('should throw when already expired', () => {
        const subscription = SubscriptionFactory.createExpired()

        expect(() => subscription.expire()).toThrow(SubscriptionAlreadyExpiredError)
      })
    })

    describe('convertTrialToActive', () => {
      it('should convert trial to active', () => {
        const subscription = SubscriptionFactory.createTrial()

        subscription.convertTrialToActive()

        expect(subscription.status).toBe('active')
        expect(subscription.trialEndDate).toBeUndefined()
      })

      it('should throw when not trial', () => {
        const subscription = SubscriptionFactory.create()

        expect(() => subscription.convertTrialToActive()).toThrow(InvalidSubscriptionStatusError)
      })
    })
  })

  describe('seat management', () => {
    describe('incrementUsedSeats', () => {
      it('should increment used seats by default 1', () => {
        const subscription = SubscriptionFactory.create({ totalSeats: 10 })

        subscription.incrementUsedSeats()

        expect(subscription.usedSeats).toBe(1)
      })

      it('should increment used seats by specified count', () => {
        const subscription = SubscriptionFactory.create({ totalSeats: 10 })

        subscription.incrementUsedSeats(3)

        expect(subscription.usedSeats).toBe(3)
      }
      )

      it('should throw when exceeding seat limit', () => {
        const subscription = SubscriptionFactory.create({ totalSeats: 5 })

        expect(() => subscription.incrementUsedSeats(6)).toThrow(SeatLimitExceededError)
      })

      it('should allow increment up to limit', () => {
        const subscription = SubscriptionFactory.create({ totalSeats: 5 })

        subscription.incrementUsedSeats(5)

        expect(subscription.usedSeats).toBe(5)
      })

      it('should allow unlimited seats when seatsUnlimited is true', () => {
        const subscription = SubscriptionFactory.create({ seatsUnlimited: true })

        subscription.incrementUsedSeats(1000)

        expect(subscription.usedSeats).toBe(1000)
      })

      it('should update updatedAt timestamp', () => {
        const subscription = SubscriptionFactory.create({ totalSeats: 10 })
        const beforeIncrement = new Date()

        subscription.incrementUsedSeats()

        expect(subscription.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeIncrement.getTime())
      })
    })

    describe('decrementUsedSeats', () => {
      it('should decrement used seats by default 1', () => {
        const subscription = SubscriptionFactory.create()
        subscription.incrementUsedSeats(5)

        subscription.decrementUsedSeats()

        expect(subscription.usedSeats).toBe(4)
      })

      it('should decrement used seats by specified count', () => {
        const subscription = SubscriptionFactory.create()
        subscription.incrementUsedSeats(10)

        subscription.decrementUsedSeats(3)

        expect(subscription.usedSeats).toBe(7)
      })

      it('should not go below zero', () => {
        const subscription = SubscriptionFactory.create()
        subscription.incrementUsedSeats(2)

        subscription.decrementUsedSeats(5)

        expect(subscription.usedSeats).toBe(0)
      })
    })

    describe('updateSeats', () => {
      it('should update total seats', () => {
        const subscription = SubscriptionFactory.create({ totalSeats: 10 })

        subscription.updateSeats(20, false)

        expect(subscription.totalSeats).toBe(20)
        expect(subscription.seatsUnlimited).toBe(false)
      })

      it('should set seats unlimited', () => {
        const subscription = SubscriptionFactory.create({ totalSeats: 10 })

        subscription.updateSeats(undefined, true)

        expect(subscription.seatsUnlimited).toBe(true)
      })

      it('should throw when reducing below used seats', () => {
        const subscription = SubscriptionFactory.create({ totalSeats: 10 })
        subscription.incrementUsedSeats(5)

        expect(() => subscription.updateSeats(3, false)).toThrow(InvalidSeatsConfigurationError)
      })

      it('should allow reducing to exactly used seats', () => {
        const subscription = SubscriptionFactory.create({ totalSeats: 10 })
        subscription.incrementUsedSeats(5)

        subscription.updateSeats(5, false)

        expect(subscription.totalSeats).toBe(5)
      })
    })
  })

  describe('computed properties', () => {
    describe('getAvailableSeats', () => {
      it('should calculate available seats correctly', () => {
        const subscription = SubscriptionFactory.create({ totalSeats: 10 })
        subscription.incrementUsedSeats(3)

        expect(subscription.getAvailableSeats()).toBe(7)
      })

      it('should return Infinity for unlimited seats', () => {
        const subscription = SubscriptionFactory.create({ seatsUnlimited: true })

        expect(subscription.getAvailableSeats()).toBe(Infinity)
      })

      it('should return 0 when totalSeats is undefined and not unlimited', () => {
        const subscription = Subscription.create({
          organizationId: 'org-123',
          name: 'Test',
          category: 'productivity',
          billingCycle: 'monthly',
          pricingModel: 'flat_rate',
          currency: 'BRL',
          totalMonthlyCost: 10000n,
          seatsUnlimited: false,
          startDate: new Date(),
          renewalDate: new Date(),
          tags: [],
          autoRenew: true,
          reminderDays: [30],
        })

        expect(subscription.getAvailableSeats()).toBe(0)
      })
    })

    describe('getUtilizationRate', () => {
      it('should calculate utilization rate correctly', () => {
        const subscription = SubscriptionFactory.create({ totalSeats: 10 })
        subscription.incrementUsedSeats(5)

        expect(subscription.getUtilizationRate()).toBe(50)
      })

      it('should return 0 for unlimited seats', () => {
        const subscription = SubscriptionFactory.create({ seatsUnlimited: true })
        subscription.incrementUsedSeats(100)

        expect(subscription.getUtilizationRate()).toBe(0)
      })

      it('should return 0 when totalSeats is undefined', () => {
        const subscription = Subscription.create({
          organizationId: 'org-123',
          name: 'Test',
          category: 'productivity',
          billingCycle: 'monthly',
          pricingModel: 'flat_rate',
          currency: 'BRL',
          totalMonthlyCost: 10000n,
          seatsUnlimited: false,
          startDate: new Date(),
          renewalDate: new Date(),
          tags: [],
          autoRenew: true,
          reminderDays: [30],
        })

        expect(subscription.getUtilizationRate()).toBe(0)
      })

      it('should round to nearest integer', () => {
        const subscription = SubscriptionFactory.create({ totalSeats: 3 })
        subscription.incrementUsedSeats(1)

        expect(subscription.getUtilizationRate()).toBe(33)
      })
    })

    describe('getDaysUntilRenewal', () => {
      it('should calculate days until renewal', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 15)

        const subscription = SubscriptionFactory.create({ renewalDate: futureDate })

        expect(subscription.getDaysUntilRenewal()).toBe(15)
      })

      it('should return negative for past renewal date', () => {
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 5)

        const subscription = SubscriptionFactory.create({ renewalDate: pastDate })

        expect(subscription.getDaysUntilRenewal()).toBe(-5)
      })
    })

    describe('isRenewalSoon', () => {
      it('should return true when renewal is within default 30 days', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 15)

        const subscription = SubscriptionFactory.create({ renewalDate: futureDate })

        expect(subscription.isRenewalSoon()).toBe(true)
      })

      it('should return false when renewal is beyond 30 days', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 45)

        const subscription = SubscriptionFactory.create({ renewalDate: futureDate })

        expect(subscription.isRenewalSoon()).toBe(false)
      })

      it('should respect custom days parameter', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 10)

        const subscription = SubscriptionFactory.create({ renewalDate: futureDate })

        expect(subscription.isRenewalSoon(7)).toBe(false)
        expect(subscription.isRenewalSoon(15)).toBe(true)
      })
    })

    describe('status checks', () => {
      it('isActive should work correctly', () => {
        expect(SubscriptionFactory.create().isActive()).toBe(true)
        expect(SubscriptionFactory.createTrial().isActive()).toBe(false)
        expect(SubscriptionFactory.createSuspended().isActive()).toBe(false)
        expect(SubscriptionFactory.createCancelled().isActive()).toBe(false)
        expect(SubscriptionFactory.createExpired().isActive()).toBe(false)
      })

      it('isTrial should work correctly', () => {
        expect(SubscriptionFactory.create().isTrial()).toBe(false)
        expect(SubscriptionFactory.createTrial().isTrial()).toBe(true)
      })

      it('isSuspended should work correctly', () => {
        expect(SubscriptionFactory.create().isSuspended()).toBe(false)
        expect(SubscriptionFactory.createSuspended().isSuspended()).toBe(true)
      })

      it('isCancelled should work correctly', () => {
        expect(SubscriptionFactory.create().isCancelled()).toBe(false)
        expect(SubscriptionFactory.createCancelled().isCancelled()).toBe(true)
      })

      it('isExpired should work correctly', () => {
        expect(SubscriptionFactory.create().isExpired()).toBe(false)
        expect(SubscriptionFactory.createExpired().isExpired()).toBe(true)
      })
    })
  })

  describe('update methods', () => {
    describe('updateCost', () => {
      it('should update cost fields', () => {
        const subscription = SubscriptionFactory.create({ totalMonthlyCost: 50000n })

        subscription.updateCost(75000n, 7500n, 900000n)

        expect(subscription.totalMonthlyCost).toBe(75000n)
        expect(subscription.pricePerUnit).toBe(7500n)
        expect(subscription.annualValue).toBe(900000n)
      })

      it('should update updatedAt timestamp', () => {
        const subscription = SubscriptionFactory.create()
        const beforeUpdate = new Date()

        subscription.updateCost(100000n)

        expect(subscription.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
      })
    })

    describe('updateRenewalDate', () => {
      it('should update renewal date', () => {
        const subscription = SubscriptionFactory.create()
        const newRenewalDate = new Date('2025-06-15')

        subscription.updateRenewalDate(newRenewalDate)

        expect(subscription.renewalDate).toEqual(newRenewalDate)
      })

      it('should update cancellation deadline', () => {
        const subscription = SubscriptionFactory.create()
        const newRenewalDate = new Date('2025-06-15')
        const cancellationDeadline = new Date('2025-05-15')

        subscription.updateRenewalDate(newRenewalDate, cancellationDeadline)

        expect(subscription.renewalDate).toEqual(newRenewalDate)
        expect(subscription.cancellationDeadline).toEqual(cancellationDeadline)
      })
    })

    describe('updateOwnership', () => {
      it('should update owner, department, and approver', () => {
        const subscription = SubscriptionFactory.create()

        subscription.updateOwnership('emp-123', 'dept-456', 'emp-789')

        expect(subscription.ownerId).toBe('emp-123')
        expect(subscription.departmentId).toBe('dept-456')
        expect(subscription.approverId).toBe('emp-789')
      })

      it('should allow clearing ownership fields', () => {
        const subscription = SubscriptionFactory.create({
          ownerId: 'emp-123',
          departmentId: 'dept-456',
        })

        subscription.updateOwnership(undefined, undefined, undefined)

        expect(subscription.ownerId).toBeUndefined()
        expect(subscription.departmentId).toBeUndefined()
        expect(subscription.approverId).toBeUndefined()
      })
    })

    describe('updateUsageStats', () => {
      it('should update usage percentage and timestamp', () => {
        const subscription = SubscriptionFactory.create()
        const beforeUpdate = new Date()

        subscription.updateUsageStats(75)

        expect(subscription.usagePercentage).toBe(75)
        expect(subscription.lastUsageCalculatedAt).toBeInstanceOf(Date)
        expect(subscription.lastUsageCalculatedAt!.getTime()).toBeGreaterThanOrEqual(
          beforeUpdate.getTime()
        )
      })
    })

    describe('updateDetails', () => {
      it('should update multiple fields', () => {
        const subscription = SubscriptionFactory.create({ name: 'Old Name' })

        subscription.updateDetails({
          name: 'New Name',
          vendor: 'New Vendor',
          category: 'development',
          notes: 'Updated notes',
        })

        expect(subscription.name).toBe('New Name')
        expect(subscription.vendor).toBe('New Vendor')
        expect(subscription.category).toBe('development')
        expect(subscription.notes).toBe('Updated notes')
      })

      it('should not update undefined fields', () => {
        const subscription = SubscriptionFactory.create({
          name: 'Original Name',
          vendor: 'Original Vendor',
        })

        subscription.updateDetails({ name: 'New Name' })

        expect(subscription.name).toBe('New Name')
        expect(subscription.vendor).toBe('Original Vendor')
      })
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON with all properties', () => {
      const subscription = SubscriptionFactory.create({ name: 'Slack' })

      const json = subscription.toJSON()

      expect(json.id).toBe(subscription.id)
      expect(json.name).toBe('Slack')
      expect(json.status).toBe('active')
      expect(json.createdAt).toBeInstanceOf(Date)
      expect(json.updatedAt).toBeInstanceOf(Date)
    })

    it('should not mutate original when modifying JSON', () => {
      const subscription = SubscriptionFactory.create({ name: 'Original' })

      const json = subscription.toJSON()
      ;(json as { name: string }).name = 'Modified'

      expect(subscription.name).toBe('Original')
    })
  })

  describe('status lifecycle', () => {
    it('should support active → suspended → active cycle', () => {
      const subscription = SubscriptionFactory.create()

      expect(subscription.isActive()).toBe(true)

      subscription.suspend()
      expect(subscription.isSuspended()).toBe(true)

      subscription.reactivate()
      expect(subscription.isActive()).toBe(true)
    })

    it('should support active → cancelled → active cycle', () => {
      const subscription = SubscriptionFactory.create()

      subscription.cancel()
      expect(subscription.isCancelled()).toBe(true)

      subscription.reactivate()
      expect(subscription.isActive()).toBe(true)
    })

    it('should support trial → active conversion', () => {
      const subscription = SubscriptionFactory.createTrial()

      expect(subscription.isTrial()).toBe(true)

      subscription.convertTrialToActive()
      expect(subscription.isActive()).toBe(true)
    })

    it('should not allow expired → any transition except via reconstitute', () => {
      const subscription = SubscriptionFactory.createExpired()

      expect(() => subscription.expire()).toThrow(SubscriptionAlreadyExpiredError)
      expect(() => subscription.cancel()).toThrow(SubscriptionAlreadyExpiredError)
      expect(() => subscription.reactivate()).toThrow(InvalidSubscriptionStatusError)
      expect(() => subscription.suspend()).toThrow(InvalidSubscriptionStatusError)
    })
  })
})
