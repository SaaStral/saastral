/**
 * Alert Service
 *
 * Handles alert generation, management, and lifecycle operations.
 * Responsible for:
 * - Generating offboarding alerts (employees with active subscriptions)
 * - Alert deduplication via alertKey
 * - Calculating potential savings
 * - Alert lifecycle operations (acknowledge, resolve, dismiss, snooze)
 */

import { Alert } from './alert.entity'
import type { AlertRepository, AlertFilterOptions } from './alert.repository'
import type { EmployeeRepository } from '../employees/employee.repository'
import type { CreateAlertInput } from './alert.types'

export interface AlertServiceDeps {
  alertRepository: AlertRepository
  employeeRepository: EmployeeRepository
}

export class AlertService {
  constructor(private readonly deps: AlertServiceDeps) {}

  /**
   * Generate offboarding alerts
   *
   * Finds all offboarded employees with active subscriptions and creates alerts.
   * Uses alert key deduplication to prevent duplicates.
   *
   * @param organizationId - Organization to generate alerts for
   * @returns Array of created/existing alerts
   */
  async generateOffboardingAlerts(organizationId: string): Promise<Alert[]> {
    // Get offboarded employees with active subscriptions
    const offboardingData = await this.deps.employeeRepository.getOffboardingAlerts(
      organizationId,
    )

    const alerts: Alert[] = []

    for (const data of offboardingData) {
      try {
        // Generate alert key for deduplication
        const alertKey = Alert.generateAlertKey('offboarding', {
          employeeId: data.id,
        })

        // Check if alert already exists
        const existing = await this.deps.alertRepository.findByAlertKey(
          organizationId,
          alertKey,
        )

        if (existing) {
          // Alert already exists, skip
          alerts.push(existing)
          continue
        }

        // Create new alert
        const alert = Alert.create({
          organizationId,
          type: 'offboarding',
          severity: 'critical',
          title: `Offboarded employee ${data.name} has ${data.licenses.length} active license(s)`,
          description: `${data.name} (${data.email}) was offboarded on ${data.offboardingDate} but still has active licenses. Potential monthly savings: R$ ${(data.totalCost / 100).toFixed(2)}`,
          employeeId: data.id,
          potentialSavings: BigInt(data.totalCost),
          currency: 'BRL',
          data: {
            employeeName: data.name,
            employeeEmail: data.email,
            offboardedAt: data.offboardingDate,
            activeLicenseCount: data.licenses.length,
            licenses: data.licenses,
          },
          alertKey,
        })

        // Save alert
        const saved = await this.deps.alertRepository.save(alert)
        alerts.push(saved)
      } catch (error) {
        // Log error but continue processing other alerts
        console.error(`Failed to create alert for employee ${data.id}:`, error)
      }
    }

    return alerts
  }

  /**
   * Create a custom alert
   *
   * @param input - Alert creation input
   * @returns Created alert
   */
  async create(input: CreateAlertInput): Promise<Alert> {
    const alert = Alert.create(input)
    return await this.deps.alertRepository.save(alert)
  }

  /**
   * Get alert by ID
   *
   * @param id - Alert ID
   * @returns Alert or null
   */
  async getById(id: string): Promise<Alert | null> {
    return await this.deps.alertRepository.findById(id)
  }

  /**
   * Find alerts with filters
   *
   * @param options - Filter options
   * @returns Array of matching alerts
   */
  async find(options: AlertFilterOptions): Promise<Alert[]> {
    return await this.deps.alertRepository.find(options)
  }

  /**
   * Get pending alerts for organization
   *
   * @param organizationId - Organization ID
   * @returns Array of pending alerts
   */
  async getPending(organizationId: string): Promise<Alert[]> {
    return await this.deps.alertRepository.findPendingByOrganization(organizationId)
  }

  /**
   * Get critical alerts for organization
   *
   * @param organizationId - Organization ID
   * @returns Array of critical alerts
   */
  async getCritical(organizationId: string): Promise<Alert[]> {
    return await this.deps.alertRepository.findCriticalByOrganization(organizationId)
  }

