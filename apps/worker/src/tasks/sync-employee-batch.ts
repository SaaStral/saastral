/**
 * Sync Employee Batch Worker Task
 *
 * CRITICAL - Processes a batch of employees from Google Workspace.
 *
 * Responsibilities:
 * - Process a batch of directory users (typically 100 users)
 * - For each user, create or update employee record
 * - Map Google status to SaaStral status
 * - Track sync stats (created, updated, skipped, errors)
 * - Update integration with batch progress
 *
 * Architecture:
 * - This task is enqueued by sync-google-directory
 * - Multiple batch tasks run in parallel (controlled by worker concurrency)
 * - Each batch is independent and can retry individually
 */

import type { Task } from 'graphile-worker'
import { getContainer } from '@saastral/infrastructure'
import type { DirectoryUser } from '@saastral/core'

interface BatchPayload {
  integrationId: string
  organizationId: string
  users: DirectoryUser[]
  batchNumber: number
  totalBatches: number
  totalUsers: number
}

/**
 * Sync Employee Batch Task
 *
 * Processes a batch of users and syncs them to the database.
 */
export const task: Task = async (payload, helpers) => {
  const container = getContainer()
  const { integrationId, organizationId, users, batchNumber, totalBatches, totalUsers } =
    payload as BatchPayload

  helpers.logger.info(
    `Processing batch ${batchNumber + 1}/${totalBatches} (${users.length} users) for org ${organizationId}`,
  )

  // Track sync stats for this batch
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  }

  const errors: string[] = []

  // Process each user in the batch
  for (const directoryUser of users) {
    try {
      await syncEmployee(organizationId, directoryUser, stats, helpers)
    } catch (error) {
      const errorMsg = `Failed to sync employee ${directoryUser.email}: ${error instanceof Error ? error.message : String(error)}`
      errors.push(errorMsg)
      stats.errors++
      helpers.logger.error(errorMsg, { error })
      // Continue with next employee
    }
  }

  // Log batch completion
  helpers.logger.info(`Batch ${batchNumber + 1}/${totalBatches} completed`, {
    stats,
    progress: `${((batchNumber + 1) / totalBatches * 100).toFixed(1)}%`,
  })

  // Update integration with batch progress
  // Note: In production, you might want to aggregate stats across all batches
  // For now, we'll just update with this batch's completion
  try {
    const integration = await container.prisma.integration.findUnique({
      where: { id: integrationId },
    })

    if (integration) {
      const currentStats = (integration.syncStats as any) || {}
      const batchesCompleted = (currentStats.batchesCompleted || 0) + 1
      const progressPercent = Math.round((batchesCompleted / totalBatches) * 100)

      await container.prisma.integration.update({
        where: { id: integrationId },
        data: {
          syncStats: {
            ...currentStats,
            batchesCompleted,
            totalBatches,
            totalUsers,
            progressPercent,
            lastBatchStats: stats,
          } as any,
          lastSyncMessage:
            batchesCompleted === totalBatches
              ? `Sync completed: ${totalUsers} users processed`
              : `Processing: ${batchesCompleted}/${totalBatches} batches (${progressPercent}%)`,
          updatedAt: new Date(),
        },
      })
    }
  } catch (error) {
    helpers.logger.error('Failed to update integration progress', { error })
    // Don't fail the batch if progress update fails
  }

  if (errors.length > 0) {
    helpers.logger.warn(`Batch ${batchNumber + 1} had ${errors.length} errors`, {
      errors: errors.slice(0, 5),
    })
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
