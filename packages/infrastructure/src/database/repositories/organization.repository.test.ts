/**
 * Integration Tests for PrismaOrganizationRepository
 *
 * Tests organization persistence with real PostgreSQL database.
 * Covers CRUD operations, lookups, soft deletes, and settings management.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { PrismaClient } from '@saastral/database'
import { PrismaOrganizationRepository } from './organization.repository'
import { getPrismaClient } from '../../../test/db-setup'

describe('PrismaOrganizationRepository', () => {
  let prisma: PrismaClient
  let repository: PrismaOrganizationRepository

  beforeEach(async () => {
    prisma = getPrismaClient()
    repository = new PrismaOrganizationRepository(prisma)
  })

  describe('create', () => {
    it('should create new organization', async () => {
      const input = {
        name: 'Acme Corp',
        slug: `acme-${Date.now()}`,
        plan: 'free',
        planStartedAt: new Date(),
        settings: {
          defaultCurrency: 'BRL',
          locale: 'pt-BR',
        },
      }

      const org = await repository.create(input)

      expect(org.id).toBeDefined()
      expect(org.name).toBe('Acme Corp')
      expect(org.slug).toBe(input.slug)
      expect(org.plan).toBe('free')
      expect(org.planStartedAt).toBeInstanceOf(Date)
      expect(org.settings).toEqual({
        defaultCurrency: 'BRL',
        locale: 'pt-BR',
      })
      expect(org.createdAt).toBeInstanceOf(Date)
      expect(org.updatedAt).toBeInstanceOf(Date)
    })

    it('should create organization with minimal data', async () => {
      const input = {
        name: 'Minimal Org',
        slug: `minimal-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings: {},
      }

      const org = await repository.create(input)

      expect(org.id).toBeDefined()
      expect(org.name).toBe('Minimal Org')
      expect(org.slug).toBe(input.slug)
      expect(org.plan).toBe('free')
      expect(org.planStartedAt).toBeNull()
      expect(org.settings).toEqual({})
    })

    it('should enforce unique slug constraint', async () => {
      const slug = `unique-${Date.now()}`

      await repository.create({
        name: 'Org 1',
        slug,
        plan: 'free',
        planStartedAt: null,
        settings: {},
      })

      // Try to create another org with same slug
      await expect(
        repository.create({
          name: 'Org 2',
          slug,
          plan: 'free',
          planStartedAt: null,
          settings: {},
        })
      ).rejects.toThrow()
    })
  })

  describe('findById', () => {
    it('should find organization by id', async () => {
      const created = await repository.create({
        name: 'Test Corp',
        slug: `test-${Date.now()}`,
        plan: 'team',
        planStartedAt: new Date(),
        settings: { defaultCurrency: 'USD' },
      })

      const found = await repository.findById(created.id)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(created.id)
      expect(found?.name).toBe('Test Corp')
      expect(found?.plan).toBe('team')
    })

    it('should return null when organization not found', async () => {
      const found = await repository.findById('non-existent-id')
      expect(found).toBeNull()
    })

    it('should not find soft-deleted organizations', async () => {
      const org = await repository.create({
        name: 'Delete Me',
        slug: `delete-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings: {},
      })

      // Soft delete
      await repository.delete(org.id)

      // Should not find it
      const found = await repository.findById(org.id)
      expect(found).toBeNull()
    })
  })

  describe('findBySlug', () => {
    it('should find organization by slug', async () => {
      const slug = `slug-test-${Date.now()}`
      const created = await repository.create({
        name: 'Slug Test',
        slug,
        plan: 'business',
        planStartedAt: new Date(),
        settings: {},
      })

      const found = await repository.findBySlug(slug)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(created.id)
      expect(found?.slug).toBe(slug)
      expect(found?.plan).toBe('business')
    })

    it('should return null when slug not found', async () => {
      const found = await repository.findBySlug('non-existent-slug')
      expect(found).toBeNull()
    })

    it('should not find soft-deleted organization by slug', async () => {
      const slug = `delete-slug-${Date.now()}`
      const org = await repository.create({
        name: 'Delete By Slug',
        slug,
        plan: 'free',
        planStartedAt: null,
        settings: {},
      })

      await repository.delete(org.id)

      const found = await repository.findBySlug(slug)
      expect(found).toBeNull()
    })
  })

  describe('update', () => {
    it('should update organization name', async () => {
      const org = await repository.create({
        name: 'Old Name',
        slug: `update-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings: {},
      })

      const updated = await repository.update(org.id, {
        name: 'New Name',
      })

      expect(updated.name).toBe('New Name')
      expect(updated.slug).toBe(org.slug) // Unchanged
      expect(updated.plan).toBe(org.plan) // Unchanged
    })

    it('should update organization slug', async () => {
      const org = await repository.create({
        name: 'Update Slug Test',
        slug: `old-slug-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings: {},
      })

      const newSlug = `new-slug-${Date.now()}`
      const updated = await repository.update(org.id, {
        slug: newSlug,
      })

      expect(updated.slug).toBe(newSlug)
      expect(updated.name).toBe(org.name) // Unchanged
    })

    it('should update organization plan', async () => {
      const org = await repository.create({
        name: 'Plan Update Test',
        slug: `plan-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings: {},
      })

      const planStartedAt = new Date()
      const updated = await repository.update(org.id, {
        plan: 'team',
        planStartedAt,
      })

      expect(updated.plan).toBe('team')
      expect(updated.planStartedAt).toEqual(planStartedAt)
    })

    it('should update organization settings', async () => {
      const org = await repository.create({
        name: 'Settings Test',
        slug: `settings-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings: { defaultCurrency: 'USD' },
      })

      const updated = await repository.update(org.id, {
        settings: {
          defaultCurrency: 'BRL',
          locale: 'pt-BR',
        },
      })

      expect(updated.settings).toEqual({
        defaultCurrency: 'BRL',
        locale: 'pt-BR',
      })
    })

    it('should update multiple fields at once', async () => {
      const org = await repository.create({
        name: 'Multi Update',
        slug: `multi-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings: {},
      })

      const newSlug = `multi-new-${Date.now()}`
      const updated = await repository.update(org.id, {
        name: 'Multi Updated',
        slug: newSlug,
        plan: 'business',
        planStartedAt: new Date(),
        settings: { defaultCurrency: 'EUR' },
      })

      expect(updated.name).toBe('Multi Updated')
      expect(updated.slug).toBe(newSlug)
      expect(updated.plan).toBe('business')
      expect(updated.planStartedAt).toBeInstanceOf(Date)
      expect(updated.settings).toEqual({ defaultCurrency: 'EUR' })
    })

    it('should throw when updating non-existent organization', async () => {
      await expect(
        repository.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow()
    })
  })

  describe('delete', () => {
    it('should soft delete organization', async () => {
      const org = await repository.create({
        name: 'Delete Test',
        slug: `delete-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings: {},
      })

      await repository.delete(org.id)

      // Verify it's soft deleted in database
      const dbRecord = await prisma.organization.findUnique({
        where: { id: org.id },
      })

      expect(dbRecord).not.toBeNull()
      expect(dbRecord?.deletedAt).toBeInstanceOf(Date)

      // Verify it's not found by repository methods
      const found = await repository.findById(org.id)
      expect(found).toBeNull()
    })

    it('should throw when deleting non-existent organization', async () => {
      await expect(repository.delete('non-existent-id')).rejects.toThrow()
    })

    it('should allow deleting already deleted organization (idempotent)', async () => {
      const org = await repository.create({
        name: 'Double Delete',
        slug: `double-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings: {},
      })

      await repository.delete(org.id)

      // Try to delete again - should succeed (idempotent)
      await repository.delete(org.id)

      // Verify still soft deleted
      const dbRecord = await prisma.organization.findUnique({
        where: { id: org.id },
      })
      expect(dbRecord?.deletedAt).toBeInstanceOf(Date)
    })
  })

  describe('domain transformation', () => {
    it('should correctly transform to and from domain', async () => {
      const planStartedAt = new Date('2024-01-01T00:00:00.000Z')
      const settings = {
        defaultCurrency: 'BRL',
        locale: 'pt-BR',
        timezone: 'America/Sao_Paulo',
      }

      const created = await repository.create({
        name: 'Transform Test',
        slug: `transform-${Date.now()}`,
        plan: 'enterprise',
        planStartedAt,
        settings,
      })

      expect(created).toMatchObject({
        name: 'Transform Test',
        plan: 'enterprise',
        planStartedAt,
        settings,
      })

      const found = await repository.findById(created.id)

      expect(found).toMatchObject({
        id: created.id,
        name: 'Transform Test',
        plan: 'enterprise',
        planStartedAt,
        settings,
      })
    })

    it('should handle empty settings object', async () => {
      const created = await repository.create({
        name: 'Empty Settings',
        slug: `empty-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings: {},
      })

      expect(created.settings).toEqual({})

      const found = await repository.findById(created.id)
      expect(found?.settings).toEqual({})
    })

    it('should handle null planStartedAt', async () => {
      const created = await repository.create({
        name: 'Null Plan Date',
        slug: `null-plan-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings: {},
      })

      expect(created.planStartedAt).toBeNull()

      const found = await repository.findById(created.id)
      expect(found?.planStartedAt).toBeNull()
    })
  })

  describe('plan management', () => {
    it('should track plan changes', async () => {
      const org = await repository.create({
        name: 'Plan Tracking',
        slug: `plan-tracking-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings: {},
      })

      // Upgrade to team
      const teamDate = new Date('2024-01-01T00:00:00.000Z')
      const upgraded = await repository.update(org.id, {
        plan: 'team',
        planStartedAt: teamDate,
      })

      expect(upgraded.plan).toBe('team')
      expect(upgraded.planStartedAt).toEqual(teamDate)

      // Upgrade to business
      const businessDate = new Date('2024-06-01T00:00:00.000Z')
      const upgraded2 = await repository.update(org.id, {
        plan: 'business',
        planStartedAt: businessDate,
      })

      expect(upgraded2.plan).toBe('business')
      expect(upgraded2.planStartedAt).toEqual(businessDate)
    })
  })

  describe('settings management', () => {
    it('should store complex settings object', async () => {
      const settings = {
        defaultCurrency: 'BRL',
        locale: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        features: {
          enableIntegrations: true,
          enableAlerts: true,
          enableReports: false,
        },
        notifications: {
          email: true,
          slack: false,
        },
      }

      const org = await repository.create({
        name: 'Complex Settings',
        slug: `complex-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings,
      })

      expect(org.settings).toEqual(settings)

      const found = await repository.findById(org.id)
      expect(found?.settings).toEqual(settings)
    })

    it('should allow partial settings updates', async () => {
      const org = await repository.create({
        name: 'Partial Settings',
        slug: `partial-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings: {
          defaultCurrency: 'USD',
          locale: 'en-US',
        },
      })

      // Update only one setting (note: this replaces entire settings object)
      const updated = await repository.update(org.id, {
        settings: {
          defaultCurrency: 'BRL',
          locale: 'pt-BR',
        },
      })

      expect(updated.settings).toEqual({
        defaultCurrency: 'BRL',
        locale: 'pt-BR',
      })
    })
  })

  describe('multiple organizations', () => {
    it('should handle multiple organizations independently', async () => {
      const org1 = await repository.create({
        name: 'Org 1',
        slug: `org1-${Date.now()}`,
        plan: 'free',
        planStartedAt: null,
        settings: { defaultCurrency: 'USD' },
      })

      const org2 = await repository.create({
        name: 'Org 2',
        slug: `org2-${Date.now()}`,
        plan: 'team',
        planStartedAt: new Date(),
        settings: { defaultCurrency: 'BRL' },
      })

      const org3 = await repository.create({
        name: 'Org 3',
        slug: `org3-${Date.now()}`,
        plan: 'business',
        planStartedAt: new Date(),
        settings: { defaultCurrency: 'EUR' },
      })

      // Verify each org can be found independently
      const found1 = await repository.findById(org1.id)
      const found2 = await repository.findBySlug(org2.slug)
      const found3 = await repository.findById(org3.id)

      expect(found1?.name).toBe('Org 1')
      expect(found2?.name).toBe('Org 2')
      expect(found3?.name).toBe('Org 3')
    })
  })
})
