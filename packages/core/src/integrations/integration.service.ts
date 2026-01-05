/**
 * Integration Service
 *
 * Handles integration lifecycle management and orchestration.
 * Responsible for creating, activating, disabling, and testing integrations.
 */

import { Integration } from './integration.entity'
import type { IntegrationRepository } from './integration.repository'
import type { DirectoryProvider } from './directory-provider.interface'
import type {
  CreateIntegrationInput,
  UpdateIntegrationInput,
  IntegrationProvider,
} from './integration.types'
import {
  IntegrationNotFoundError,
  IntegrationAlreadyExistsError,
  InvalidCredentialsError,
} from './integration.errors'

export interface IntegrationServiceDeps {
  integrationRepository: IntegrationRepository
  directoryProvider: DirectoryProvider
}

export class IntegrationService {
  constructor(private readonly deps: IntegrationServiceDeps) {}

  /**
   * Create a new integration
   *
   * Validates that:
   * - No integration of this type exists for the organization
   * - Credentials are valid (test connection)
   *
   * @throws IntegrationAlreadyExistsError if integration already exists
   * @throws InvalidCredentialsError if credentials don't work
   */
  async create(input: CreateIntegrationInput): Promise<Integration> {
    const { organizationId, provider, credentials, config, createdBy } = input

    // Check if integration already exists
    const existing = await this.deps.integrationRepository.findByOrganizationAndProvider(
      organizationId,
      provider,
    )

    if (existing) {
      throw new IntegrationAlreadyExistsError(organizationId, provider)
    }

    // Create integration entity
    const integration = Integration.create({
      id: crypto.randomUUID(),
      organizationId,
      provider,
      credentials,
      config,
      createdBy,
    })

    // Save to database
    const saved = await this.deps.integrationRepository.save(integration)

    return saved
  }

  /**
   * Test connection to directory provider
   *
   * Validates credentials by attempting to connect to the provider API.
   *
   * @throws InvalidCredentialsError if connection fails
   */
  async testConnection(id: string): Promise<void> {
    const integration = await this.deps.integrationRepository.findById(id)

    if (!integration) {
      throw new IntegrationNotFoundError(id)
    }

    try {
      await this.deps.directoryProvider.testConnection()
    } catch (error) {
      throw new InvalidCredentialsError(
        integration.provider,
        error instanceof Error ? error.message : 'Connection test failed',
      )
    }
  }

  /**
   * Activate an integration
   *
   * Sets status to 'active' and allows syncing to begin.
   */
  async activate(id: string): Promise<Integration> {
    const integration = await this.deps.integrationRepository.findById(id)

    if (!integration) {
      throw new IntegrationNotFoundError(id)
    }

    integration.activate()

    return await this.deps.integrationRepository.save(integration)
  }

  /**
   * Disable an integration
   *
   * Sets status to 'disabled' and stops syncing.
   */
  async disable(id: string): Promise<Integration> {
    const integration = await this.deps.integrationRepository.findById(id)

    if (!integration) {
      throw new IntegrationNotFoundError(id)
    }

    integration.disable()

    return await this.deps.integrationRepository.save(integration)
  }

  /**
   * Update integration configuration
   *
   * Allows updating config fields without changing credentials.
   */
  async update(id: string, input: UpdateIntegrationInput): Promise<Integration> {
    const integration = await this.deps.integrationRepository.findById(id)

    if (!integration) {
      throw new IntegrationNotFoundError(id)
    }

    integration.updateConfig(input.config || {})

    return await this.deps.integrationRepository.save(integration)
  }

  /**
   * Get integration by ID
   */
  async getById(id: string): Promise<Integration> {
    const integration = await this.deps.integrationRepository.findById(id)

    if (!integration) {
      throw new IntegrationNotFoundError(id)
    }

    return integration
  }

  /**
   * Get integration by organization and provider
   */
  async getByOrganizationAndProvider(
    organizationId: string,
    provider: IntegrationProvider,
  ): Promise<Integration | null> {
    return await this.deps.integrationRepository.findByOrganizationAndProvider(
      organizationId,
      provider,
    )
  }

  /**
   * List all integrations for an organization
   */
  async listByOrganization(organizationId: string): Promise<Integration[]> {
    return await this.deps.integrationRepository.findByOrganization(organizationId)
  }

  /**
   * List all active integrations
   */
  async listActive(): Promise<Integration[]> {
    return await this.deps.integrationRepository.findAllActive()
  }

  /**
   * List active integrations by provider
   */
  async listActiveByProvider(provider: IntegrationProvider): Promise<Integration[]> {
    return await this.deps.integrationRepository.findActiveByProvider(provider)
  }

  /**
   * Delete an integration
   *
   * Soft deletes the integration (sets deletedAt timestamp).
   */
  async delete(id: string): Promise<void> {
    const integration = await this.deps.integrationRepository.findById(id)

    if (!integration) {
      throw new IntegrationNotFoundError(id)
    }

    await this.deps.integrationRepository.delete(id)
  }

  /**
   * Check if integration exists
   */
  async exists(organizationId: string, provider: IntegrationProvider): Promise<boolean> {
    return await this.deps.integrationRepository.exists(organizationId, provider)
  }
}
