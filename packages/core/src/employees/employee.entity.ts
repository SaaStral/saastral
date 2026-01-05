import { Email } from '../shared/value-objects/email'
import { EmployeeProps, EmployeeStatus } from './employee.types'
import { EmployeeAlreadyOffboardedError, InvalidEmployeeStatusError } from './employee.errors'

// Utility type to make all properties mutable
type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

export class Employee {
  private props: Mutable<EmployeeProps>

  private constructor(props: EmployeeProps) {
    this.props = { ...props } as Mutable<EmployeeProps>
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Create a new employee
   */
  static create(
    props: Omit<EmployeeProps, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'metadata'>
  ): Employee {
    return new Employee({
      ...props,
      id: crypto.randomUUID(),
      status: 'active',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Reconstitute from database
   */
  static reconstitute(props: EmployeeProps): Employee {
    return new Employee(props)
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

  get email(): Email {
    return this.props.email
  }

  get title(): string | undefined {
    return this.props.title
  }

  get phone(): string | undefined {
    return this.props.phone
  }

  get avatarUrl(): string | undefined {
    return this.props.avatarUrl
  }

  get status(): EmployeeStatus {
    return this.props.status
  }

  get departmentId(): string | undefined {
    return this.props.departmentId
  }

  get managerId(): string | undefined {
    return this.props.managerId
  }

  get hiredAt(): Date | undefined {
    return this.props.hiredAt
  }

  get offboardedAt(): Date | undefined {
    return this.props.offboardedAt
  }

  get externalId(): string | undefined {
    return this.props.externalId
  }

  get externalProvider(): 'google' | 'microsoft' | 'okta' | 'keycloak' | undefined {
    return this.props.externalProvider
  }

  get metadata(): Record<string, unknown> {
    return this.props.metadata
  }

  get monthlySaasCost(): bigint | undefined {
    return this.props.monthlySaasCost
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

  isActive(): boolean {
    return this.props.status === 'active'
  }

  isSuspended(): boolean {
    return this.props.status === 'suspended'
  }

  isOffboarded(): boolean {
    return this.props.status === 'offboarded'
  }

  hasExternalId(): boolean {
    return !!this.props.externalId
  }

  // ============================================================================
  // Business Methods
  // ============================================================================

  /**
   * Offboard the employee
   * Business Rule: Can only offboard active or suspended employees
   */
  offboard(): void {
    if (this.isOffboarded()) {
      throw new EmployeeAlreadyOffboardedError(this.id)
    }

    this.props.status = 'offboarded'
    this.props.offboardedAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * Suspend the employee
   * Business Rule: Can only suspend active employees
   */
  suspend(): void {
    if (!this.isActive()) {
      throw new InvalidEmployeeStatusError(this.props.status, 'suspend')
    }

    this.props.status = 'suspended'
    this.props.updatedAt = new Date()
  }

  /**
   * Reactivate the employee
   * Business Rule: Can only reactivate suspended employees
   */
  reactivate(): void {
    if (!this.isSuspended()) {
      throw new InvalidEmployeeStatusError(this.props.status, 'reactivate')
    }

    this.props.status = 'active'
    this.props.updatedAt = new Date()
  }

  /**
   * Update monthly SaaS cost
   */
  updateMonthlySaasCost(costInCents: bigint): void {
    this.props.monthlySaasCost = costInCents
    this.props.updatedAt = new Date()
  }

  /**
   * Update department
   */
  updateDepartment(departmentId: string | undefined): void {
    this.props.departmentId = departmentId
    this.props.updatedAt = new Date()
  }

  /**
   * Update manager
   */
  updateManager(managerId: string | undefined): void {
    this.props.managerId = managerId
    this.props.updatedAt = new Date()
  }

  /**
   * Update profile information
   */
  updateProfile(updates: {
    name?: string
    title?: string
    phone?: string
    avatarUrl?: string
  }): void {
    if (updates.name !== undefined) {
      this.props.name = updates.name
    }
    if (updates.title !== undefined) {
      this.props.title = updates.title
    }
    if (updates.phone !== undefined) {
      this.props.phone = updates.phone
    }
    if (updates.avatarUrl !== undefined) {
      this.props.avatarUrl = updates.avatarUrl
    }
    this.props.updatedAt = new Date()
  }

  /**
   * Update name
   * Used by directory sync to update employee name from external provider
   */
  updateName(name: string): void {
    this.props.name = name
    this.props.updatedAt = new Date()
  }

  /**
   * Update email
   * Used by directory sync to update employee email from external provider
   */
  updateEmail(email: Email): void {
    this.props.email = email
    this.props.updatedAt = new Date()
  }

  /**
   * Update external ID
   * Used by directory sync to link employee to external provider
   */
  updateExternalId(
    externalId: string,
    provider: 'google' | 'microsoft' | 'okta' | 'keycloak',
  ): void {
    this.props.externalId = externalId
    this.props.externalProvider = provider
    this.props.updatedAt = new Date()
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  toJSON(): EmployeeProps {
    return { ...this.props }
  }
}
