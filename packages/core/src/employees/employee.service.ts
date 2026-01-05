import { Employee } from './employee.entity'
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
  CreateEmployeeInput,
  UpdateEmployeeInput,
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

  /**
   * Create a new employee
   */
  async createEmployee(input: CreateEmployeeInput): Promise<Employee> {
    this.logger.info('[EmployeeService.createEmployee] Creating employee', {
      organizationId: input.organizationId,
      email: input.email.toString(),
    })

    const employee = Employee.create(input)
    return await this.employeeRepo.save(employee)
  }

  /**
   * Update employee information
   */
  async updateEmployee(
    id: string,
    organizationId: string,
    input: UpdateEmployeeInput
  ): Promise<Employee> {
    this.logger.info('[EmployeeService.updateEmployee] Updating employee', {
      id,
      organizationId,
    })

    const employee = await this.employeeRepo.findById(id, organizationId)

    if (!employee) {
      throw new Error(`Employee ${id} not found`)
    }

    // Update profile fields (name, title, phone, avatarUrl)
    const profileUpdates: {
      name?: string
      title?: string
      phone?: string
      avatarUrl?: string
    } = {}

    if (input.name !== undefined) {
      profileUpdates.name = input.name
    }
    if (input.title !== undefined) {
      profileUpdates.title = input.title
    }
    if (input.phone !== undefined) {
      profileUpdates.phone = input.phone
    }
    if (input.avatarUrl !== undefined) {
      profileUpdates.avatarUrl = input.avatarUrl
    }

    if (Object.keys(profileUpdates).length > 0) {
      employee.updateProfile(profileUpdates)
    }

    // Update department
    if (input.departmentId !== undefined) {
      employee.updateDepartment(input.departmentId)
    }

    // Update manager
    if (input.managerId !== undefined) {
      employee.updateManager(input.managerId)
    }

    // Note: Email updates are not supported in the current entity implementation
    // They would require additional business logic (verification, uniqueness check, etc.)

    return await this.employeeRepo.save(employee)
  }

  /**
   * Offboard an employee
   */
  async offboardEmployee(id: string, organizationId: string): Promise<Employee> {
    this.logger.info('[EmployeeService.offboardEmployee] Offboarding employee', {
      id,
      organizationId,
    })

    const employee = await this.employeeRepo.findById(id, organizationId)

    if (!employee) {
      throw new Error(`Employee ${id} not found`)
    }

    employee.offboard()

    return await this.employeeRepo.save(employee)
  }

  /**
   * Suspend an employee
   */
  async suspendEmployee(id: string, organizationId: string): Promise<Employee> {
    this.logger.info('[EmployeeService.suspendEmployee] Suspending employee', {
      id,
      organizationId,
    })

    const employee = await this.employeeRepo.findById(id, organizationId)

    if (!employee) {
      throw new Error(`Employee ${id} not found`)
    }

    employee.suspend()

    return await this.employeeRepo.save(employee)
  }

  /**
   * Reactivate an employee
   */
  async reactivateEmployee(id: string, organizationId: string): Promise<Employee> {
    this.logger.info('[EmployeeService.reactivateEmployee] Reactivating employee', {
      id,
      organizationId,
    })

    const employee = await this.employeeRepo.findById(id, organizationId)

    if (!employee) {
      throw new Error(`Employee ${id} not found`)
    }

    employee.reactivate()

    return await this.employeeRepo.save(employee)
  }
}
