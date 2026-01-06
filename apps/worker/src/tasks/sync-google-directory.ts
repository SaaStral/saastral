/**
 * Sync Google Directory Worker Task
 *
 * CRITICAL - Employee sync orchestrator that runs periodically.
 *
 * Responsibilities:
 * - Fetch all active Google Workspace integrations
 * - For each integration, fetch user list from Google
 * - Split users into batches and enqueue batch processing jobs
 * - Provides scalability for organizations with thousands of employees
 *
 * Runs: Hourly (configurable via cron)
 *
 * Architecture:
 * - This task fetches users and enqueues batches (fast, non-blocking)
 * - sync-employee-batch task processes each batch in parallel
 * - Batch size: 100 users per batch (configurable)
 */

import type { Task } from 'graphile-worker'
import { getContainer, GoogleDirectoryProvider } from '@saastral/infrastructure'
import type { OAuthTokens } from '@saastral/infrastructure'
import type { DirectoryUser } from '@saastral/core'

const BATCH_SIZE = 100 // Process 100 employees per batch

/**
 * Sync Google Directory Task
 *
 * Fetches all active Google integrations, retrieves user lists,
 * and enqueues batch processing jobs.
 */
export const task: Task = async (_payload, helpers) => {
  const container = getContainer()

  helpers.logger.info('Starting Google Workspace directory sync orchestration...')

  try {
    // Find all active Google Workspace integrations
    const integrations = await container.prisma.integration.findMany({
      where: {
        provider: 'google_workspace' as any,
        status: 'active',
        deletedAt: null,
      },
    })

    if (integrations.length === 0) {
      helpers.logger.info('No active Google Workspace integrations found')
      return
    }

    helpers.logger.info(`Found ${integrations.length} Google Workspace integration(s)`)

    // Process each integration
    for (const integration of integrations) {
      try {
        await orchestrateIntegrationSync(integration, helpers)
      } catch (error) {
        helpers.logger.error(
          `Failed to orchestrate sync for integration ${integration.id} for org ${integration.organizationId}`,
          { error },
        )

        // Mark integration as errored
        await container.prisma.integration.update({
          where: { id: integration.id },
          data: {
            lastSyncAt: new Date(),
            lastSyncStatus: 'error',
            lastSyncMessage: error instanceof Error ? error.message : String(error),
            updatedAt: new Date(),
          },
        })

        // Continue with next integration instead of failing entire job
      }
    }

    helpers.logger.info('✅ Google Workspace directory sync orchestration completed')
  } catch (error) {
    helpers.logger.error('❌ Fatal error in Google Workspace sync orchestration', { error })
    throw error
  }
}

/**
 * Orchestrate sync for a single integration
 *
 * Fetches user list from Google and enqueues batch processing jobs
 */
async function orchestrateIntegrationSync(integration: any, helpers: any) {
  const container = getContainer()
  const orgId = integration.organizationId

  helpers.logger.info(`Orchestrating sync for organization ${orgId}`)

  // Parse config
  const config = integration.config as Record<string, any>
  const oauthTokens = config.oauthTokens as OAuthTokens
  const oauthClientId = integration.oauthClientId
  const oauthClientSecret = integration.oauthClientSecret

  if (!oauthClientId || !oauthClientSecret) {
    throw new Error('OAuth client credentials missing from integration')
  }

  if (!oauthTokens || !oauthTokens.accessToken || !oauthTokens.refreshToken) {
    throw new Error('OAuth tokens missing from integration config')
  }

  // Create directory provider with token refresh callback
  const provider = new GoogleDirectoryProvider({
    oauthClientId,
    oauthClientSecret,
    oauthTokens,
    onTokensRefreshed: async (newTokens: OAuthTokens) => {
      // Update integration with refreshed tokens
      helpers.logger.info(`Refreshing OAuth tokens for integration ${integration.id}`)

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

  try {
    // Fetch all users from Google (handle pagination)
    let pageToken: string | undefined
    let allUsers: DirectoryUser[] = []

    do {
      const result = await provider.listUsers({
        pageSize: 500,
        pageToken,
      })

      allUsers = allUsers.concat(result.items)
      pageToken = result.nextPageToken
    } while (pageToken)

    helpers.logger.info(`Fetched ${allUsers.length} users from Google Workspace`)

    // Split users into batches
    const batches: DirectoryUser[][] = []
    for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
      batches.push(allUsers.slice(i, i + BATCH_SIZE))
    }

    helpers.logger.info(`Split ${allUsers.length} users into ${batches.length} batches of ${BATCH_SIZE}`)

    // Enqueue batch processing jobs
    for (let i = 0; i < batches.length; i++) {
      await helpers.addJob('sync-employee-batch', {
        integrationId: integration.id,
        organizationId: orgId,
        users: batches[i],
        batchNumber: i,
        totalBatches: batches.length,
        totalUsers: allUsers.length,
      })
    }

    // Update integration status to "in progress"
    await container.prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Enqueued ${batches.length} batches for ${allUsers.length} users`,
        syncStats: {
          totalUsers: allUsers.length,
          totalBatches: batches.length,
          batchSize: BATCH_SIZE,
        } as any,
        updatedAt: new Date(),
      },
    })

    helpers.logger.info(
      `✅ Enqueued ${batches.length} batch jobs for integration ${integration.id}`,
    )
  } catch (error) {
    // Update integration with error status
    await container.prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'error',
        lastSyncMessage: error instanceof Error ? error.message : String(error),
        updatedAt: new Date(),
      },
    })

    throw error
  }
}

export default task
