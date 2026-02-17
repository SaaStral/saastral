import { Subscription } from './subscription.entity'
import {
  SubscriptionFilters,
  SubscriptionListItem,
  UpcomingRenewal,
  CategoryBreakdown,
} from './subscription.types'

/**
 * Subscription Repository Interface (Port)
 * Defines the contract for subscription data access
 * Implementation will be in Infrastructure layer
 */
export interface SubscriptionRepository {
  /**
   * Find subscription by ID
   */
  findById(id: string, organizationId: string): Promise<Subscription | null>

  /**
   * Find subscription by SSO App ID (from Okta/Keycloak)
   */
  findBySsoAppId(ssoAppId: string, organizationId: string): Promise<Subscription | null>

  /**
   * List subscriptions with filters, pagination, and sorting
   */
  list(
    organizationId: string,
    filters: SubscriptionFilters,
    pagination: { page: number; pageSize: number },
    sort?: { by: string; order: 'asc' | 'desc' }
  ): Promise<{
    subscriptions: SubscriptionListItem[]
    totalCount: number
  }>

  /**
   * Count subscriptions by status
   */
  countByStatus(organizationId: string, status?: string): Promise<number>

  /**
   * Get total monthly cost for all active subscriptions
   */
  getTotalMonthlyCost(organizationId: string): Promise<bigint>

  /**
   * Get total annual value for all active subscriptions
   */
  getTotalAnnualValue(organizationId: string): Promise<bigint>

  /**
   * Get aggregate seat statistics
   */
  getSeatsStats(organizationId: string): Promise<{ total: number; used: number }>

  /**
   * Get subscriptions with upcoming renewals
   */
  getUpcomingRenewals(
    organizationId: string,
    withinDays: number,
    limit?: number
  ): Promise<UpcomingRenewal[]>

  /**
   * Count subscriptions in trial that will expire soon
   */
  getExpiringTrials(organizationId: string, withinDays: number): Promise<number>

  /**
   * Get spending breakdown by category
   */
  getCategoryBreakdown(organizationId: string): Promise<CategoryBreakdown[]>

  /**
   * Save subscription (create or update)
   */
  save(subscription: Subscription): Promise<Subscription>

  /**
   * Delete subscription (soft delete)
   */
  delete(id: string, organizationId: string): Promise<void>

  /**
   * Bulk update usage statistics
   * Used by background jobs to recalculate usage from login events
   */
  bulkUpdateUsageStats(
    updates: Array<{ subscriptionId: string; usagePercentage: number }>
  ): Promise<void>
}
