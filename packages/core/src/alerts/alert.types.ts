/**
 * Alert Service DTOs
 *
 * Data Transfer Objects for alert service layer.
 * Base types (AlertType, AlertSeverity, AlertStatus, AlertProps) are exported from alert.entity.ts
 * Repository interfaces (AlertFilterOptions) are exported from alert.repository.ts
 */

import type { AlertType, AlertSeverity } from './alert.entity'

// ============================================================================
// Service Input DTOs
// ============================================================================

export interface CreateAlertInput {
  readonly organizationId: string
  readonly type: AlertType
  readonly severity: AlertSeverity
  readonly title: string
  readonly description?: string
  readonly employeeId?: string
  readonly subscriptionId?: string
  readonly data?: Record<string, unknown>
  readonly potentialSavings?: bigint
  readonly currency?: string
  readonly alertKey?: string
}
