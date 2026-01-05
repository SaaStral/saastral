/**
 * Google Directory Provider
 *
 * CRITICAL - Implements DirectoryProvider interface for Google Workspace.
 *
 * Responsibilities:
 * - Fetch users from Google Admin SDK
 * - Fetch organizational units (departments)
 * - Map Google-specific types to domain types
 * - Handle pagination
 */

import type {
  DirectoryProvider,
  DirectoryUser,
  DirectoryOrgUnit,
  DirectoryListOptions,
  DirectoryListResult,
  DirectoryUserStatus,
  ServiceAccountCredentials,
} from '@saastral/core'
import { GoogleAPIClient } from './google-api.client'
import type { admin_directory_v1 } from 'googleapis'

export interface GoogleDirectoryProviderConfig {
  credentials: ServiceAccountCredentials
  adminEmail: string // Email to impersonate for domain-wide delegation
  customerId?: string // Optional Google Workspace customer ID
  domain?: string // Optional organization domain
}

/**
 * Google Directory Provider
 *
 * Implements DirectoryProvider for Google Workspace using Admin SDK.
 */
export class GoogleDirectoryProvider implements DirectoryProvider {
  private client: GoogleAPIClient

  constructor(config: GoogleDirectoryProviderConfig) {
    this.client = new GoogleAPIClient({
      credentials: config.credentials,
      adminEmail: config.adminEmail,
      customerId: config.customerId,
    })
  }

  /**
   * Test connection to Google Workspace
   */
  async testConnection(): Promise<void> {
    await this.client.testConnection()
  }

  /**
   * List users with pagination
   */
  async listUsers(options?: DirectoryListOptions): Promise<DirectoryListResult<DirectoryUser>> {
    const pageSize = options?.pageSize || 500
    const pageToken = options?.pageToken

    const response = await this.client.listUsers(pageSize, pageToken)

    const users = response.users.map((googleUser) => this.mapUserToDomain(googleUser))

    return {
      items: users,
      nextPageToken: response.nextPageToken,
      totalCount: undefined, // Google API doesn't provide total count
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<DirectoryUser | null> {
    const googleUser = await this.client.getUserByEmail(email)

    if (!googleUser) {
      return null
    }

    return this.mapUserToDomain(googleUser)
  }

  /**
   * Get user by external ID
   */
  async getUserById(externalId: string): Promise<DirectoryUser | null> {
    const googleUser = await this.client.getUserById(externalId)

    if (!googleUser) {
      return null
    }

    return this.mapUserToDomain(googleUser)
  }

  /**
   * List organizational units
   */
  async listOrgUnits(): Promise<DirectoryOrgUnit[]> {
    const googleOrgUnits = await this.client.listOrgUnits()

    return googleOrgUnits.map((orgUnit) => this.mapOrgUnitToDomain(orgUnit))
  }

  /**
   * Get organizational unit by ID (path)
   */
  async getOrgUnitById(externalId: string): Promise<DirectoryOrgUnit | null> {
    const googleOrgUnit = await this.client.getOrgUnitById(externalId)

    if (!googleOrgUnit) {
      return null
    }

    return this.mapOrgUnitToDomain(googleOrgUnit)
  }

  /**
   * Map Google User to domain DirectoryUser
   */
  private mapUserToDomain(googleUser: admin_directory_v1.Schema$User): DirectoryUser {
    // Determine status
    const status = this.mapUserStatus(googleUser)

    // Extract primary phone
    const primaryPhone = googleUser.phones?.find((p: any) => p.primary)?.value

    // Extract job title from organizations
    const primaryOrg = googleUser.organizations?.find((o: any) => o.primary)
    const jobTitle = primaryOrg?.title

    // Extract department
    const departmentName = primaryOrg?.department

    // Extract manager email from relations
    const managerRelation = googleUser.relations?.find(
      (r: any) => r.type === 'manager' || r.customType === 'manager',
    )
    const managerEmail = managerRelation?.value

    // Parse dates
    const startDate = googleUser.creationTime ? new Date(googleUser.creationTime) : undefined
    const lastLoginAt = googleUser.lastLoginTime ? new Date(googleUser.lastLoginTime) : undefined
    const suspendedAt =
      googleUser.suspended && googleUser.suspensionReason
        ? new Date() // Google doesn't provide suspension date
        : undefined

    return {
      externalId: googleUser.id!,
      email: googleUser.primaryEmail!,
      fullName: googleUser.name?.fullName || googleUser.primaryEmail!,
      firstName: googleUser.name?.givenName ?? undefined,
      lastName: googleUser.name?.familyName ?? undefined,
      status,
      jobTitle: jobTitle ?? undefined,
      departmentId: googleUser.orgUnitPath ?? undefined, // Use org unit path as department ID
      departmentName: departmentName ?? undefined,
      managerEmail: managerEmail ?? undefined,
      phoneNumber: primaryPhone ?? undefined,
      startDate,
      lastLoginAt,
      suspendedAt,
      metadata: {
        orgUnitPath: googleUser.orgUnitPath,
        thumbnailPhotoUrl: googleUser.thumbnailPhotoUrl,
        customSchemas: googleUser.customSchemas,
        suspensionReason: googleUser.suspensionReason,
      },
    }
  }

  /**
   * Map Google Org Unit to domain DirectoryOrgUnit
   */
  private mapOrgUnitToDomain(
    googleOrgUnit: admin_directory_v1.Schema$OrgUnit,
  ): DirectoryOrgUnit {
    // Extract parent ID from parent path
    // If parentOrgUnitPath is "/", then it's a root unit (no parent)
    const parentId =
      googleOrgUnit.parentOrgUnitPath && googleOrgUnit.parentOrgUnitPath !== '/'
        ? googleOrgUnit.parentOrgUnitPath
        : undefined

    return {
      externalId: googleOrgUnit.orgUnitId || googleOrgUnit.orgUnitPath!,
      name: googleOrgUnit.name!,
      path: googleOrgUnit.orgUnitPath!,
      parentId,
      description: googleOrgUnit.description ?? undefined,
      metadata: {
        blockInheritance: googleOrgUnit.blockInheritance,
      },
    }
  }

  /**
   * Map Google user status to domain DirectoryUserStatus
   */
  private mapUserStatus(googleUser: admin_directory_v1.Schema$User): DirectoryUserStatus {
    if (googleUser.archived) {
      return 'archived'
    }

    if (googleUser.suspended) {
      return 'suspended'
    }

    return 'active'
  }
}
