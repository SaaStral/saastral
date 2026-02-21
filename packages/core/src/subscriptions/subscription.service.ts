import { Subscription } from './subscription.entity'
import { SubscriptionRepository } from './subscription.repository'
import { LoggerInterface } from '../shared/interfaces/logger'
import { SubscriptionNotFoundError } from './subscription.errors'
import {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  ListSubscriptionsInput,
  ListSubscriptionsOutput,
  SubscriptionKPIsOutput,
  UpcomingRenewal,
  CategoryBreakdown,
} from './subscription.types'

/**
 * Subscription Service
 * Orchestrates subscription-related use cases
 */
export class SubscriptionService {
  constructor(
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly logger: LoggerInterface
  ) {}

  // ============================================================================
  // Queries
  // ============================================================================

  /**
   * Get KPI statistics for subscription dashboard
   */
  async getKPIs(organizationId: string): Promise<SubscriptionKPIsOutput> {
    this.logger.info('[SubscriptionService.getKPIs] Getting KPIs', { organizationId })

    const [
      activeCount,
      totalMonthlyCost,
      totalAnnualValue,
      seatsStats,
      upcomingRenewals,
      expiringTrials,
    ] = await Promise.all([
      this.subscriptionRepo.countByStatus(organizationId, 'active'),
      this.subscriptionRepo.getTotalMonthlyCost(organizationId),
      this.subscriptionRepo.getTotalAnnualValue(organizationId),
      this.subscriptionRepo.getSeatsStats(organizationId),
      this.subscriptionRepo.getUpcomingRenewals(organizationId, 30),
      this.subscriptionRepo.getExpiringTrials(organizationId, 7),
    ])

    const avgCost = activeCount > 0 ? Number(totalMonthlyCost) / activeCount : 0
    const utilization =
      seatsStats.total > 0
        ? Math.round((seatsStats.used / seatsStats.total) * 100)
        : 0

    return {
      totalSubscriptions: activeCount,
      totalMonthlyCost: Number(totalMonthlyCost),
      totalAnnualValue: Number(totalAnnualValue),
      averageCostPerSubscription: Math.round(avgCost),
      totalSeats: seatsStats.total,
      usedSeats: seatsStats.used,
      overallUtilization: utilization,
      upcomingRenewals: upcomingRenewals.length,
      expiringTrials,
    }
  }

