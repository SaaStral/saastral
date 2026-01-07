import { describe, it, expect } from 'vitest'
import { Integration } from './integration.entity'
import { IntegrationDisabledError, InvalidStatusTransitionError } from './integration.errors'
import type { IntegrationProvider, SyncResult } from './integration.types'
import { ServiceAccountCredentials } from './value-objects/service-account-credentials'

// Helper to create mock credentials
function createMockCredentials(): ServiceAccountCredentials {
  return ServiceAccountCredentials.create({
    clientEmail: 'test@project.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n',
    clientId: '123456789',
    projectId: 'test-project',
    privateKeyId: 'key-id-123',
  })
}

// Helper to create mock sync result
function createMockSyncResult(): SyncResult {
  return {
    success: true,
    startedAt: new Date(),
    completedAt: new Date(),
    stats: {
      created: 10,
      updated: 5,
      skipped: 2,
      errors: 0,
    },
    errors: [],
  }
}

describe('Integration Entity', () => {
  describe('create', () => {
    it('should create integration with all required fields', () => {
      const credentials = createMockCredentials()

      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials,
      })

      expect(integration.id).toBe('int-123')
      expect(integration.organizationId).toBe('org-123')
      expect(integration.provider).toBe('google_workspace')
      expect(integration.credentials).toBe(credentials)
      expect(integration.status).toBe('pending')
      expect(integration.createdAt).toBeInstanceOf(Date)
      expect(integration.updatedAt).toBeInstanceOf(Date)
    })

    it('should create with optional config', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
        config: {
          adminEmail: 'admin@example.com',
          domain: 'example.com',
        },
      })

      expect(integration.config).toEqual({
        adminEmail: 'admin@example.com',
        domain: 'example.com',
      })
    })

    it('should create with createdBy user ID', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
        createdBy: 'user-456',
      })

      expect(integration.createdBy).toBe('user-456')
    })

    it('should support all provider types', () => {
      const providers: IntegrationProvider[] = [
        'google_workspace',
        'microsoft_365',
        'okta',
        'keycloak',
      ]

      providers.forEach(provider => {
        const integration = Integration.create({
          id: `int-${provider}`,
          organizationId: 'org-123',
          provider,
          credentials: createMockCredentials(),
        })

        expect(integration.provider).toBe(provider)
      })
    })

    it('should throw when ID is missing', () => {
      expect(() =>
        Integration.create({
          id: '',
          organizationId: 'org-123',
          provider: 'google_workspace',
          credentials: createMockCredentials(),
        })
      ).toThrow('Integration ID is required')
    })

    it('should throw when organization ID is missing', () => {
      expect(() =>
        Integration.create({
          id: 'int-123',
          organizationId: '',
          provider: 'google_workspace',
          credentials: createMockCredentials(),
        })
      ).toThrow('Organization ID is required')
    })
  })

  describe('fromPersistence', () => {
    it('should reconstitute integration from stored props', () => {
      const credentials = createMockCredentials()
      const createdAt = new Date('2024-01-01')
      const updatedAt = new Date('2024-01-02')

      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'active',
        credentials,
        createdAt,
        updatedAt,
      })

      expect(integration.id).toBe('int-123')
      expect(integration.status).toBe('active')
      expect(integration.createdAt).toEqual(createdAt)
      expect(integration.updatedAt).toEqual(updatedAt)
    })

    it('should reconstitute with sync history', () => {
      const lastSyncAt = new Date('2024-01-05')

      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'active',
        credentials: createMockCredentials(),
        lastSyncAt,
        lastSyncStatus: 'success',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      expect(integration.lastSyncAt).toEqual(lastSyncAt)
      expect(integration.lastSyncStatus).toBe('success')
    })

    it('should reconstitute integration with error state', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'error',
        credentials: createMockCredentials(),
        lastSyncStatus: 'error',
        lastSyncError: 'Authentication failed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      expect(integration.status).toBe('error')
      expect(integration.hasErrors()).toBe(true)
      expect(integration.lastSyncError).toBe('Authentication failed')
    })
  })

  describe('activate', () => {
    it('should activate pending integration', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
      })
      const beforeActivate = new Date()

      integration.activate()

      expect(integration.status).toBe('active')
      expect(integration.isActive()).toBe(true)
      expect(integration.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeActivate.getTime())
    })

    it('should activate integration in error state', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'error',
        credentials: createMockCredentials(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      integration.activate()

      expect(integration.status).toBe('active')
      expect(integration.isActive()).toBe(true)
    })

    it('should throw when activating disabled integration', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'disabled',
        credentials: createMockCredentials(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      expect(() => integration.activate()).toThrow(InvalidStatusTransitionError)
      expect(() => integration.activate()).toThrow('Invalid status transition from "disabled" to "active"')
    })
  })

  describe('disable', () => {
    it('should disable active integration', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'active',
        credentials: createMockCredentials(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const beforeDisable = new Date()

      integration.disable()

      expect(integration.status).toBe('disabled')
      expect(integration.isDisabled()).toBe(true)
      expect(integration.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeDisable.getTime())
    })

    it('should be idempotent when already disabled', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'disabled',
        credentials: createMockCredentials(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const updatedBefore = integration.updatedAt

      integration.disable()

      expect(integration.status).toBe('disabled')
      // Should be no-op, updatedAt doesn't change
      expect(integration.updatedAt).toBe(updatedBefore)
    })

    it('should disable integration in error state', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'error',
        credentials: createMockCredentials(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      integration.disable()

      expect(integration.status).toBe('disabled')
    })
  })

  describe('markAsError', () => {
    it('should mark active integration as error', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'active',
        credentials: createMockCredentials(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const beforeError = new Date()

      integration.markAsError('Authentication failed')

      expect(integration.status).toBe('error')
      expect(integration.hasErrors()).toBe(true)
      expect(integration.lastSyncError).toBe('Authentication failed')
      expect(integration.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeError.getTime())
    })

    it('should throw when marking disabled integration as error', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'disabled',
        credentials: createMockCredentials(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      expect(() => integration.markAsError('Some error')).toThrow(IntegrationDisabledError)
      expect(() => integration.markAsError('Some error')).toThrow(
        'Integration "int-123" is disabled'
      )
    })
  })

  describe('recordSyncSuccess', () => {
    it('should record successful sync', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'pending',
        credentials: createMockCredentials(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const syncResult = createMockSyncResult()
      const beforeSync = new Date()

      integration.recordSyncSuccess(syncResult)

      expect(integration.status).toBe('active')
      expect(integration.isActive()).toBe(true)
      expect(integration.lastSyncAt).toEqual(syncResult.completedAt)
      expect(integration.lastSyncStatus).toBe('success')
      expect(integration.lastSyncError).toBeUndefined()
      expect(integration.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeSync.getTime())
    })

    it('should transition from error to active on successful sync', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'error',
        credentials: createMockCredentials(),
        lastSyncError: 'Previous error',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      integration.recordSyncSuccess(createMockSyncResult())

      expect(integration.status).toBe('active')
      expect(integration.lastSyncError).toBeUndefined()
    })

    it('should throw when recording sync on disabled integration', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'disabled',
        credentials: createMockCredentials(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      expect(() => integration.recordSyncSuccess(createMockSyncResult())).toThrow(
        IntegrationDisabledError
      )
    })
  })

  describe('recordSyncError', () => {
    it('should record sync error', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'active',
        credentials: createMockCredentials(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const errorTime = new Date()
      const beforeRecord = new Date()

      integration.recordSyncError('API rate limit exceeded', errorTime)

      expect(integration.status).toBe('error')
      expect(integration.hasErrors()).toBe(true)
      expect(integration.lastSyncAt).toEqual(errorTime)
      expect(integration.lastSyncStatus).toBe('error')
      expect(integration.lastSyncError).toBe('API rate limit exceeded')
      expect(integration.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeRecord.getTime())
    })

    it('should default to current timestamp when not provided', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'active',
        credentials: createMockCredentials(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const beforeError = new Date()

      integration.recordSyncError('Connection timeout')

      expect(integration.lastSyncAt).toBeInstanceOf(Date)
      expect(integration.lastSyncAt!.getTime()).toBeGreaterThanOrEqual(beforeError.getTime())
    })

    it('should throw when recording error on disabled integration', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'disabled',
        credentials: createMockCredentials(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      expect(() => integration.recordSyncError('Some error')).toThrow(
        IntegrationDisabledError
      )
    })
  })

  describe('updateCredentials', () => {
    it('should update credentials', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
      })
      const newCredentials = ServiceAccountCredentials.create({
        clientEmail: 'new@project.iam.gserviceaccount.com',
        privateKey: '-----BEGIN PRIVATE KEY-----\nNEW_KEY\n-----END PRIVATE KEY-----\n',
        clientId: '987654321',
        projectId: 'new-project',
        privateKeyId: 'new-key-id',
      })
      const beforeUpdate = new Date()

      integration.updateCredentials(newCredentials)

      expect(integration.credentials).toBe(newCredentials)
      expect(integration.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should throw when updating with invalid credentials', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
      })
      const invalidCredentials = ServiceAccountCredentials.create({
        clientEmail: '',
        privateKey: '',
        clientId: '',
        projectId: '',
        privateKeyId: '',
      })

      expect(() => integration.updateCredentials(invalidCredentials)).toThrow(
        'Invalid credentials'
      )
    })
  })

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
        config: {
          adminEmail: 'old@example.com',
        },
      })
      const beforeUpdate = new Date()

      integration.updateConfig({ domain: 'example.com' })

      expect(integration.config).toEqual({
        adminEmail: 'old@example.com',
        domain: 'example.com',
      })
      expect(integration.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should merge with existing config', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
        config: {
          adminEmail: 'admin@example.com',
          customField: 'value',
        },
      })

      integration.updateConfig({ domain: 'example.com' })

      expect(integration.config).toEqual({
        adminEmail: 'admin@example.com',
        customField: 'value',
        domain: 'example.com',
      })
    })

    it('should override existing values', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
        config: {
          adminEmail: 'old@example.com',
        },
      })

      integration.updateConfig({ adminEmail: 'new@example.com' })

      expect(integration.config?.adminEmail).toBe('new@example.com')
    })
  })

  describe('getConfigValue', () => {
    it('should get existing config value', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
        config: {
          adminEmail: 'admin@example.com',
          syncSchedule: '0 */2 * * *',
        },
      })

      expect(integration.getConfigValue<string>('adminEmail')).toBe('admin@example.com')
      expect(integration.getConfigValue<string>('syncSchedule')).toBe('0 */2 * * *')
    })

    it('should return undefined for missing key', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
        config: {},
      })

      expect(integration.getConfigValue('missing')).toBeUndefined()
    })

    it('should return default value when key is missing', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
        config: {},
      })

      expect(integration.getConfigValue('missing', 'default-value')).toBe('default-value')
    })

    it('should return undefined when config is undefined', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
      })

      expect(integration.getConfigValue('any')).toBeUndefined()
    })

    it('should return default value when config is undefined', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
      })

      expect(integration.getConfigValue('any', 42)).toBe(42)
    })
  })

  describe('isSyncOverdue', () => {
    it('should return true when never synced', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
      })

      expect(integration.isSyncOverdue()).toBe(true)
    })

    it('should return false when synced within threshold', () => {
      const recentSync = new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'active',
        credentials: createMockCredentials(),
        lastSyncAt: recentSync,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      expect(integration.isSyncOverdue(2)).toBe(false)
    })

    it('should return true when sync exceeds threshold', () => {
      const oldSync = new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'active',
        credentials: createMockCredentials(),
        lastSyncAt: oldSync,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      expect(integration.isSyncOverdue(2)).toBe(true)
    })

    it('should support custom threshold', () => {
      const syncTime = new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'active',
        credentials: createMockCredentials(),
        lastSyncAt: syncTime,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      expect(integration.isSyncOverdue(4)).toBe(true)
      expect(integration.isSyncOverdue(6)).toBe(false)
    })
  })

  describe('computed properties', () => {
    describe('isActive', () => {
      it('should return true for active integration', () => {
        const integration = Integration.fromPersistence({
          id: 'int-123',
          organizationId: 'org-123',
          provider: 'google_workspace',
          status: 'active',
          credentials: createMockCredentials(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        expect(integration.isActive()).toBe(true)
      })

      it('should return false for pending integration', () => {
        const integration = Integration.create({
          id: 'int-123',
          organizationId: 'org-123',
          provider: 'google_workspace',
          credentials: createMockCredentials(),
        })

        expect(integration.isActive()).toBe(false)
      })
    })

    describe('isDisabled', () => {
      it('should return true for disabled integration', () => {
        const integration = Integration.fromPersistence({
          id: 'int-123',
          organizationId: 'org-123',
          provider: 'google_workspace',
          status: 'disabled',
          credentials: createMockCredentials(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        expect(integration.isDisabled()).toBe(true)
      })

      it('should return false for active integration', () => {
        const integration = Integration.fromPersistence({
          id: 'int-123',
          organizationId: 'org-123',
          provider: 'google_workspace',
          status: 'active',
          credentials: createMockCredentials(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        expect(integration.isDisabled()).toBe(false)
      })
    })

    describe('hasErrors', () => {
      it('should return true for integration in error state', () => {
        const integration = Integration.fromPersistence({
          id: 'int-123',
          organizationId: 'org-123',
          provider: 'google_workspace',
          status: 'error',
          credentials: createMockCredentials(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        expect(integration.hasErrors()).toBe(true)
      })

      it('should return false for active integration', () => {
        const integration = Integration.fromPersistence({
          id: 'int-123',
          organizationId: 'org-123',
          provider: 'google_workspace',
          status: 'active',
          credentials: createMockCredentials(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        expect(integration.hasErrors()).toBe(false)
      })
    })
  })

  describe('status lifecycle', () => {
    it('should support pending → active flow', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
      })

      expect(integration.status).toBe('pending')

      integration.activate()
      expect(integration.isActive()).toBe(true)
    })

    it('should support pending → error → active flow', () => {
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials: createMockCredentials(),
      })

      integration.markAsError('Initial connection failed')
      expect(integration.hasErrors()).toBe(true)

      integration.activate()
      expect(integration.isActive()).toBe(true)
    })

    it('should support active → disabled flow', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'active',
        credentials: createMockCredentials(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      integration.disable()
      expect(integration.isDisabled()).toBe(true)
    })

    it('should support active → error → active via sync success', () => {
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'active',
        credentials: createMockCredentials(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      integration.recordSyncError('Temporary failure')
      expect(integration.hasErrors()).toBe(true)

      integration.recordSyncSuccess(createMockSyncResult())
      expect(integration.isActive()).toBe(true)
    })
  })

  describe('toObject', () => {
    it('should serialize to plain object', () => {
      const credentials = createMockCredentials()
      const integration = Integration.create({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        credentials,
        config: { adminEmail: 'admin@example.com' },
      })

      const obj = integration.toObject()

      expect(obj.id).toBe('int-123')
      expect(obj.organizationId).toBe('org-123')
      expect(obj.provider).toBe('google_workspace')
      expect(obj.status).toBe('pending')
      expect(obj.credentials).toBe(credentials)
      expect(obj.config).toEqual({ adminEmail: 'admin@example.com' })
      expect(obj.createdAt).toBeInstanceOf(Date)
      expect(obj.updatedAt).toBeInstanceOf(Date)
    })

    it('should include sync history when present', () => {
      const lastSyncAt = new Date('2024-01-05')
      const integration = Integration.fromPersistence({
        id: 'int-123',
        organizationId: 'org-123',
        provider: 'google_workspace',
        status: 'active',
        credentials: createMockCredentials(),
        lastSyncAt,
        lastSyncStatus: 'success',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const obj = integration.toObject()

      expect(obj.lastSyncAt).toEqual(lastSyncAt)
      expect(obj.lastSyncStatus).toBe('success')
    })
  })
})
