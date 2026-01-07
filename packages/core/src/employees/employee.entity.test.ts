import { describe, it, expect, beforeEach } from 'vitest'
import { Employee } from './employee.entity'
import { Email } from '../shared/value-objects/email'
import { EmployeeAlreadyOffboardedError, InvalidEmployeeStatusError } from './employee.errors'
import { EmployeeFactory } from '../../test/factories/employee.factory'

describe('Employee Entity', () => {
  describe('create', () => {
    it('should create employee with auto-generated ID and timestamps', () => {
      const employee = Employee.create({
        organizationId: 'org-123',
        name: 'John Doe',
        email: Email.create('john@example.com'),
      })

      expect(employee.id).toBeDefined()
      expect(employee.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i) // UUID v4
      expect(employee.createdAt).toBeInstanceOf(Date)
      expect(employee.updatedAt).toBeInstanceOf(Date)
    })

    it('should default to active status', () => {
      const employee = Employee.create({
        organizationId: 'org-123',
        name: 'John Doe',
        email: Email.create('john@example.com'),
      })

      expect(employee.status).toBe('active')
      expect(employee.isActive()).toBe(true)
      expect(employee.isSuspended()).toBe(false)
      expect(employee.isOffboarded()).toBe(false)
    })

    it('should initialize with empty metadata', () => {
      const employee = Employee.create({
        organizationId: 'org-123',
        name: 'John Doe',
        email: Email.create('john@example.com'),
      })

      expect(employee.metadata).toEqual({})
    })

    it('should create with all optional fields', () => {
      const hiredAt = new Date('2024-01-01')

      const employee = Employee.create({
        organizationId: 'org-123',
        name: 'John Doe',
        email: Email.create('john@example.com'),
        title: 'Software Engineer',
        phone: '+1234567890',
        avatarUrl: 'https://example.com/avatar.jpg',
        departmentId: 'dept-123',
        managerId: 'mgr-123',
        hiredAt,
        externalId: 'ext-123',
        externalProvider: 'google',
      })

      expect(employee.title).toBe('Software Engineer')
      expect(employee.phone).toBe('+1234567890')
      expect(employee.avatarUrl).toBe('https://example.com/avatar.jpg')
      expect(employee.departmentId).toBe('dept-123')
      expect(employee.managerId).toBe('mgr-123')
      expect(employee.hiredAt).toEqual(hiredAt)
      expect(employee.externalId).toBe('ext-123')
      expect(employee.externalProvider).toBe('google')
    })
  })

  describe('reconstitute', () => {
    it('should reconstitute employee from database props', () => {
      const props = {
        id: 'emp-123',
        organizationId: 'org-123',
        name: 'John Doe',
        email: Email.create('john@example.com'),
        status: 'active' as const,
        metadata: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      }

      const employee = Employee.reconstitute(props)

      expect(employee.id).toBe('emp-123')
      expect(employee.name).toBe('John Doe')
      expect(employee.status).toBe('active')
      expect(employee.createdAt).toEqual(props.createdAt)
      expect(employee.updatedAt).toEqual(props.updatedAt)
    })

    it('should reconstitute offboarded employee', () => {
      const offboardedAt = new Date('2024-02-01')

      const employee = Employee.reconstitute({
        id: 'emp-123',
        organizationId: 'org-123',
        name: 'John Doe',
        email: Email.create('john@example.com'),
        status: 'offboarded',
        offboardedAt,
        metadata: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-02-01'),
      })

      expect(employee.isOffboarded()).toBe(true)
      expect(employee.offboardedAt).toEqual(offboardedAt)
    })
  })

  describe('offboard', () => {
    it('should transition active employee to offboarded', () => {
      const employee = EmployeeFactory.create()
      const beforeTimestamp = new Date()

      employee.offboard()

      expect(employee.status).toBe('offboarded')
      expect(employee.isOffboarded()).toBe(true)
      expect(employee.offboardedAt).toBeInstanceOf(Date)
      expect(employee.offboardedAt!.getTime()).toBeGreaterThanOrEqual(beforeTimestamp.getTime())
    })

    it('should transition suspended employee to offboarded', () => {
      const employee = EmployeeFactory.createSuspended()

      employee.offboard()

      expect(employee.status).toBe('offboarded')
      expect(employee.isOffboarded()).toBe(true)
      expect(employee.offboardedAt).toBeInstanceOf(Date)
    })

    it('should update updatedAt timestamp', () => {
      const employee = EmployeeFactory.create()
      const originalUpdatedAt = employee.updatedAt

      // Wait a tiny bit to ensure timestamp changes
      const beforeOffboard = new Date()

      employee.offboard()

      expect(employee.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeOffboard.getTime())
      expect(employee.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())
    })

    it('should throw EmployeeAlreadyOffboardedError when already offboarded', () => {
      const employee = EmployeeFactory.createOffboarded()

      expect(() => employee.offboard()).toThrow(EmployeeAlreadyOffboardedError)
      expect(() => employee.offboard()).toThrow(
        `Employee with id "${employee.id}" is already offboarded`
      )
    })
  })

  describe('suspend', () => {
    it('should transition active employee to suspended', () => {
      const employee = EmployeeFactory.create()

      employee.suspend()

      expect(employee.status).toBe('suspended')
      expect(employee.isSuspended()).toBe(true)
      expect(employee.isActive()).toBe(false)
    })

    it('should update updatedAt timestamp', () => {
      const employee = EmployeeFactory.create()
      const beforeSuspend = new Date()

      employee.suspend()

      expect(employee.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeSuspend.getTime())
    })

    it('should throw InvalidEmployeeStatusError when suspended employee', () => {
      const employee = EmployeeFactory.createSuspended()

      expect(() => employee.suspend()).toThrow(InvalidEmployeeStatusError)
      expect(() => employee.suspend()).toThrow('Cannot suspend employee with status "suspended"')
    })

    it('should throw InvalidEmployeeStatusError when offboarded employee', () => {
      const employee = EmployeeFactory.createOffboarded()

      expect(() => employee.suspend()).toThrow(InvalidEmployeeStatusError)
      expect(() => employee.suspend()).toThrow('Cannot suspend employee with status "offboarded"')
    })
  })

  describe('reactivate', () => {
    it('should transition suspended employee to active', () => {
      const employee = EmployeeFactory.createSuspended()

      employee.reactivate()

      expect(employee.status).toBe('active')
      expect(employee.isActive()).toBe(true)
      expect(employee.isSuspended()).toBe(false)
    })

    it('should update updatedAt timestamp', () => {
      const employee = EmployeeFactory.createSuspended()
      const beforeReactivate = new Date()

      employee.reactivate()

      expect(employee.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeReactivate.getTime())
    })

    it('should throw InvalidEmployeeStatusError when active employee', () => {
      const employee = EmployeeFactory.create()

      expect(() => employee.reactivate()).toThrow(InvalidEmployeeStatusError)
      expect(() => employee.reactivate()).toThrow(
        'Cannot reactivate employee with status "active"'
      )
    })

    it('should throw InvalidEmployeeStatusError when offboarded employee', () => {
      const employee = EmployeeFactory.createOffboarded()

      expect(() => employee.reactivate()).toThrow(InvalidEmployeeStatusError)
      expect(() => employee.reactivate()).toThrow(
        'Cannot reactivate employee with status "offboarded"'
      )
    })
  })

  describe('updateMonthlySaasCost', () => {
    it('should update monthly SaaS cost', () => {
      const employee = EmployeeFactory.create()

      employee.updateMonthlySaasCost(5000n)

      expect(employee.monthlySaasCost).toBe(5000n)
    })

    it('should update updatedAt timestamp', () => {
      const employee = EmployeeFactory.create()
      const beforeUpdate = new Date()

      employee.updateMonthlySaasCost(5000n)

      expect(employee.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should allow updating to zero', () => {
      const employee = EmployeeFactory.create()
      employee.updateMonthlySaasCost(5000n)

      employee.updateMonthlySaasCost(0n)

      expect(employee.monthlySaasCost).toBe(0n)
    })
  })

  describe('updateDepartment', () => {
    it('should update department ID', () => {
      const employee = EmployeeFactory.create()

      employee.updateDepartment('new-dept-123')

      expect(employee.departmentId).toBe('new-dept-123')
    })

    it('should clear department when undefined', () => {
      const employee = EmployeeFactory.create({ departmentId: 'dept-123' })

      employee.updateDepartment(undefined)

      expect(employee.departmentId).toBeUndefined()
    })

    it('should update updatedAt timestamp', () => {
      const employee = EmployeeFactory.create()
      const beforeUpdate = new Date()

      employee.updateDepartment('dept-123')

      expect(employee.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })
  })

  describe('updateManager', () => {
    it('should update manager ID', () => {
      const employee = EmployeeFactory.create()

      employee.updateManager('mgr-456')

      expect(employee.managerId).toBe('mgr-456')
    })

    it('should clear manager when undefined', () => {
      const employee = EmployeeFactory.create({ managerId: 'mgr-123' })

      employee.updateManager(undefined)

      expect(employee.managerId).toBeUndefined()
    })

    it('should update updatedAt timestamp', () => {
      const employee = EmployeeFactory.create()
      const beforeUpdate = new Date()

      employee.updateManager('mgr-456')

      expect(employee.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })
  })

  describe('updateProfile', () => {
    it('should update name only', () => {
      const employee = EmployeeFactory.create({ name: 'Old Name' })

      employee.updateProfile({ name: 'New Name' })

      expect(employee.name).toBe('New Name')
    })

    it('should update title only', () => {
      const employee = EmployeeFactory.create()

      employee.updateProfile({ title: 'Senior Engineer' })

      expect(employee.title).toBe('Senior Engineer')
    })

    it('should update phone only', () => {
      const employee = EmployeeFactory.create()

      employee.updateProfile({ phone: '+1234567890' })

      expect(employee.phone).toBe('+1234567890')
    })

    it('should update avatarUrl only', () => {
      const employee = EmployeeFactory.create()

      employee.updateProfile({ avatarUrl: 'https://new-avatar.com/pic.jpg' })

      expect(employee.avatarUrl).toBe('https://new-avatar.com/pic.jpg')
    })

    it('should update multiple fields', () => {
      const employee = EmployeeFactory.create()

      employee.updateProfile({
        name: 'Jane Smith',
        title: 'Tech Lead',
        phone: '+9876543210',
      })

      expect(employee.name).toBe('Jane Smith')
      expect(employee.title).toBe('Tech Lead')
      expect(employee.phone).toBe('+9876543210')
    })

    it('should update updatedAt timestamp', () => {
      const employee = EmployeeFactory.create()
      const beforeUpdate = new Date()

      employee.updateProfile({ name: 'New Name' })

      expect(employee.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should not modify other fields', () => {
      const employee = EmployeeFactory.create({
        name: 'John Doe',
        title: 'Engineer',
      })

      employee.updateProfile({ phone: '+1234567890' })

      expect(employee.name).toBe('John Doe')
      expect(employee.title).toBe('Engineer')
      expect(employee.phone).toBe('+1234567890')
    })
  })

  describe('updateName', () => {
    it('should update name', () => {
      const employee = EmployeeFactory.create({ name: 'Old Name' })

      employee.updateName('New Name')

      expect(employee.name).toBe('New Name')
    })

    it('should update updatedAt timestamp', () => {
      const employee = EmployeeFactory.create()
      const beforeUpdate = new Date()

      employee.updateName('Updated Name')

      expect(employee.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })
  })

  describe('updateEmail', () => {
    it('should update email', () => {
      const employee = EmployeeFactory.create({ email: 'old@example.com' })
      const newEmail = Email.create('new@example.com')

      employee.updateEmail(newEmail)

      expect(employee.email).toBe(newEmail)
      expect(employee.email.toString()).toBe('new@example.com')
    })

    it('should update updatedAt timestamp', () => {
      const employee = EmployeeFactory.create()
      const beforeUpdate = new Date()

      employee.updateEmail(Email.create('updated@example.com'))

      expect(employee.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })
  })

  describe('updateExternalId', () => {
    it('should update external ID and provider', () => {
      const employee = EmployeeFactory.create()

      employee.updateExternalId('google-123', 'google')

      expect(employee.externalId).toBe('google-123')
      expect(employee.externalProvider).toBe('google')
    })

    it('should update for Microsoft provider', () => {
      const employee = EmployeeFactory.create()

      employee.updateExternalId('ms-456', 'microsoft')

      expect(employee.externalId).toBe('ms-456')
      expect(employee.externalProvider).toBe('microsoft')
    })

    it('should update for Okta provider', () => {
      const employee = EmployeeFactory.create()

      employee.updateExternalId('okta-789', 'okta')

      expect(employee.externalId).toBe('okta-789')
      expect(employee.externalProvider).toBe('okta')
    })

    it('should update for Keycloak provider', () => {
      const employee = EmployeeFactory.create()

      employee.updateExternalId('keycloak-101', 'keycloak')

      expect(employee.externalId).toBe('keycloak-101')
      expect(employee.externalProvider).toBe('keycloak')
    })

    it('should update updatedAt timestamp', () => {
      const employee = EmployeeFactory.create()
      const beforeUpdate = new Date()

      employee.updateExternalId('ext-123', 'google')

      expect(employee.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should replace existing external ID', () => {
      const employee = EmployeeFactory.create({
        externalId: 'old-id',
        externalProvider: 'google',
      })

      employee.updateExternalId('new-id', 'microsoft')

      expect(employee.externalId).toBe('new-id')
      expect(employee.externalProvider).toBe('microsoft')
    })
  })

  describe('computed properties', () => {
    describe('isActive', () => {
      it('should return true for active employee', () => {
        const employee = EmployeeFactory.create()

        expect(employee.isActive()).toBe(true)
      })

      it('should return false for suspended employee', () => {
        const employee = EmployeeFactory.createSuspended()

        expect(employee.isActive()).toBe(false)
      })

      it('should return false for offboarded employee', () => {
        const employee = EmployeeFactory.createOffboarded()

        expect(employee.isActive()).toBe(false)
      })
    })

    describe('isSuspended', () => {
      it('should return true for suspended employee', () => {
        const employee = EmployeeFactory.createSuspended()

        expect(employee.isSuspended()).toBe(true)
      })

      it('should return false for active employee', () => {
        const employee = EmployeeFactory.create()

        expect(employee.isSuspended()).toBe(false)
      })

      it('should return false for offboarded employee', () => {
        const employee = EmployeeFactory.createOffboarded()

        expect(employee.isSuspended()).toBe(false)
      })
    })

    describe('isOffboarded', () => {
      it('should return true for offboarded employee', () => {
        const employee = EmployeeFactory.createOffboarded()

        expect(employee.isOffboarded()).toBe(true)
      })

      it('should return false for active employee', () => {
        const employee = EmployeeFactory.create()

        expect(employee.isOffboarded()).toBe(false)
      })

      it('should return false for suspended employee', () => {
        const employee = EmployeeFactory.createSuspended()

        expect(employee.isOffboarded()).toBe(false)
      })
    })

    describe('hasExternalId', () => {
      it('should return true when external ID exists', () => {
        const employee = EmployeeFactory.create({
          externalId: 'ext-123',
          externalProvider: 'google',
        })

        expect(employee.hasExternalId()).toBe(true)
      })

      it('should return false when no external ID', () => {
        const employee = EmployeeFactory.create()

        expect(employee.hasExternalId()).toBe(false)
      })
    })
  })

  describe('status lifecycle', () => {
    it('should support active → suspended → active cycle', () => {
      const employee = EmployeeFactory.create()

      expect(employee.isActive()).toBe(true)

      employee.suspend()
      expect(employee.isSuspended()).toBe(true)

      employee.reactivate()
      expect(employee.isActive()).toBe(true)
    })

    it('should support active → suspended → offboarded flow', () => {
      const employee = EmployeeFactory.create()

      employee.suspend()
      expect(employee.isSuspended()).toBe(true)

      employee.offboard()
      expect(employee.isOffboarded()).toBe(true)
    })

    it('should support active → offboarded flow', () => {
      const employee = EmployeeFactory.create()

      employee.offboard()
      expect(employee.isOffboarded()).toBe(true)
    })

    it('should not allow offboarded → any transition', () => {
      const employee = EmployeeFactory.createOffboarded()

      expect(() => employee.offboard()).toThrow(EmployeeAlreadyOffboardedError)
      expect(() => employee.reactivate()).toThrow(InvalidEmployeeStatusError)
      expect(() => employee.suspend()).toThrow(InvalidEmployeeStatusError)
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON with all properties', () => {
      const employee = Employee.create({
        organizationId: 'org-123',
        name: 'John Doe',
        email: Email.create('john@example.com'),
        title: 'Engineer',
      })

      const json = employee.toJSON()

      expect(json.id).toBe(employee.id)
      expect(json.organizationId).toBe('org-123')
      expect(json.name).toBe('John Doe')
      expect(json.email).toBe(employee.email)
      expect(json.title).toBe('Engineer')
      expect(json.status).toBe('active')
      expect(json.createdAt).toBeInstanceOf(Date)
      expect(json.updatedAt).toBeInstanceOf(Date)
    })

    it('should not mutate original when modifying JSON', () => {
      const employee = EmployeeFactory.create({ name: 'Original' })

      const json = employee.toJSON()
      json.name = 'Modified'

      expect(employee.name).toBe('Original')
    })
  })
})
