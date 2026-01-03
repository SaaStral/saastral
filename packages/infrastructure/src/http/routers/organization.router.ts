import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { getContainer } from '../../container'

// Input schema for creating an organization
const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  userId: z.string().uuid(), // BetterAuth now generates UUIDs
})

export const organizationRouter = router({
  /**
   * Create a new organization and make the user an owner
   */
  create: publicProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ input }) => {
      const container = getContainer()
      return await container.organizationService.createOrganization(input)
    }),

  /**
   * List all organizations the user has access to
   * Uses authenticated user from context
   */
  listUserOrganizations: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new Error('Not authenticated')
      }
      const container = getContainer()
      return await container.organizationService.listUserOrganizations(ctx.userId)
    }),
})
