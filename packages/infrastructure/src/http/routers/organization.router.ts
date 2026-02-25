import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { getContainer } from '../../container'

// Input schema for creating an organization
const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
})

export const organizationRouter = router({
  /**
   * Create a new organization and make the user an owner.
   *
   * Uses protectedProcedure — userId comes from the authenticated session,
   * not from client input (prevents creating orgs on behalf of other users).
   */
  create: protectedProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ input, ctx }) => {
      const container = getContainer()
      return await container.organizationService.createOrganization({
        name: input.name,
        userId: ctx.userId,
      })
    }),

  /**
   * List all organizations the user has access to.
   * Uses authenticated user from context.
   */
  listUserOrganizations: protectedProcedure
    .query(async ({ ctx }) => {
      const container = getContainer()
      return await container.organizationService.listUserOrganizations(ctx.userId)
    }),
})
