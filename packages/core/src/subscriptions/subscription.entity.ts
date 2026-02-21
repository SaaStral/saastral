import {
  SubscriptionProps,
  SubscriptionStatus,
  SubscriptionCategory,
  SubscriptionBillingCycle,
  PricingModel,
  LicenseType,
  PaymentMethod,
  ContractType,
} from './subscription.types'
import {
  SubscriptionAlreadyCancelledError,
  SubscriptionAlreadyExpiredError,
  InvalidSubscriptionStatusError,
  InvalidSeatsConfigurationError,
  SeatLimitExceededError,
} from './subscription.errors'

// Utility type to make all properties mutable
type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

export class Subscription {
  private props: Mutable<SubscriptionProps>

  private constructor(props: SubscriptionProps) {
    this.props = { ...props } as Mutable<SubscriptionProps>
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Create a new subscription
   */
  static create(
    props: Omit<SubscriptionProps, 'id' | 'status' | 'usedSeats' | 'createdAt' | 'updatedAt' | 'metadata'> & {
      status?: SubscriptionStatus
    }
  ): Subscription {
    return new Subscription({
      ...props,
      id: crypto.randomUUID(),
      status: props.status || 'active',
      usedSeats: 0,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Reconstitute from database
   */
  static reconstitute(props: SubscriptionProps): Subscription {
    return new Subscription(props)
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

  get vendor(): string | undefined {
    return this.props.vendor
  }

  get category(): SubscriptionCategory {
    return this.props.category
  }

  get description(): string | undefined {
    return this.props.description
  }

  get website(): string | undefined {
    return this.props.website
  }

  get logoUrl(): string | undefined {
    return this.props.logoUrl
  }

  get tags(): string[] {
    return this.props.tags
  }

  get status(): SubscriptionStatus {
    return this.props.status
  }

  get contractType(): ContractType | undefined {
    return this.props.contractType
  }

  get billingCycle(): SubscriptionBillingCycle {
    return this.props.billingCycle
  }

  get pricingModel(): PricingModel {
    return this.props.pricingModel
  }

  get currency(): string {
    return this.props.currency
  }

  get pricePerUnit(): bigint | undefined {
    return this.props.pricePerUnit
  }

  get totalMonthlyCost(): bigint {
    return this.props.totalMonthlyCost
  }

  get annualValue(): bigint | undefined {
    return this.props.annualValue
  }

  get discountPercentage(): number | undefined {
    return this.props.discountPercentage
  }

  get originalPrice(): bigint | undefined {
    return this.props.originalPrice
  }

  get totalSeats(): number | undefined {
    return this.props.totalSeats
  }

  get usedSeats(): number {
    return this.props.usedSeats
  }

  get seatsUnlimited(): boolean {
    return this.props.seatsUnlimited
  }

  get licenseType(): LicenseType | undefined {
    return this.props.licenseType
  }

  get paymentMethod(): PaymentMethod | undefined {
    return this.props.paymentMethod
  }

  get billingEmail(): string | undefined {
    return this.props.billingEmail
  }

  get autoRenew(): boolean {
    return this.props.autoRenew
  }

  get costCenter(): string | undefined {
    return this.props.costCenter
  }

  get budgetCode(): string | undefined {
    return this.props.budgetCode
  }

  get startDate(): Date {
    return this.props.startDate
  }

  get renewalDate(): Date {
    return this.props.renewalDate
  }

  get cancellationDeadline(): Date | undefined {
    return this.props.cancellationDeadline
  }

  get trialEndDate(): Date | undefined {
    return this.props.trialEndDate
  }

  get reminderDays(): number[] {
    return this.props.reminderDays
  }

  get ownerId(): string | undefined {
    return this.props.ownerId
  }

  get departmentId(): string | undefined {
    return this.props.departmentId
  }

  get approverId(): string | undefined {
    return this.props.approverId
  }

  get vendorContact(): Record<string, unknown> | undefined {
    return this.props.vendorContact
  }

  get notes(): string | undefined {
    return this.props.notes
  }

  get integrationId(): string | undefined {
    return this.props.integrationId
  }

  get ssoAppId(): string | undefined {
    return this.props.ssoAppId
  }

  get usagePercentage(): number | undefined {
    return this.props.usagePercentage
  }

  get lastUsageCalculatedAt(): Date | undefined {
    return this.props.lastUsageCalculatedAt
  }

  get metadata(): Record<string, unknown> {
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

  isActive(): boolean {
    return this.props.status === 'active'
  }

  isTrial(): boolean {
    return this.props.status === 'trial'
  }

  isSuspended(): boolean {
    return this.props.status === 'suspended'
  }

  isCancelled(): boolean {
    return this.props.status === 'cancelled'
  }

  isExpired(): boolean {
    return this.props.status === 'expired'
  }

  getAvailableSeats(): number {
    if (this.props.seatsUnlimited) return Infinity
    return (this.props.totalSeats || 0) - this.props.usedSeats
  }

  getUtilizationRate(): number {
    if (this.props.seatsUnlimited || !this.props.totalSeats) return 0
    return Math.round((this.props.usedSeats / this.props.totalSeats) * 100)
  }

  getDaysUntilRenewal(): number {
    const now = new Date()
    const diff = this.props.renewalDate.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  isRenewalSoon(days: number = 30): boolean {
    return this.getDaysUntilRenewal() <= days
  }

  // ============================================================================
  // Business Methods - Status Transitions
  // ============================================================================

  /**
   * Cancel the subscription
   * Business Rule: Cannot cancel if already cancelled or expired
   */
  cancel(): void {
    if (this.isCancelled()) {
      throw new SubscriptionAlreadyCancelledError(this.id)
    }
    if (this.isExpired()) {
      throw new SubscriptionAlreadyExpiredError(this.id)
    }
    this.props.status = 'cancelled'
    this.props.updatedAt = new Date()
  }

  /**
   * Suspend the subscription
   * Business Rule: Can only suspend active or trial subscriptions
   */
  suspend(): void {
    if (!this.isActive() && !this.isTrial()) {
      throw new InvalidSubscriptionStatusError(this.props.status, 'suspend')
    }
    this.props.status = 'suspended'
    this.props.updatedAt = new Date()
  }

  /**
   * Reactivate the subscription
   * Business Rule: Can only reactivate suspended or cancelled subscriptions
   */
  reactivate(): void {
    if (!this.isSuspended() && !this.isCancelled()) {
      throw new InvalidSubscriptionStatusError(this.props.status, 'reactivate')
    }
    this.props.status = 'active'
    this.props.updatedAt = new Date()
  }

  /**
   * Expire the subscription
   * Business Rule: Cannot expire if already expired
   */
  expire(): void {
    if (this.isExpired()) {
      throw new SubscriptionAlreadyExpiredError(this.id)
    }
    this.props.status = 'expired'
    this.props.updatedAt = new Date()
  }

  /**
   * Convert trial to active subscription
   * Business Rule: Can only convert from trial status
   */
  convertTrialToActive(): void {
    if (!this.isTrial()) {
      throw new InvalidSubscriptionStatusError(this.props.status, 'convert to active')
    }
    this.props.status = 'active'
    this.props.trialEndDate = undefined
    this.props.updatedAt = new Date()
  }

  // ============================================================================
  // Business Methods - Seat Management
  // ============================================================================

  /**
   * Increment used seats
   * Business Rule: Cannot exceed total seats unless unlimited
   */
  incrementUsedSeats(count: number = 1): void {
    if (!this.props.seatsUnlimited && this.props.totalSeats) {
      if (this.props.usedSeats + count > this.props.totalSeats) {
        throw new SeatLimitExceededError(this.props.totalSeats, this.props.usedSeats + count)
      }
    }
    this.props.usedSeats += count
    this.props.updatedAt = new Date()
  }

  /**
   * Decrement used seats
   * Business Rule: Cannot go below zero
   */
  decrementUsedSeats(count: number = 1): void {
    this.props.usedSeats = Math.max(0, this.props.usedSeats - count)
    this.props.updatedAt = new Date()
  }

  /**
   * Update seat configuration
   * Business Rule: Cannot set total seats below current used seats
   */
  updateSeats(totalSeats: number | undefined, seatsUnlimited: boolean): void {
    if (!seatsUnlimited && totalSeats !== undefined && totalSeats < this.props.usedSeats) {
      throw new InvalidSeatsConfigurationError(
        `Cannot set totalSeats to ${totalSeats} when ${this.props.usedSeats} seats are already in use`
      )
    }
    this.props.totalSeats = totalSeats
    this.props.seatsUnlimited = seatsUnlimited
    this.props.updatedAt = new Date()
  }

  // ============================================================================
  // Business Methods - Updates
  // ============================================================================

  /**
   * Update cost information
   */
  updateCost(totalMonthlyCost: bigint, pricePerUnit?: bigint, annualValue?: bigint): void {
    this.props.totalMonthlyCost = totalMonthlyCost
    this.props.pricePerUnit = pricePerUnit
    this.props.annualValue = annualValue
    this.props.updatedAt = new Date()
  }

  /**
   * Update renewal date and cancellation deadline
   */
  updateRenewalDate(renewalDate: Date, cancellationDeadline?: Date): void {
    this.props.renewalDate = renewalDate
    this.props.cancellationDeadline = cancellationDeadline
    this.props.updatedAt = new Date()
  }

  /**
   * Update ownership information
   */
  updateOwnership(ownerId?: string, departmentId?: string, approverId?: string): void {
    this.props.ownerId = ownerId
    this.props.departmentId = departmentId
    this.props.approverId = approverId
    this.props.updatedAt = new Date()
  }

  /**
   * Update usage statistics
   */
  updateUsageStats(usagePercentage: number): void {
    this.props.usagePercentage = usagePercentage
    this.props.lastUsageCalculatedAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * Update general details
   */
  updateDetails(updates: {
    name?: string
    vendor?: string
    category?: SubscriptionCategory
    description?: string
    website?: string
    logoUrl?: string
    tags?: string[]
    billingCycle?: SubscriptionBillingCycle
    pricingModel?: PricingModel
    licenseType?: LicenseType
    paymentMethod?: PaymentMethod
    billingEmail?: string
    autoRenew?: boolean
    costCenter?: string
    budgetCode?: string
    notes?: string
  }): void {
    if (updates.name !== undefined) this.props.name = updates.name
    if (updates.vendor !== undefined) this.props.vendor = updates.vendor
    if (updates.category !== undefined) this.props.category = updates.category
    if (updates.description !== undefined) this.props.description = updates.description
    if (updates.website !== undefined) this.props.website = updates.website
    if (updates.logoUrl !== undefined) this.props.logoUrl = updates.logoUrl
    if (updates.tags !== undefined) this.props.tags = updates.tags
    if (updates.billingCycle !== undefined) this.props.billingCycle = updates.billingCycle
    if (updates.pricingModel !== undefined) this.props.pricingModel = updates.pricingModel
    if (updates.licenseType !== undefined) this.props.licenseType = updates.licenseType
    if (updates.paymentMethod !== undefined) this.props.paymentMethod = updates.paymentMethod
    if (updates.billingEmail !== undefined) this.props.billingEmail = updates.billingEmail
    if (updates.autoRenew !== undefined) this.props.autoRenew = updates.autoRenew
    if (updates.costCenter !== undefined) this.props.costCenter = updates.costCenter
    if (updates.budgetCode !== undefined) this.props.budgetCode = updates.budgetCode
    if (updates.notes !== undefined) this.props.notes = updates.notes
    this.props.updatedAt = new Date()
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  toJSON(): SubscriptionProps {
    return {
      ...this.props,
      tags: [...this.props.tags],
      reminderDays: [...this.props.reminderDays],
      startDate: new Date(this.props.startDate),
      renewalDate: new Date(this.props.renewalDate),
      createdAt: new Date(this.props.createdAt),
      updatedAt: new Date(this.props.updatedAt),
      cancellationDeadline: this.props.cancellationDeadline ? new Date(this.props.cancellationDeadline) : undefined,
      trialEndDate: this.props.trialEndDate ? new Date(this.props.trialEndDate) : undefined,
      lastUsageCalculatedAt: this.props.lastUsageCalculatedAt ? new Date(this.props.lastUsageCalculatedAt) : undefined,
      vendorContact: this.props.vendorContact ? { ...this.props.vendorContact } : undefined,
      metadata: { ...this.props.metadata },
    }
  }
}
