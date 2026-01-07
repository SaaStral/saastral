import { describe, it, expect } from 'vitest'
import { Email } from './email'

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create valid email', () => {
      const email = Email.create('test@example.com')

      expect(email.getValue()).toBe('test@example.com')
    })

    it('should normalize email to lowercase', () => {
      const email = Email.create('Test@EXAMPLE.COM')

      expect(email.getValue()).toBe('test@example.com')
    })

    it('should trim whitespace from email', () => {
      const email = Email.create('  test@example.com  ')

      expect(email.getValue()).toBe('test@example.com')
    })

    it('should trim and lowercase together', () => {
      const email = Email.create('  Test@EXAMPLE.COM  ')

      expect(email.getValue()).toBe('test@example.com')
    })

    it('should accept email with subdomain', () => {
      const email = Email.create('user@mail.example.com')

      expect(email.getValue()).toBe('user@mail.example.com')
    })

    it('should accept email with plus addressing', () => {
      const email = Email.create('user+tag@example.com')

      expect(email.getValue()).toBe('user+tag@example.com')
    })

    it('should accept email with dots in local part', () => {
      const email = Email.create('first.last@example.com')

      expect(email.getValue()).toBe('first.last@example.com')
    })

    it('should accept email with numbers', () => {
      const email = Email.create('user123@example456.com')

      expect(email.getValue()).toBe('user123@example456.com')
    })

    it('should throw on invalid email format - no @', () => {
      expect(() => Email.create('invalid')).toThrow('Invalid email format: invalid')
    })

    it('should throw on invalid email format - no domain', () => {
      expect(() => Email.create('invalid@')).toThrow('Invalid email format: invalid@')
    })

    it('should throw on invalid email format - no local part', () => {
      expect(() => Email.create('@example.com')).toThrow('Invalid email format: @example.com')
    })

    it('should throw on invalid email format - no TLD', () => {
      expect(() => Email.create('user@domain')).toThrow('Invalid email format: user@domain')
    })

    it('should throw on invalid email format - multiple @', () => {
      expect(() => Email.create('user@@example.com')).toThrow('Invalid email format: user@@example.com')
    })

    it('should throw on invalid email format - spaces', () => {
      expect(() => Email.create('user name@example.com')).toThrow('Invalid email format: user name@example.com')
    })

    it('should throw on empty string', () => {
      expect(() => Email.create('')).toThrow('Invalid email format: ')
    })

    it('should throw on whitespace only', () => {
      expect(() => Email.create('   ')).toThrow('Invalid email format:    ')
    })
  })

  describe('reconstitute', () => {
    it('should reconstitute email without validation', () => {
      // Reconstitute is used when loading from database
      // It trusts the data is already valid
      const email = Email.reconstitute('test@example.com')

      expect(email.getValue()).toBe('test@example.com')
    })

    it('should not normalize when reconstituting', () => {
      // This preserves the exact stored value
      const email = Email.reconstitute('Test@EXAMPLE.COM')

      expect(email.getValue()).toBe('Test@EXAMPLE.COM')
    })
  })

  describe('getValue', () => {
    it('should return the email value', () => {
      const email = Email.create('test@example.com')

      expect(email.getValue()).toBe('test@example.com')
    })
  })

  describe('getDomain', () => {
    it('should extract domain from email', () => {
      const email = Email.create('test@example.com')

      expect(email.getDomain()).toBe('example.com')
    })

    it('should extract domain with subdomain', () => {
      const email = Email.create('test@mail.example.com')

      expect(email.getDomain()).toBe('mail.example.com')
    })

    it('should extract domain from normalized email', () => {
      const email = Email.create('Test@EXAMPLE.COM')

      expect(email.getDomain()).toBe('example.com')
    })
  })

  describe('equals', () => {
    it('should return true for same email', () => {
      const email1 = Email.create('test@example.com')
      const email2 = Email.create('test@example.com')

      expect(email1.equals(email2)).toBe(true)
    })

    it('should return true for same email with different casing', () => {
      const email1 = Email.create('Test@Example.com')
      const email2 = Email.create('test@example.com')

      expect(email1.equals(email2)).toBe(true)
    })

    it('should return true for same email with whitespace', () => {
      const email1 = Email.create('  test@example.com  ')
      const email2 = Email.create('test@example.com')

      expect(email1.equals(email2)).toBe(true)
    })

    it('should return false for different emails', () => {
      const email1 = Email.create('test@example.com')
      const email2 = Email.create('other@example.com')

      expect(email1.equals(email2)).toBe(false)
    })

    it('should return false for different domains', () => {
      const email1 = Email.create('test@example.com')
      const email2 = Email.create('test@other.com')

      expect(email1.equals(email2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return email as string', () => {
      const email = Email.create('test@example.com')

      expect(email.toString()).toBe('test@example.com')
    })

    it('should return normalized email', () => {
      const email = Email.create('Test@EXAMPLE.COM')

      expect(email.toString()).toBe('test@example.com')
    })
  })

  describe('immutability', () => {
    it('should maintain consistent value', () => {
      const email = Email.create('test@example.com')

      const value1 = email.getValue()
      const value2 = email.getValue()

      // Value remains constant
      expect(value1).toBe(value2)
      expect(value1).toBe('test@example.com')
    })
  })
})
