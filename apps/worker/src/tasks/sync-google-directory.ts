/**
 * Sync Google Directory Worker Task
 *
 * CRITICAL - Employee sync worker that runs periodically.
 *
 * Responsibilities:
 * - Fetch all active Google Workspace integrations
 * - For each integration, sync employees from Google Workspace
 * - Update employee status (active/suspended/offboarded)
 * - Track sync stats and errors
 *
 * Runs: Hourly (configurable via cron)
 */

import type { Task } from 'graphile-worker'
import { getContainer, GoogleDirectoryProvider } from '@saastral/infrastructure'
import type { OAuthTokens } from '@saastral/infrastructure'
import type { DirectoryUser } from '@saastral/core'

/**
 * Sync Google Directory Task
 *
 * Fetches all active Google integrations and syncs employees.
 */
export const task: Task = async (_payload, helpers) => {
  const container = getContainer()

  helpers.logger.info('Starting Google Workspace directory sync...')

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

    // Sync each integration
    for (const integration of integrations) {
      try {
        await syncIntegration(integration, helpers)
      } catch (error) {
        helpers.logger.error(
          `Failed to sync integration ${integration.id} for org ${integration.organizationId}`,
          { error },
        )
        // Continue with next integration instead of failing entire job
      }
    }

    helpers.logger.info('✅ Google Workspace directory sync completed')
  } catch (error) {
    helpers.logger.error('❌ Fatal error in Google Workspace sync', { error })
    throw error
  }
}

/**
 * Sync a single integration
 */
async function syncIntegration(integration: any, helpers: any) {
  const container = getContainer()
  const orgId = integration.organizationId

  helpers.logger.info(`Syncing Google Workspace for organization ${orgId}`)

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

  // Track sync stats
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  }

  const errors: string[] = []

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

    // Sync each user
    for (const directoryUser of allUsers) {
      try {
        await syncEmployee(orgId, directoryUser, stats, helpers)
      } catch (error) {
        const errorMsg = `Failed to sync employee ${directoryUser.email}: ${error instanceof Error ? error.message : String(error)}`
        errors.push(errorMsg)
        stats.errors++
        helpers.logger.error(errorMsg, { error })
        // Continue with next employee
      }
    }

    // Update integration sync status
    await container.prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: errors.length > 0 ? 'partial' : 'success',
        lastSyncMessage:
          errors.length > 0 ? `Completed with ${errors.length} errors` : 'Sync completed successfully',
        syncStats: stats as any,
        updatedAt: new Date(),
      },
    })

    helpers.logger.info(`Sync completed for org ${orgId}`, { stats })

    if (errors.length > 0) {
      helpers.logger.warn(`Sync had ${errors.length} errors`, { errors: errors.slice(0, 10) })
    }
  } catch (error) {
    // Update integration with error status
    await container.prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'error',
        lastSyncMessage: error instanceof Error ? error.message : String(error),
        syncStats: stats as any,
        updatedAt: new Date(),
      },
    })

    throw error
  }
}

/**
 * Sync a single employee
 *
 * Strategy:
 * 1. Try to find employee by externalId (Google user ID - stable)
 * 2. Fallback to email (can change, but still unique)
 * 3. If not found, create new employee
 * 4. Update status based on Google status
 */
async function syncEmployee(
  orgId: string,
  directoryUser: DirectoryUser,
  stats: { created: number; updated: number; skipped: number; errors: number },
  helpers: any,
) {
  const container = getContainer()

  // Find existing employee by externalId first (more stable), then by email
  let employee = await container.prisma.employee.findFirst({
    where: {
      organizationId: orgId,
      externalId: directoryUser.externalId,
    },
  })

  if (!employee) {
    // Try to find by email as fallback
    employee = await container.prisma.employee.findFirst({
      where: {
        organizationId: orgId,
        email: directoryUser.email,
      },
    })
  }

  // Map directory status to employee status
  const status = mapDirectoryStatusToEmployeeStatus(directoryUser.status)

  if (employee) {
    // Update existing employee
    const hasChanges =
      employee.externalId !== directoryUser.externalId ||
      employee.email !== directoryUser.email ||
      employee.name !== directoryUser.fullName ||
      employee.status !== status

    if (hasChanges) {
      await container.prisma.employee.update({
        where: { id: employee.id },
        data: {
          externalId: directoryUser.externalId,
          email: directoryUser.email,
          name: directoryUser.fullName,
          title: directoryUser.jobTitle,
          phone: directoryUser.phoneNumber,
          hiredAt: directoryUser.startDate,
          status,
          offboardedAt: status === 'offboarded' ? new Date() : null,
          updatedAt: new Date(),
        },
      })

      stats.updated++
      helpers.logger.debug(`Updated employee ${directoryUser.email}`)
    } else {
      stats.skipped++
      helpers.logger.debug(`Skipped employee ${directoryUser.email} (no changes)`)
    }
  } else {
    // Create new employee
    await container.prisma.employee.create({
      data: {
        organizationId: orgId,
        externalId: directoryUser.externalId,
        email: directoryUser.email,
        name: directoryUser.fullName,
        title: directoryUser.jobTitle,
        phone: directoryUser.phoneNumber,
        hiredAt: directoryUser.startDate,
        status,
        offboardedAt: status === 'offboarded' ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    stats.created++
    helpers.logger.debug(`Created employee ${directoryUser.email}`)
  }
}

/**
 * Map directory user status to employee status
 */
function mapDirectoryStatusToEmployeeStatus(
  directoryStatus: string,
): 'active' | 'suspended' | 'offboarded' {
  switch (directoryStatus) {
    case 'active':
      return 'active'
    case 'suspended':
      return 'suspended'
    case 'archived':
    case 'deleted':
      return 'offboarded'
    default:
      return 'active' // Default to active for unknown statuses
  }
}

export default task
