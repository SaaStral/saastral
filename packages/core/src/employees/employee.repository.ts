import { Employee } from './employee.entity'
import {
  EmployeeFilters,
  EmployeeListItem,
  OffboardingAlert,
  DepartmentBreakdown,
} from './employee.types'

/**
 * Employee Repository Interface (Port)
 * Defines the contract for employee data access
 * Implementation will be in Infrastructure layer
 */
export interface EmployeeRepository {
  /**
   * Find employee by ID
   */
  findById(id: string, organizationId: string): Promise<Employee | null>

  /**
   * Find employee by email
   */
  findByEmail(email: string, organizationId: string): Promise<Employee | null>

  /**
   * Find employee by external ID (from SSO provider)
   */
  findByExternalId(
    externalId: string,
    organizationId: string
  ): Promise<Employee | null>

  /**
   * List employees with filters and pagination
   */
  list(
    organizationId: string,
    filters: EmployeeFilters,
    pagination: { page: number; pageSize: number }
  ): Promise<{
    employees: EmployeeListItem[]
    totalCount: number
  }>

  /**
   * Count employees by status
   */
  countByStatus(organizationId: string, status?: 'active' | 'suspended' | 'offboarded'): Promise<number>

  /**
   * Count offboarded employees with active subscriptions
   */
  countOffboardedWithActiveSubscriptions(organizationId: string): Promise<number>

  /**
   * Get offboarding alerts (offboarded employees with active subscriptions)
   */
  getOffboardingAlerts(organizationId: string, limit?: number): Promise<OffboardingAlert[]>

  /**
   * Get department breakdown (employee count and cost by department)
   */
  getDepartmentBreakdown(organizationId: string): Promise<DepartmentBreakdown[]>

  /**
   * Calculate license utilization across all subscriptions
   */
  calculateLicenseUtilization(organizationId: string): Promise<number>

  /**
   * Get average monthly SaaS cost per employee
   */
  getAverageMonthlyCost(organizationId: string): Promise<number>

  /**
   * Save employee (create or update)
   */
  save(employee: Employee): Promise<Employee>

  /**
   * Delete employee (soft delete)
   */
  delete(id: string, organizationId: string): Promise<void>

  /**
   * Bulk update monthly SaaS costs
   * Used by background jobs to recalculate costs
   */
  bulkUpdateMonthlyCosts(
    updates: Array<{ employeeId: string; costInCents: bigint }>
  ): Promise<void>
}
