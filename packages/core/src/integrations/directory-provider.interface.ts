/**
 * Directory Provider Interface
 *
 * Provider-agnostic interface for employee directory synchronization.
 * Implementations handle Google Workspace, Microsoft 365, etc.
 *
 * This is a port in the hexagonal architecture - implementations live in
 * the infrastructure layer.
 */

/**
 * User status in the directory provider
 */
export type DirectoryUserStatus =
  | 'active' // User is active and can log in
  | 'suspended' // User is suspended (account locked)
  | 'archived' // User is archived but not deleted
  | 'deleted' // User is deleted

/**
 * Directory user representation (provider-agnostic)
 */
export interface DirectoryUser {
  /**
   * Unique identifier in the provider system
   * (e.g., Google User ID, Azure AD Object ID)
   */
  externalId: string

  /**
   * Primary email address
   */
  email: string

  /**
   * Full name
   */
  fullName: string

  /**
   * First name
   */
  firstName?: string

  /**
   * Last name
   */
  lastName?: string

  /**
   * User status
   */
  status: DirectoryUserStatus

  /**
   * Job title
   */
  jobTitle?: string

  /**
   * Department ID (external)
   */
  departmentId?: string

  /**
   * Department name
   */
  departmentName?: string

  /**
   * Manager email
   */
  managerEmail?: string

  /**
   * Phone number
   */
  phoneNumber?: string

  /**
   * Employee start date
   */
  startDate?: Date

  /**
   * Last login date (if available)
   */
  lastLoginAt?: Date

  /**
   * Date user was suspended (if applicable)
   */
  suspendedAt?: Date

  /**
   * Provider-specific metadata
   */
  metadata?: Record<string, unknown>
}

/**
 * Organizational unit / department representation
 */
export interface DirectoryOrgUnit {
  /**
   * Unique identifier in the provider system
   */
  externalId: string

  /**
   * Organization unit name
   */
  name: string

  /**
   * Full path (e.g., "/Engineering/Backend")
   */
  path: string

  /**
   * Parent organization unit ID
   */
  parentId?: string

  /**
   * Description
   */
  description?: string

  /**
   * Provider-specific metadata
   */
  metadata?: Record<string, unknown>
}

/**
 * Pagination options
 */
export interface DirectoryListOptions {
  /**
   * Maximum number of results per page
   */
  pageSize?: number

  /**
   * Pagination token from previous request
   */
  pageToken?: string

  /**
   * Filter by status
   */
  status?: DirectoryUserStatus[]

  /**
   * Filter by department
   */
  departmentId?: string

  /**
   * Include deleted users
   */
  includeDeleted?: boolean
}

/**
 * Paginated list result
 */
export interface DirectoryListResult<T> {
  /**
   * List of items
   */
  items: T[]

  /**
   * Token for next page (if available)
   */
  nextPageToken?: string

  /**
   * Total count (if available from provider)
   */
  totalCount?: number
}

/**
 * Directory Provider Interface
 *
 * Defines operations for synchronizing employee directory data
 * from external providers (Google Workspace, Microsoft 365, etc.)
 */
export interface DirectoryProvider {
  /**
   * Test connection to the provider
   * Throws error if connection fails
   */
  testConnection(): Promise<void>

  /**
   * List all users with pagination
   */
  listUsers(
    options?: DirectoryListOptions,
  ): Promise<DirectoryListResult<DirectoryUser>>

  /**
   * Get a single user by email
   */
  getUserByEmail(email: string): Promise<DirectoryUser | null>

  /**
   * Get a single user by external ID
   */
  getUserById(externalId: string): Promise<DirectoryUser | null>

  /**
   * List organizational units / departments
   */
  listOrgUnits(): Promise<DirectoryOrgUnit[]>

  /**
   * Get organization unit by ID
   */
  getOrgUnitById(externalId: string): Promise<DirectoryOrgUnit | null>
}
