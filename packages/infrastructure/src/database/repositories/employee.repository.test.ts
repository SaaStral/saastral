import { describe, it, expect, beforeEach } from 'vitest'
import type { PrismaClient } from '@saastral/database'
import { PrismaEmployeeRepository } from './employee.repository'
import { Employee, Email } from '@saastral/core'
import { getPrismaClient } from '../../../test/db-setup'

describe('PrismaEmployeeRepository', () => {
  let prisma: PrismaClient
  let repository: PrismaEmployeeRepository
  let orgId: string

  beforeEach(async () => {
    // Use the shared Prisma client from global setup
    prisma = getPrismaClient()
    repository = new PrismaEmployeeRepository(prisma)

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
    it('should create new employee in database', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'John Doe',
        email: Email.create('john@example.com'),
      })

      const saved = await repository.save(employee)

      expect(saved.id).toBe(employee.id)
      expect(saved.name).toBe('John Doe')
      expect(saved.email.toString()).toBe('john@example.com')

      // Verify in database
      const dbRecord = await prisma.employee.findUnique({
        where: { id: employee.id },
      })
      expect(dbRecord).not.toBeNull()
      expect(dbRecord!.name).toBe('John Doe')
      expect(dbRecord!.email).toBe('john@example.com')
    })

    it('should update existing employee (upsert)', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'John Doe',
        email: Email.create('john@example.com'),
      })

      await repository.save(employee)

      // Update the employee
      employee.updateProfile({ name: 'Jane Smith' })
      const updated = await repository.save(employee)

      expect(updated.name).toBe('Jane Smith')

      // Verify in database
      const dbRecord = await prisma.employee.findUnique({
        where: { id: employee.id },
      })
      expect(dbRecord!.name).toBe('Jane Smith')
    })

    it('should save employee with all optional fields', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'John Doe',
        email: Email.create('john@example.com'),
        title: 'Software Engineer',
        phone: '+1234567890',
        avatarUrl: 'https://example.com/avatar.jpg',
        externalId: 'google-123',
        externalProvider: 'google',
      })

      const saved = await repository.save(employee)

      expect(saved.title).toBe('Software Engineer')
      expect(saved.phone).toBe('+1234567890')
      expect(saved.avatarUrl).toBe('https://example.com/avatar.jpg')
      expect(saved.externalId).toBe('google-123')
      expect(saved.externalProvider).toBe('google')
    })

    it('should save offboarded employee with timestamp', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'John Doe',
        email: Email.create('john@example.com'),
      })
      employee.offboard()

      const saved = await repository.save(employee)

      expect(saved.status).toBe('offboarded')
      expect(saved.offboardedAt).toBeInstanceOf(Date)

      const dbRecord = await prisma.employee.findUnique({
        where: { id: employee.id },
      })
      expect(dbRecord!.status).toBe('offboarded')
      expect(dbRecord!.offboardedAt).toBeInstanceOf(Date)
    })
  })

  describe('findById', () => {
    it('should find employee by ID', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'John Doe',
        email: Email.create('john@example.com'),
      })
      await repository.save(employee)

      const found = await repository.findById(employee.id, orgId)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(employee.id)
      expect(found!.name).toBe('John Doe')
      expect(found!.email.toString()).toBe('john@example.com')
    })

    it('should return null when employee not found', async () => {
      const found = await repository.findById('non-existent-id', orgId)

      expect(found).toBeNull()
    })

    it('should return null when employee belongs to different organization', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'John Doe',
        email: Email.create('john@example.com'),
      })
      await repository.save(employee)

      const found = await repository.findById(employee.id, 'different-org-id')

      expect(found).toBeNull()
    })

    it('should not return soft-deleted employees', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'John Doe',
        email: Email.create('john@example.com'),
      })
      await repository.save(employee)
      await repository.delete(employee.id, orgId)

      const found = await repository.findById(employee.id, orgId)

      expect(found).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should find employee by email', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'John Doe',
        email: Email.create('john@example.com'),
      })
      await repository.save(employee)

      const found = await repository.findByEmail('john@example.com', orgId)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(employee.id)
      expect(found!.email.toString()).toBe('john@example.com')
    })

    it('should be case-insensitive', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'John Doe',
        email: Email.create('john@example.com'),
      })
      await repository.save(employee)

      const found = await repository.findByEmail('JOHN@EXAMPLE.COM', orgId)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(employee.id)
    })

    it('should return null when email not found', async () => {
      const found = await repository.findByEmail('nonexistent@example.com', orgId)

      expect(found).toBeNull()
    })

    it('should respect organization boundary', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'John Doe',
        email: Email.create('john@example.com'),
      })
      await repository.save(employee)

      const found = await repository.findByEmail('john@example.com', 'different-org-id')

      expect(found).toBeNull()
    })
  })

  describe('findByExternalId', () => {
    it('should find employee by external ID', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'John Doe',
        email: Email.create('john@example.com'),
        externalId: 'google-123',
        externalProvider: 'google',
      })
      await repository.save(employee)

      const found = await repository.findByExternalId('google-123', orgId)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(employee.id)
      expect(found!.externalId).toBe('google-123')
    })

    it('should return null when external ID not found', async () => {
      const found = await repository.findByExternalId('nonexistent-id', orgId)

      expect(found).toBeNull()
    })

    it('should respect organization boundary', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'John Doe',
        email: Email.create('john@example.com'),
        externalId: 'google-123',
        externalProvider: 'google',
      })
      await repository.save(employee)

      const found = await repository.findByExternalId('google-123', 'different-org-id')

      expect(found).toBeNull()
    })
  })

  describe('list', () => {
    beforeEach(async () => {
      // Create multiple employees for list testing
      const employees = [
        Employee.create({
          organizationId: orgId,
          name: 'Alice Smith',
          email: Email.create('alice@example.com'),
        }),
        Employee.create({
          organizationId: orgId,
          name: 'Bob Johnson',
          email: Email.create('bob@example.com'),
        }),
        Employee.create({
          organizationId: orgId,
          name: 'Charlie Brown',
          email: Email.create('charlie@example.com'),
        }),
      ]

      for (const emp of employees) {
        await repository.save(emp)
      }
    })

    it('should list all employees with pagination', async () => {
      const result = await repository.list(
        orgId,
        {},
        { page: 1, pageSize: 10 }
      )

      expect(result.employees).toHaveLength(3)
      expect(result.totalCount).toBe(3)
    })

    it('should apply pagination correctly', async () => {
      const result = await repository.list(
        orgId,
        {},
        { page: 1, pageSize: 2 }
      )

      expect(result.employees).toHaveLength(2)
      expect(result.totalCount).toBe(3)
    })

    it('should filter by status', async () => {
      // Offboard one employee
      const employees = await prisma.employee.findMany({
        where: { organizationId: orgId },
        take: 1,
      })
      await prisma.employee.update({
        where: { id: employees[0]!.id },
        data: { status: 'offboarded', offboardedAt: new Date() },
      })

      const result = await repository.list(
        orgId,
        { status: 'active' },
        { page: 1, pageSize: 10 }
      )

      expect(result.employees).toHaveLength(2)
      expect(result.employees.every(e => e.status === 'active')).toBe(true)
    })

    it('should filter by search query', async () => {
      const result = await repository.list(
        orgId,
        { search: 'Alice' },
        { page: 1, pageSize: 10 }
      )

      expect(result.employees).toHaveLength(1)
      expect(result.employees[0]!.name).toBe('Alice Smith')
    })

    it('should search by email', async () => {
      const result = await repository.list(
        orgId,
        { search: 'bob@example' },
        { page: 1, pageSize: 10 }
      )

      expect(result.employees).toHaveLength(1)
      expect(result.employees[0]!.email).toBe('bob@example.com')
    })

    it('should not return deleted employees', async () => {
      const employees = await prisma.employee.findMany({
        where: { organizationId: orgId },
        take: 1,
      })
      await prisma.employee.update({
        where: { id: employees[0]!.id },
        data: { deletedAt: new Date() },
      })

      const result = await repository.list(
        orgId,
        {},
        { page: 1, pageSize: 10 }
      )

      expect(result.employees).toHaveLength(2)
    })
  })

  describe('countByStatus', () => {
    beforeEach(async () => {
      // Create employees with different statuses
      await repository.save(
        Employee.create({
          organizationId: orgId,
          name: 'Active 1',
          email: Email.create('active1@example.com'),
        })
      )
      await repository.save(
        Employee.create({
          organizationId: orgId,
          name: 'Active 2',
          email: Email.create('active2@example.com'),
        })
      )

      const offboarded = Employee.create({
        organizationId: orgId,
        name: 'Offboarded',
        email: Email.create('offboarded@example.com'),
      })
      offboarded.offboard()
      await repository.save(offboarded)
    })

    it('should count all employees when no status provided', async () => {
      const count = await repository.countByStatus(orgId)

      expect(count).toBe(3)
    })

    it('should count active employees', async () => {
      const count = await repository.countByStatus(orgId, 'active')

      expect(count).toBe(2)
    })

    it('should count offboarded employees', async () => {
      const count = await repository.countByStatus(orgId, 'offboarded')

      expect(count).toBe(1)
    })

    it('should not count deleted employees', async () => {
      const employees = await prisma.employee.findMany({
        where: { organizationId: orgId, status: 'active' },
        take: 1,
      })
      await prisma.employee.update({
        where: { id: employees[0]!.id },
        data: { deletedAt: new Date() },
      })

      const count = await repository.countByStatus(orgId, 'active')

      expect(count).toBe(1)
    })
  })

  describe('countOffboardedWithActiveSubscriptions', () => {
    it('should count offboarded employees with active subscriptions', async () => {
      // Create offboarded employee
      const employee = Employee.create({
        organizationId: orgId,
        name: 'Offboarded',
        email: Email.create('offboarded@example.com'),
      })
      employee.offboard()
      await repository.save(employee)

      // Create subscription
      const subscription = await prisma.subscription.create({
        data: {
          id: `sub-${Date.now()}`,
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
          id: `su-${Date.now()}`,
          subscriptionId: subscription.id,
          employeeId: employee.id,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const count = await repository.countOffboardedWithActiveSubscriptions(orgId)

      expect(count).toBe(1)
    })

    it('should not count offboarded employees without subscriptions', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'Offboarded',
        email: Email.create('offboarded@example.com'),
      })
      employee.offboard()
      await repository.save(employee)

      const count = await repository.countOffboardedWithActiveSubscriptions(orgId)

      expect(count).toBe(0)
    })
  })

  describe('delete', () => {
    it('should soft delete employee', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'John Doe',
        email: Email.create('john@example.com'),
      })
      await repository.save(employee)

      await repository.delete(employee.id, orgId)

      const dbRecord = await prisma.employee.findUnique({
        where: { id: employee.id },
      })
      expect(dbRecord!.deletedAt).toBeInstanceOf(Date)

      // Verify it's not returned by findById
      const found = await repository.findById(employee.id, orgId)
      expect(found).toBeNull()
    })
  })

  describe('bulkUpdateMonthlyCosts', () => {
    it('should update monthly costs for multiple employees', async () => {
      const emp1 = Employee.create({
        organizationId: orgId,
        name: 'Employee 1',
        email: Email.create('emp1@example.com'),
      })
      const emp2 = Employee.create({
        organizationId: orgId,
        name: 'Employee 2',
        email: Email.create('emp2@example.com'),
      })
      await repository.save(emp1)
      await repository.save(emp2)

      await repository.bulkUpdateMonthlyCosts([
        { employeeId: emp1.id, costInCents: 5000n },
        { employeeId: emp2.id, costInCents: 7500n },
      ])

      const updated1 = await repository.findById(emp1.id, orgId)
      const updated2 = await repository.findById(emp2.id, orgId)

      expect(updated1!.monthlySaasCost).toBe(5000n)
      expect(updated2!.monthlySaasCost).toBe(7500n)
    })
  })

  describe('domain transformation', () => {
    it('should correctly transform from domain to persistence', async () => {
      const employee = Employee.create({
        organizationId: orgId,
        name: 'John Doe',
        email: Email.create('john@example.com'),
        title: 'Engineer',
        phone: '+123456',
      })

      await repository.save(employee)

      const dbRecord = await prisma.employee.findUnique({
        where: { id: employee.id },
      })

      expect(dbRecord!.email).toBe('john@example.com') // Email toString
      expect(dbRecord!.title).toBe('Engineer')
      expect(dbRecord!.phone).toBe('+123456')
    })

    it('should correctly transform from persistence to domain', async () => {
      const dbRecord = await prisma.employee.create({
        data: {
          id: `emp-${Date.now()}`,
          organizationId: orgId,
          name: 'Jane Doe',
          email: 'jane@example.com',
          status: 'active',
          metadata: { customField: 'value' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const employee = await repository.findById(dbRecord.id, orgId)

      expect(employee).not.toBeNull()
      expect(employee!.email).toBeInstanceOf(Email)
      expect(employee!.email.toString()).toBe('jane@example.com')
      expect(employee!.metadata).toEqual({ customField: 'value' })
    })
  })
})
