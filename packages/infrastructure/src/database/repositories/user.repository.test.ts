/**
 * Integration Tests for PrismaUserRepository
 *
 * Tests user persistence with real PostgreSQL database.
 * Covers CRUD operations, lookups, and counting.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { PrismaClient } from '@saastral/database'
import { PrismaUserRepository } from './user.repository'
import { getPrismaClient } from '../../../test/db-setup'

describe('PrismaUserRepository', () => {
  let prisma: PrismaClient
  let repository: PrismaUserRepository

  beforeEach(async () => {
    prisma = getPrismaClient()
    repository = new PrismaUserRepository(prisma)
  })

  describe('hasUsers', () => {
    it('should return false when no users exist', async () => {
      const hasUsers = await repository.hasUsers()
      expect(hasUsers).toBe(false)
    })

    it('should return true when users exist', async () => {
      await prisma.user.create({
        data: {
          id: `user-${Date.now()}-${Math.random()}`,
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const hasUsers = await repository.hasUsers()
      expect(hasUsers).toBe(true)
    })
  })

  describe('count', () => {
    it('should return 0 when no users exist', async () => {
      const count = await repository.count()
      expect(count).toBe(0)
    })

    it('should return correct count of users', async () => {
      // Create 3 users
      await prisma.user.createMany({
        data: [
          {
            id: `user-${Date.now()}-1`,
            name: 'User 1',
            email: `user1-${Date.now()}@example.com`,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: `user-${Date.now()}-2`,
            name: 'User 2',
            email: `user2-${Date.now()}@example.com`,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: `user-${Date.now()}-3`,
            name: 'User 3',
            email: `user3-${Date.now()}@example.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })

      const count = await repository.count()
      expect(count).toBe(3)
    })
  })

  describe('findById', () => {
    it('should find user by id', async () => {
      const user = await prisma.user.create({
        data: {
          id: `user-${Date.now()}-${Math.random()}`,
          name: 'John Doe',
          email: `john-${Date.now()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const found = await repository.findById(user.id)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(user.id)
      expect(found?.name).toBe('John Doe')
      expect(found?.email).toBe(user.email)
      expect(found?.emailVerified).toBe(true)
      expect(found?.createdAt).toBeInstanceOf(Date)
      expect(found?.updatedAt).toBeInstanceOf(Date)
    })

    it('should return null when user not found', async () => {
      const found = await repository.findById('non-existent-id')
      expect(found).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = `jane-${Date.now()}@example.com`
      const user = await prisma.user.create({
        data: {
          id: `user-${Date.now()}-${Math.random()}`,
          name: 'Jane Smith',
          email,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const found = await repository.findByEmail(email)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(user.id)
      expect(found?.email).toBe(email)
      expect(found?.name).toBe('Jane Smith')
    })

    it('should return null when email not found', async () => {
      const found = await repository.findByEmail('nonexistent@example.com')
      expect(found).toBeNull()
    })

    it('should be case-sensitive for email', async () => {
      const email = `bob-${Date.now()}@example.com`
      await prisma.user.create({
        data: {
          id: `user-${Date.now()}-${Math.random()}`,
          name: 'Bob',
          email,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // PostgreSQL unique constraint is case-sensitive by default
      const found = await repository.findByEmail(email.toUpperCase())
      expect(found).toBeNull()
    })
  })

  describe('domain transformation', () => {
    it('should correctly transform to domain UserData', async () => {
      const email = `transform-${Date.now()}@example.com`
      const createdAt = new Date('2024-01-01T00:00:00.000Z')
      const updatedAt = new Date('2024-01-02T00:00:00.000Z')

      const user = await prisma.user.create({
        data: {
          id: `user-${Date.now()}-${Math.random()}`,
          name: 'Transform Test',
          email,
          emailVerified: true,
          createdAt,
          updatedAt,
        },
      })

      const found = await repository.findById(user.id)

      expect(found).not.toBeNull()
      expect(found).toMatchObject({
        id: user.id,
        email,
        name: 'Transform Test',
        emailVerified: true,
        createdAt,
        updatedAt,
      })
    })

    it('should handle emailVerified false', async () => {
      const user = await prisma.user.create({
        data: {
          id: `user-${Date.now()}-${Math.random()}`,
          name: 'Unverified User',
          email: `unverified-${Date.now()}@example.com`,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const found = await repository.findById(user.id)

      expect(found?.emailVerified).toBe(false)
    })
  })

  describe('email uniqueness', () => {
    it('should enforce unique email constraint', async () => {
      const email = `unique-${Date.now()}@example.com`

      await prisma.user.create({
        data: {
          id: `user-${Date.now()}-1`,
          name: 'User 1',
          email,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // Try to create another user with same email
      await expect(
        prisma.user.create({
          data: {
            id: `user-${Date.now()}-2`,
            name: 'User 2',
            email,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('multiple users', () => {
    it('should handle multiple users independently', async () => {
      // Create multiple users
      const user1 = await prisma.user.create({
        data: {
          id: `user-${Date.now()}-1`,
          name: 'Alice',
          email: `alice-${Date.now()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const user2 = await prisma.user.create({
        data: {
          id: `user-${Date.now()}-2`,
          name: 'Bob',
          email: `bob-${Date.now()}@example.com`,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const user3 = await prisma.user.create({
        data: {
          id: `user-${Date.now()}-3`,
          name: 'Charlie',
          email: `charlie-${Date.now()}@example.com`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // Verify each user can be found independently
      const foundUser1 = await repository.findById(user1.id)
      const foundUser2 = await repository.findByEmail(user2.email)
      const foundUser3 = await repository.findById(user3.id)

      expect(foundUser1?.name).toBe('Alice')
      expect(foundUser2?.name).toBe('Bob')
      expect(foundUser3?.name).toBe('Charlie')

      // Verify count
      const count = await repository.count()
      expect(count).toBe(3)
    })
  })
})
