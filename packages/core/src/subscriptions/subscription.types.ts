// ============================================================================
// Enums (matching Prisma schema)
// ============================================================================

export type SubscriptionCategory =
  | 'productivity'
  | 'development'
  | 'design'
  | 'infrastructure'
  | 'sales_marketing'
  | 'communication'
  | 'finance'
  | 'hr'
  | 'security'
  | 'analytics'
  | 'support'
  | 'other'

export type SubscriptionBillingCycle =
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'biennial'
  | 'usage_based'
  | 'one_time'

export type PricingModel =
  | 'per_seat'
  | 'per_active_user'
  | 'flat_rate'
  | 'tiered'
  | 'usage_based'
  | 'freemium'
  | 'hybrid'

export type LicenseType = 'named' | 'concurrent' | 'floating' | 'unlimited'

export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'invoice'
  | 'bank_transfer'
  | 'pix'
  | 'paypal'
  | 'wire_transfer'
  | 'marketplace'
  | 'other'

export type ContractType = 'saas' | 'enterprise' | 'free' | 'trial'

export type SubscriptionStatus = 'active' | 'trial' | 'suspended' | 'cancelled' | 'expired'

// ============================================================================
// Subscription Props (Internal to Entity)
// ============================================================================

export interface SubscriptionProps {
  readonly id: string
  readonly organizationId: string

  // Basic info
  readonly name: string
  readonly vendor?: string
  readonly category: SubscriptionCategory
  readonly description?: string
  readonly website?: string
  readonly logoUrl?: string
  readonly tags: string[]

  // Contract & Billing
  readonly status: SubscriptionStatus
  readonly contractType?: ContractType
  readonly billingCycle: SubscriptionBillingCycle
  readonly pricingModel: PricingModel
  readonly currency: string

  // Pricing (stored in cents as bigint)
  readonly pricePerUnit?: bigint
  readonly totalMonthlyCost: bigint
  readonly annualValue?: bigint
  readonly discountPercentage?: number
  readonly originalPrice?: bigint

  // Licenses
  readonly totalSeats?: number
  readonly usedSeats: number
  readonly seatsUnlimited: boolean
  readonly licenseType?: LicenseType

  // Payment
  readonly paymentMethod?: PaymentMethod
  readonly billingEmail?: string
  readonly autoRenew: boolean
  readonly costCenter?: string
  readonly budgetCode?: string

  // Dates
  readonly startDate: Date
  readonly renewalDate: Date
  readonly cancellationDeadline?: Date
  readonly trialEndDate?: Date
  readonly reminderDays: number[]

  // Ownership
  readonly ownerId?: string
  readonly departmentId?: string
  readonly approverId?: string

  // Vendor contact (JSON)
  readonly vendorContact?: Record<string, unknown>
  readonly notes?: string

  // SSO Integration
  readonly integrationId?: string
  readonly ssoAppId?: string

  // Analytics
  readonly usagePercentage?: number
  readonly lastUsageCalculatedAt?: Date

  // Metadata
  readonly metadata: Record<string, unknown>

  // Audit
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly createdBy?: string
  readonly updatedBy?: string
}

// ============================================================================
// Service Input DTOs
// ============================================================================

export interface CreateSubscriptionInput {
  readonly organizationId: string
  readonly name: string
  readonly vendor?: string
  readonly category: SubscriptionCategory
  readonly description?: string
  readonly website?: string
  readonly logoUrl?: string
  readonly tags?: string[]
  readonly status?: SubscriptionStatus
  readonly contractType?: ContractType
  readonly billingCycle: SubscriptionBillingCycle
  readonly pricingModel: PricingModel
  readonly currency?: string
  readonly pricePerUnit?: bigint
  readonly totalMonthlyCost: bigint
  readonly annualValue?: bigint
  readonly discountPercentage?: number
  readonly originalPrice?: bigint
  readonly totalSeats?: number
  readonly seatsUnlimited?: boolean
  readonly licenseType?: LicenseType
  readonly paymentMethod?: PaymentMethod
  readonly billingEmail?: string
  readonly autoRenew?: boolean
  readonly costCenter?: string
  readonly budgetCode?: string
  readonly startDate: Date
  readonly renewalDate: Date
  readonly cancellationDeadline?: Date
  readonly trialEndDate?: Date
  readonly reminderDays?: number[]
  readonly ownerId?: string
  readonly departmentId?: string
  readonly approverId?: string
  readonly notes?: string
  readonly integrationId?: string
  readonly ssoAppId?: string
  readonly createdBy?: string
}

