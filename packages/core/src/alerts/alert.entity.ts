/**
 * Alert Domain Entity
 *
 * Represents a notification about something that needs attention
 * (e.g., employee offboarded with active licenses, renewal approaching, etc.)
 */

/**
 * Alert type classification
 */
export type AlertType =
  | 'offboarding' // Employee left, has active licenses
  | 'renewal_upcoming' // Subscription renewal approaching
  | 'unused_license' // License not used for X days
  | 'low_utilization' // Less than threshold% usage
  | 'duplicate_tool' // Similar tools in same category
  | 'cost_anomaly' // Unusual cost increase
  | 'seat_shortage' // Running out of seats
  | 'trial_ending' // Trial period ending

/**
 * Alert severity level
 */
export type AlertSeverity = 'info' | 'warning' | 'critical'

/**
 * Alert status
 */
export type AlertStatus = 'pending' | 'acknowledged' | 'resolved' | 'dismissed'

export interface AlertProps {
  id: string
  organizationId: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  title: string
  description?: string
  employeeId?: string
  subscriptionId?: string
  data?: Record<string, unknown>
  potentialSavings?: bigint // In cents
  currency?: string
  resolvedAt?: Date
  resolvedBy?: string
  resolutionNotes?: string
  acknowledgedAt?: Date
  acknowledgedBy?: string
  dismissedAt?: Date
  dismissedBy?: string
  dismissReason?: string
  snoozedUntil?: Date
  snoozedBy?: string
  alertKey?: string // For deduplication
  createdAt: Date
  updatedAt: Date
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

export class Alert {
  private props: Mutable<AlertProps>

