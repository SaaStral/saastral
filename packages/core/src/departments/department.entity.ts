/**
 * Department Domain Entity
 *
 * Represents an organizational department/unit within a company.
 * Supports hierarchical structure (departments can have parent departments).
 */

export interface DepartmentProps {
  id: string
  organizationId: string
  name: string
  description?: string
  parentId?: string
  externalId?: string // ID from Google Workspace, Microsoft 365, etc.
  externalProvider?: 'google' | 'microsoft' | 'okta' | 'keycloak'
  path?: string // Full path (e.g., "/Engineering/Backend")
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

export class Department {
  private props: Mutable<DepartmentProps>

  private constructor(props: DepartmentProps) {
    this.props = { ...props } as Mutable<DepartmentProps>
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Create a new department
   */
  static create(
    props: Omit<DepartmentProps, 'id' | 'createdAt' | 'updatedAt' | 'metadata'> & {
      id?: string
      metadata?: Record<string, unknown>
    },
  ): Department {
    return new Department({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      metadata: props.metadata ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: DepartmentProps): Department {
    return new Department(props)
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get id(): string {
    return this.props.id
  }

  get organizationId(): string {
    return this.props.organizationId
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | undefined {
    return this.props.description
  }

  get parentId(): string | undefined {
    return this.props.parentId
  }

  get externalId(): string | undefined {
    return this.props.externalId
  }

  get externalProvider(): 'google' | 'microsoft' | 'okta' | 'keycloak' | undefined {
    return this.props.externalProvider
  }

  get path(): string | undefined {
    return this.props.path
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get createdBy(): string | undefined {
    return this.props.createdBy
  }

  get updatedBy(): string | undefined {
    return this.props.updatedBy
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Check if this is a root department (no parent)
   */
  isRoot(): boolean {
    return !this.props.parentId
  }

  /**
   * Check if this department has an external ID (synced from provider)
   */
  hasExternalId(): boolean {
    return !!this.props.externalId
  }

  /**
   * Get depth level based on path (0 = root, 1 = first level, etc.)
   */
  getDepth(): number {
    if (!this.props.path) {
      return 0
    }
    // Count slashes, excluding leading slash
    const parts = this.props.path.split('/').filter((p) => p.length > 0)
    return parts.length
  }

  // ============================================================================
  // Business Methods
  // ============================================================================

  /**
   * Update department name
   */
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Department name cannot be empty')
    }

    this.props.name = name.trim()
    this.props.updatedAt = new Date()
  }

  /**
   * Update department description
   */
  updateDescription(description: string | undefined): void {
    this.props.description = description
    this.props.updatedAt = new Date()
  }

  /**
   * Update parent department
   * Business Rule: Cannot set self as parent (prevents circular reference)
   */
  updateParent(parentId: string | undefined): void {
    if (parentId === this.props.id) {
      throw new Error('Department cannot be its own parent')
    }

    this.props.parentId = parentId
    this.props.updatedAt = new Date()
  }

  /**
   * Update external ID (from directory provider)
   */
  updateExternalId(
    externalId: string,
    provider: 'google' | 'microsoft' | 'okta' | 'keycloak',
  ): void {
    this.props.externalId = externalId
    this.props.externalProvider = provider
    this.props.updatedAt = new Date()
  }

  /**
   * Update department path
   */
  updatePath(path: string): void {
    this.props.path = path
    this.props.updatedAt = new Date()
  }

  /**
   * Update metadata
   */
  updateMetadata(metadata: Record<string, unknown>): void {
    this.props.metadata = {
      ...this.props.metadata,
      ...metadata,
    }
    this.props.updatedAt = new Date()
  }

  /**
   * Clear external ID (when disconnecting integration)
   */
  clearExternalId(): void {
    this.props.externalId = undefined
    this.props.externalProvider = undefined
    this.props.updatedAt = new Date()
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  toJSON(): DepartmentProps {
    return { ...this.props }
  }
}
