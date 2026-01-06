/**
 * Directory Sync Service
 *
 * CRITICAL - Core sync orchestration logic.
 *
 * Handles:
 * - Employee directory synchronization
 * - Department hierarchy synchronization
 * - Status mapping and change detection
 * - Employee matching (externalId → email fallback)
 * - Error collection and reporting
 */

import type { DirectoryProvider } from './directory-provider.interface'
import type { IntegrationRepository } from './integration.repository'
import type { EmployeeRepository } from '../employees/employee.repository'
import type { DepartmentRepository } from '../departments/department.repository'
import { Employee } from '../employees/employee.entity'
import { Department } from '../departments/department.entity'
import { Email } from '../shared/value-objects/email'
import type { SyncResult, SyncStats } from './integration.types'
import { SyncFailedError } from './integration.errors'

export interface DirectorySyncServiceDeps {
  integrationRepository: IntegrationRepository
  employeeRepository: EmployeeRepository
  departmentRepository: DepartmentRepository
  directoryProvider: DirectoryProvider
}

interface SyncError {
  type: 'employee' | 'department'
  identifier: string
  error: string
}

export class DirectorySyncService {
  constructor(private readonly deps: DirectorySyncServiceDeps) {}

  /**
   * Map IntegrationProvider to employee external provider type
   */
  private mapProviderToEmployeeProvider(
    provider: string,
  ): 'google' | 'microsoft' | 'okta' | 'keycloak' {
    switch (provider) {
      case 'google_workspace':
        return 'google'
      case 'microsoft_365':
        return 'microsoft'
      case 'okta':
        return 'okta'
      case 'keycloak':
        return 'keycloak'
      default:
        return 'google'
    }
  }

  /**
   * Sync employees from directory provider
   *
   * Strategy:
   * 1. Fetch all users from provider
   * 2. For each user:
   *    - Match by externalId first (stable)
   *    - Fallback to email (can change)
   *    - Create if not exists, update if exists
   *    - Map status: active/suspended/archived → active/suspended/offboarded
   * 3. Collect errors but continue processing
   * 4. Return sync stats
   *
   * @param integrationId - Integration to sync from
   * @param organizationId - Organization to sync to
   * @returns Sync result with stats and errors
   */
  async syncEmployees(integrationId: string, organizationId: string): Promise<SyncResult> {
    const startedAt = new Date()
    const stats: SyncStats = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    }
    const errors: SyncError[] = []

