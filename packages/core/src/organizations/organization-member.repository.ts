/**
 * Organization Member Repository Interface (Port)
 * Defines the contract for organization membership data access
 * Implementation will be in Infrastructure layer
 */
export interface OrganizationMemberRepository {
  /**
   * Create a new organization membership
   */
  create(input: CreateOrganizationMemberData): Promise<OrganizationMemberData>

  /**
   * Find membership by organization and user
   */
  findByOrganizationAndUser(
    organizationId: string,
    userId: string
  ): Promise<OrganizationMemberData | null>

  /**
   * List members of an organization
   */
  listByOrganization(organizationId: string): Promise<OrganizationMemberData[]>

  /**
   * Update member role
   */
  updateRole(
    organizationId: string,
    userId: string,
    role: OrganizationRole
  ): Promise<OrganizationMemberData>

  /**
   * Remove member from organization
   */
  remove(organizationId: string, userId: string): Promise<void>

  /**
   * List organizations for a user
   */
  listOrganizationsByUser(userId: string): Promise<UserOrganizationData[]>
}

/**
 * Organization member data type
 */
export interface OrganizationMemberData {
  organizationId: string
  userId: string
  role: OrganizationRole
  acceptedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Organization member role
 */
export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer'

/**
 * Input for creating an organization member
 */
export interface CreateOrganizationMemberData {
  organizationId: string
  userId: string
  role: OrganizationRole
  acceptedAt?: Date
}

/**
 * User's organization data (for listing organizations a user belongs to)
 */
export interface UserOrganizationData {
  id: string
  name: string
  slug: string
  role: OrganizationRole
}
