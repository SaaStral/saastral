/**
 * Prisma Implementation of AlertRepository
 *
 * Handles persistence of Alert entities with filtering and aggregation support.
 */

import type { PrismaClient } from '@saastral/database'
import {
  Alert,
  type AlertRepository,
  type AlertFilterOptions,
  type AlertSeverity,
  type AlertStatus,
  type AlertType,
} from '@saastral/core'

export class PrismaAlertRepository implements AlertRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Alert | null> {
    const record = await this.prisma.alert.findUnique({
      where: { id },
    })

    return record ? this.toDomain(record) : null
  }

  async findByAlertKey(
    organizationId: string,
    alertKey: string,
  ): Promise<Alert | null> {
    const record = await this.prisma.alert.findFirst({
      where: {
        organizationId,
        alertKey,
      },
    })

    return record ? this.toDomain(record) : null
  }

  async findPendingByOrganization(organizationId: string): Promise<Alert[]> {
    const records = await this.prisma.alert.findMany({
      where: {
        organizationId,
        status: 'pending',
      },
      orderBy: [
        { severity: 'desc' }, // critical first
        { createdAt: 'desc' }, // newest first
      ],
    })

    return records.map((r) => this.toDomain(r))
  }

  async find(options: AlertFilterOptions): Promise<Alert[]> {
    const where: any = {
      organizationId: options.organizationId,
    }

    // Status filter
    if (options.status) {
      if (Array.isArray(options.status)) {
        where.status = { in: options.status }
      } else {
        where.status = options.status
      }
    }

    // Severity filter
    if (options.severity) {
      if (Array.isArray(options.severity)) {
        where.severity = { in: options.severity }
      } else {
        where.severity = options.severity
      }
    }

    // Type filter
    if (options.type) {
      if (Array.isArray(options.type)) {
        where.type = { in: options.type }
      } else {
        where.type = options.type
      }
    }

    // Employee filter
    if (options.employeeId) {
      where.employeeId = options.employeeId
    }

    // Subscription filter
    if (options.subscriptionId) {
      where.subscriptionId = options.subscriptionId
    }

    // Exclude resolved/dismissed by default
    if (!options.includeResolved) {
      where.NOT = where.NOT || []
      where.NOT.push({ status: 'resolved' })
    }

    if (!options.includeDismissed) {
      where.NOT = where.NOT || []
      where.NOT.push({ status: 'dismissed' })
    }

    const records = await this.prisma.alert.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: options.limit || undefined,
      skip: options.offset || undefined,
    })

    return records.map((r) => this.toDomain(r))
  }

  async findByEmployee(employeeId: string): Promise<Alert[]> {
    const records = await this.prisma.alert.findMany({
      where: {
        employeeId,
        status: {
          in: ['pending', 'acknowledged'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return records.map((r) => this.toDomain(r))
  }

  async findBySubscription(subscriptionId: string): Promise<Alert[]> {
    const records = await this.prisma.alert.findMany({
      where: {
        subscriptionId,
        status: {
          in: ['pending', 'acknowledged'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return records.map((r) => this.toDomain(r))
  }

  async findCriticalByOrganization(organizationId: string): Promise<Alert[]> {
    const records = await this.prisma.alert.findMany({
      where: {
        organizationId,
        severity: 'critical',
        status: {
          in: ['pending', 'acknowledged'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return records.map((r) => this.toDomain(r))
  }

  async countByStatus(organizationId: string): Promise<{
    pending: number
    acknowledged: number
    resolved: number
    dismissed: number
  }> {
    const [pending, acknowledged, resolved, dismissed] = await Promise.all([
      this.prisma.alert.count({
        where: { organizationId, status: 'pending' },
      }),
      this.prisma.alert.count({
        where: { organizationId, status: 'acknowledged' },
      }),
      this.prisma.alert.count({
        where: { organizationId, status: 'resolved' },
      }),
      this.prisma.alert.count({
        where: { organizationId, status: 'dismissed' },
      }),
    ])

    return { pending, acknowledged, resolved, dismissed }
  }

  async calculatePotentialSavings(organizationId: string): Promise<bigint> {
    const result = await this.prisma.alert.aggregate({
      where: {
        organizationId,
        status: {
          in: ['pending', 'acknowledged'],
        },
        potentialSavings: {
          not: null,
        },
      },
      _sum: {
        potentialSavings: true,
      },
    })

    return BigInt(result._sum.potentialSavings || 0)
  }

  async save(alert: Alert): Promise<Alert> {
    const data = this.toPersistence(alert)

    const record = await this.prisma.alert.upsert({
      where: { id: alert.id },
      create: data,
      update: data,
    })

    return this.toDomain(record)
  }

  async saveMany(alerts: Alert[]): Promise<Alert[]> {
    const results = await this.prisma.$transaction(
      alerts.map((alert) => {
        const data = this.toPersistence(alert)
        return this.prisma.alert.upsert({
          where: { id: alert.id },
          create: data,
          update: data,
        })
      }),
    )

    return results.map((r) => this.toDomain(r))
  }

  async delete(id: string): Promise<void> {
    await this.prisma.alert.delete({
      where: { id },
    })
  }

  async deleteByOrganization(organizationId: string): Promise<void> {
    await this.prisma.alert.deleteMany({
      where: { organizationId },
    })
  }

  async deleteOldAlerts(
    organizationId: string,
    daysOld: number,
  ): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await this.prisma.alert.deleteMany({
      where: {
        organizationId,
        status: {
          in: ['resolved', 'dismissed'],
        },
        updatedAt: {
          lt: cutoffDate,
        },
      },
    })

    return result.count
  }

  /**
   * Convert Prisma record to domain entity
   */
  private toDomain(record: any): Alert {
    return Alert.reconstitute({
      id: record.id,
      organizationId: record.organizationId,
      type: record.type as AlertType,
      severity: record.severity as AlertSeverity,
      status: record.status as AlertStatus,
      title: record.title,
      description: record.description || undefined,
      employeeId: record.employeeId || undefined,
      subscriptionId: record.subscriptionId || undefined,
      data: (record.data as Record<string, unknown>) || undefined,
      potentialSavings: record.potentialSavings
        ? BigInt(record.potentialSavings)
        : undefined,
      currency: record.currency || undefined,
      resolvedAt: record.resolvedAt || undefined,
      resolvedBy: record.resolvedBy || undefined,
      resolutionNotes: record.resolutionNotes || undefined,
      acknowledgedAt: record.acknowledgedAt || undefined,
      acknowledgedBy: record.acknowledgedBy || undefined,
      dismissedAt: record.dismissedAt || undefined,
      dismissedBy: record.dismissedBy || undefined,
      dismissReason: record.dismissReason || undefined,
      snoozedUntil: record.snoozedUntil || undefined,
      snoozedBy: record.snoozedBy || undefined,
      alertKey: record.alertKey || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  /**
   * Convert domain entity to Prisma record
   */
  private toPersistence(alert: Alert): any {
    const props = alert.toJSON()

    return {
      id: props.id,
      organizationId: props.organizationId,
      type: props.type,
      severity: props.severity,
      status: props.status,
      title: props.title,
      description: props.description || null,
      employeeId: props.employeeId || null,
      subscriptionId: props.subscriptionId || null,
      data: props.data || {},
      potentialSavings: props.potentialSavings || null,
      currency: props.currency || null,
      resolvedAt: props.resolvedAt || null,
      resolvedBy: props.resolvedBy || null,
      resolutionNotes: props.resolutionNotes || null,
      acknowledgedAt: props.acknowledgedAt || null,
      acknowledgedBy: props.acknowledgedBy || null,
      dismissedAt: props.dismissedAt || null,
      dismissedBy: props.dismissedBy || null,
      dismissReason: props.dismissReason || null,
      snoozedUntil: props.snoozedUntil || null,
      snoozedBy: props.snoozedBy || null,
      alertKey: props.alertKey || null,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    }
  }
}
