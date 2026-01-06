import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { getContainer } from '../../container'
import { Integration } from '@saastral/core'

/**
 * Integration Router
 * Handles integration configuration and management
 */

// Input schema for saving Google OAuth credentials
const saveGoogleOAuthCredentialsSchema = z.object({
  organizationId: z.string().uuid(),
  oauthClientId: z.string().min(1, 'Client ID is required'),
  oauthClientSecret: z.string().min(1, 'Client Secret is required'),
})

// Input schema for listing integrations
const listIntegrationsSchema = z.object({
  organizationId: z.string().uuid(),
})

export const integrationRouter = router({
  /**
   * Save Google OAuth credentials for an organization
   * Creates or updates the integration with OAuth client credentials
   */
  saveGoogleOAuthCredentials: publicProcedure
    .input(saveGoogleOAuthCredentialsSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      const container = getContainer()
      const { organizationId, oauthClientId, oauthClientSecret } = input

      // Check if integration already exists
      const existing = await container.integrationRepo.findByOrganizationAndProvider(
        organizationId,
        'google_workspace',
      )

      if (existing) {
        // Update existing integration with new OAuth credentials
        const config = existing.toObject().config || {}
        config.oauthClientId = oauthClientId
        config.oauthClientSecret = oauthClientSecret

        // Create updated integration (immutable pattern)
        const updated = Integration.fromPersistence({
          ...existing.toObject(),
          config,
          updatedAt: new Date(),
        })

        await container.integrationRepo.save(updated)

        return {
          success: true,
          message: 'Google OAuth credentials updated successfully',
        }
      } else {
        // Create new integration with OAuth credentials
        // Note: This creates a "pending" integration that will be activated after OAuth flow
        const integration = Integration.create({
          id: crypto.randomUUID(),
          organizationId,
          provider: 'google_workspace',
          credentials: {
            clientEmail: '', // Will be populated after OAuth
            privateKey: '',
            clientId: oauthClientId,
            projectId: '',
            privateKeyId: '',
          } as any,
          config: {
            oauthClientId,
            oauthClientSecret,
          },
          createdBy: ctx.userId,
        })

        await container.integrationRepo.save(integration)

        return {
          success: true,
          message: 'Google OAuth credentials saved successfully',
        }
      }
    }),

  /**
   * List all integrations for an organization
   */
  list: publicProcedure
    .input(listIntegrationsSchema)
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      const container = getContainer()
      const integrations = await container.integrationRepo.findByOrganization(
        input.organizationId,
      )

      // Map to safe output format (don't expose credentials)
      return integrations.map((integration) => {
        const props = integration.toObject()
        return {
          id: props.id,
          organizationId: props.organizationId,
          provider: props.provider,
          status: props.status,
          lastSyncAt: props.lastSyncAt,
          lastSyncStatus: props.lastSyncStatus,
          lastSyncError: props.lastSyncError,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
          hasOAuthCredentials: !!(props.config?.oauthClientId && props.config?.oauthClientSecret),
        }
      })
    }),

  /**
   * Get OAuth client ID for an organization's Google integration
   * Returns only the client ID (not the secret) for use in OAuth flow
   */
  getGoogleOAuthClientId: publicProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ input }) => {
      const container = getContainer()
      const integration = await container.integrationRepo.findByOrganizationAndProvider(
        input.organizationId,
        'google_workspace',
      )

      if (!integration) {
        return { oauthClientId: null }
      }

      const config = integration.toObject().config
      return {
        oauthClientId: config?.oauthClientId as string | null,
      }
    }),

  /**
   * Get integration by ID
   */
  get: publicProcedure
    .input(z.object({ integrationId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      const container = getContainer()
      const integration = await container.integrationRepo.findById(input.integrationId)

      if (!integration) {
        throw new Error('Integration not found')
      }

      const props = integration.toObject()
      const config = props.config || {}

      return {
        id: props.id,
        organizationId: props.organizationId,
        provider: props.provider,
        status: props.status,
        lastSyncAt: props.lastSyncAt,
        lastSyncStatus: props.lastSyncStatus,
        lastSyncError: props.lastSyncError,
        syncStats: config.syncStats,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        hasOAuthCredentials: !!(config.oauthClientId && config.oauthClientSecret),
      }
    }),

  /**
   * Disable an integration
   * Sets status to 'disabled' and stops syncing
   */
  disable: publicProcedure
    .input(z.object({ integrationId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      const container = getContainer()
      const integration = await container.integrationRepo.findById(input.integrationId)

      if (!integration) {
        throw new Error('Integration not found')
      }

      // Use domain method to disable
      integration.disable()

      await container.integrationRepo.save(integration)

      return {
        success: true,
        message: 'Integration disabled successfully',
      }
    }),

  /**
   * Test connection to Google Workspace
   * Validates OAuth credentials by attempting to list users
   */
  testConnection: publicProcedure
    .input(z.object({ integrationId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      const container = getContainer()
      const integration = await container.integrationRepo.findById(input.integrationId)

      if (!integration) {
        throw new Error('Integration not found')
      }

      const props = integration.toObject()
      const config = props.config || {}

      // Validate OAuth credentials exist
      if (!config.oauthClientId || !config.oauthClientSecret || !config.oauthTokens) {
        return {
          success: false,
          message: 'OAuth credentials not configured',
        }
      }

      // Import GoogleDirectoryProvider
      const { GoogleDirectoryProvider } = await import('../../providers/google/google-directory.provider')

      try {
        // Create provider with current credentials
        const provider = new GoogleDirectoryProvider({
          oauthClientId: config.oauthClientId as string,
          oauthClientSecret: config.oauthClientSecret as string,
          oauthTokens: config.oauthTokens as any,
          onTokensRefreshed: async (newTokens) => {
            // Update tokens if refreshed during test
            await container.prisma.integration.update({
              where: { id: integration.id },
              data: {
                config: {
                  ...config,
                  oauthTokens: newTokens,
                } as any,
                updatedAt: new Date(),
              },
            })
          },
        })

        // Test connection
        await provider.testConnection()

        return {
          success: true,
          message: 'Connection successful',
        }
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Connection failed',
        }
      }
    }),

  /**
   * Get sync history for an integration
   * Returns recent sync attempts from graphile_worker._private_jobs table
   */
  getSyncHistory: publicProcedure
    .input(z.object({
      integrationId: z.string().uuid(),
      limit: z.number().int().positive().max(50).optional().default(10),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      const container = getContainer()

      // Verify integration exists
      const integration = await container.integrationRepo.findById(input.integrationId)

      if (!integration) {
        throw new Error('Integration not found')
      }

      // Query Graphile Worker jobs table for sync history
      // Note: This queries the _private_jobs table which tracks all job executions
      const syncHistory = await container.prisma.$queryRaw<Array<{
        id: string
        task_identifier: string
        created_at: Date
        updated_at: Date
        attempts: number
        max_attempts: number
        last_error: string | null
      }>>`
        SELECT
          id,
          task_identifier,
          created_at,
          updated_at,
          attempts,
          max_attempts,
          last_error
        FROM graphile_worker._private_jobs
        WHERE task_identifier IN ('sync-google-directory', 'sync-employee-batch')
        ORDER BY created_at DESC
        LIMIT ${input.limit}
      `

      return syncHistory.map(job => ({
        id: String(job.id),
        taskName: job.task_identifier,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        attempts: job.attempts,
        maxAttempts: job.max_attempts,
        status: job.last_error ? 'failed' : 'completed',
        error: job.last_error,
      }))
    }),

  /**
   * Trigger manual sync for an integration
   * Enqueues a sync-google-directory job for immediate execution
   */
  manualSync: publicProcedure
    .input(z.object({
      integrationId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }

      const container = getContainer()

      // Verify integration exists and is active
      const integration = await container.integrationRepo.findById(input.integrationId)

      if (!integration) {
        throw new Error('Integration not found')
      }

      const props = integration.toObject()

      if (props.status !== 'active') {
        throw new Error('Integration must be active to sync')
      }

      // Enqueue sync job using Graphile Worker
      await container.prisma.$queryRaw`
        SELECT graphile_worker.add_job('sync-google-directory', '{}', queue_name := 'manual-sync');
      `

      return {
        success: true,
        message: 'Sync job enqueued successfully',
      }
    }),
})