export interface UpdateSubscriptionInput {
  readonly name?: string
  readonly vendor?: string
  readonly category?: SubscriptionCategory
  readonly description?: string
  readonly website?: string
  readonly logoUrl?: string
  readonly tags?: string[]
  readonly status?: SubscriptionStatus
  readonly contractType?: ContractType
  readonly billingCycle?: SubscriptionBillingCycle
  readonly pricingModel?: PricingModel
  readonly pricePerUnit?: bigint
  readonly totalMonthlyCost?: bigint
  readonly annualValue?: bigint
  readonly discountPercentage?: number
  readonly totalSeats?: number
  readonly seatsUnlimited?: boolean
  readonly licenseType?: LicenseType
  readonly paymentMethod?: PaymentMethod
  readonly billingEmail?: string
  readonly autoRenew?: boolean
  readonly costCenter?: string
  readonly budgetCode?: string
  readonly renewalDate?: Date
  readonly cancellationDeadline?: Date
  readonly reminderDays?: number[]
  readonly ownerId?: string | null
  readonly departmentId?: string | null
  readonly approverId?: string | null
  readonly notes?: string
  readonly updatedBy?: string
}

export interface ListSubscriptionsInput {
  readonly organizationId: string
  readonly search?: string
  readonly category?: SubscriptionCategory | 'all'
  readonly status?: SubscriptionStatus | 'all'
  readonly departmentId?: string
  readonly page?: number
  readonly pageSize?: number
  readonly sortBy?: 'name' | 'totalMonthlyCost' | 'renewalDate' | 'usagePercentage'
  readonly sortOrder?: 'asc' | 'desc'
}

// ============================================================================
// Output DTOs
// ============================================================================

export interface SubscriptionListItem {
  readonly id: string
  readonly name: string
  readonly vendor?: string
  readonly category: SubscriptionCategory
  readonly logoUrl?: string
  readonly status: SubscriptionStatus
  readonly totalMonthlyCost: number
  readonly annualValue?: number
  readonly totalSeats?: number
  readonly usedSeats: number
  readonly seatsUnlimited: boolean
  readonly usagePercentage?: number
  readonly renewalDate: string
  readonly daysUntilRenewal: number
  readonly department?: string
  readonly owner?: { id: string; name: string }
  readonly tags: string[]
}

export interface ListSubscriptionsOutput {
  readonly subscriptions: SubscriptionListItem[]
  readonly pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasMore: boolean
  }
}

export interface SubscriptionKPIsOutput {
  readonly totalSubscriptions: number
  readonly totalMonthlyCost: number
  readonly totalAnnualValue: number
  readonly averageCostPerSubscription: number
  readonly totalSeats: number
  readonly usedSeats: number
  readonly overallUtilization: number
  readonly upcomingRenewals: number
  readonly expiringTrials: number
}

export interface UpcomingRenewal {
  readonly id: string
  readonly name: string
  readonly logoUrl?: string
  readonly renewalDate: string
  readonly daysUntilRenewal: number
  readonly totalMonthlyCost: number
  readonly autoRenew: boolean
}

export interface CategoryBreakdown {
  readonly category: SubscriptionCategory
  readonly count: number
  readonly monthlyCost: number
  readonly percentage: number
  readonly color: string
}

// ============================================================================
// Repository Filters
// ============================================================================

export interface SubscriptionFilters {
  readonly status?: SubscriptionStatus | 'all'
  readonly category?: SubscriptionCategory | 'all'
  readonly search?: string
  readonly departmentId?: string
  readonly renewalWithinDays?: number
  readonly minCost?: bigint
  readonly maxCost?: bigint
}
