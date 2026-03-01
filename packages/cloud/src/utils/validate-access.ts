/**
 * Re-exports the org access validator from infrastructure.
 *
 * This wrapper exists so that if the cloud package ever needs to add
 * additional access checks (e.g., billing admin role), it can do so
 * in one place without modifying the core infrastructure package.
 */

import { TRPCError } from '@trpc/server'
import { getContainer } from '@saastral/infrastructure'

export async function validateOrganizationAccess(userId: string, organizationId: string) {
  const container = getContainer()
  const userOrgs = await container.organizationService.listUserOrganizations(userId)
  const hasAccess = userOrgs.some((org: { id: string }) => org.id === organizationId)

  if (!hasAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this organization',
    })
  }
}
