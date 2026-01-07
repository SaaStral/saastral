/**
 * Prisma Implementation of IntegrationRepository
 *
 * Handles persistence of Integration entities with encrypted credentials.
 * SECURITY-CRITICAL: All credentials must be encrypted before storage.
 */

import { PrismaClient, IntegrationProvider as PrismaIntegrationProvider } from '@saastral/database'
import {
  Integration,
  type IntegrationRepository,
  type IntegrationProvider,
  ServiceAccountCredentials,
} from '@saastral/core'
import { getEncryptionService } from '../../utils/encryption.service'

/**
 * Map Prisma IntegrationProvider enum to domain type
 */
function mapProviderToDomain(
  provider: string,
): IntegrationProvider {
  // Prisma stores as 'google', 'microsoft', 'okta', 'keycloak'
  // Domain uses 'google_workspace', 'microsoft_365', 'okta', 'keycloak'
  switch (provider) {
    case 'google':
      return 'google_workspace'
    case 'microsoft':
      return 'microsoft_365'
    case 'okta':
      return 'okta'
    case 'keycloak':
      return 'keycloak'
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

/**
 * Map domain IntegrationProvider to Prisma enum
 */
function mapProviderToPrisma(provider: IntegrationProvider): PrismaIntegrationProvider {
  switch (provider) {
    case 'google_workspace':
      return 'google' as PrismaIntegrationProvider
    case 'microsoft_365':
      return 'microsoft' as PrismaIntegrationProvider
    case 'okta':
      return 'okta' as PrismaIntegrationProvider
    case 'keycloak':
      return 'keycloak' as PrismaIntegrationProvider
  }
}

/**
 * Map Prisma status to domain status
 */
function mapStatusToDomain(status: string) {
  return status as 'pending' | 'active' | 'error' | 'disabled'
}

export class PrismaIntegrationRepository implements IntegrationRepository {
  private readonly encryptionService = getEncryptionService()

  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Integration | null> {
    const record = await this.prisma.integration.findUnique({
      where: { id },
    })

    return record ? await this.toDomain(record) : null
  }

  async findByOrganizationAndProvider(
    organizationId: string,
    provider: IntegrationProvider,
  ): Promise<Integration | null> {
    const prismaProvider = mapProviderToPrisma(provider)

    const record = await this.prisma.integration.findFirst({
      where: {
        organizationId,
        provider: prismaProvider,
        deletedAt: null,
      },
    })

    return record ? await this.toDomain(record) : null
  }

  async findByOrganization(organizationId: string): Promise<Integration[]> {
    const records = await this.prisma.integration.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return await Promise.all(records.map((r) => this.toDomain(r)))
  }

  async findAllActive(): Promise<Integration[]> {
    const records = await this.prisma.integration.findMany({
      where: {
        status: 'active',
        deletedAt: null,
      },
    })

    return await Promise.all(records.map((r) => this.toDomain(r)))
  }

  async findActiveByProvider(
    provider: IntegrationProvider,
  ): Promise<Integration[]> {
    const prismaProvider = mapProviderToPrisma(provider)

    const records = await this.prisma.integration.findMany({
      where: {
        provider: prismaProvider,
        status: 'active',
        deletedAt: null,
      },
    })

    return await Promise.all(records.map((r) => this.toDomain(r)))
  }

  async save(integration: Integration): Promise<Integration> {
    const data = await this.toPersistence(integration)

    const record = await this.prisma.integration.upsert({
      where: { id: integration.id },
      create: data,
      update: data,
    })

    return await this.toDomain(record)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.integration.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  async exists(
    organizationId: string,
    provider: IntegrationProvider,
  ): Promise<boolean> {
    const prismaProvider = mapProviderToPrisma(provider)

    const count = await this.prisma.integration.count({
      where: {
        organizationId,
        provider: prismaProvider,
        deletedAt: null,
      },
    })

    return count > 0
  }

  /**
   * Convert Prisma record to domain entity
   * SECURITY: Decrypts credentials and OAuth client credentials
   */
  private async toDomain(record: any): Promise<Integration> {
    // Decrypt credentials
    const decryptedCredentials = await this.encryptionService.decryptJSON<{
      clientEmail: string
      privateKey: string
      clientId: string
      projectId: string
      privateKeyId: string
    }>(record.encryptedCredentials)

    const credentials = ServiceAccountCredentials.create(decryptedCredentials)

    // Parse config
    const config = record.config as Record<string, unknown>
    const providerConfig = record.providerConfig as Record<string, unknown>

    // Decrypt OAuth client credentials if present
    if (record.oauthClientId && record.oauthClientSecret) {
      const decryptedOAuthClientSecret = await this.encryptionService.decrypt(
        record.oauthClientSecret,
      )

      // Add OAuth client credentials to config
      config.oauthClientId = record.oauthClientId
      config.oauthClientSecret = decryptedOAuthClientSecret
    }

    // Merge provider config into config
    const mergedConfig = {
      ...config,
      ...providerConfig,
    }

    return Integration.fromPersistence({
      id: record.id,
      organizationId: record.organizationId,
      provider: mapProviderToDomain(record.provider),
      status: mapStatusToDomain(record.status),
      credentials,
      config: mergedConfig,
      lastSyncAt: record.lastSyncAt || undefined,
      lastSyncStatus:
        record.lastSyncStatus === 'success' ||
        record.lastSyncStatus === 'error'
          ? record.lastSyncStatus
          : undefined,
      lastSyncError: record.errorMessage || record.lastSyncMessage || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: record.createdBy || undefined,
    })
  }

  /**
   * Convert domain entity to Prisma record
   * SECURITY: Encrypts credentials and OAuth client credentials
   */
  private async toPersistence(integration: Integration): Promise<any> {
    const props = integration.toObject()

    // Encrypt credentials
    const encryptedCredentials = await this.encryptionService.encryptJSON(
      props.credentials.toJSON(),
    )

    // Extract provider-specific config
    const config = props.config || {}
    const providerConfig: Record<string, unknown> = {}

    // Extract and encrypt OAuth client credentials if present
    let oauthClientId: string | null = null
    let oauthClientSecret: string | null = null

    if (config.oauthClientId && config.oauthClientSecret) {
      oauthClientId = config.oauthClientId as string
      oauthClientSecret = await this.encryptionService.encrypt(
        config.oauthClientSecret as string,
      )
      // Remove from config to avoid duplication
      delete config.oauthClientId
      delete config.oauthClientSecret
    }

    // Extract adminEmail, domain, syncSchedule to providerConfig
    if (config.adminEmail) {
      providerConfig.adminEmail = config.adminEmail
      delete config.adminEmail
    }
    if (config.domain) {
      providerConfig.domain = config.domain
      delete config.domain
    }
    if (config.syncSchedule) {
      providerConfig.syncSchedule = config.syncSchedule
      delete config.syncSchedule
    }

    // Generate name from provider
    let name: string
    switch (props.provider) {
      case 'google_workspace':
        name = 'Google Workspace'
        break
      case 'microsoft_365':
        name = 'Microsoft 365'
        break
      case 'okta':
        name = 'Okta'
        break
      case 'keycloak':
        name = 'Keycloak'
        break
    }

    return {
      id: props.id,
      organizationId: props.organizationId,
      provider: mapProviderToPrisma(props.provider),
      name,
      status: props.status,
      errorMessage: props.lastSyncError || null,
      encryptedCredentials,
      oauthClientId,
      oauthClientSecret,
      config,
      providerConfig,
      lastSyncAt: props.lastSyncAt || null,
      lastSyncStatus: props.lastSyncStatus || null,
      lastSyncMessage: props.lastSyncError || null,
      syncStats: null, // Will be populated by sync service
      lastTestedAt: null,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      createdBy: props.createdBy || null,
      updatedBy: null, // TODO: Track updatedBy when implementing update operations
      deletedAt: null,
    }
  }
}
