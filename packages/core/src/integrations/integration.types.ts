/**
 * Integration Types and DTOs
 *
 * Data Transfer Objects and type definitions for the Integration domain module.
 */

import type { ServiceAccountCredentials } from './value-objects/service-account-credentials'

/**
 * Integration provider types
 */
export type IntegrationProvider =
  | 'google_workspace'
  | 'microsoft_365'
  | 'okta'
  | 'keycloak'

/**
 * Integration status
 */
export type IntegrationStatus =
  | 'pending' // Initial state after creation, before activation
  | 'active' // Integration is working and syncing
  | 'error' // Last sync failed or credentials invalid
  | 'disabled' // Manually disabled by user

/**
 * Input for creating a new integration
 */
export interface CreateIntegrationInput {
  organizationId: string
  provider: IntegrationProvider
  credentials: ServiceAccountCredentials
  config?: {
    adminEmail?: string // Email to impersonate for Google Workspace
    domain?: string // Organization domain
    syncSchedule?: string // Cron expression for sync schedule
    [key: string]: unknown // Allow provider-specific config
  }
}

/**
 * Input for updating an existing integration
 */
export interface UpdateIntegrationInput {
  credentials?: ServiceAccountCredentials
  config?: {
    adminEmail?: string
    domain?: string
    syncSchedule?: string
    [key: string]: unknown
  }
  status?: IntegrationStatus
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  recordsSkipped: number
  errors: SyncError[]
  startedAt: Date
  completedAt: Date
  durationMs: number
}

/**
 * Individual sync error
 */
export interface SyncError {
  recordId?: string
  recordType: 'employee' | 'department' | 'unknown'
  error: string
  details?: unknown
}

/**
 * Integration output (for API responses)
 */
export interface IntegrationOutput {
  id: string
  organizationId: string
  provider: IntegrationProvider
  status: IntegrationStatus
  config?: {
    adminEmail?: string
    domain?: string
    syncSchedule?: string
    [key: string]: unknown
  }
  lastSyncAt?: Date
  lastSyncStatus?: 'success' | 'error'
  lastSyncError?: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

/**
 * Sync statistics output
 */
export interface SyncStatsOutput {
  totalSyncs: number
  successfulSyncs: number
  failedSyncs: number
  lastSyncAt?: Date
  lastSyncStatus?: 'success' | 'error'
  averageDurationMs?: number
  totalRecordsProcessed: number
  totalRecordsCreated: number
  totalRecordsUpdated: number
}

/**
 * Provider configuration for Google Workspace
 */
export interface GoogleWorkspaceConfig {
  adminEmail: string // Required: email to impersonate
  domain?: string // Optional: organization domain
  syncSchedule?: string // Optional: cron expression
  customerId?: string // Optional: Google Workspace customer ID
}

/**
 * Provider configuration for Okta
 */
export interface OktaConfig {
  domain: string // Required: Okta domain (e.g., "dev-123456.okta.com")
  syncSchedule?: string
}

/**
 * Provider configuration for Microsoft 365
 */
export interface Microsoft365Config {
  tenantId: string // Required: Azure AD tenant ID
  syncSchedule?: string
}

/**
 * Provider configuration for Keycloak
 */
export interface KeycloakConfig {
  serverUrl: string // Required: Keycloak server URL
  realm: string // Required: Realm name
  syncSchedule?: string
}
