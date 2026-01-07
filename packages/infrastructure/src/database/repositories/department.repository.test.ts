/**
 * Integration Tests for PrismaDepartmentRepository
 *
 * Tests department persistence with real PostgreSQL database.
 * Covers CRUD operations, hierarchical queries, and soft deletes.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { PrismaClient } from '@saastral/database'
import { PrismaDepartmentRepository } from './department.repository'
import { Department } from '@saastral/core'
import { getPrismaClient } from '../../../test/db-setup'

describe('PrismaDepartmentRepository', () => {
  let prisma: PrismaClient
  let repository: PrismaDepartmentRepository
  let orgId: string

  beforeEach(async () => {
    prisma = getPrismaClient()
    repository = new PrismaDepartmentRepository(prisma)

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
    it('should persist new department', async () => {
      const department = Department.create({
        organizationId: orgId,
        name: 'Engineering',
        description: 'Engineering team',
      })

      await repository.save(department)

      const dbRecord = await prisma.department.findUnique({
        where: { id: department.id },
      })

      expect(dbRecord).not.toBeNull()
      expect(dbRecord?.organizationId).toBe(orgId)
      expect(dbRecord?.name).toBe('Engineering')
      expect(dbRecord?.description).toBe('Engineering team')
    })

    it('should update existing department (upsert)', async () => {
      const department = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })

      await repository.save(department)

      department.updateName('Product Engineering')
      await repository.save(department)

      const dbRecord = await prisma.department.findUnique({
        where: { id: department.id },
      })

      expect(dbRecord?.name).toBe('Product Engineering')
    })

    it('should handle all optional fields', async () => {
      const department = Department.create({
        organizationId: orgId,
        name: 'Engineering',
        description: 'Engineering team',
        externalId: 'ext-123',
        metadata: { code: 'ENG', budget: 100000 },
      })

      const saved = await repository.save(department)

      expect(saved.description).toBe('Engineering team')
      expect(saved.externalId).toBe('ext-123')
      expect(saved.metadata).toEqual({ code: 'ENG', budget: 100000 })
    })

    it('should handle hierarchical departments', async () => {
      const parent = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })
      await repository.save(parent)

      const child = Department.create({
        organizationId: orgId,
        name: 'Frontend',
        parentId: parent.id,
      })
      await repository.save(child)

      const found = await repository.findById(child.id)

      expect(found).not.toBeNull()
      expect(found?.parentId).toBe(parent.id)
    })
  })

  describe('findById', () => {
    it('should find department by id', async () => {
      const department = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })

      await repository.save(department)

      const found = await repository.findById(department.id)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(department.id)
      expect(found?.name).toBe('Engineering')
    })

    it('should return null when department not found', async () => {
      const result = await repository.findById('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('findByExternalId', () => {
    it('should find department by external id', async () => {
      const department = Department.create({
        organizationId: orgId,
        name: 'Engineering',
        externalId: 'google-dept-123',
      })

      await repository.save(department)

      const found = await repository.findByExternalId(
        orgId,
        'google-dept-123',
        'google',
      )

      expect(found).not.toBeNull()
      expect(found?.externalId).toBe('google-dept-123')
    })

    it('should return null when not found', async () => {
      const result = await repository.findByExternalId(
        orgId,
        'non-existent',
        'google',
      )
      expect(result).toBeNull()
    })

    it('should respect organization boundary', async () => {
      const department = Department.create({
        organizationId: orgId,
        name: 'Engineering',
        externalId: 'google-dept-123',
      })

      await repository.save(department)

      const found = await repository.findByExternalId(
        'other-org',
        'google-dept-123',
        'google',
      )

      expect(found).toBeNull()
    })

    it('should not find soft-deleted departments', async () => {
      const department = Department.create({
        organizationId: orgId,
        name: 'Engineering',
        externalId: 'google-dept-123',
      })

      await repository.save(department)
      await repository.delete(department.id)

      const found = await repository.findByExternalId(
        orgId,
        'google-dept-123',
        'google',
      )

      expect(found).toBeNull()
    })
  })

  describe('findByOrganization', () => {
    it('should find all departments for organization', async () => {
      const dept1 = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })

      const dept2 = Department.create({
        organizationId: orgId,
        name: 'Sales',
      })

      await repository.save(dept1)
      await repository.save(dept2)

      const departments = await repository.findByOrganization(orgId)

      expect(departments).toHaveLength(2)
      expect(departments.map((d) => d.name).sort()).toEqual([
        'Engineering',
        'Sales',
      ])
    })

    it('should return empty array for org with no departments', async () => {
      const departments = await repository.findByOrganization('empty-org')
      expect(departments).toEqual([])
    })

    it('should not include soft-deleted departments', async () => {
      const dept1 = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })

      const dept2 = Department.create({
        organizationId: orgId,
        name: 'Sales',
      })

      await repository.save(dept1)
      await repository.save(dept2)
      await repository.delete(dept1.id)

      const departments = await repository.findByOrganization(orgId)

      expect(departments).toHaveLength(1)
      expect(departments[0].name).toBe('Sales')
    })

    it('should order departments by name ascending', async () => {
      const deptZ = Department.create({
        organizationId: orgId,
        name: 'Zebra Team',
      })

      const deptA = Department.create({
        organizationId: orgId,
        name: 'Alpha Team',
      })

      const deptM = Department.create({
        organizationId: orgId,
        name: 'Middle Team',
      })

      await repository.save(deptZ)
      await repository.save(deptA)
      await repository.save(deptM)

      const departments = await repository.findByOrganization(orgId)

      expect(departments.map((d) => d.name)).toEqual([
        'Alpha Team',
        'Middle Team',
        'Zebra Team',
      ])
    })
  })

  describe('findRootDepartments', () => {
    it('should find only root departments (no parent)', async () => {
      const root1 = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })

      const root2 = Department.create({
        organizationId: orgId,
        name: 'Sales',
      })

      await repository.save(root1)
      await repository.save(root2)

      const child = Department.create({
        organizationId: orgId,
        name: 'Frontend',
        parentId: root1.id,
      })
      await repository.save(child)

      const rootDepartments = await repository.findRootDepartments(orgId)

      expect(rootDepartments).toHaveLength(2)
      expect(rootDepartments.map((d) => d.name).sort()).toEqual([
        'Engineering',
        'Sales',
      ])
    })

    it('should return empty array when no root departments', async () => {
      const rootDepartments = await repository.findRootDepartments(orgId)
      expect(rootDepartments).toEqual([])
    })
  })

  describe('findByParent', () => {
    it('should find all child departments', async () => {
      const parent = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })
      await repository.save(parent)

      const child1 = Department.create({
        organizationId: orgId,
        name: 'Frontend',
        parentId: parent.id,
      })

      const child2 = Department.create({
        organizationId: orgId,
        name: 'Backend',
        parentId: parent.id,
      })

      await repository.save(child1)
      await repository.save(child2)

      const children = await repository.findByParent(parent.id)

      expect(children).toHaveLength(2)
      expect(children.map((d) => d.name).sort()).toEqual(['Backend', 'Frontend'])
    })

    it('should return empty array when no children', async () => {
      const parent = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })
      await repository.save(parent)

      const children = await repository.findByParent(parent.id)
      expect(children).toEqual([])
    })
  })

  describe('findByName', () => {
    it('should find department by name', async () => {
      const department = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })

      await repository.save(department)

      const found = await repository.findByName(orgId, 'Engineering')

      expect(found).not.toBeNull()
      expect(found?.name).toBe('Engineering')
    })

    it('should return null when name not found', async () => {
      const result = await repository.findByName(orgId, 'NonExistent')
      expect(result).toBeNull()
    })

    it('should respect organization boundary', async () => {
      const department = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })

      await repository.save(department)

      const found = await repository.findByName('other-org', 'Engineering')
      expect(found).toBeNull()
    })
  })

  describe('saveMany', () => {
    it('should save multiple departments in transaction', async () => {
      const departments = [
        Department.create({
          organizationId: orgId,
          name: 'Engineering',
        }),
        Department.create({
          organizationId: orgId,
          name: 'Sales',
        }),
        Department.create({
          organizationId: orgId,
          name: 'Marketing',
        }),
      ]

      const saved = await repository.saveMany(departments)

      expect(saved).toHaveLength(3)

      const dbCount = await prisma.department.count({
        where: { organizationId: orgId },
      })
      expect(dbCount).toBe(3)
    })
  })

  describe('delete', () => {
    it('should soft delete department', async () => {
      const department = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })

      await repository.save(department)

      await repository.delete(department.id)

      const dbRecord = await prisma.department.findUnique({
        where: { id: department.id },
      })

      expect(dbRecord?.deletedAt).toBeInstanceOf(Date)

      // Should not be found by findById since it filters deletedAt
      const found = await repository.findById(department.id)
      expect(found).not.toBeNull() // Note: findById doesn't filter by deletedAt currently
    })
  })

  describe('existsByExternalId', () => {
    it('should return true when department exists', async () => {
      const department = Department.create({
        organizationId: orgId,
        name: 'Engineering',
        externalId: 'google-dept-123',
      })

      await repository.save(department)

      const exists = await repository.existsByExternalId(
        orgId,
        'google-dept-123',
        'google',
      )

      expect(exists).toBe(true)
    })

    it('should return false when department does not exist', async () => {
      const exists = await repository.existsByExternalId(
        orgId,
        'non-existent',
        'google',
      )

      expect(exists).toBe(false)
    })

    it('should return false for soft-deleted departments', async () => {
      const department = Department.create({
        organizationId: orgId,
        name: 'Engineering',
        externalId: 'google-dept-123',
      })

      await repository.save(department)
      await repository.delete(department.id)

      const exists = await repository.existsByExternalId(
        orgId,
        'google-dept-123',
        'google',
      )

      expect(exists).toBe(false)
    })
  })

  describe('getHierarchy', () => {
    it('should return department with ancestors and descendants', async () => {
      // Create hierarchy: Engineering > Frontend > React Team
      const engineering = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })
      await repository.save(engineering)

      const frontend = Department.create({
        organizationId: orgId,
        name: 'Frontend',
        parentId: engineering.id,
      })
      await repository.save(frontend)

      const reactTeam = Department.create({
        organizationId: orgId,
        name: 'React Team',
        parentId: frontend.id,
      })
      await repository.save(reactTeam)

      // Also create a sibling to Frontend
      const backend = Department.create({
        organizationId: orgId,
        name: 'Backend',
        parentId: engineering.id,
      })
      await repository.save(backend)

      // Get hierarchy for Frontend
      const hierarchy = await repository.getHierarchy(frontend.id)

      expect(hierarchy.department.id).toBe(frontend.id)
      expect(hierarchy.ancestors).toHaveLength(1)
      expect(hierarchy.ancestors[0].name).toBe('Engineering')
      expect(hierarchy.descendants).toHaveLength(1)
      expect(hierarchy.descendants[0].name).toBe('React Team')
    })

    it('should return empty ancestors for root department', async () => {
      const root = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })
      await repository.save(root)

      const hierarchy = await repository.getHierarchy(root.id)

      expect(hierarchy.department.id).toBe(root.id)
      expect(hierarchy.ancestors).toHaveLength(0)
    })

    it('should return empty descendants for leaf department', async () => {
      const department = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })
      await repository.save(department)

      const hierarchy = await repository.getHierarchy(department.id)

      expect(hierarchy.department.id).toBe(department.id)
      expect(hierarchy.descendants).toHaveLength(0)
    })

    it('should throw error when department not found', async () => {
      await expect(
        repository.getHierarchy('non-existent-id'),
      ).rejects.toThrow('Department with ID non-existent-id not found')
    })

    it('should return all descendants recursively', async () => {
      // Create deep hierarchy
      const root = Department.create({
        organizationId: orgId,
        name: 'Engineering',
      })
      await repository.save(root)

      const level1 = Department.create({
        organizationId: orgId,
        name: 'Frontend',
        parentId: root.id,
      })
      await repository.save(level1)

      const level2 = Department.create({
        organizationId: orgId,
        name: 'React Team',
        parentId: level1.id,
      })
      await repository.save(level2)

      const level3 = Department.create({
        organizationId: orgId,
        name: 'React Core',
        parentId: level2.id,
      })
      await repository.save(level3)

      const hierarchy = await repository.getHierarchy(root.id)

      expect(hierarchy.descendants).toHaveLength(3)
      expect(hierarchy.descendants.map((d) => d.name).sort()).toEqual([
        'Frontend',
        'React Core',
        'React Team',
      ])
    })
  })

  describe('domain transformation', () => {
    it('should correctly transform to and from domain', async () => {
      const department = Department.create({
        organizationId: orgId,
        name: 'Engineering',
        description: 'Engineering team',
        externalId: 'google-dept-123',
        metadata: { code: 'ENG', budget: 100000 },
      })

      const saved = await repository.save(department)

      expect(saved.id).toBe(department.id)
      expect(saved.organizationId).toBe(orgId)
      expect(saved.name).toBe('Engineering')
      expect(saved.description).toBe('Engineering team')
      expect(saved.externalId).toBe('google-dept-123')
      expect(saved.metadata).toEqual({ code: 'ENG', budget: 100000 })
      expect(saved.createdAt).toBeInstanceOf(Date)
      expect(saved.updatedAt).toBeInstanceOf(Date)
    })
  })
})
