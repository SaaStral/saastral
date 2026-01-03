import { EmployeeRepository } from './employee.repository'
import { LoggerInterface } from '../shared/interfaces/logger'
import {
  ListEmployeesInput,
  ListEmployeesOutput,
  GetEmployeeKPIsInput,
  EmployeeKPIsOutput,
  GetOffboardingAlertsInput,
  OffboardingAlert,
  GetDepartmentBreakdownInput,
  DepartmentBreakdown,
} from './employee.types'

/**
 * Employee Service
 * Orchestrates employee-related use cases
 */
export class EmployeeService {
  constructor(
    private readonly employeeRepo: EmployeeRepository,
    private readonly logger: LoggerInterface
  ) {}

  // ============================================================================
  // Queries
  // ============================================================================

  /**
   * Get KPI statistics for employee dashboard
   */
  async getKPIs(input: GetEmployeeKPIsInput): Promise<EmployeeKPIsOutput> {
    this.logger.info('[EmployeeService.getKPIs] Getting KPIs', {
      organizationId: input.organizationId,
    })

    const [
      activeCount,
      offboardedWithLicenses,
      averageCost,
      licenseUtilization,
    ] = await Promise.all([
      this.employeeRepo.countByStatus(input.organizationId, 'active'),
      this.employeeRepo.countOffboardedWithActiveSubscriptions(input.organizationId),
      this.employeeRepo.getAverageMonthlyCost(input.organizationId),
      this.employeeRepo.calculateLicenseUtilization(input.organizationId),
    ])

    // TODO: Get trend from cost_history table
    // For now, using placeholder values
    const trend = 5
    const costTrend = -8

    return {
      totalEmployees: activeCount,
      trend,
      pendingOffboardings: offboardedWithLicenses,
      averageCostPerEmployee: averageCost,
      costTrend,
      licenseUtilization,
    }
  }

  /**
   * List employees with pagination and filters
   */
  async list(input: ListEmployeesInput): Promise<ListEmployeesOutput> {
    this.logger.info('[EmployeeService.list] Listing employees', {
      organizationId: input.organizationId,
      search: input.search,
      status: input.status,
    })

    const page = input.page || 1
    const pageSize = input.pageSize || 20

    // Convert status filter
    const statusFilter = input.status === 'all' ? undefined :
      input.status === 'offboarding' ? 'offboarded' : input.status

    const { employees, totalCount } = await this.employeeRepo.list(
      input.organizationId,
      {
        status: statusFilter,
        search: input.search,
        departmentId: input.departmentId,
      },
      { page, pageSize }
    )

    return {
      employees,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: page * pageSize < totalCount,
      },
    }
  }

  /**
   * Get offboarding alerts
   */
  async getOffboardingAlerts(
    input: GetOffboardingAlertsInput
  ): Promise<OffboardingAlert[]> {
    this.logger.info('[EmployeeService.getOffboardingAlerts] Getting offboarding alerts', {
      organizationId: input.organizationId,
    })

    return await this.employeeRepo.getOffboardingAlerts(
      input.organizationId,
      input.limit || 10
    )
  }

  /**
   * Get department breakdown
   */
  async getDepartmentBreakdown(
    input: GetDepartmentBreakdownInput
  ): Promise<DepartmentBreakdown[]> {
    this.logger.info('[EmployeeService.getDepartmentBreakdown] Getting department breakdown', {
      organizationId: input.organizationId,
    })

    return await this.employeeRepo.getDepartmentBreakdown(input.organizationId)
  }

  // ============================================================================
  // Commands
  // ============================================================================

  // TODO: Add command methods like:
  // - createEmployee
  // - updateEmployee
  // - offboardEmployee
  // - suspendEmployee
  // - reactivateEmployee
  // These will be implemented as needed
}
