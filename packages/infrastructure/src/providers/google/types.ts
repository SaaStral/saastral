/**
 * Google Workspace API Types
 *
 * Type definitions for Google Admin SDK API responses.
 * These types represent the raw API responses before mapping to domain types.
 */

/**
 * Google User status from Admin SDK
 */
export type GoogleUserStatus = 'active' | 'suspended' | 'archived' | 'deleted'

/**
 * Google User from Admin SDK Directory API
 * https://developers.google.com/admin-sdk/directory/reference/rest/v1/users
 */
export interface GoogleUser {
  id: string // Unique identifier
  primaryEmail: string
  name: {
    givenName?: string
    familyName?: string
    fullName?: string
  }
  suspended?: boolean
  archived?: boolean
  orgUnitPath?: string // e.g., "/Engineering/Backend"
  organizations?: Array<{
    title?: string
    department?: string
    primary?: boolean
  }>
  phones?: Array<{
    value?: string
    type?: string
    primary?: boolean
  }>
  relations?: Array<{
    value?: string // Manager email
    type?: string
    customType?: string
  }>
  thumbnailPhotoUrl?: string
  creationTime?: string // ISO 8601
  lastLoginTime?: string // ISO 8601
  suspensionReason?: string
  customSchemas?: {
    [key: string]: unknown
  }
}

/**
 * Google Org Unit from Admin SDK Directory API
 * https://developers.google.com/admin-sdk/directory/reference/rest/v1/orgunits
 */
export interface GoogleOrgUnit {
  orgUnitId: string
  name: string
  orgUnitPath: string // e.g., "/Engineering/Backend"
  parentOrgUnitId?: string
  parentOrgUnitPath?: string
  description?: string
  blockInheritance?: boolean
}

/**
 * Google API List Response
 */
export interface GoogleListUsersResponse {
  kind: 'admin#directory#users'
  users?: GoogleUser[]
  nextPageToken?: string
}

export interface GoogleListOrgUnitsResponse {
  kind: 'admin#directory#orgUnits'
  organizationUnits?: GoogleOrgUnit[]
}

/**
 * Type guards for Google API responses
 */
export function isGoogleUser(obj: unknown): obj is GoogleUser {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'primaryEmail' in obj &&
    typeof (obj as GoogleUser).id === 'string' &&
    typeof (obj as GoogleUser).primaryEmail === 'string'
  )
}

export function isGoogleOrgUnit(obj: unknown): obj is GoogleOrgUnit {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'orgUnitId' in obj &&
    'orgUnitPath' in obj &&
    typeof (obj as GoogleOrgUnit).orgUnitId === 'string' &&
    typeof (obj as GoogleOrgUnit).orgUnitPath === 'string'
  )
}

/**
 * Map Google user status to domain status
 */
export function mapGoogleUserStatus(user: GoogleUser): GoogleUserStatus {
  if (user.archived) {
    return 'archived'
  }
  if (user.suspended) {
    return 'suspended'
  }
  return 'active'
}