  /**
   * List subscriptions with pagination and filters
   */
  async list(input: ListSubscriptionsInput): Promise<ListSubscriptionsOutput> {
    this.logger.info('[SubscriptionService.list] Listing subscriptions', {
      organizationId: input.organizationId,
      search: input.search,
      category: input.category,
    })

    const page = input.page || 1
    const pageSize = input.pageSize || 20

    const { subscriptions, totalCount } = await this.subscriptionRepo.list(
      input.organizationId,
      {
        status: input.status === 'all' ? undefined : input.status,
        category: input.category === 'all' ? undefined : input.category,
        search: input.search,
        departmentId: input.departmentId,
      },
      { page, pageSize },
      input.sortBy ? { by: input.sortBy, order: input.sortOrder || 'asc' } : undefined
    )

    return {
      subscriptions,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: page * pageSize < totalCount,
      },
    }
  }

  /**
   * Get a single subscription by ID
   */
  async getById(id: string, organizationId: string): Promise<Subscription> {
    this.logger.info('[SubscriptionService.getById] Getting subscription', { id, organizationId })

    const subscription = await this.subscriptionRepo.findById(id, organizationId)
    if (!subscription) {
      throw new SubscriptionNotFoundError(id)
    }
    return subscription
  }

  /**
   * Get upcoming renewal alerts
   */
  async getUpcomingRenewals(
    organizationId: string,
    withinDays: number = 30,
    limit?: number
  ): Promise<UpcomingRenewal[]> {
    this.logger.info('[SubscriptionService.getUpcomingRenewals] Getting renewals', {
      organizationId,
      withinDays,
    })
    return this.subscriptionRepo.getUpcomingRenewals(organizationId, withinDays, limit)
  }

  /**
   * Get spending breakdown by category
   */
  async getCategoryBreakdown(organizationId: string): Promise<CategoryBreakdown[]> {
    this.logger.info('[SubscriptionService.getCategoryBreakdown] Getting breakdown', {
      organizationId,
    })
    return this.subscriptionRepo.getCategoryBreakdown(organizationId)
  }

  // ============================================================================
  // Commands
  // ============================================================================

  /**
   * Create a new subscription
   */
  async create(input: CreateSubscriptionInput): Promise<Subscription> {
    this.logger.info('[SubscriptionService.create] Creating subscription', {
      organizationId: input.organizationId,
      name: input.name,
    })

    const subscription = Subscription.create({
      organizationId: input.organizationId,
      name: input.name,
      vendor: input.vendor,
      category: input.category,
      description: input.description,
      website: input.website,
      logoUrl: input.logoUrl,
      tags: input.tags || [],
      status: input.status,
      contractType: input.contractType,
      billingCycle: input.billingCycle,
      pricingModel: input.pricingModel,
      currency: input.currency || 'BRL',
      pricePerUnit: input.pricePerUnit,
      totalMonthlyCost: input.totalMonthlyCost,
      annualValue: input.annualValue,
      discountPercentage: input.discountPercentage,
      originalPrice: input.originalPrice,
      totalSeats: input.totalSeats,
      seatsUnlimited: input.seatsUnlimited || false,
      licenseType: input.licenseType,
      paymentMethod: input.paymentMethod,
      billingEmail: input.billingEmail,
      autoRenew: input.autoRenew ?? true,
      costCenter: input.costCenter,
      budgetCode: input.budgetCode,
      startDate: input.startDate,
      renewalDate: input.renewalDate,
      cancellationDeadline: input.cancellationDeadline,
      trialEndDate: input.trialEndDate,
      reminderDays: input.reminderDays || [30, 15, 7],
      ownerId: input.ownerId,
      departmentId: input.departmentId,
      approverId: input.approverId,
      notes: input.notes,
      integrationId: input.integrationId,
      ssoAppId: input.ssoAppId,
      createdBy: input.createdBy,
    })

    return this.subscriptionRepo.save(subscription)
  }

  /**
   * Update an existing subscription
   */
  async update(
    id: string,
    organizationId: string,
    input: UpdateSubscriptionInput
  ): Promise<Subscription> {
    this.logger.info('[SubscriptionService.update] Updating subscription', { id, organizationId })

    const subscription = await this.subscriptionRepo.findById(id, organizationId)
    if (!subscription) {
      throw new SubscriptionNotFoundError(id)
    }

    // Update seats configuration
    if (input.totalSeats !== undefined || input.seatsUnlimited !== undefined) {
      subscription.updateSeats(
        input.totalSeats ?? subscription.totalSeats,
        input.seatsUnlimited ?? subscription.seatsUnlimited
      )
    }

    // Update cost information
    if (input.totalMonthlyCost !== undefined) {
      subscription.updateCost(
        input.totalMonthlyCost,
        input.pricePerUnit ?? subscription.pricePerUnit,
        input.annualValue ?? subscription.annualValue
      )
    }

    // Update renewal information
    if (input.renewalDate !== undefined) {
      subscription.updateRenewalDate(
        input.renewalDate,
        input.cancellationDeadline ?? subscription.cancellationDeadline
      )
    }

    // Update ownership
    if (
      input.ownerId !== undefined ||
      input.departmentId !== undefined ||
      input.approverId !== undefined
    ) {
      subscription.updateOwnership(
        input.ownerId === null ? undefined : (input.ownerId ?? subscription.ownerId),
        input.departmentId === null ? undefined : (input.departmentId ?? subscription.departmentId),
        input.approverId === null ? undefined : (input.approverId ?? subscription.approverId)
      )
    }

    // Update general details (only if at least one detail field is provided)
    const detailUpdates = {
      name: input.name,
      vendor: input.vendor,
      category: input.category,
      description: input.description,
      website: input.website,
      logoUrl: input.logoUrl,
      tags: input.tags,
      billingCycle: input.billingCycle,
      pricingModel: input.pricingModel,
      licenseType: input.licenseType,
      paymentMethod: input.paymentMethod,
      billingEmail: input.billingEmail,
      autoRenew: input.autoRenew,
      costCenter: input.costCenter,
      budgetCode: input.budgetCode,
      notes: input.notes,
    }
    const hasDetailUpdates = Object.values(detailUpdates).some(v => v !== undefined)
    if (hasDetailUpdates) {
      subscription.updateDetails(detailUpdates)
    }

    return this.subscriptionRepo.save(subscription)
  }

  /**
   * Cancel a subscription
   */
  async cancel(id: string, organizationId: string): Promise<Subscription> {
    this.logger.info('[SubscriptionService.cancel] Cancelling subscription', { id, organizationId })

    const subscription = await this.subscriptionRepo.findById(id, organizationId)
    if (!subscription) {
      throw new SubscriptionNotFoundError(id)
    }

    subscription.cancel()
    return this.subscriptionRepo.save(subscription)
  }

  /**
   * Suspend a subscription
   */
  async suspend(id: string, organizationId: string): Promise<Subscription> {
    this.logger.info('[SubscriptionService.suspend] Suspending subscription', { id, organizationId })

    const subscription = await this.subscriptionRepo.findById(id, organizationId)
    if (!subscription) {
      throw new SubscriptionNotFoundError(id)
    }

    subscription.suspend()
    return this.subscriptionRepo.save(subscription)
  }

  /**
   * Reactivate a subscription
   */
  async reactivate(id: string, organizationId: string): Promise<Subscription> {
    this.logger.info('[SubscriptionService.reactivate] Reactivating subscription', {
      id,
      organizationId,
    })

    const subscription = await this.subscriptionRepo.findById(id, organizationId)
    if (!subscription) {
      throw new SubscriptionNotFoundError(id)
    }

    subscription.reactivate()
    return this.subscriptionRepo.save(subscription)
  }

  /**
   * Delete a subscription (soft delete)
   */
  async delete(id: string, organizationId: string): Promise<void> {
    this.logger.info('[SubscriptionService.delete] Deleting subscription', { id, organizationId })

    const subscription = await this.subscriptionRepo.findById(id, organizationId)
    if (!subscription) {
      throw new SubscriptionNotFoundError(id)
    }

    await this.subscriptionRepo.delete(id, organizationId)
  }
}
