/**
 * Integration Domain Errors
 *
 * Custom error classes for the Integration domain module.
 */

import type { IntegrationProvider } from './integration.types'

/**
 * Base error for integration domain
 */
export class IntegrationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'IntegrationError'
    Object.setPrototypeOf(this, IntegrationError.prototype)
  }
}

/**
 * Integration not found error
 */
export class IntegrationNotFoundError extends IntegrationError {
  constructor(
    public readonly integrationId: string,
  ) {
    super(
      `Integration with ID "${integrationId}" not found`,
      'INTEGRATION_NOT_FOUND',
    )
    this.name = 'IntegrationNotFoundError'
    Object.setPrototypeOf(this, IntegrationNotFoundError.prototype)
  }
}

/**
 * Integration already exists error
 */
export class IntegrationAlreadyExistsError extends IntegrationError {
  constructor(
    public readonly organizationId: string,
    public readonly provider: IntegrationProvider,
  ) {
    super(
      `Integration for provider "${provider}" already exists in organization "${organizationId}"`,
      'INTEGRATION_ALREADY_EXISTS',
    )
    this.name = 'IntegrationAlreadyExistsError'
    Object.setPrototypeOf(this, IntegrationAlreadyExistsError.prototype)
  }
}

/**
 * Sync failed error
 */
export class SyncFailedError extends IntegrationError {
  constructor(
    public readonly integrationId: string,
    public readonly reason: string,
    public readonly details?: unknown,
  ) {
    super(
      `Sync failed for integration "${integrationId}": ${reason}`,
      'SYNC_FAILED',
    )
    this.name = 'SyncFailedError'
    Object.setPrototypeOf(this, SyncFailedError.prototype)
  }
}

/**
 * Invalid credentials error
 */
export class InvalidCredentialsError extends IntegrationError {
  constructor(
    public readonly provider: IntegrationProvider,
    public readonly reason: string,
  ) {
    super(
      `Invalid credentials for provider "${provider}": ${reason}`,
      'INVALID_CREDENTIALS',
    )
    this.name = 'InvalidCredentialsError'
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype)
  }
}

/**
 * Invalid status transition error
 */
export class InvalidStatusTransitionError extends IntegrationError {
  constructor(
    public readonly currentStatus: string,
    public readonly targetStatus: string,
  ) {
    super(
      `Invalid status transition from "${currentStatus}" to "${targetStatus}"`,
      'INVALID_STATUS_TRANSITION',
    )
    this.name = 'InvalidStatusTransitionError'
    Object.setPrototypeOf(this, InvalidStatusTransitionError.prototype)
  }
}

/**
 * Provider connection error
 */
export class ProviderConnectionError extends IntegrationError {
  constructor(
    public readonly provider: IntegrationProvider,
    public readonly reason: string,
    public readonly details?: unknown,
  ) {
    super(
      `Failed to connect to provider "${provider}": ${reason}`,
      'PROVIDER_CONNECTION_ERROR',
    )
    this.name = 'ProviderConnectionError'
    Object.setPrototypeOf(this, ProviderConnectionError.prototype)
  }
}

/**
 * Integration disabled error
 */
export class IntegrationDisabledError extends IntegrationError {
  constructor(
    public readonly integrationId: string,
  ) {
    super(
      `Integration "${integrationId}" is disabled`,
      'INTEGRATION_DISABLED',
    )
    this.name = 'IntegrationDisabledError'
    Object.setPrototypeOf(this, IntegrationDisabledError.prototype)
  }
}

/**
 * Configuration error
 */
export class IntegrationConfigurationError extends IntegrationError {
  constructor(
    public readonly provider: IntegrationProvider,
    public readonly reason: string,
  ) {
    super(
      `Invalid configuration for provider "${provider}": ${reason}`,
      'INTEGRATION_CONFIGURATION_ERROR',
    )
    this.name = 'IntegrationConfigurationError'
    Object.setPrototypeOf(this, IntegrationConfigurationError.prototype)
  }
}
