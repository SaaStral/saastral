import { Email } from '../shared/value-objects/email'

// ============================================================================
// Employee Status
// ============================================================================

export type EmployeeStatus = 'active' | 'suspended' | 'offboarded'

// ============================================================================
// Employee Props (Internal to Entity)
// ============================================================================

export interface EmployeeProps {
  readonly id: string
  readonly organizationId: string
  readonly name: string
  readonly email: Email
  readonly title?: string
  readonly phone?: string
  readonly avatarUrl?: string
  readonly status: EmployeeStatus
  readonly departmentId?: string
  readonly managerId?: string
  readonly hiredAt?: Date
  readonly offboardedAt?: Date
  readonly externalId?: string
  readonly externalProvider?: 'google' | 'microsoft' | 'okta' | 'keycloak'
  readonly metadata: Record<string, unknown>
  readonly monthlySaasCost?: bigint
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly createdBy?: string
  readonly updatedBy?: string
}

// ============================================================================
// Service Input/Output DTOs
// ============================================================================

export interface ListEmployeesInput {
  readonly organizationId: string
  readonly search?: string
  readonly status?: 'all' | 'active' | 'offboarding' | 'offboarded'
  readonly departmentId?: string
  readonly page?: number
  readonly pageSize?: number
}

export interface GetEmployeeKPIsInput {
  readonly organizationId: string
}

export interface GetOffboardingAlertsInput {
  readonly organizationId: string
  readonly limit?: number
}

export interface GetDepartmentBreakdownInput {
  readonly organizationId: string
}

// ============================================================================
// Output DTOs
// ============================================================================

export interface EmployeeKPIsOutput {
  readonly totalEmployees: number
  readonly trend: number
  readonly pendingOffboardings: number
  readonly averageCostPerEmployee: number // in cents
  readonly costTrend: number
  readonly licenseUtilization: number
}

export interface EmployeeListItem {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly department: string
  readonly status: EmployeeStatus
  readonly licenseCount: number
  readonly licenses: Array<{
    name: string
    icon: string
    color: string
  }>
  readonly monthlyCost: number
  readonly lastActivityTime: string
  readonly activitySource: string
  readonly avatar: {
    initials: string
    color: string
  }
  readonly hasWarning: boolean
}

export interface ListEmployeesOutput {
  readonly employees: EmployeeListItem[]
  readonly pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasMore: boolean
  }
}

export interface OffboardingAlert {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly offboardingDate: string
  readonly timeAgo: string
  readonly licenses: Array<{
    name: string
    icon: string
    color: string
  }>
  readonly totalCost: number
}

export interface DepartmentBreakdown {
  readonly name: string
  readonly employeeCount: number
  readonly monthlyCost: number
  readonly percentage: number
  readonly color: string
}

// ============================================================================
// Repository Filters
// ============================================================================

export interface EmployeeFilters {
  readonly status?: EmployeeStatus | 'all'
  readonly search?: string
  readonly departmentId?: string
  readonly hasActiveSubscriptions?: boolean
}
