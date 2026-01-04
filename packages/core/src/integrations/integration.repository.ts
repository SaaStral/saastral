/**
 * Integration Repository Interface (Port)
 *
 * Defines the contract for persistence operations on Integration entities.
 * This is a port in the hexagonal architecture - implementations live in
 * the infrastructure layer.
 */

import type { Integration } from './integration.entity'
import type { IntegrationProvider } from './integration.types'

/**
 * Repository interface for Integration persistence
 */
export interface IntegrationRepository {
  /**
   * Find integration by ID
   */
  findById(id: string): Promise<Integration | null>

  /**
   * Find integration by organization and provider
   * (there should only be one integration per organization per provider)
   */
  findByOrganizationAndProvider(
    organizationId: string,
    provider: IntegrationProvider,
  ): Promise<Integration | null>

  /**
   * Find all integrations for an organization
   */
  findByOrganization(organizationId: string): Promise<Integration[]>

  /**
   * Find all active integrations (for background sync jobs)
   */
  findAllActive(): Promise<Integration[]>

  /**
   * Find all active integrations for a specific provider
   */
  findActiveByProvider(provider: IntegrationProvider): Promise<Integration[]>

  /**
   * Save (create or update) an integration
   */
  save(integration: Integration): Promise<Integration>

  /**
   * Delete an integration
   */
  delete(id: string): Promise<void>

  /**
   * Check if integration exists for organization and provider
   */
  exists(
    organizationId: string,
    provider: IntegrationProvider,
  ): Promise<boolean>
}
