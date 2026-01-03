/**
 * Organization Repository Interface (Port)
 * Defines the contract for organization data access
 * Implementation will be in Infrastructure layer
 */
export interface OrganizationRepository {
  /**
   * Find organization by ID
   */
  findById(id: string): Promise<OrganizationData | null>

  /**
   * Find organization by slug
   */
  findBySlug(slug: string): Promise<OrganizationData | null>

  /**
   * Create a new organization
   */
  create(input: CreateOrganizationData): Promise<OrganizationData>

  /**
   * Update organization
   */
  update(id: string, input: UpdateOrganizationData): Promise<OrganizationData>

  /**
   * Delete organization (soft delete)
   */
  delete(id: string): Promise<void>
}

/**
 * Organization data type returned by repository
 */
export interface OrganizationData {
  id: string
  name: string
  slug: string
  plan: string
  planStartedAt: Date | null
  settings: OrganizationSettings
  createdAt: Date
  updatedAt: Date
}

/**
 * Organization settings structure
 */
export interface OrganizationSettings {
  timezone: string
  currency: string
  alertDefaults: {
    unusedLicenseDays: number
    lowUtilizationThreshold: number
    renewalReminderDays: number[]
  }
}

/**
 * Input for creating an organization
 */
export interface CreateOrganizationData {
  name: string
  slug: string
  plan: string
  planStartedAt: Date
  settings: OrganizationSettings
}

/**
 * Input for updating an organization
 */
export interface UpdateOrganizationData {
  name?: string
  slug?: string
  plan?: string
  planStartedAt?: Date
  settings?: Partial<OrganizationSettings>
}