  private constructor(props: AlertProps) {
    this.props = { ...props } as Mutable<AlertProps>
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Create a new alert
   */
  static create(
    props: Omit<AlertProps, 'id' | 'status' | 'createdAt' | 'updatedAt'> & {
      id?: string
    },
  ): Alert {
    return new Alert({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: AlertProps): Alert {
    return new Alert(props)
  }

  /**
   * Generate alert key for deduplication
   *
   * Alert key format:
   * - offboarding: `offboarding:employeeId`
   * - renewal_upcoming: `renewal:subscriptionId`
   * - unused_license: `unused:employeeId:subscriptionId`
   * - low_utilization: `low_util:subscriptionId`
   * - etc.
   */
  static generateAlertKey(
    type: AlertType,
    options: {
      employeeId?: string
      subscriptionId?: string
      metadata?: Record<string, string>
    },
  ): string {
    switch (type) {
      case 'offboarding':
        if (!options.employeeId) {
          throw new Error('employeeId required for offboarding alert key')
        }
        return `offboarding:${options.employeeId}`

      case 'renewal_upcoming':
        if (!options.subscriptionId) {
          throw new Error(
            'subscriptionId required for renewal_upcoming alert key',
          )
        }
        return `renewal:${options.subscriptionId}`

      case 'unused_license':
        if (!options.employeeId || !options.subscriptionId) {
          throw new Error(
            'employeeId and subscriptionId required for unused_license alert key',
          )
        }
        return `unused:${options.employeeId}:${options.subscriptionId}`

      case 'low_utilization':
        if (!options.subscriptionId) {
          throw new Error(
            'subscriptionId required for low_utilization alert key',
          )
        }
        return `low_util:${options.subscriptionId}`

      case 'duplicate_tool':
        if (!options.metadata?.category) {
          throw new Error(
            'category metadata required for duplicate_tool alert key',
          )
        }
        return `duplicate:${options.metadata.category}`

      case 'cost_anomaly':
        if (!options.subscriptionId) {
          throw new Error(
            'subscriptionId required for cost_anomaly alert key',
          )
        }
        return `cost_anomaly:${options.subscriptionId}`

      case 'seat_shortage':
        if (!options.subscriptionId) {
          throw new Error(
            'subscriptionId required for seat_shortage alert key',
          )
        }
        return `seat_shortage:${options.subscriptionId}`

      case 'trial_ending':
        if (!options.subscriptionId) {
          throw new Error(
            'subscriptionId required for trial_ending alert key',
          )
        }
        return `trial_ending:${options.subscriptionId}`

      default:
        return `${type}:${options.employeeId || options.subscriptionId || 'unknown'}`
    }
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

  get type(): AlertType {
    return this.props.type
  }

  get severity(): AlertSeverity {
    return this.props.severity
  }

  get status(): AlertStatus {
    return this.props.status
  }

  get title(): string {
    return this.props.title
  }

  get description(): string | undefined {
    return this.props.description
  }

  get employeeId(): string | undefined {
    return this.props.employeeId
  }

  get subscriptionId(): string | undefined {
    return this.props.subscriptionId
  }

  get data(): Record<string, unknown> | undefined {
    return this.props.data
  }

  get potentialSavings(): bigint | undefined {
    return this.props.potentialSavings
  }

  get currency(): string | undefined {
    return this.props.currency
  }

  get resolvedAt(): Date | undefined {
    return this.props.resolvedAt
  }

  get resolvedBy(): string | undefined {
    return this.props.resolvedBy
  }

  get resolutionNotes(): string | undefined {
    return this.props.resolutionNotes
  }

  get acknowledgedAt(): Date | undefined {
    return this.props.acknowledgedAt
  }

  get acknowledgedBy(): string | undefined {
    return this.props.acknowledgedBy
  }

  get dismissedAt(): Date | undefined {
    return this.props.dismissedAt
  }

  get dismissedBy(): string | undefined {
    return this.props.dismissedBy
  }

  get dismissReason(): string | undefined {
    return this.props.dismissReason
  }

  get snoozedUntil(): Date | undefined {
    return this.props.snoozedUntil
  }

  get snoozedBy(): string | undefined {
    return this.props.snoozedBy
  }

  get alertKey(): string | undefined {
    return this.props.alertKey
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  isPending(): boolean {
    return this.props.status === 'pending'
  }

  isAcknowledged(): boolean {
    return this.props.status === 'acknowledged'
  }

  isResolved(): boolean {
    return this.props.status === 'resolved'
  }

  isDismissed(): boolean {
    return this.props.status === 'dismissed'
  }

  isCritical(): boolean {
    return this.props.severity === 'critical'
  }

  isSnoozed(): boolean {
    if (!this.props.snoozedUntil) {
      return false
    }
    return this.props.snoozedUntil > new Date()
  }

  // ============================================================================
  // Business Methods
  // ============================================================================

  /**
   * Acknowledge the alert
   * Business Rule: Can only acknowledge pending alerts
   */
  acknowledge(userId: string): void {
    if (this.props.status !== 'pending') {
      throw new Error(
        `Cannot acknowledge alert with status: ${this.props.status}`,
      )
    }

    this.props.status = 'acknowledged'
    this.props.acknowledgedAt = new Date()
    this.props.acknowledgedBy = userId
    this.props.updatedAt = new Date()
  }

  /**
   * Resolve the alert
   * Business Rule: Can resolve pending or acknowledged alerts
   */
  resolve(userId: string, notes?: string): void {
    if (this.props.status === 'resolved') {
      return // Already resolved
    }

    if (this.props.status === 'dismissed') {
      throw new Error('Cannot resolve dismissed alert')
    }

    this.props.status = 'resolved'
    this.props.resolvedAt = new Date()
    this.props.resolvedBy = userId
    this.props.resolutionNotes = notes
    this.props.updatedAt = new Date()
  }

  /**
   * Dismiss the alert
   * Business Rule: Can dismiss any alert except resolved ones
   */
  dismiss(userId: string, reason?: string): void {
    if (this.props.status === 'resolved') {
      throw new Error('Cannot dismiss resolved alert')
    }

    this.props.status = 'dismissed'
    this.props.dismissedAt = new Date()
    this.props.dismissedBy = userId
    this.props.dismissReason = reason
    this.props.updatedAt = new Date()
  }

  /**
   * Snooze the alert until a specific date
   */
  snooze(userId: string, until: Date): void {
    if (this.props.status !== 'pending') {
      throw new Error('Can only snooze pending alerts')
    }

    if (until <= new Date()) {
      throw new Error('Snooze date must be in the future')
    }

    this.props.snoozedUntil = until
    this.props.snoozedBy = userId
    this.props.updatedAt = new Date()
  }

  /**
   * Unsnooze the alert
   */
  unsnooze(): void {
    this.props.snoozedUntil = undefined
    this.props.snoozedBy = undefined
    this.props.updatedAt = new Date()
  }

  /**
   * Update severity
   */
  updateSeverity(severity: AlertSeverity): void {
    this.props.severity = severity
    this.props.updatedAt = new Date()
  }

  /**
   * Update potential savings
   */
  updatePotentialSavings(amountInCents: bigint, currency: string = 'BRL'): void {
    this.props.potentialSavings = amountInCents
    this.props.currency = currency
    this.props.updatedAt = new Date()
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  toJSON(): AlertProps {
    return { ...this.props }
  }
}
