/**
 * Integration Tests for PrismaOrganizationMemberRepository
 *
 * Tests organization member persistence with real PostgreSQL database.
 * Covers CRUD operations, role management, and user-organization relationships.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { PrismaClient } from '@saastral/database'
import { PrismaOrganizationMemberRepository } from './organization-member.repository'
import { getPrismaClient } from '../../../test/db-setup'

describe('PrismaOrganizationMemberRepository', () => {
  let prisma: PrismaClient
  let repository: PrismaOrganizationMemberRepository
  let userId1: string
  let userId2: string
  let orgId1: string
  let orgId2: string

  beforeEach(async () => {
    prisma = getPrismaClient()
    repository = new PrismaOrganizationMemberRepository(prisma)

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        id: `user-${Date.now()}-${Math.random()}`,
        name: 'Test User 1',
        email: `test1-${Date.now()}@example.com`,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    userId1 = user1.id

    const user2 = await prisma.user.create({
      data: {
        id: `user-${Date.now()}-${Math.random()}`,
        name: 'Test User 2',
        email: `test2-${Date.now()}@example.com`,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    userId2 = user2.id

    // Create test organizations
    const org1 = await prisma.organization.create({
      data: {
        id: `org-${Date.now()}-${Math.random()}`,
        name: 'Test Organization 1',
        slug: `test-org-1-${Date.now()}`,
        plan: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    orgId1 = org1.id

    const org2 = await prisma.organization.create({
      data: {
        id: `org-${Date.now()}-${Math.random()}`,
        name: 'Test Organization 2',
        slug: `test-org-2-${Date.now()}`,
        plan: 'team',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    orgId2 = org2.id
  })

  describe('create', () => {
    it('should create new organization member', async () => {
      const input = {
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      }

      const member = await repository.create(input)

      expect(member.organizationId).toBe(orgId1)
      expect(member.userId).toBe(userId1)
      expect(member.role).toBe('admin')
      expect(member.acceptedAt).toBeInstanceOf(Date)
      expect(member.createdAt).toBeInstanceOf(Date)
      expect(member.updatedAt).toBeInstanceOf(Date)
    })

    it('should create member with pending invitation (no acceptedAt)', async () => {
      const input = {
        organizationId: orgId1,
        userId: userId1,
        role: 'member' as const,
        acceptedAt: null,
      }

      const member = await repository.create(input)

      expect(member.organizationId).toBe(orgId1)
      expect(member.userId).toBe(userId1)
      expect(member.role).toBe('member')
      expect(member.acceptedAt).toBeNull()
    })

    it('should enforce unique constraint on (organizationId, userId)', async () => {
      const input = {
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      }

      await repository.create(input)

      // Try to create duplicate membership
      await expect(repository.create(input)).rejects.toThrow()
    })

    it('should allow same user in different organizations', async () => {
      const member1 = await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      })

      const member2 = await repository.create({
        organizationId: orgId2,
        userId: userId1,
        role: 'member' as const,
        acceptedAt: new Date(),
      })

      expect(member1.organizationId).toBe(orgId1)
      expect(member2.organizationId).toBe(orgId2)
      expect(member1.userId).toBe(userId1)
      expect(member2.userId).toBe(userId1)
    })
  })

  describe('findByOrganizationAndUser', () => {
    it('should find organization member by composite key', async () => {
      await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      })

      const found = await repository.findByOrganizationAndUser(orgId1, userId1)

      expect(found).not.toBeNull()
      expect(found?.organizationId).toBe(orgId1)
      expect(found?.userId).toBe(userId1)
      expect(found?.role).toBe('admin')
    })

    it('should return null when membership not found', async () => {
      const found = await repository.findByOrganizationAndUser(orgId1, userId1)
      expect(found).toBeNull()
    })

    it('should return null for wrong organization', async () => {
      await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      })

      const found = await repository.findByOrganizationAndUser(orgId2, userId1)
      expect(found).toBeNull()
    })

    it('should return null for wrong user', async () => {
      await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      })

      const found = await repository.findByOrganizationAndUser(orgId1, userId2)
      expect(found).toBeNull()
    })
  })

  describe('listByOrganization', () => {
    it('should list all members of an organization', async () => {
      await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      })

      await repository.create({
        organizationId: orgId1,
        userId: userId2,
        role: 'member' as const,
        acceptedAt: new Date(),
      })

      const members = await repository.listByOrganization(orgId1)

      expect(members).toHaveLength(2)
      expect(members.map((m) => m.userId).sort()).toEqual([userId1, userId2].sort())
    })

    it('should return empty array for organization with no members', async () => {
      const members = await repository.listByOrganization(orgId1)
      expect(members).toEqual([])
    })

    it('should not include members from other organizations', async () => {
      await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      })

      await repository.create({
        organizationId: orgId2,
        userId: userId2,
        role: 'admin' as const,
        acceptedAt: new Date(),
      })

      const membersOrg1 = await repository.listByOrganization(orgId1)
      const membersOrg2 = await repository.listByOrganization(orgId2)

      expect(membersOrg1).toHaveLength(1)
      expect(membersOrg1[0].userId).toBe(userId1)

      expect(membersOrg2).toHaveLength(1)
      expect(membersOrg2[0].userId).toBe(userId2)
    })
  })

  describe('updateRole', () => {
    it('should update member role', async () => {
      await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'member' as const,
        acceptedAt: new Date(),
      })

      const updated = await repository.updateRole(orgId1, userId1, 'admin')

      expect(updated.role).toBe('admin')
      expect(updated.organizationId).toBe(orgId1)
      expect(updated.userId).toBe(userId1)
    })

    it('should allow downgrading from admin to member', async () => {
      await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      })

      const updated = await repository.updateRole(orgId1, userId1, 'member')

      expect(updated.role).toBe('member')
    })

    it('should allow changing to viewer role', async () => {
      await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'member' as const,
        acceptedAt: new Date(),
      })

      const updated = await repository.updateRole(orgId1, userId1, 'viewer')

      expect(updated.role).toBe('viewer')
    })

    it('should throw when updating non-existent membership', async () => {
      await expect(
        repository.updateRole(orgId1, userId1, 'admin')
      ).rejects.toThrow()
    })
  })

  describe('remove', () => {
    it('should remove organization member', async () => {
      await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      })

      await repository.remove(orgId1, userId1)

      const found = await repository.findByOrganizationAndUser(orgId1, userId1)
      expect(found).toBeNull()
    })

    it('should throw when removing non-existent membership', async () => {
      await expect(repository.remove(orgId1, userId1)).rejects.toThrow()
    })

    it('should not affect other memberships', async () => {
      await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      })

      await repository.create({
        organizationId: orgId1,
        userId: userId2,
        role: 'member' as const,
        acceptedAt: new Date(),
      })

      await repository.remove(orgId1, userId1)

      const remainingMembers = await repository.listByOrganization(orgId1)
      expect(remainingMembers).toHaveLength(1)
      expect(remainingMembers[0].userId).toBe(userId2)
    })
  })

  describe('listOrganizationsByUser', () => {
    it('should list all organizations user belongs to', async () => {
      await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      })

      await repository.create({
        organizationId: orgId2,
        userId: userId1,
        role: 'member' as const,
        acceptedAt: new Date(),
      })

      const orgs = await repository.listOrganizationsByUser(userId1)

      expect(orgs).toHaveLength(2)
      expect(orgs.map((o) => o.id).sort()).toEqual([orgId1, orgId2].sort())

      // Check that organization data is included
      expect(orgs.find((o) => o.id === orgId1)?.name).toBe('Test Organization 1')
      expect(orgs.find((o) => o.id === orgId2)?.name).toBe('Test Organization 2')

      // Check that roles are included
      expect(orgs.find((o) => o.id === orgId1)?.role).toBe('admin')
      expect(orgs.find((o) => o.id === orgId2)?.role).toBe('member')
    })

    it('should return empty array for user with no organizations', async () => {
      const orgs = await repository.listOrganizationsByUser(userId1)
      expect(orgs).toEqual([])
    })

    it('should include organization slug in response', async () => {
      await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      })

      const orgs = await repository.listOrganizationsByUser(userId1)

      expect(orgs[0].slug).toBeDefined()
      expect(orgs[0].slug).toContain('test-org-1-')
    })
  })

  describe('domain transformation', () => {
    it('should correctly transform to domain OrganizationMemberData', async () => {
      const acceptedAt = new Date('2024-01-01T00:00:00.000Z')

      const member = await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt,
      })

      expect(member).toMatchObject({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin',
        acceptedAt,
      })
      expect(member.createdAt).toBeInstanceOf(Date)
      expect(member.updatedAt).toBeInstanceOf(Date)
    })

    it('should handle null acceptedAt', async () => {
      const member = await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'member' as const,
        acceptedAt: null,
      })

      expect(member.acceptedAt).toBeNull()
    })
  })

  describe('role management', () => {
    it('should support all role types', async () => {
      const roles: Array<'admin' | 'member' | 'viewer'> = [
        'admin',
        'member',
        'viewer',
      ]

      for (const role of roles) {
        // Create a unique user for each role
        const user = await prisma.user.create({
          data: {
            id: `user-${Date.now()}-${Math.random()}`,
            name: `User ${role}`,
            email: `${role}-${Date.now()}@example.com`,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })

        const member = await repository.create({
          organizationId: orgId1,
          userId: user.id,
          role,
          acceptedAt: new Date(),
        })

        expect(member.role).toBe(role)
      }

      const members = await repository.listByOrganization(orgId1)
      expect(members.map((m) => m.role).sort()).toEqual(['admin', 'member', 'viewer'])
    })
  })

  describe('invitation workflow', () => {
    it('should create pending invitation without acceptedAt', async () => {
      const member = await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'member' as const,
        acceptedAt: null,
      })

      expect(member.acceptedAt).toBeNull()
      expect(member.role).toBe('member')
    })

    it('should track accepted invitations', async () => {
      const member = await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'member' as const,
        acceptedAt: new Date(),
      })

      expect(member.acceptedAt).toBeInstanceOf(Date)
    })
  })

  describe('multiple memberships', () => {
    it('should allow user to be member of multiple organizations with different roles', async () => {
      // User 1 is admin in org1, member in org2
      await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      })

      await repository.create({
        organizationId: orgId2,
        userId: userId1,
        role: 'member' as const,
        acceptedAt: new Date(),
      })

      const org1Member = await repository.findByOrganizationAndUser(orgId1, userId1)
      const org2Member = await repository.findByOrganizationAndUser(orgId2, userId1)

      expect(org1Member?.role).toBe('admin')
      expect(org2Member?.role).toBe('member')

      const userOrgs = await repository.listOrganizationsByUser(userId1)
      expect(userOrgs).toHaveLength(2)
    })

    it('should allow multiple users in same organization with different roles', async () => {
      await repository.create({
        organizationId: orgId1,
        userId: userId1,
        role: 'admin' as const,
        acceptedAt: new Date(),
      })

      await repository.create({
        organizationId: orgId1,
        userId: userId2,
        role: 'viewer' as const,
        acceptedAt: new Date(),
      })

      const members = await repository.listByOrganization(orgId1)
      expect(members).toHaveLength(2)

      const user1Member = members.find((m) => m.userId === userId1)
      const user2Member = members.find((m) => m.userId === userId2)

      expect(user1Member?.role).toBe('admin')
      expect(user2Member?.role).toBe('viewer')
    })
  })
})
