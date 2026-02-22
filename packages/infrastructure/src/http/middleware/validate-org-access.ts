import { TRPCError } from '@trpc/server'
import { getContainer } from '../../container'

/**
 * Validates that the authenticated user has access to the specified organization.
 * Throws FORBIDDEN if the user does not belong to the organization.
 *
 * Shared across all routers that need org-level authorization.
 */
export async function validateOrganizationAccess(userId: string, organizationId: string) {
  const container = getContainer()
  const userOrgs = await container.organizationService.listUserOrganizations(userId)

  const hasAccess = userOrgs.some(org => org.id === organizationId)

  if (!hasAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this organization',
    })
  }
}
