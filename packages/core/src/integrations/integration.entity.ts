/**
 * Integration Domain Entity
 *
 * Represents a connection to an external provider (Google Workspace, Okta, etc.)
 * for an organization. Encapsulates business logic for integration lifecycle,
 * status transitions, and sync tracking.
 */

import {
  IntegrationDisabledError,
  InvalidStatusTransitionError,
} from './integration.errors'
import type {
  IntegrationProvider,
  IntegrationStatus,
  SyncResult,
} from './integration.types'
import type { ServiceAccountCredentials } from './value-objects/service-account-credentials'

export interface IntegrationProps {
  id: string
  organizationId: string
  provider: IntegrationProvider
  status: IntegrationStatus
  credentials: ServiceAccountCredentials
  config?: Record<string, unknown>
  lastSyncAt?: Date
  lastSyncStatus?: 'success' | 'error'
  lastSyncError?: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

/**
 * Integration Entity
 *
 * Rich domain entity with business methods for managing integration lifecycle.
 */
export class Integration {
  private constructor(private props: IntegrationProps) {
    // Validate required fields
    if (!props.id) {
      throw new Error('Integration ID is required')
    }
    if (!props.organizationId) {
      throw new Error('Organization ID is required')
    }
    if (!props.provider) {
      throw new Error('Provider is required')
    }
    if (!props.credentials) {
      throw new Error('Credentials are required')
    }
  }

  /**
   * Create a new Integration entity
   */
  static create(props: {
    id: string
    organizationId: string
    provider: IntegrationProvider
    credentials: ServiceAccountCredentials
    config?: Record<string, unknown>
    createdBy?: string
  }): Integration {
    const now = new Date()

    return new Integration({
      id: props.id,
      organizationId: props.organizationId,
      provider: props.provider,
      status: 'pending',
      credentials: props.credentials,
      config: props.config,
      createdAt: now,
      updatedAt: now,
      createdBy: props.createdBy,
    })
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: IntegrationProps): Integration {
    return new Integration(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get organizationId(): string {
    return this.props.organizationId
  }

  get provider(): IntegrationProvider {
    return this.props.provider
  }

  get status(): IntegrationStatus {
    return this.props.status
  }

  get credentials(): ServiceAccountCredentials {
    return this.props.credentials
  }

  get config(): Record<string, unknown> | undefined {
    return this.props.config
  }

  get lastSyncAt(): Date | undefined {
    return this.props.lastSyncAt
  }

  get lastSyncStatus(): 'success' | 'error' | undefined {
    return this.props.lastSyncStatus
  }

  get lastSyncError(): string | undefined {
    return this.props.lastSyncError
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

  /**
   * Check if integration is active
   */
  isActive(): boolean {
    return this.props.status === 'active'
  }

  /**
   * Check if integration is disabled
   */
  isDisabled(): boolean {
    return this.props.status === 'disabled'
  }

  /**
   * Check if integration has errors
   */
  hasErrors(): boolean {
    return this.props.status === 'error'
  }

  /**
   * Activate the integration
   */
  activate(): void {
    // Can activate from pending or error state
    if (this.props.status === 'disabled') {
      throw new InvalidStatusTransitionError(this.props.status, 'active')
    }

    this.props.status = 'active'
    this.props.updatedAt = new Date()
  }

  /**
   * Disable the integration
   */
  disable(): void {
    if (this.props.status === 'disabled') {
      return // Already disabled, no-op
    }

    this.props.status = 'disabled'
    this.props.updatedAt = new Date()
  }

  /**
   * Mark integration as having errors
   */
  markAsError(error: string): void {
    if (this.props.status === 'disabled') {
      throw new IntegrationDisabledError(this.props.id)
    }

    this.props.status = 'error'
    this.props.lastSyncError = error
    this.props.updatedAt = new Date()
  }

  /**
   * Record a successful sync
   */
  recordSyncSuccess(result: SyncResult): void {
    if (this.props.status === 'disabled') {
      throw new IntegrationDisabledError(this.props.id)
    }

    this.props.status = 'active'
    this.props.lastSyncAt = result.completedAt
    this.props.lastSyncStatus = 'success'
    this.props.lastSyncError = undefined
    this.props.updatedAt = new Date()
  }

  /**
   * Record a failed sync
   */
  recordSyncError(error: string, timestamp: Date = new Date()): void {
    if (this.props.status === 'disabled') {
      throw new IntegrationDisabledError(this.props.id)
    }

    this.props.status = 'error'
    this.props.lastSyncAt = timestamp
    this.props.lastSyncStatus = 'error'
    this.props.lastSyncError = error
    this.props.updatedAt = new Date()
  }

  /**
   * Update credentials
   */
  updateCredentials(credentials: ServiceAccountCredentials): void {
    if (!credentials.isValid()) {
      throw new Error('Invalid credentials')
    }

    this.props.credentials = credentials
    this.props.updatedAt = new Date()
  }

  /**
   * Update configuration
   */
  updateConfig(config: Record<string, unknown>): void {
    this.props.config = {
      ...this.props.config,
      ...config,
    }
    this.props.updatedAt = new Date()
  }

  /**
   * Get configuration value
   */
  getConfigValue<T = unknown>(key: string, defaultValue?: T): T | undefined {
    if (!this.props.config) {
      return defaultValue
    }
    return (this.props.config[key] as T) ?? defaultValue
  }

  /**
   * Check if sync is overdue (no sync in last 2 hours)
   */
  isSyncOverdue(thresholdHours: number = 2): boolean {
    if (!this.props.lastSyncAt) {
      return true // Never synced
    }

    const now = new Date()
    const hoursSinceLastSync =
      (now.getTime() - this.props.lastSyncAt.getTime()) / (1000 * 60 * 60)

    return hoursSinceLastSync > thresholdHours
  }

  /**
   * Export to plain object (for persistence)
   */
  toObject(): IntegrationProps {
    return {
      id: this.props.id,
      organizationId: this.props.organizationId,
      provider: this.props.provider,
      status: this.props.status,
      credentials: this.props.credentials,
      config: this.props.config,
      lastSyncAt: this.props.lastSyncAt,
      lastSyncStatus: this.props.lastSyncStatus,
      lastSyncError: this.props.lastSyncError,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      createdBy: this.props.createdBy,
    }
  }
}