  /**
   * Get alerts by employee
   *
   * @param employeeId - Employee ID
   * @returns Array of alerts for employee
   */
  async getByEmployee(employeeId: string): Promise<Alert[]> {
    return await this.deps.alertRepository.findByEmployee(employeeId)
  }

  /**
   * Get alerts by subscription
   *
   * @param subscriptionId - Subscription ID
   * @returns Array of alerts for subscription
   */
  async getBySubscription(subscriptionId: string): Promise<Alert[]> {
    return await this.deps.alertRepository.findBySubscription(subscriptionId)
  }

  /**
   * Count alerts by status
   *
   * @param organizationId - Organization ID
   * @returns Object with counts by status
   */
  async countByStatus(organizationId: string): Promise<{
    pending: number
    acknowledged: number
    resolved: number
    dismissed: number
  }> {
    return await this.deps.alertRepository.countByStatus(organizationId)
  }

  /**
   * Calculate total potential savings
   *
   * Sums up potentialSavings for all pending/acknowledged alerts.
   *
   * @param organizationId - Organization ID
   * @returns Total potential savings in cents
   */
  async calculatePotentialSavings(organizationId: string): Promise<bigint> {
    return await this.deps.alertRepository.calculatePotentialSavings(organizationId)
  }

  /**
   * Acknowledge an alert
   *
   * @param id - Alert ID
   * @param acknowledgedBy - User ID who acknowledged
   * @returns Updated alert
   */
  async acknowledge(id: string, acknowledgedBy: string): Promise<Alert> {
    const alert = await this.deps.alertRepository.findById(id)

    if (!alert) {
      throw new Error(`Alert ${id} not found`)
    }

    alert.acknowledge(acknowledgedBy)

    return await this.deps.alertRepository.save(alert)
  }

  /**
   * Resolve an alert
   *
   * @param id - Alert ID
   * @param resolvedBy - User ID who resolved
   * @param notes - Optional resolution notes
   * @returns Updated alert
   */
  async resolve(id: string, resolvedBy: string, notes?: string): Promise<Alert> {
    const alert = await this.deps.alertRepository.findById(id)

    if (!alert) {
      throw new Error(`Alert ${id} not found`)
    }

    alert.resolve(resolvedBy, notes)

    return await this.deps.alertRepository.save(alert)
  }

  /**
   * Dismiss an alert
   *
   * @param id - Alert ID
   * @param dismissedBy - User ID who dismissed
   * @param reason - Optional dismissal reason
   * @returns Updated alert
   */
  async dismiss(id: string, dismissedBy: string, reason?: string): Promise<Alert> {
    const alert = await this.deps.alertRepository.findById(id)

    if (!alert) {
      throw new Error(`Alert ${id} not found`)
    }

    alert.dismiss(dismissedBy, reason)

    return await this.deps.alertRepository.save(alert)
  }

  /**
   * Snooze an alert
   *
   * @param id - Alert ID
   * @param snoozedBy - User ID who snoozed
   * @param snoozedUntil - Date when alert should reappear
   * @returns Updated alert
   */
  async snooze(id: string, snoozedBy: string, snoozedUntil: Date): Promise<Alert> {
    const alert = await this.deps.alertRepository.findById(id)

    if (!alert) {
      throw new Error(`Alert ${id} not found`)
    }

    alert.snooze(snoozedBy, snoozedUntil)

    return await this.deps.alertRepository.save(alert)
  }

  /**
   * Delete an alert
   *
   * @param id - Alert ID
   */
  async delete(id: string): Promise<void> {
    await this.deps.alertRepository.delete(id)
  }

  /**
   * Delete old resolved/dismissed alerts
   *
   * @param organizationId - Organization ID
   * @param daysOld - Delete alerts older than this many days
   * @returns Number of alerts deleted
   */
  async deleteOldAlerts(organizationId: string, daysOld: number): Promise<number> {
    return await this.deps.alertRepository.deleteOldAlerts(organizationId, daysOld)
  }

  /**
   * Batch create alerts
   *
   * @param alerts - Array of alerts to create
   * @returns Array of created alerts
   */
  async createMany(alerts: Alert[]): Promise<Alert[]> {
    return await this.deps.alertRepository.saveMany(alerts)
  }
}
