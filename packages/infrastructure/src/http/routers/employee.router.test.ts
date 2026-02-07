/**
 * Integration Tests for Employee tRPC Router
 *
 * Tests API layer with real database, focusing on:
 * - Authentication (UNAUTHORIZED when not logged in)
 * - Authorization (FORBIDDEN when no org access)
 * - Input validation
 * - Business logic integration
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { PrismaClient } from '@saastral/database'
import { appRouter } from './index'
import { getPrismaClient } from '../../../test/db-setup'
import type { Context } from '../trpc'

describe('Employee Router', () => {
  let prisma: PrismaClient
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

  describe('getKPIs', () => {
    it('should return KPIs for authenticated user with org access', async () => {
      const caller = createCaller({ userId })

      const result = await caller.employee.getKPIs({ organizationId: orgId })

      expect(result).toBeDefined()
      expect(result.totalEmployees).toBeDefined()
      expect(result.activeEmployees).toBeDefined()
      expect(result.offboardedEmployees).toBeDefined()
    })

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const caller = createCaller({})

      await expect(
        caller.employee.getKPIs({ organizationId: orgId })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      })
    })

    it('should throw FORBIDDEN when user has no access to organization', async () => {
      const caller = createCaller({ userId })

      await expect(
        caller.employee.getKPIs({ organizationId: otherOrgId })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'You do not have access to this organization',
      })
    })

    it('should validate UUID format for organizationId', async () => {
      const caller = createCaller({ userId })

      await expect(
        caller.employee.getKPIs({ organizationId: 'not-a-uuid' })
      ).rejects.toThrow()
    })
  })

  describe('list', () => {
    beforeEach(async () => {
      // Create some test employees
      await prisma.employee.createMany({
        data: [
          {
            id: crypto.randomUUID(),
            organizationId: orgId,
            name: 'Alice Active',
            email: `alice-${Date.now()}@example.com`,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            organizationId: orgId,
            name: 'Bob Offboarded',
            email: `bob-${Date.now()}@example.com`,
            status: 'offboarded',
            offboardedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })
    })

    it('should return paginated employees', async () => {
      const caller = createCaller({ userId })

      const result = await caller.employee.list({ organizationId: orgId })

      expect(result).toBeDefined()
      expect(result.employees).toBeInstanceOf(Array)
      expect(result.total).toBeGreaterThanOrEqual(2)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it('should filter by status', async () => {
      const caller = createCaller({ userId })

      const activeResult = await caller.employee.list({
        organizationId: orgId,
        status: 'active',
      })

      expect(activeResult.employees.every((emp: any) => emp.status === 'active')).toBe(true)
    })

    it('should support search', async () => {
      const caller = createCaller({ userId })

      const result = await caller.employee.list({
        organizationId: orgId,
        search: 'Alice',
      })

      expect(result.employees.length).toBeGreaterThanOrEqual(1)
      expect(result.employees.some((emp: any) => emp.name.includes('Alice'))).toBe(true)
    })

    it('should support pagination', async () => {
      const caller = createCaller({ userId })

      const page1 = await caller.employee.list({
        organizationId: orgId,
        page: 1,
        pageSize: 1,
      })

      expect(page1.employees).toHaveLength(1)
      expect(page1.page).toBe(1)

      if (page1.total > 1) {
        const page2 = await caller.employee.list({
          organizationId: orgId,
          page: 2,
          pageSize: 1,
        })

        expect(page2.employees).toHaveLength(1)
        expect(page2.page).toBe(2)
        expect(page2.employees[0].id).not.toBe(page1.employees[0].id)
      }
    })

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const caller = createCaller({})

      await expect(
        caller.employee.list({ organizationId: orgId })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    })

    it('should throw FORBIDDEN for unauthorized org', async () => {
      const caller = createCaller({ userId })

      await expect(
        caller.employee.list({ organizationId: otherOrgId })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })

    it('should validate input schema', async () => {
      const caller = createCaller({ userId })

      // Invalid page (must be positive)
      await expect(
        caller.employee.list({ organizationId: orgId, page: 0 })
      ).rejects.toThrow()

      // Invalid pageSize (must be positive)
      await expect(
        caller.employee.list({ organizationId: orgId, pageSize: 0 })
      ).rejects.toThrow()

      // Invalid pageSize (max 100)
      await expect(
        caller.employee.list({ organizationId: orgId, pageSize: 101 })
      ).rejects.toThrow()
    })
  })

  describe('getOffboardingAlerts', () => {
    beforeEach(async () => {
      // Create offboarded employee with subscriptions
      const employee = await prisma.employee.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: orgId,
          name: 'Offboarded Employee',
          email: `offboarded-${Date.now()}@example.com`,
          status: 'offboarded',
          offboardedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // Create subscription
      const subscription = await prisma.subscription.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: orgId,
          name: 'Slack',
          category: 'communication',
          status: 'active',
          totalSeats: 10,
          usedSeats: 5,
          pricePerUnit: 1000n,
          totalMonthlyCost: 10000n,
          billingCycle: 'monthly',
          pricingModel: 'per_seat',
          currency: 'BRL',
          startDate: new Date(),
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // Link employee to subscription
      await prisma.subscriptionUser.create({
        data: {
          subscriptionId: subscription.id,
          employeeId: employee.id,
          assignedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    })

    it('should return offboarding alerts', async () => {
      const caller = createCaller({ userId })

      const result = await caller.employee.getOffboardingAlerts({
        organizationId: orgId,
      })

      expect(result).toBeInstanceOf(Array)
      // Should have at least the employee we created
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it('should respect limit parameter', async () => {
      const caller = createCaller({ userId })

      const result = await caller.employee.getOffboardingAlerts({
        organizationId: orgId,
        limit: 1,
      })

      expect(result.length).toBeLessThanOrEqual(1)
    })

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const caller = createCaller({})

      await expect(
        caller.employee.getOffboardingAlerts({ organizationId: orgId })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    })

    it('should throw FORBIDDEN for unauthorized org', async () => {
      const caller = createCaller({ userId })

      await expect(
        caller.employee.getOffboardingAlerts({ organizationId: otherOrgId })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })
  })

  describe('getDepartmentBreakdown', () => {
    beforeEach(async () => {
      // Create department
      const department = await prisma.department.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: orgId,
          name: 'Engineering',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // Create employees in department
      await prisma.employee.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: orgId,
          departmentId: department.id,
          name: 'Engineer 1',
          email: `eng1-${Date.now()}@example.com`,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    })

    it('should return department breakdown', async () => {
      const caller = createCaller({ userId })

      const result = await caller.employee.getDepartmentBreakdown({
        organizationId: orgId,
      })

      expect(result).toBeInstanceOf(Array)
      // Should have at least one department with employees
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('departmentName')
        expect(result[0]).toHaveProperty('employeeCount')
      }
    })

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const caller = createCaller({})

      await expect(
        caller.employee.getDepartmentBreakdown({ organizationId: orgId })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    })

    it('should throw FORBIDDEN for unauthorized org', async () => {
      const caller = createCaller({ userId })

      await expect(
        caller.employee.getDepartmentBreakdown({ organizationId: otherOrgId })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })
  })

  describe('authorization', () => {
    it('should allow admin user to access their organization', async () => {
      const caller = createCaller({ userId })

      // Should not throw
      await expect(
        caller.employee.getKPIs({ organizationId: orgId })
      ).resolves.toBeDefined()
    })

    it('should prevent user from accessing other organizations', async () => {
      const caller = createCaller({ userId })

      await expect(
        caller.employee.getKPIs({ organizationId: otherOrgId })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })

    it('should prevent unauthenticated requests', async () => {
      const caller = createCaller({})

      await expect(
        caller.employee.getKPIs({ organizationId: orgId })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    })

    it('should prevent access with undefined userId', async () => {
      const caller = createCaller({ userId: undefined })

      await expect(
        caller.employee.getKPIs({ organizationId: orgId })
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    })
  })
})
