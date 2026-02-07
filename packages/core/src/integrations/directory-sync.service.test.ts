/**
 * Unit Tests for DirectorySyncService
 *
 * Tests the critical sync orchestration logic for employees and departments.
 * Uses mocks for all dependencies to test business logic in isolation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { DirectorySyncService } from './directory-sync.service'
import type { DirectoryProvider } from './directory-provider.interface'
import type { IntegrationRepository } from './integration.repository'
import type { EmployeeRepository } from '../employees/employee.repository'
import type { DepartmentRepository } from '../departments/department.repository'
import { Integration, ServiceAccountCredentials } from './index'
import { Employee } from '../employees/employee.entity'
import { Department } from '../departments/department.entity'
import { Email } from '../shared/value-objects/email'
import type { DirectoryUser, DirectoryOrgUnit } from './directory-provider.interface'

describe('DirectorySyncService', () => {
  let service: DirectorySyncService
  let mockDirectoryProvider: MockProxy<DirectoryProvider>
  let mockIntegrationRepo: MockProxy<IntegrationRepository>
  let mockEmployeeRepo: MockProxy<EmployeeRepository>
  let mockDepartmentRepo: MockProxy<DepartmentRepository>

  const orgId = 'org-123'
  const integrationId = 'int-123'

  let testIntegration: Integration
  let testCredentials: ServiceAccountCredentials

  beforeEach(() => {
    // Create mocks
    mockDirectoryProvider = mock<DirectoryProvider>()
    mockIntegrationRepo = mock<IntegrationRepository>()
    mockEmployeeRepo = mock<EmployeeRepository>()
    mockDepartmentRepo = mock<DepartmentRepository>()

    // Create service
    service = new DirectorySyncService({
      directoryProvider: mockDirectoryProvider,
      integrationRepository: mockIntegrationRepo,
      employeeRepository: mockEmployeeRepo,
      departmentRepository: mockDepartmentRepo,
    })

    // Create test credentials and integration
    testCredentials = ServiceAccountCredentials.create({
      clientEmail: 'service@example.com',
      privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
    })

    testIntegration = Integration.create({
      id: integrationId,
      organizationId: orgId,
      provider: 'google_workspace',
      credentials: testCredentials,
    })
    testIntegration.activate()

    // Default: integration is found
    mockIntegrationRepo.findById.mockResolvedValue(testIntegration)
  })

  describe('syncEmployees', () => {
    describe('creating new employees', () => {
      it('should create new employee from directory user', async () => {
        const directoryUser: DirectoryUser = {
          externalId: 'google-123',
          email: 'john@example.com',
          fullName: 'John Doe',
          status: 'active',
          jobTitle: 'Engineer',
          phoneNumber: '+1234567890',
        }

        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [directoryUser],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(null)
        mockEmployeeRepo.findByEmail.mockResolvedValue(null)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        const result = await service.syncEmployees(integrationId, orgId)

        expect(result.success).toBe(true)
        expect(result.stats.created).toBe(1)
        expect(result.stats.updated).toBe(0)
        expect(result.stats.skipped).toBe(0)
        expect(result.stats.errors).toBe(0)

        expect(mockEmployeeRepo.save).toHaveBeenCalledOnce()
        const savedEmployee = vi.mocked(mockEmployeeRepo.save).mock.calls[0][0]
        expect(savedEmployee.name).toBe('John Doe')
        expect(savedEmployee.email.toString()).toBe('john@example.com')
        expect(savedEmployee.externalId).toBe('google-123')
        expect(savedEmployee.status).toBe('active')
      })

      it('should create multiple employees', async () => {
        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-1',
              email: 'user1@example.com',
              fullName: 'User One',
              status: 'active',
            },
            {
              externalId: 'google-2',
              email: 'user2@example.com',
              fullName: 'User Two',
              status: 'active',
            },
            {
              externalId: 'google-3',
              email: 'user3@example.com',
              fullName: 'User Three',
              status: 'active',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(null)
        mockEmployeeRepo.findByEmail.mockResolvedValue(null)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        const result = await service.syncEmployees(integrationId, orgId)

        expect(result.stats.created).toBe(3)
        expect(mockEmployeeRepo.save).toHaveBeenCalledTimes(3)
      })

      it('should create employee with suspended status', async () => {
        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-123',
              email: 'suspended@example.com',
              fullName: 'Suspended User',
              status: 'suspended',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(null)
        mockEmployeeRepo.findByEmail.mockResolvedValue(null)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        await service.syncEmployees(integrationId, orgId)

        const savedEmployee = vi.mocked(mockEmployeeRepo.save).mock.calls[0][0]
        expect(savedEmployee.status).toBe('suspended')
      })

      it('should create employee with offboarded status for deleted users', async () => {
        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-123',
              email: 'deleted@example.com',
              fullName: 'Deleted User',
              status: 'deleted',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(null)
        mockEmployeeRepo.findByEmail.mockResolvedValue(null)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        await service.syncEmployees(integrationId, orgId)

        const savedEmployee = vi.mocked(mockEmployeeRepo.save).mock.calls[0][0]
        expect(savedEmployee.status).toBe('offboarded')
      })

      it('should create employee with offboarded status for archived users', async () => {
        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-123',
              email: 'archived@example.com',
              fullName: 'Archived User',
              status: 'archived',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(null)
        mockEmployeeRepo.findByEmail.mockResolvedValue(null)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        await service.syncEmployees(integrationId, orgId)

        const savedEmployee = vi.mocked(mockEmployeeRepo.save).mock.calls[0][0]
        expect(savedEmployee.status).toBe('offboarded')
      })
    })

    describe('updating existing employees', () => {
      it('should update employee name when changed', async () => {
        const existingEmployee = Employee.create({
          organizationId: orgId,
          name: 'Old Name',
          email: Email.create('john@example.com'),
          externalId: 'google-123',
          externalProvider: 'google',
        })

        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-123',
              email: 'john@example.com',
              fullName: 'New Name',
              status: 'active',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(existingEmployee)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        const result = await service.syncEmployees(integrationId, orgId)

        expect(result.stats.updated).toBe(1)
        expect(result.stats.created).toBe(0)
        expect(mockEmployeeRepo.save).toHaveBeenCalledOnce()

        const savedEmployee = vi.mocked(mockEmployeeRepo.save).mock.calls[0][0]
        expect(savedEmployee.name).toBe('New Name')
      })

      it('should update employee email when changed', async () => {
        const existingEmployee = Employee.create({
          organizationId: orgId,
          name: 'John Doe',
          email: Email.create('old@example.com'),
          externalId: 'google-123',
          externalProvider: 'google',
        })

        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-123',
              email: 'new@example.com',
              fullName: 'John Doe',
              status: 'active',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(existingEmployee)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        await service.syncEmployees(integrationId, orgId)

        const savedEmployee = vi.mocked(mockEmployeeRepo.save).mock.calls[0][0]
        expect(savedEmployee.email.toString()).toBe('new@example.com')
      })

      it('should suspend active employee when status changes', async () => {
        const existingEmployee = Employee.create({
          organizationId: orgId,
          name: 'John Doe',
          email: Email.create('john@example.com'),
          externalId: 'google-123',
          externalProvider: 'google',
        })

        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-123',
              email: 'john@example.com',
              fullName: 'John Doe',
              status: 'suspended',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(existingEmployee)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        await service.syncEmployees(integrationId, orgId)

        const savedEmployee = vi.mocked(mockEmployeeRepo.save).mock.calls[0][0]
        expect(savedEmployee.status).toBe('suspended')
      })

      it('should offboard employee when deleted in directory', async () => {
        const existingEmployee = Employee.create({
          organizationId: orgId,
          name: 'John Doe',
          email: Email.create('john@example.com'),
          externalId: 'google-123',
          externalProvider: 'google',
        })

        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-123',
              email: 'john@example.com',
              fullName: 'John Doe',
              status: 'deleted',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(existingEmployee)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        await service.syncEmployees(integrationId, orgId)

        const savedEmployee = vi.mocked(mockEmployeeRepo.save).mock.calls[0][0]
        expect(savedEmployee.status).toBe('offboarded')
      })

      it('should reactivate suspended employee', async () => {
        const existingEmployee = Employee.create({
          organizationId: orgId,
          name: 'John Doe',
          email: Email.create('john@example.com'),
          externalId: 'google-123',
          externalProvider: 'google',
        })
        existingEmployee.suspend()

        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-123',
              email: 'john@example.com',
              fullName: 'John Doe',
              status: 'active',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(existingEmployee)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        await service.syncEmployees(integrationId, orgId)

        const savedEmployee = vi.mocked(mockEmployeeRepo.save).mock.calls[0][0]
        expect(savedEmployee.status).toBe('active')
      })

      it('should skip employee when nothing changed', async () => {
        const existingEmployee = Employee.create({
          organizationId: orgId,
          name: 'John Doe',
          email: Email.create('john@example.com'),
          externalId: 'google-123',
          externalProvider: 'google',
        })

        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-123',
              email: 'john@example.com',
              fullName: 'John Doe',
              status: 'active',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(existingEmployee)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        const result = await service.syncEmployees(integrationId, orgId)

        expect(result.stats.skipped).toBe(1)
        expect(result.stats.updated).toBe(0)
        expect(mockEmployeeRepo.save).not.toHaveBeenCalled()
      })

      it('should add externalId if missing during update', async () => {
        const existingEmployee = Employee.create({
          organizationId: orgId,
          name: 'Old Name', // Name will change, triggering update
          email: Email.create('john@example.com'),
        })

        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-123',
              email: 'john@example.com',
              fullName: 'New Name', // Name changed
              status: 'active',
            },
          ],
        })

        // Not found by external ID (doesn't have one yet)
        mockEmployeeRepo.findByExternalId.mockResolvedValue(null)
        // Found by email
        mockEmployeeRepo.findByEmail.mockResolvedValue(existingEmployee)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        await service.syncEmployees(integrationId, orgId)

        const savedEmployee = vi.mocked(mockEmployeeRepo.save).mock.calls[0][0]
        expect(savedEmployee.externalId).toBe('google-123')
        expect(savedEmployee.externalProvider).toBe('google')
        expect(savedEmployee.name).toBe('New Name')
      })
    })

    describe('employee matching', () => {
      it('should match by externalId first', async () => {
        const employee = Employee.create({
          organizationId: orgId,
          name: 'John Doe',
          email: Email.create('john@example.com'),
          externalId: 'google-123',
          externalProvider: 'google',
        })

        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-123',
              email: 'newemail@example.com', // Email changed
              fullName: 'John Doe',
              status: 'active',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(employee)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        await service.syncEmployees(integrationId, orgId)

        // Should find by external ID and update email
        expect(mockEmployeeRepo.findByExternalId).toHaveBeenCalledWith('google-123', orgId)
        expect(mockEmployeeRepo.findByEmail).not.toHaveBeenCalled()

        const savedEmployee = vi.mocked(mockEmployeeRepo.save).mock.calls[0][0]
        expect(savedEmployee.email.toString()).toBe('newemail@example.com')
      })

      it('should fallback to email if externalId not found', async () => {
        const employee = Employee.create({
          organizationId: orgId,
          name: 'John Doe',
          email: Email.create('john@example.com'),
        })

        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-123',
              email: 'john@example.com',
              fullName: 'John Doe',
              status: 'active',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(null)
        mockEmployeeRepo.findByEmail.mockResolvedValue(employee)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        await service.syncEmployees(integrationId, orgId)

        expect(mockEmployeeRepo.findByExternalId).toHaveBeenCalled()
        expect(mockEmployeeRepo.findByEmail).toHaveBeenCalledWith('john@example.com', orgId)
      })
    })

    describe('error handling', () => {
      it('should collect individual employee errors and continue', async () => {
        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-1',
              email: 'good@example.com',
              fullName: 'Good User',
              status: 'active',
            },
            {
              externalId: 'google-2',
              email: 'bad@example.com',
              fullName: 'Bad User',
              status: 'active',
            },
            {
              externalId: 'google-3',
              email: 'good2@example.com',
              fullName: 'Good User 2',
              status: 'active',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(null)
        mockEmployeeRepo.findByEmail.mockResolvedValue(null)

        // Second save fails
        let saveCount = 0
        mockEmployeeRepo.save.mockImplementation(async (emp) => {
          saveCount++
          if (saveCount === 2) {
            throw new Error('Database error')
          }
          return emp
        })

        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        const result = await service.syncEmployees(integrationId, orgId)

        expect(result.success).toBe(false)
        expect(result.stats.created).toBe(2)
        expect(result.stats.errors).toBe(1)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]).toContain('bad@example.com')
        expect(result.errors[0]).toContain('Database error')
      })

      it('should throw SyncFailedError when integration not found', async () => {
        mockIntegrationRepo.findById.mockResolvedValue(null)

        await expect(service.syncEmployees(integrationId, orgId)).rejects.toThrow(
          `Integration ${integrationId} not found`,
        )
      })

      it('should throw SyncFailedError when provider fails', async () => {
        mockDirectoryProvider.listUsers.mockRejectedValue(new Error('API error'))

        await expect(service.syncEmployees(integrationId, orgId)).rejects.toThrow()
      })

      it('should update integration status to error on failure', async () => {
        mockDirectoryProvider.listUsers.mockRejectedValue(new Error('API error'))
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        try {
          await service.syncEmployees(integrationId, orgId)
        } catch {
          // Expected to throw
        }

        expect(mockIntegrationRepo.save).toHaveBeenCalled()
        const savedIntegration = vi.mocked(mockIntegrationRepo.save).mock.calls[0][0]
        expect(savedIntegration.lastSyncStatus).toBe('error')
        expect(savedIntegration.lastSyncError).toContain('API error')
      })
    })

    describe('integration status tracking', () => {
      it('should update integration with successful sync result', async () => {
        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-123',
              email: 'test@example.com',
              fullName: 'Test User',
              status: 'active',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(null)
        mockEmployeeRepo.findByEmail.mockResolvedValue(null)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        await service.syncEmployees(integrationId, orgId)

        expect(mockIntegrationRepo.save).toHaveBeenCalled()
        const savedIntegration = vi.mocked(mockIntegrationRepo.save).mock.calls[0][0]
        expect(savedIntegration.lastSyncStatus).toBe('success')
        expect(savedIntegration.lastSyncAt).toBeInstanceOf(Date)
      })

      it('should update integration with error when sync has errors', async () => {
        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-1',
              email: 'error@example.com',
              fullName: 'Error User',
              status: 'active',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(null)
        mockEmployeeRepo.findByEmail.mockResolvedValue(null)
        mockEmployeeRepo.save.mockRejectedValue(new Error('Save failed'))
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        await service.syncEmployees(integrationId, orgId)

        const savedIntegration = vi.mocked(mockIntegrationRepo.save).mock.calls[0][0]
        expect(savedIntegration.lastSyncStatus).toBe('error')
        expect(savedIntegration.lastSyncError).toBeDefined()
      })
    })

    describe('sync result', () => {
      it('should return complete sync result with timestamps', async () => {
        const beforeSync = new Date()

        mockDirectoryProvider.listUsers.mockResolvedValue({
          items: [
            {
              externalId: 'google-123',
              email: 'test@example.com',
              fullName: 'Test User',
              status: 'active',
            },
          ],
        })

        mockEmployeeRepo.findByExternalId.mockResolvedValue(null)
        mockEmployeeRepo.findByEmail.mockResolvedValue(null)
        mockEmployeeRepo.save.mockImplementation(async (emp) => emp)
        mockIntegrationRepo.save.mockImplementation(async (int) => int)

        const result = await service.syncEmployees(integrationId, orgId)

        const afterSync = new Date()

        expect(result.success).toBe(true)
        expect(result.startedAt).toBeInstanceOf(Date)
        expect(result.completedAt).toBeInstanceOf(Date)
        expect(result.startedAt.getTime()).toBeGreaterThanOrEqual(beforeSync.getTime())
        expect(result.completedAt.getTime()).toBeLessThanOrEqual(afterSync.getTime())
        expect(result.stats).toEqual({
          created: 1,
          updated: 0,
          skipped: 0,
          errors: 0,
        })
        expect(result.errors).toEqual([])
      })
    })
  })

  describe('syncDepartments', () => {
    describe('creating new departments', () => {
      it('should create new department from org unit', async () => {
        const orgUnit: DirectoryOrgUnit = {
          externalId: 'dept-123',
          name: 'Engineering',
          path: '/Engineering',
          description: 'Engineering team',
        }

        mockDirectoryProvider.listOrgUnits.mockResolvedValue([orgUnit])
        mockDepartmentRepo.findByExternalId.mockResolvedValue(null)
        mockDepartmentRepo.save.mockImplementation(async (dept) => dept)

        const result = await service.syncDepartments(integrationId, orgId)

        expect(result.success).toBe(true)
        expect(result.stats.created).toBe(1)
        expect(mockDepartmentRepo.save).toHaveBeenCalledOnce()

        const savedDept = vi.mocked(mockDepartmentRepo.save).mock.calls[0][0]
        expect(savedDept.name).toBe('Engineering')
        expect(savedDept.externalId).toBe('dept-123')
      })

      it('should create hierarchical departments in correct order', async () => {
        const orgUnits: DirectoryOrgUnit[] = [
          {
            externalId: 'dept-child',
            name: 'Backend',
            path: '/Engineering/Backend',
            parentId: 'dept-parent',
          },
          {
            externalId: 'dept-parent',
            name: 'Engineering',
            path: '/Engineering',
          },
        ]

        mockDirectoryProvider.listOrgUnits.mockResolvedValue(orgUnits)
        mockDepartmentRepo.findByExternalId.mockResolvedValue(null)

        const savedDepts: Department[] = []
        mockDepartmentRepo.save.mockImplementation(async (dept) => {
          savedDepts.push(dept)
          return dept
        })

        await service.syncDepartments(integrationId, orgId)

        // Parent should be created first (shorter path)
        expect(savedDepts).toHaveLength(2)
        expect(savedDepts[0].name).toBe('Engineering')
        expect(savedDepts[0].parentId).toBeUndefined()
        expect(savedDepts[1].name).toBe('Backend')
        expect(savedDepts[1].parentId).toBe(savedDepts[0].id)
      })

      it('should create deep hierarchy (3 levels)', async () => {
        const orgUnits: DirectoryOrgUnit[] = [
          {
            externalId: 'dept-root',
            name: 'Company',
            path: '/Company',
          },
          {
            externalId: 'dept-middle',
            name: 'Engineering',
            path: '/Company/Engineering',
            parentId: 'dept-root',
          },
          {
            externalId: 'dept-leaf',
            name: 'Backend',
            path: '/Company/Engineering/Backend',
            parentId: 'dept-middle',
          },
        ]

        mockDirectoryProvider.listOrgUnits.mockResolvedValue(orgUnits)
        mockDepartmentRepo.findByExternalId.mockResolvedValue(null)

        const savedDepts: Department[] = []
        mockDepartmentRepo.save.mockImplementation(async (dept) => {
          savedDepts.push(dept)
          return dept
        })

        await service.syncDepartments(integrationId, orgId)

        expect(savedDepts).toHaveLength(3)
        expect(savedDepts[0].name).toBe('Company')
        expect(savedDepts[1].parentId).toBe(savedDepts[0].id)
        expect(savedDepts[2].parentId).toBe(savedDepts[1].id)
      })
    })

    describe('updating existing departments', () => {
      it('should update department name when changed', async () => {
        const existingDept = Department.create({
          organizationId: orgId,
          name: 'Old Name',
          externalId: 'dept-123',
          externalProvider: 'google',
        })

        mockDirectoryProvider.listOrgUnits.mockResolvedValue([
          {
            externalId: 'dept-123',
            name: 'New Name',
            path: '/New Name',
          },
        ])

        mockDepartmentRepo.findByExternalId.mockResolvedValue(existingDept)
        mockDepartmentRepo.save.mockImplementation(async (dept) => dept)

        const result = await service.syncDepartments(integrationId, orgId)

        expect(result.stats.updated).toBe(1)
        const savedDept = vi.mocked(mockDepartmentRepo.save).mock.calls[0][0]
        expect(savedDept.name).toBe('New Name')
      })

      it('should skip department when nothing changed', async () => {
        const existingDept = Department.create({
          organizationId: orgId,
          name: 'Engineering',
          externalId: 'dept-123',
          externalProvider: 'google',
        })

        mockDirectoryProvider.listOrgUnits.mockResolvedValue([
          {
            externalId: 'dept-123',
            name: 'Engineering',
            path: '/Engineering',
          },
        ])

        mockDepartmentRepo.findByExternalId.mockResolvedValue(existingDept)

        const result = await service.syncDepartments(integrationId, orgId)

        expect(result.stats.skipped).toBe(1)
        expect(mockDepartmentRepo.save).not.toHaveBeenCalled()
      })
    })

    describe('error handling', () => {
      it('should collect individual department errors and continue', async () => {
        mockDirectoryProvider.listOrgUnits.mockResolvedValue([
          {
            externalId: 'dept-1',
            name: 'Good Dept',
            path: '/Good',
          },
          {
            externalId: 'dept-2',
            name: 'Bad Dept',
            path: '/Bad',
          },
        ])

        mockDepartmentRepo.findByExternalId.mockResolvedValue(null)

        let saveCount = 0
        mockDepartmentRepo.save.mockImplementation(async (dept) => {
          saveCount++
          if (saveCount === 2) {
            throw new Error('Save failed')
          }
          return dept
        })

        const result = await service.syncDepartments(integrationId, orgId)

        expect(result.success).toBe(false)
        expect(result.stats.created).toBe(1)
        expect(result.stats.errors).toBe(1)
        expect(result.errors[0]).toContain('Bad Dept')
      })

      it('should throw when integration not found', async () => {
        mockIntegrationRepo.findById.mockResolvedValue(null)

        await expect(service.syncDepartments(integrationId, orgId)).rejects.toThrow()
      })
    })
  })
})
