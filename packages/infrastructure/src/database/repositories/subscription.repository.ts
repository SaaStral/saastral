import type { PrismaClient, Prisma, Subscription as PrismaSubscription } from '@saastral/database'
import {
  Subscription,
  SubscriptionRepository,
  SubscriptionFilters,
  SubscriptionListItem,
  UpcomingRenewal,
  CategoryBreakdown,
} from '@saastral/core'

/**
 * Prisma implementation of SubscriptionRepository
 */
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string, organizationId: string): Promise<Subscription | null> {
    const record = await this.prisma.subscription.findFirst({
      where: { id, organizationId, deletedAt: null },
    })
    return record ? this.toDomain(record) : null
  }

  async findBySsoAppId(ssoAppId: string, organizationId: string): Promise<Subscription | null> {
    const record = await this.prisma.subscription.findFirst({
      where: { ssoAppId, organizationId, deletedAt: null },
    })
    return record ? this.toDomain(record) : null
  }

  async list(
    organizationId: string,
    filters: SubscriptionFilters,
    pagination: { page: number; pageSize: number },
    sort?: { by: string; order: 'asc' | 'desc' }
  ): Promise<{ subscriptions: SubscriptionListItem[]; totalCount: number }> {
    const where: Record<string, unknown> = { organizationId, deletedAt: null }

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status
    }
    if (filters.category && filters.category !== 'all') {
      where.category = filters.category
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { vendor: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    if (filters.departmentId) {
      where.departmentId = filters.departmentId
    }
    if (filters.renewalWithinDays) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + filters.renewalWithinDays)
      where.renewalDate = { lte: futureDate }
    }

    const totalCount = await this.prisma.subscription.count({ where })

    const orderBy: Record<string, string> = sort
      ? { [sort.by]: sort.order }
      : { name: 'asc' }

    const subscriptions = await this.prisma.subscription.findMany({
      where,
      select: {
        id: true,
        name: true,
        vendor: true,
        category: true,
        logoUrl: true,
        status: true,
        totalMonthlyCost: true,
        annualValue: true,
        totalSeats: true,
        usedSeats: true,
        seatsUnlimited: true,
        usagePercentage: true,
        renewalDate: true,
        tags: true,
        department: { select: { name: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy,
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    })

    const subscriptionListItems: SubscriptionListItem[] = subscriptions.map(sub => {
      const now = new Date()
      const daysUntilRenewal = Math.ceil(
        (sub.renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: sub.id,
        name: sub.name,
        vendor: sub.vendor || undefined,
        category: sub.category as SubscriptionListItem['category'],
        logoUrl: sub.logoUrl || undefined,
        status: sub.status as SubscriptionListItem['status'],
        totalMonthlyCost: Number(sub.totalMonthlyCost),
        annualValue: sub.annualValue ? Number(sub.annualValue) : undefined,
        totalSeats: sub.totalSeats || undefined,
        usedSeats: sub.usedSeats,
        seatsUnlimited: sub.seatsUnlimited,
        usagePercentage: sub.usagePercentage ? Number(sub.usagePercentage) : undefined,
        renewalDate: sub.renewalDate.toISOString().split('T')[0]!,
        daysUntilRenewal,
        department: sub.department?.name,
        owner: sub.owner ? { id: sub.owner.id, name: sub.owner.name } : undefined,
        tags: sub.tags,
      }
    })

    return { subscriptions: subscriptionListItems, totalCount }
  }

  async countByStatus(organizationId: string, status?: string): Promise<number> {
    return this.prisma.subscription.count({
      where: {
        organizationId,
        ...(status ? { status: status as 'active' | 'trial' | 'suspended' | 'cancelled' | 'expired' } : {}),
        deletedAt: null,
      },
    })
  }

  async getTotalMonthlyCost(organizationId: string): Promise<bigint> {
    const result = await this.prisma.subscription.aggregate({
      where: { organizationId, status: 'active', deletedAt: null },
      _sum: { totalMonthlyCost: true },
    })
    return result._sum.totalMonthlyCost || 0n
  }

  async getTotalAnnualValue(organizationId: string): Promise<bigint> {
    const result = await this.prisma.subscription.aggregate({
      where: { organizationId, status: 'active', deletedAt: null },
      _sum: { annualValue: true },
    })
    return result._sum.annualValue || 0n
  }

  async getSeatsStats(organizationId: string): Promise<{ total: number; used: number }> {
    const result = await this.prisma.subscription.aggregate({
      where: { organizationId, status: 'active', deletedAt: null, seatsUnlimited: false },
      _sum: { totalSeats: true, usedSeats: true },
    })
    return {
      total: result._sum.totalSeats || 0,
      used: result._sum.usedSeats || 0,
    }
  }

  async getUpcomingRenewals(
    organizationId: string,
    withinDays: number,
    limit = 10
  ): Promise<UpcomingRenewal[]> {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + withinDays)

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        organizationId,
        status: 'active',
        deletedAt: null,
        renewalDate: { lte: futureDate, gte: new Date() },
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        renewalDate: true,
        totalMonthlyCost: true,
        autoRenew: true,
      },
      orderBy: { renewalDate: 'asc' },
      take: limit,
    })

    return subscriptions.map(sub => {
      const now = new Date()
      const daysUntilRenewal = Math.ceil(
        (sub.renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: sub.id,
        name: sub.name,
        logoUrl: sub.logoUrl || undefined,
        renewalDate: sub.renewalDate.toISOString().split('T')[0]!,
        daysUntilRenewal,
        totalMonthlyCost: Number(sub.totalMonthlyCost),
        autoRenew: sub.autoRenew,
      }
    })
  }

  async getExpiringTrials(organizationId: string, withinDays: number): Promise<number> {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + withinDays)

    return this.prisma.subscription.count({
      where: {
        organizationId,
        status: 'trial',
        deletedAt: null,
        trialEndDate: { lte: futureDate, gte: new Date() },
      },
    })
  }

  async getCategoryBreakdown(organizationId: string): Promise<CategoryBreakdown[]> {
    const results = await this.prisma.subscription.groupBy({
      by: ['category'],
      where: { organizationId, status: 'active', deletedAt: null },
      _count: true,
      _sum: { totalMonthlyCost: true },
    })

    const totalCost = results.reduce((sum, r) => sum + Number(r._sum.totalMonthlyCost || 0), 0)

    const categoryColors: Record<string, string> = {
      productivity: '#3b82f6',
      development: '#8b5cf6',
      design: '#ec4899',
      infrastructure: '#f97316',
      sales_marketing: '#14b8a6',
      communication: '#06b6d4',
      finance: '#84cc16',
      hr: '#eab308',
      security: '#ef4444',
      analytics: '#6366f1',
      support: '#22c55e',
      other: '#6b7280',
    }

    return results.map(r => ({
      category: r.category as CategoryBreakdown['category'],
      count: r._count,
      monthlyCost: Number(r._sum.totalMonthlyCost || 0),
      percentage:
        totalCost > 0 ? Math.round((Number(r._sum.totalMonthlyCost || 0) / totalCost) * 100) : 0,
      color: categoryColors[r.category] || '#6b7280',
    }))
  }

  async save(subscription: Subscription): Promise<Subscription> {
    const data = this.toPersistence(subscription)
    const record = await this.prisma.subscription.upsert({
      where: { id: subscription.id },
      create: data as Prisma.SubscriptionUncheckedCreateInput,
      update: data as Prisma.SubscriptionUncheckedUpdateInput,
    })
    return this.toDomain(record)
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.subscription.update({
      where: { id, organizationId },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    })
  }

  async bulkUpdateUsageStats(
    updates: Array<{ subscriptionId: string; usagePercentage: number }>
  ): Promise<void> {
    await this.prisma.$transaction(
      updates.map(u =>
        this.prisma.subscription.update({
          where: { id: u.subscriptionId },
          data: {
            usagePercentage: u.usagePercentage,
            lastUsageCalculatedAt: new Date(),
            updatedAt: new Date(),
          },
        })
      )
    )
  }

  private toDomain(record: PrismaSubscription): Subscription {
    return Subscription.reconstitute({
      id: record.id,
      organizationId: record.organizationId,
      name: record.name,
      vendor: record.vendor || undefined,
      category: record.category as Subscription['category'],
      description: record.description || undefined,
      website: record.website || undefined,
      logoUrl: record.logoUrl || undefined,
      tags: record.tags || [],
      status: record.status as Subscription['status'],
      contractType: (record.contractType as Subscription['contractType']) || undefined,
      billingCycle: record.billingCycle as Subscription['billingCycle'],
      pricingModel: record.pricingModel as Subscription['pricingModel'],
      currency: record.currency,
      pricePerUnit: record.pricePerUnit || undefined,
      totalMonthlyCost: record.totalMonthlyCost,
      annualValue: record.annualValue || undefined,
      discountPercentage: record.discountPercentage
        ? Number(record.discountPercentage)
        : undefined,
      originalPrice: record.originalPrice || undefined,
      totalSeats: record.totalSeats || undefined,
      usedSeats: record.usedSeats,
      seatsUnlimited: record.seatsUnlimited,
      licenseType: (record.licenseType as Subscription['licenseType']) || undefined,
      paymentMethod: (record.paymentMethod as Subscription['paymentMethod']) || undefined,
      billingEmail: record.billingEmail || undefined,
      autoRenew: record.autoRenew,
      costCenter: record.costCenter || undefined,
      budgetCode: record.budgetCode || undefined,
      startDate: record.startDate,
      renewalDate: record.renewalDate,
      cancellationDeadline: record.cancellationDeadline || undefined,
      trialEndDate: record.trialEndDate || undefined,
      reminderDays: record.reminderDays || [30, 15, 7],
      ownerId: record.ownerId || undefined,
      departmentId: record.departmentId || undefined,
      approverId: record.approverId || undefined,
      vendorContact: (record.vendorContact as Record<string, unknown>) || undefined,
      notes: record.notes || undefined,
      integrationId: record.integrationId || undefined,
      ssoAppId: record.ssoAppId || undefined,
      usagePercentage: record.usagePercentage ? Number(record.usagePercentage) : undefined,
      lastUsageCalculatedAt: record.lastUsageCalculatedAt || undefined,
      metadata: (record.metadata as Record<string, unknown>) || {},
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: record.createdBy || undefined,
      updatedBy: record.updatedBy || undefined,
    })
  }

  private toPersistence(subscription: Subscription): Prisma.SubscriptionUncheckedCreateInput {
    const props = subscription.toJSON()
    return {
      id: props.id,
      organizationId: props.organizationId,
      name: props.name,
      vendor: props.vendor || null,
      category: props.category,
      description: props.description || null,
      website: props.website || null,
      logoUrl: props.logoUrl || null,
      tags: props.tags,
      status: props.status,
      contractType: props.contractType || null,
      billingCycle: props.billingCycle,
      pricingModel: props.pricingModel,
      currency: props.currency,
      pricePerUnit: props.pricePerUnit || null,
      totalMonthlyCost: props.totalMonthlyCost,
      annualValue: props.annualValue || null,
      discountPercentage: props.discountPercentage || null,
      originalPrice: props.originalPrice || null,
      totalSeats: props.totalSeats || null,
      usedSeats: props.usedSeats,
      seatsUnlimited: props.seatsUnlimited,
      licenseType: props.licenseType || null,
      paymentMethod: props.paymentMethod || null,
      billingEmail: props.billingEmail || null,
      autoRenew: props.autoRenew,
      costCenter: props.costCenter || null,
      budgetCode: props.budgetCode || null,
      startDate: props.startDate,
      renewalDate: props.renewalDate,
      cancellationDeadline: props.cancellationDeadline || null,
      trialEndDate: props.trialEndDate || null,
      reminderDays: props.reminderDays,
      ownerId: props.ownerId || null,
      departmentId: props.departmentId || null,
      approverId: props.approverId || null,
      vendorContact: props.vendorContact || null,
      notes: props.notes || null,
      integrationId: props.integrationId || null,
      ssoAppId: props.ssoAppId || null,
      usagePercentage: props.usagePercentage || null,
      lastUsageCalculatedAt: props.lastUsageCalculatedAt || null,
      metadata: props.metadata,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      createdBy: props.createdBy || null,
      updatedBy: props.updatedBy || null,
    }
  }
}
