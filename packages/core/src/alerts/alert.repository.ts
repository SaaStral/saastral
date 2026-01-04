/**
 * Alert Repository Interface (Port)
 *
 * Defines the contract for persistence operations on Alert entities.
 * This is a port in the hexagonal architecture - implementations live in
 * the infrastructure layer.
 */

import type { Alert, AlertSeverity, AlertStatus, AlertType } from './alert.entity'

/**
 * Alert filter options
 */
export interface AlertFilterOptions {
  organizationId: string
  status?: AlertStatus | AlertStatus[]
  severity?: AlertSeverity | AlertSeverity[]
  type?: AlertType | AlertType[]
  employeeId?: string
  subscriptionId?: string
  includeResolved?: boolean
  includeDismissed?: boolean
  limit?: number
  offset?: number
}

/**
 * Repository interface for Alert persistence
 */
export interface AlertRepository {
  /**
   * Find alert by ID
   */
  findById(id: string): Promise<Alert | null>

  /**
   * Find alert by alert key (for deduplication)
   */
  findByAlertKey(
    organizationId: string,
    alertKey: string,
  ): Promise<Alert | null>

  /**
   * Find all pending alerts for an organization
   */
  findPendingByOrganization(organizationId: string): Promise<Alert[]>

  /**
   * Find alerts with filter options
   */
  find(options: AlertFilterOptions): Promise<Alert[]>

  /**
   * Find all alerts for an employee
   */
  findByEmployee(employeeId: string): Promise<Alert[]>

  /**
   * Find all alerts for a subscription
   */
  findBySubscription(subscriptionId: string): Promise<Alert[]>

  /**
   * Find critical alerts for an organization
   */
  findCriticalByOrganization(organizationId: string): Promise<Alert[]>

  /**
   * Count alerts by status for an organization
   */
  countByStatus(organizationId: string): Promise<{
    pending: number
    acknowledged: number
    resolved: number
    dismissed: number
  }>

  /**
   * Calculate total potential savings from pending alerts
   */
  calculatePotentialSavings(organizationId: string): Promise<bigint>

  /**
   * Save (create or update) an alert
   */
  save(alert: Alert): Promise<Alert>

  /**
   * Save multiple alerts (for batch creation)
   */
  saveMany(alerts: Alert[]): Promise<Alert[]>

  /**
   * Delete an alert
   */
  delete(id: string): Promise<void>

  /**
   * Delete all alerts for an organization (cleanup)
   */
  deleteByOrganization(organizationId: string): Promise<void>

  /**
   * Delete all resolved/dismissed alerts older than X days
   */
  deleteOldAlerts(
    organizationId: string,
    daysOld: number,
  ): Promise<number>
}