    try {
      // Fetch integration
      const integration = await this.deps.integrationRepository.findById(integrationId)
      if (!integration) {
        throw new Error(`Integration ${integrationId} not found`)
      }

      // Fetch all users from directory provider
      // Include deleted users to properly detect offboarding events
      const result = await this.deps.directoryProvider.listUsers({
        includeDeleted: true,
      })
      const directoryUsers = result.items

      // Process each user
      for (const dirUser of directoryUsers) {
        try {
          // Match existing employee
          let employee = await this.deps.employeeRepository.findByExternalId(
            dirUser.externalId,
            organizationId,
          )

          // Fallback to email if not found by externalId
          if (!employee) {
            employee = await this.deps.employeeRepository.findByEmail(
              dirUser.email,
              organizationId,
            )
          }

          // Map status from directory to domain
          const status = this.mapDirectoryStatus(dirUser.status)

          if (employee) {
            // Update existing employee
            const needsUpdate =
              employee.name !== dirUser.fullName ||
              employee.email.toString() !== dirUser.email ||
              employee.status !== status

            if (needsUpdate) {
              employee.updateName(dirUser.fullName)
              employee.updateEmail(Email.create(dirUser.email))

              // Update status
              if (status === 'suspended' && employee.status === 'active') {
                employee.suspend()
              } else if (status === 'offboarded' && employee.status !== 'offboarded') {
                employee.offboard()
              } else if (status === 'active' && employee.status !== 'active') {
                employee.reactivate()
              }

              // Update external ID if missing
              if (!employee.externalId && dirUser.externalId) {
                employee.updateExternalId(
                  dirUser.externalId,
                  this.mapProviderToEmployeeProvider(integration.provider),
                )
              }

              await this.deps.employeeRepository.save(employee)
              stats.updated++
            } else {
              stats.skipped++
            }
          } else {
            // Create new employee
            const newEmployee = Employee.create({
              organizationId,
              name: dirUser.fullName,
              email: Email.create(dirUser.email),
              externalId: dirUser.externalId,
              externalProvider: this.mapProviderToEmployeeProvider(integration.provider),
              title: dirUser.jobTitle,
              phone: dirUser.phoneNumber,
            })

            // Set status if not active (default is active)
            if (status === 'suspended') {
              newEmployee.suspend()
            } else if (status === 'offboarded') {
              newEmployee.offboard()
            }

            await this.deps.employeeRepository.save(newEmployee)
            stats.created++
          }
        } catch (error) {
          // Collect error but continue processing
          errors.push({
            type: 'employee',
            identifier: dirUser.email,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          stats.errors++
        }
      }

      // Build sync result
      const completedAt = new Date()
      const syncResult: SyncResult = {
        success: errors.length === 0,
        startedAt,
        completedAt,
        stats,
        errors: errors.map((e) => `${e.type}:${e.identifier} - ${e.error}`),
      }

      // Update integration sync status
      if (syncResult.success) {
        integration.recordSyncSuccess(syncResult)
      } else {
        integration.recordSyncError(
          `Sync completed with ${errors.length} errors: ${errors.map((e) => e.identifier).join(', ')}`,
        )
      }
      await this.deps.integrationRepository.save(integration)

      return syncResult
    } catch (error) {
      // Fatal error - entire sync failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Update integration to error state
      const integration = await this.deps.integrationRepository.findById(integrationId)
      if (integration) {
        integration.recordSyncError(errorMessage)
        await this.deps.integrationRepository.save(integration)
      }

      throw new SyncFailedError(integrationId, errorMessage)
    }
  }

  /**
   * Sync departments from directory provider
   *
   * Strategy:
   * 1. Fetch all org units from provider
   * 2. Sort by path depth (parents before children)
   * 3. For each org unit:
   *    - Match by externalId
   *    - Create if not exists, update if exists
   *    - Set parent relationship
   * 4. Return sync stats
   *
   * @param integrationId - Integration to sync from
   * @param organizationId - Organization to sync to
   * @returns Sync result with stats and errors
   */
  async syncDepartments(integrationId: string, organizationId: string): Promise<SyncResult> {
    const startedAt = new Date()
    const stats: SyncStats = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    }
    const errors: SyncError[] = []

    try {
      // Fetch integration
      const integration = await this.deps.integrationRepository.findById(integrationId)
      if (!integration) {
        throw new Error(`Integration ${integrationId} not found`)
      }

      // Fetch all org units from directory provider
      const orgUnits = await this.deps.directoryProvider.listOrgUnits()

      // Sort by path depth (parents before children)
      const sortedOrgUnits = orgUnits.sort((a, b) => {
        const aDepth = a.path.split('/').length
        const bDepth = b.path.split('/').length
        return aDepth - bDepth
      })

      // Track external ID to department ID mapping
      const externalIdMap = new Map<string, string>()

      // Process each org unit
      for (const orgUnit of sortedOrgUnits) {
        try {
          // Match existing department by external ID
          let department = await this.deps.departmentRepository.findByExternalId(
            organizationId,
            orgUnit.externalId,
            this.mapProviderToEmployeeProvider(integration.provider),
          )

          // Determine parent ID
          let parentId: string | undefined
          if (orgUnit.parentId) {
            // Look up parent in mapping
            parentId = externalIdMap.get(orgUnit.parentId)
            if (!parentId) {
              // Try to find parent in database
              const parentDept = await this.deps.departmentRepository.findByExternalId(
                organizationId,
                orgUnit.parentId,
                this.mapProviderToEmployeeProvider(integration.provider),
              )
              if (parentDept) {
                parentId = parentDept.id
                externalIdMap.set(orgUnit.parentId, parentDept.id)
              }
            }
          }

          if (department) {
            // Update existing department
            const needsUpdate =
              department.name !== orgUnit.name ||
              department.description !== orgUnit.description ||
              department.parentId !== parentId

            if (needsUpdate) {
              department.updateName(orgUnit.name)
              department.updateDescription(orgUnit.description)
              if (parentId) {
                department.updateParent(parentId)
              }

              await this.deps.departmentRepository.save(department)
              stats.updated++
            } else {
              stats.skipped++
            }

            // Add to mapping
            externalIdMap.set(orgUnit.externalId, department.id)
          } else {
            // Create new department
            const newDepartment = Department.create({
              organizationId,
              name: orgUnit.name,
              description: orgUnit.description,
              parentId,
              externalId: orgUnit.externalId,
              externalProvider: this.mapProviderToEmployeeProvider(integration.provider),
            })

            const saved = await this.deps.departmentRepository.save(newDepartment)
            stats.created++

            // Add to mapping
            externalIdMap.set(orgUnit.externalId, saved.id)
          }
        } catch (error) {
          // Collect error but continue processing
          errors.push({
            type: 'department',
            identifier: orgUnit.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          stats.errors++
        }
      }

      // Build sync result
      const completedAt = new Date()
      const syncResult: SyncResult = {
        success: errors.length === 0,
        startedAt,
        completedAt,
        stats,
        errors: errors.map((e) => `${e.type}:${e.identifier} - ${e.error}`),
      }

      return syncResult
    } catch (error) {
      // Fatal error - entire sync failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      throw new SyncFailedError(integrationId, errorMessage)
    }
  }

  /**
   * Map directory status to domain employee status
   *
   * Google/Microsoft status → SaaStral status
   * - active → active
   * - suspended → suspended
   * - archived/deleted → offboarded
   */
  private mapDirectoryStatus(
    dirStatus: 'active' | 'suspended' | 'archived' | 'deleted',
  ): 'active' | 'suspended' | 'offboarded' {
    switch (dirStatus) {
      case 'active':
        return 'active'
      case 'suspended':
        return 'suspended'
      case 'archived':
      case 'deleted':
        return 'offboarded'
      default:
        return 'active'
    }
  }
}
