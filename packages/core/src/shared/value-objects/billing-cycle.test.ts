import { describe, it, expect } from 'vitest'
import { BillingCycle } from './billing-cycle'

describe('BillingCycle Value Object', () => {
  describe('monthly', () => {
    it('should create monthly billing cycle', () => {
      const cycle = BillingCycle.monthly()

      expect(cycle.getType()).toBe('monthly')
      expect(cycle.getIntervalMonths()).toBe(1)
    })

    it('should be recurring', () => {
      const cycle = BillingCycle.monthly()

      expect(cycle.isRecurring()).toBe(true)
    })
  })

  describe('quarterly', () => {
    it('should create quarterly billing cycle', () => {
      const cycle = BillingCycle.quarterly()

      expect(cycle.getType()).toBe('quarterly')
      expect(cycle.getIntervalMonths()).toBe(3)
    })

    it('should be recurring', () => {
      const cycle = BillingCycle.quarterly()

      expect(cycle.isRecurring()).toBe(true)
    })
  })

  describe('yearly', () => {
    it('should create yearly billing cycle', () => {
      const cycle = BillingCycle.yearly()

      expect(cycle.getType()).toBe('yearly')
      expect(cycle.getIntervalMonths()).toBe(12)
    })

    it('should be recurring', () => {
      const cycle = BillingCycle.yearly()

      expect(cycle.isRecurring()).toBe(true)
    })
  })

  describe('oneTime', () => {
    it('should create one-time billing cycle', () => {
      const cycle = BillingCycle.oneTime()

      expect(cycle.getType()).toBe('one-time')
      expect(cycle.getIntervalMonths()).toBe(0)
    })

    it('should not be recurring', () => {
      const cycle = BillingCycle.oneTime()

      expect(cycle.isRecurring()).toBe(false)
    })
  })

  describe('fromType', () => {
    it('should create monthly from type', () => {
      const cycle = BillingCycle.fromType('monthly')

      expect(cycle.getType()).toBe('monthly')
      expect(cycle.getIntervalMonths()).toBe(1)
    })

    it('should create quarterly from type', () => {
      const cycle = BillingCycle.fromType('quarterly')

      expect(cycle.getType()).toBe('quarterly')
      expect(cycle.getIntervalMonths()).toBe(3)
    })

    it('should create yearly from type', () => {
      const cycle = BillingCycle.fromType('yearly')

      expect(cycle.getType()).toBe('yearly')
      expect(cycle.getIntervalMonths()).toBe(12)
    })

    it('should create one-time from type', () => {
      const cycle = BillingCycle.fromType('one-time')

      expect(cycle.getType()).toBe('one-time')
      expect(cycle.getIntervalMonths()).toBe(0)
    })
  })

  describe('getType', () => {
    it('should return billing cycle type', () => {
      const cycle = BillingCycle.monthly()

      expect(cycle.getType()).toBe('monthly')
    })
  })

  describe('getIntervalMonths', () => {
    it('should return 1 for monthly', () => {
      const cycle = BillingCycle.monthly()

      expect(cycle.getIntervalMonths()).toBe(1)
    })

    it('should return 3 for quarterly', () => {
      const cycle = BillingCycle.quarterly()

      expect(cycle.getIntervalMonths()).toBe(3)
    })

    it('should return 12 for yearly', () => {
      const cycle = BillingCycle.yearly()

      expect(cycle.getIntervalMonths()).toBe(12)
    })

    it('should return 0 for one-time', () => {
      const cycle = BillingCycle.oneTime()

      expect(cycle.getIntervalMonths()).toBe(0)
    })
  })

  describe('isRecurring', () => {
    it('should return true for monthly', () => {
      const cycle = BillingCycle.monthly()

      expect(cycle.isRecurring()).toBe(true)
    })

    it('should return true for quarterly', () => {
      const cycle = BillingCycle.quarterly()

      expect(cycle.isRecurring()).toBe(true)
    })

    it('should return true for yearly', () => {
      const cycle = BillingCycle.yearly()

      expect(cycle.isRecurring()).toBe(true)
    })

    it('should return false for one-time', () => {
      const cycle = BillingCycle.oneTime()

      expect(cycle.isRecurring()).toBe(false)
    })
  })

  describe('getNextBillingDate', () => {
    it('should calculate next monthly billing date', () => {
      const cycle = BillingCycle.monthly()
      const currentDate = new Date('2024-01-15')

      const nextDate = cycle.getNextBillingDate(currentDate)

      expect(nextDate).toEqual(new Date('2024-02-15'))
    })

    it('should calculate next quarterly billing date', () => {
      const cycle = BillingCycle.quarterly()
      const currentDate = new Date('2024-01-15')

      const nextDate = cycle.getNextBillingDate(currentDate)

      expect(nextDate).toEqual(new Date('2024-04-15'))
    })

    it('should calculate next yearly billing date', () => {
      const cycle = BillingCycle.yearly()
      const currentDate = new Date('2024-01-15')

      const nextDate = cycle.getNextBillingDate(currentDate)

      expect(nextDate).toEqual(new Date('2025-01-15'))
    })

    it('should handle month overflow correctly', () => {
      const cycle = BillingCycle.monthly()
      const currentDate = new Date('2024-01-31')

      const nextDate = cycle.getNextBillingDate(currentDate)

      // JavaScript Date handles overflow: Jan 31 + 1 month
      // Since Feb doesn't have 31 days, it overflows to March
      expect(nextDate?.getMonth()).toBe(2) // March (0-indexed)
      expect(nextDate?.getFullYear()).toBe(2024)
      // Just verify it's a valid date in March
      expect(nextDate?.getDate()).toBeGreaterThan(0)
    })

    it('should handle year transition', () => {
      const cycle = BillingCycle.monthly()
      const currentDate = new Date('2024-12-15')

      const nextDate = cycle.getNextBillingDate(currentDate)

      expect(nextDate).toEqual(new Date('2025-01-15'))
    })

    it('should return null for one-time billing', () => {
      const cycle = BillingCycle.oneTime()
      const currentDate = new Date('2024-01-15')

      const nextDate = cycle.getNextBillingDate(currentDate)

      expect(nextDate).toBeNull()
    })

    it('should not mutate input date', () => {
      const cycle = BillingCycle.monthly()
      const currentDate = new Date('2024-01-15')
      const originalTime = currentDate.getTime()

      cycle.getNextBillingDate(currentDate)

      expect(currentDate.getTime()).toBe(originalTime)
    })
  })

  describe('toString', () => {
    it('should return type as string for monthly', () => {
      const cycle = BillingCycle.monthly()

      expect(cycle.toString()).toBe('monthly')
    })

    it('should return type as string for quarterly', () => {
      const cycle = BillingCycle.quarterly()

      expect(cycle.toString()).toBe('quarterly')
    })

    it('should return type as string for yearly', () => {
      const cycle = BillingCycle.yearly()

      expect(cycle.toString()).toBe('yearly')
    })

    it('should return type as string for one-time', () => {
      const cycle = BillingCycle.oneTime()

      expect(cycle.toString()).toBe('one-time')
    })
  })

  describe('equals', () => {
    it('should return true for same type', () => {
      const cycle1 = BillingCycle.monthly()
      const cycle2 = BillingCycle.monthly()

      expect(cycle1.equals(cycle2)).toBe(true)
    })

    it('should return true for same type via fromType', () => {
      const cycle1 = BillingCycle.monthly()
      const cycle2 = BillingCycle.fromType('monthly')

      expect(cycle1.equals(cycle2)).toBe(true)
    })

    it('should return false for different types', () => {
      const cycle1 = BillingCycle.monthly()
      const cycle2 = BillingCycle.yearly()

      expect(cycle1.equals(cycle2)).toBe(false)
    })

    it('should return false comparing recurring with one-time', () => {
      const cycle1 = BillingCycle.monthly()
      const cycle2 = BillingCycle.oneTime()

      expect(cycle1.equals(cycle2)).toBe(false)
    })
  })

  describe('immutability', () => {
    it('should maintain consistent type', () => {
      const cycle = BillingCycle.monthly()

      const type1 = cycle.getType()
      const type2 = cycle.getType()

      // Type remains constant
      expect(type1).toBe(type2)
      expect(type1).toBe('monthly')
    })

    it('should maintain consistent interval months', () => {
      const cycle = BillingCycle.quarterly()

      const interval1 = cycle.getIntervalMonths()
      const interval2 = cycle.getIntervalMonths()

      // Interval remains constant
      expect(interval1).toBe(interval2)
      expect(interval1).toBe(3)
    })
  })

  describe('factory methods consistency', () => {
    it('should create equivalent instances', () => {
      const direct = BillingCycle.monthly()
      const fromType = BillingCycle.fromType('monthly')

      expect(direct.equals(fromType)).toBe(true)
      expect(direct.getIntervalMonths()).toBe(fromType.getIntervalMonths())
    })
  })
})
