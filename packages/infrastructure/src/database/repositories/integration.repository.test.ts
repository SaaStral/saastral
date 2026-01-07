import { describe, it, expect, beforeEach } from 'vitest'
import type { PrismaClient } from '@saastral/database'
import { PrismaIntegrationRepository } from './integration.repository'
import { Integration, ServiceAccountCredentials } from '@saastral/core'
import { getPrismaClient } from '../../../test/db-setup'

describe('PrismaIntegrationRepository', () => {
  let prisma: PrismaClient
  let repository: PrismaIntegrationRepository
  let orgId: string

  // Test credentials
  const testCredentials = ServiceAccountCredentials.create({
    clientEmail: 'test@project.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n',
    clientId: '1234567890',
    projectId: 'test-project-123',
    privateKeyId: 'key123',
  })

  beforeEach(async () => {
    prisma = getPrismaClient()
    repository = new PrismaIntegrationRepository(prisma)

    // Create test organization
    const org = await prisma.organization.create({
      data: {
        id: `org-${Date.now()}-${Math.random()}`,
        name: 'Test Organization',
        slug: `test-org-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    orgId = org.id
  })

  describe('save', () => {
    it('should create new integration with encrypted credentials', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
        config: { adminEmail: 'admin@company.com', domain: 'company.com' },
      })

      const saved = await repository.save(integration)

      expect(saved.id).toBe(integration.id)
      expect(saved.provider).toBe('google_workspace')
      expect(saved.status).toBe('pending')
      expect(saved.credentials.clientEmail).toBe(testCredentials.clientEmail)

      // Verify in database - credentials should be encrypted
      const dbRecord = await prisma.integration.findUnique({
        where: { id: integration.id },
      })
      expect(dbRecord).not.toBeNull()
      expect(dbRecord!.encryptedCredentials).toBeDefined()
      // Should not contain plain-text credentials
      expect(dbRecord!.encryptedCredentials).not.toContain(testCredentials.privateKey)
    })

    it('should update existing integration (upsert)', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })

      await repository.save(integration)

      // Activate the integration
      integration.activate()
      const updated = await repository.save(integration)

      expect(updated.status).toBe('active')
      expect(updated.isActive()).toBe(true)
    })

    it('should save integration with oauth client credentials', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
        config: {
          oauthClientId: 'oauth-client-123',
          oauthClientSecret: 'oauth-secret-456',
          adminEmail: 'admin@company.com',
        },
      })

      const saved = await repository.save(integration)

      expect(saved.config?.oauthClientId).toBe('oauth-client-123')
      expect(saved.config?.oauthClientSecret).toBe('oauth-secret-456')

      // Verify OAuth client secret is encrypted in database
      const dbRecord = await prisma.integration.findUnique({
        where: { id: integration.id },
      })
      expect(dbRecord!.oauthClientId).toBe('oauth-client-123')
      expect(dbRecord!.oauthClientSecret).toBeDefined()
      expect(dbRecord!.oauthClientSecret).not.toBe('oauth-secret-456') // Should be encrypted
    })
  })

  describe('findById', () => {
    it('should find integration by ID', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      await repository.save(integration)

      const found = await repository.findById(integration.id)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(integration.id)
      expect(found!.provider).toBe('google_workspace')
      expect(found!.credentials.clientEmail).toBe(testCredentials.clientEmail)
    })

    it('should return null when integration not found', async () => {
      const found = await repository.findById('non-existent-id')

      expect(found).toBeNull()
    })

    it('should decrypt credentials when retrieving', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      await repository.save(integration)

      const found = await repository.findById(integration.id)

      expect(found!.credentials.privateKey).toBe(testCredentials.privateKey)
      expect(found!.credentials.projectId).toBe(testCredentials.projectId)
      expect(found!.credentials.clientId).toBe(testCredentials.clientId)
    })
  })

  describe('findByOrganizationAndProvider', () => {
    it('should find integration by organization and provider', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      await repository.save(integration)

      const found = await repository.findByOrganizationAndProvider(orgId, 'google_workspace')

      expect(found).not.toBeNull()
      expect(found!.id).toBe(integration.id)
      expect(found!.provider).toBe('google_workspace')
    })

    it('should return null when provider not found for organization', async () => {
      const found = await repository.findByOrganizationAndProvider(orgId, 'okta')

      expect(found).toBeNull()
    })

    it('should not return soft-deleted integrations', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      await repository.save(integration)
      await repository.delete(integration.id)

      const found = await repository.findByOrganizationAndProvider(orgId, 'google_workspace')

      expect(found).toBeNull()
    })

    it('should respect organization boundary', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      await repository.save(integration)

      const found = await repository.findByOrganizationAndProvider('different-org-id', 'google_workspace')

      expect(found).toBeNull()
    })
  })

  describe('findByOrganization', () => {
    it('should find all integrations for an organization', async () => {
      const googleIntegration = Integration.create({
        id: `int-google-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })

      const oktaIntegration = Integration.create({
        id: `int-okta-${Date.now()}`,
        organizationId: orgId,
        provider: 'okta',
        credentials: testCredentials,
      })

      await repository.save(googleIntegration)
      await repository.save(oktaIntegration)

      const integrations = await repository.findByOrganization(orgId)

      expect(integrations).toHaveLength(2)
      expect(integrations.map(i => i.provider)).toContain('google_workspace')
      expect(integrations.map(i => i.provider)).toContain('okta')
    })

    it('should return empty array when no integrations exist', async () => {
      const integrations = await repository.findByOrganization(orgId)

      expect(integrations).toEqual([])
    })

    it('should not return soft-deleted integrations', async () => {
      const integration1 = Integration.create({
        id: `int-1-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      const integration2 = Integration.create({
        id: `int-2-${Date.now()}`,
        organizationId: orgId,
        provider: 'okta',
        credentials: testCredentials,
      })

      await repository.save(integration1)
      await repository.save(integration2)
      await repository.delete(integration1.id)

      const integrations = await repository.findByOrganization(orgId)

      expect(integrations).toHaveLength(1)
      expect(integrations[0]!.provider).toBe('okta')
    })

    it('should order by createdAt descending', async () => {
      // Create integrations with slight delay to ensure different timestamps
      const integration1 = Integration.create({
        id: `int-1-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      await repository.save(integration1)

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 10))

      const integration2 = Integration.create({
        id: `int-2-${Date.now()}`,
        organizationId: orgId,
        provider: 'okta',
        credentials: testCredentials,
      })
      await repository.save(integration2)

      const integrations = await repository.findByOrganization(orgId)

      // Most recent should be first
      expect(integrations[0]!.provider).toBe('okta')
      expect(integrations[1]!.provider).toBe('google_workspace')
    })
  })

  describe('findAllActive', () => {
    it('should find all active integrations across all organizations', async () => {
      // Create active integration in first org
      const activeIntegration = Integration.create({
        id: `int-active-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      activeIntegration.activate()
      await repository.save(activeIntegration)

      // Create pending integration
      const pendingIntegration = Integration.create({
        id: `int-pending-${Date.now()}`,
        organizationId: orgId,
        provider: 'okta',
        credentials: testCredentials,
      })
      await repository.save(pendingIntegration)

      const activeIntegrations = await repository.findAllActive()

      expect(activeIntegrations).toHaveLength(1)
      expect(activeIntegrations[0]!.status).toBe('active')
      expect(activeIntegrations[0]!.isActive()).toBe(true)
    })

    it('should not return disabled integrations', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      integration.activate()
      await repository.save(integration)

      integration.disable()
      await repository.save(integration)

      const activeIntegrations = await repository.findAllActive()

      expect(activeIntegrations).toHaveLength(0)
    })
  })

  describe('findActiveByProvider', () => {
    it('should find all active integrations for a specific provider', async () => {
      const googleIntegration = Integration.create({
        id: `int-google-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      googleIntegration.activate()
      await repository.save(googleIntegration)

      const oktaIntegration = Integration.create({
        id: `int-okta-${Date.now()}`,
        organizationId: orgId,
        provider: 'okta',
        credentials: testCredentials,
      })
      oktaIntegration.activate()
      await repository.save(oktaIntegration)

      const googleIntegrations = await repository.findActiveByProvider('google_workspace')

      expect(googleIntegrations).toHaveLength(1)
      expect(googleIntegrations[0]!.provider).toBe('google_workspace')
    })

    it('should only return active integrations', async () => {
      const activeIntegration = Integration.create({
        id: `int-active-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      activeIntegration.activate()
      await repository.save(activeIntegration)

      // Use okta provider to avoid unique constraint violation
      const pendingIntegration = Integration.create({
        id: `int-pending-${Date.now()}`,
        organizationId: orgId,
        provider: 'okta',
        credentials: testCredentials,
      })
      await repository.save(pendingIntegration)

      const activeIntegrations = await repository.findActiveByProvider('google_workspace')

      expect(activeIntegrations).toHaveLength(1)
      expect(activeIntegrations[0]!.id).toBe(activeIntegration.id)
    })
  })

  describe('delete', () => {
    it('should soft delete integration', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      await repository.save(integration)

      await repository.delete(integration.id)

      const dbRecord = await prisma.integration.findUnique({
        where: { id: integration.id },
      })
      expect(dbRecord!.deletedAt).toBeInstanceOf(Date)

      // Verify it's not returned by findById (though the repo doesn't filter by deletedAt)
      const found = await repository.findById(integration.id)
      expect(found).toBeNull()
    })
  })

  describe('exists', () => {
    it('should return true when integration exists for organization and provider', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      await repository.save(integration)

      const exists = await repository.exists(orgId, 'google_workspace')

      expect(exists).toBe(true)
    })

    it('should return false when integration does not exist', async () => {
      const exists = await repository.exists(orgId, 'okta')

      expect(exists).toBe(false)
    })

    it('should return false for soft-deleted integrations', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      await repository.save(integration)
      await repository.delete(integration.id)

      const exists = await repository.exists(orgId, 'google_workspace')

      expect(exists).toBe(false)
    })

    it('should respect organization boundary', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      await repository.save(integration)

      const exists = await repository.exists('different-org-id', 'google_workspace')

      expect(exists).toBe(false)
    })
  })

  describe('provider mapping', () => {
    it('should correctly map google_workspace to google in database', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      await repository.save(integration)

      const dbRecord = await prisma.integration.findUnique({
        where: { id: integration.id },
      })
      expect(dbRecord!.provider).toBe('google')
    })

    it('should correctly map microsoft_365 to microsoft in database', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'microsoft_365',
        credentials: testCredentials,
      })
      await repository.save(integration)

      const dbRecord = await prisma.integration.findUnique({
        where: { id: integration.id },
      })
      expect(dbRecord!.provider).toBe('microsoft')
    })

    it('should correctly map google to google_workspace when retrieving', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      await repository.save(integration)

      const found = await repository.findById(integration.id)

      expect(found!.provider).toBe('google_workspace')
    })
  })

  describe('sync tracking', () => {
    it('should save and retrieve sync status', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      integration.activate()
      await repository.save(integration)

      // Record successful sync
      const syncResult = {
        success: true,
        startedAt: new Date(),
        completedAt: new Date(),
        stats: {
          created: 7,
          updated: 4,
          skipped: 1,
          errors: 0,
        },
        errors: [],
      }
      integration.recordSyncSuccess(syncResult)
      await repository.save(integration)

      const found = await repository.findById(integration.id)

      expect(found!.lastSyncAt).toBeInstanceOf(Date)
      expect(found!.lastSyncStatus).toBe('success')
      expect(found!.lastSyncError).toBeUndefined()
    })

    it('should save and retrieve sync errors', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
      })
      integration.activate()
      await repository.save(integration)

      // Record sync error
      const errorMessage = 'Failed to authenticate with Google API'
      integration.recordSyncError(errorMessage)
      await repository.save(integration)

      const found = await repository.findById(integration.id)

      expect(found!.lastSyncAt).toBeInstanceOf(Date)
      expect(found!.lastSyncStatus).toBe('error')
      expect(found!.lastSyncError).toBe(errorMessage)
    })
  })

  describe('provider-specific config', () => {
    it('should extract and store adminEmail in providerConfig', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
        config: {
          adminEmail: 'admin@company.com',
          domain: 'company.com',
          syncSchedule: '0 */6 * * *',
        },
      })
      await repository.save(integration)

      const dbRecord = await prisma.integration.findUnique({
        where: { id: integration.id },
      })
      const providerConfig = dbRecord!.providerConfig as Record<string, unknown>
      expect(providerConfig.adminEmail).toBe('admin@company.com')
      expect(providerConfig.domain).toBe('company.com')
      expect(providerConfig.syncSchedule).toBe('0 */6 * * *')
    })

    it('should merge providerConfig back into config when retrieving', async () => {
      const integration = Integration.create({
        id: `int-${Date.now()}`,
        organizationId: orgId,
        provider: 'google_workspace',
        credentials: testCredentials,
        config: {
          adminEmail: 'admin@company.com',
          domain: 'company.com',
        },
      })
      await repository.save(integration)

      const found = await repository.findById(integration.id)

      expect(found!.config?.adminEmail).toBe('admin@company.com')
      expect(found!.config?.domain).toBe('company.com')
    })
  })
})
