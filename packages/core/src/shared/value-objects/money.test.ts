import { describe, it, expect } from 'vitest'
import { Money } from './money'

describe('Money Value Object', () => {
  describe('fromCents', () => {
    it('should create money from cents', () => {
      const money = Money.fromCents(1000)

      expect(money.getCents()).toBe(1000)
      expect(money.getDecimal()).toBe(10)
    })

    it('should round cents to integer', () => {
      const money = Money.fromCents(1000.7)

      expect(money.getCents()).toBe(1001)
    })

    it('should create with default BRL currency', () => {
      const money = Money.fromCents(1000)

      expect(money.getCurrency()).toBe('BRL')
    })

    it('should create with custom currency', () => {
      const money = Money.fromCents(1000, 'USD')

      expect(money.getCurrency()).toBe('USD')
    })

    it('should throw on negative amount', () => {
      expect(() => Money.fromCents(-100)).toThrow('Amount cannot be negative')
    })

    it('should allow zero amount', () => {
      const money = Money.fromCents(0)

      expect(money.getCents()).toBe(0)
    })
  })

  describe('fromDecimal', () => {
    it('should create money from decimal value', () => {
      const money = Money.fromDecimal(10.50)

      expect(money.getCents()).toBe(1050)
      expect(money.getDecimal()).toBe(10.5)
    })

    it('should round to nearest cent', () => {
      const money = Money.fromDecimal(10.505)

      expect(money.getCents()).toBe(1051)
    })

    it('should handle whole numbers', () => {
      const money = Money.fromDecimal(10)

      expect(money.getCents()).toBe(1000)
      expect(money.getDecimal()).toBe(10)
    })

    it('should create with custom currency', () => {
      const money = Money.fromDecimal(10.50, 'EUR')

      expect(money.getCurrency()).toBe('EUR')
    })

    it('should throw on negative amount', () => {
      expect(() => Money.fromDecimal(-10.50)).toThrow('Amount cannot be negative')
    })
  })

  describe('zero', () => {
    it('should create zero money', () => {
      const money = Money.zero()

      expect(money.getCents()).toBe(0)
      expect(money.getDecimal()).toBe(0)
    })

    it('should create zero with default BRL currency', () => {
      const money = Money.zero()

      expect(money.getCurrency()).toBe('BRL')
    })

    it('should create zero with custom currency', () => {
      const money = Money.zero('USD')

      expect(money.getCurrency()).toBe('USD')
    })
  })

  describe('getCents', () => {
    it('should return cents value', () => {
      const money = Money.fromCents(1234)

      expect(money.getCents()).toBe(1234)
    })
  })

  describe('getDecimal', () => {
    it('should return decimal value', () => {
      const money = Money.fromCents(1234)

      expect(money.getDecimal()).toBe(12.34)
    })

    it('should handle zero', () => {
      const money = Money.zero()

      expect(money.getDecimal()).toBe(0)
    })

    it('should handle whole numbers', () => {
      const money = Money.fromCents(1000)

      expect(money.getDecimal()).toBe(10)
    })
  })

  describe('getCurrency', () => {
    it('should return currency code', () => {
      const money = Money.fromCents(1000, 'USD')

      expect(money.getCurrency()).toBe('USD')
    })
  })

  describe('add', () => {
    it('should add two money values', () => {
      const money1 = Money.fromCents(1000)
      const money2 = Money.fromCents(500)

      const result = money1.add(money2)

      expect(result.getCents()).toBe(1500)
    })

    it('should preserve currency', () => {
      const money1 = Money.fromCents(1000, 'USD')
      const money2 = Money.fromCents(500, 'USD')

      const result = money1.add(money2)

      expect(result.getCurrency()).toBe('USD')
    })

    it('should not mutate original values', () => {
      const money1 = Money.fromCents(1000)
      const money2 = Money.fromCents(500)

      money1.add(money2)

      expect(money1.getCents()).toBe(1000)
      expect(money2.getCents()).toBe(500)
    })

    it('should throw when adding different currencies', () => {
      const brl = Money.fromCents(1000, 'BRL')
      const usd = Money.fromCents(500, 'USD')

      expect(() => brl.add(usd)).toThrow('Cannot operate on different currencies: BRL and USD')
    })

    it('should allow adding zero', () => {
      const money = Money.fromCents(1000)
      const zero = Money.zero()

      const result = money.add(zero)

      expect(result.getCents()).toBe(1000)
    })
  })

  describe('subtract', () => {
    it('should subtract two money values', () => {
      const money1 = Money.fromCents(1000)
      const money2 = Money.fromCents(300)

      const result = money1.subtract(money2)

      expect(result.getCents()).toBe(700)
    })

    it('should throw when result would be negative', () => {
      const money1 = Money.fromCents(100)
      const money2 = Money.fromCents(300)

      expect(() => money1.subtract(money2)).toThrow('Amount cannot be negative')
    })

    it('should preserve currency', () => {
      const money1 = Money.fromCents(1000, 'EUR')
      const money2 = Money.fromCents(300, 'EUR')

      const result = money1.subtract(money2)

      expect(result.getCurrency()).toBe('EUR')
    })

    it('should not mutate original values', () => {
      const money1 = Money.fromCents(1000)
      const money2 = Money.fromCents(300)

      money1.subtract(money2)

      expect(money1.getCents()).toBe(1000)
      expect(money2.getCents()).toBe(300)
    })

    it('should throw when subtracting different currencies', () => {
      const brl = Money.fromCents(1000, 'BRL')
      const usd = Money.fromCents(300, 'USD')

      expect(() => brl.subtract(usd)).toThrow('Cannot operate on different currencies: BRL and USD')
    })
  })

  describe('multiply', () => {
    it('should multiply by factor', () => {
      const money = Money.fromCents(1000)

      const result = money.multiply(2)

      expect(result.getCents()).toBe(2000)
    })

    it('should multiply by decimal factor', () => {
      const money = Money.fromCents(1000)

      const result = money.multiply(1.5)

      expect(result.getCents()).toBe(1500)
    })

    it('should round result to nearest cent', () => {
      const money = Money.fromCents(1000)

      const result = money.multiply(1.505)

      expect(result.getCents()).toBe(1505)
    })

    it('should preserve currency', () => {
      const money = Money.fromCents(1000, 'GBP')

      const result = money.multiply(2)

      expect(result.getCurrency()).toBe('GBP')
    })

    it('should not mutate original value', () => {
      const money = Money.fromCents(1000)

      money.multiply(2)

      expect(money.getCents()).toBe(1000)
    })

    it('should handle zero factor', () => {
      const money = Money.fromCents(1000)

      const result = money.multiply(0)

      expect(result.getCents()).toBe(0)
    })

    it('should throw when multiplying by negative factor', () => {
      const money = Money.fromCents(1000)

      expect(() => money.multiply(-1)).toThrow('Amount cannot be negative')
    })
  })

  describe('divide', () => {
    it('should divide by divisor', () => {
      const money = Money.fromCents(1000)

      const result = money.divide(2)

      expect(result.getCents()).toBe(500)
    })

    it('should round result to nearest cent', () => {
      const money = Money.fromCents(1000)

      const result = money.divide(3)

      expect(result.getCents()).toBe(333)
    })

    it('should preserve currency', () => {
      const money = Money.fromCents(1000, 'JPY')

      const result = money.divide(2)

      expect(result.getCurrency()).toBe('JPY')
    })

    it('should not mutate original value', () => {
      const money = Money.fromCents(1000)

      money.divide(2)

      expect(money.getCents()).toBe(1000)
    })

    it('should throw when dividing by zero', () => {
      const money = Money.fromCents(1000)

      expect(() => money.divide(0)).toThrow('Cannot divide by zero')
    })

    it('should throw when dividing by negative divisor', () => {
      const money = Money.fromCents(1000)

      expect(() => money.divide(-2)).toThrow('Amount cannot be negative')
    })
  })

  describe('isGreaterThan', () => {
    it('should return true when greater', () => {
      const money1 = Money.fromCents(1000)
      const money2 = Money.fromCents(500)

      expect(money1.isGreaterThan(money2)).toBe(true)
    })

    it('should return false when less', () => {
      const money1 = Money.fromCents(500)
      const money2 = Money.fromCents(1000)

      expect(money1.isGreaterThan(money2)).toBe(false)
    })

    it('should return false when equal', () => {
      const money1 = Money.fromCents(1000)
      const money2 = Money.fromCents(1000)

      expect(money1.isGreaterThan(money2)).toBe(false)
    })

    it('should throw when comparing different currencies', () => {
      const brl = Money.fromCents(1000, 'BRL')
      const usd = Money.fromCents(500, 'USD')

      expect(() => brl.isGreaterThan(usd)).toThrow('Cannot operate on different currencies: BRL and USD')
    })
  })

  describe('isLessThan', () => {
    it('should return true when less', () => {
      const money1 = Money.fromCents(500)
      const money2 = Money.fromCents(1000)

      expect(money1.isLessThan(money2)).toBe(true)
    })

    it('should return false when greater', () => {
      const money1 = Money.fromCents(1000)
      const money2 = Money.fromCents(500)

      expect(money1.isLessThan(money2)).toBe(false)
    })

    it('should return false when equal', () => {
      const money1 = Money.fromCents(1000)
      const money2 = Money.fromCents(1000)

      expect(money1.isLessThan(money2)).toBe(false)
    })

    it('should throw when comparing different currencies', () => {
      const brl = Money.fromCents(1000, 'BRL')
      const usd = Money.fromCents(500, 'USD')

      expect(() => brl.isLessThan(usd)).toThrow('Cannot operate on different currencies: BRL and USD')
    })
  })

  describe('equals', () => {
    it('should return true for same amount and currency', () => {
      const money1 = Money.fromCents(1000, 'BRL')
      const money2 = Money.fromCents(1000, 'BRL')

      expect(money1.equals(money2)).toBe(true)
    })

    it('should return false for different amounts', () => {
      const money1 = Money.fromCents(1000)
      const money2 = Money.fromCents(500)

      expect(money1.equals(money2)).toBe(false)
    })

    it('should return false for different currencies', () => {
      const brl = Money.fromCents(1000, 'BRL')
      const usd = Money.fromCents(1000, 'USD')

      expect(brl.equals(usd)).toBe(false)
    })
  })

  describe('format', () => {
    it('should format in pt-BR locale by default', () => {
      const money = Money.fromCents(1050, 'BRL')

      const formatted = money.format()

      // Check it contains the expected components (locale formatting may vary)
      expect(formatted).toContain('10')
      expect(formatted).toContain('50')
      expect(formatted.replace(/\s/g, ' ')).toMatch(/R\$\s*10[.,]50/)
    })

    it('should format USD in pt-BR locale', () => {
      const money = Money.fromCents(1050, 'USD')

      const formatted = money.format()

      expect(formatted).toContain('10')
      expect(formatted).toContain('50')
    })

    it('should format in en-US locale', () => {
      const money = Money.fromCents(1050, 'USD')

      const formatted = money.format('en-US')

      expect(formatted).toBe('$10.50')
    })

    it('should format zero', () => {
      const money = Money.zero('BRL')

      const formatted = money.format()

      expect(formatted).toContain('0')
      expect(formatted).toMatch(/0[.,]00/)
    })

    it('should format large amounts', () => {
      const money = Money.fromCents(123456789, 'BRL')

      const formatted = money.format()

      expect(formatted).toContain('1')
      expect(formatted).toContain('234')
      expect(formatted).toContain('567')
      expect(formatted).toContain('89')
    })
  })

  describe('immutability', () => {
    it('should create new instance on operations', () => {
      const original = Money.fromCents(1000)
      const doubled = original.multiply(2)

      // Operations create new instances
      expect(doubled).not.toBe(original)
      expect(original.getCents()).toBe(1000)
      expect(doubled.getCents()).toBe(2000)
    })

    it('should maintain immutability through arithmetic operations', () => {
      const money1 = Money.fromCents(1000)
      const money2 = Money.fromCents(500)

      const sum = money1.add(money2)

      // Original values unchanged
      expect(money1.getCents()).toBe(1000)
      expect(money2.getCents()).toBe(500)
      expect(sum.getCents()).toBe(1500)
    })
  })
})
