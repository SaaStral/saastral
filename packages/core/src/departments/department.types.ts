/**
 * Department Service DTOs
 *
 * Data Transfer Objects for department service layer.
 * Base types (DepartmentProps) are exported from department.entity.ts
 */

// ============================================================================
// Service Input/Output DTOs
// ============================================================================

export interface CreateDepartmentInput {
  readonly organizationId: string
  readonly name: string
  readonly description?: string
  readonly parentId?: string
  readonly externalId?: string
  readonly externalProvider?: 'google' | 'microsoft' | 'okta' | 'keycloak'
  readonly metadata?: Record<string, unknown>
  readonly createdBy?: string
}

export interface UpdateDepartmentInput {
  readonly name?: string
  readonly description?: string
  readonly parentId?: string | null
}
