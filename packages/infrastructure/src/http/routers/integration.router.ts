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
})
