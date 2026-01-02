import { router } from '../trpc'
import { organizationRouter } from './organization.router'

export const appRouter = router({
  organization: organizationRouter,
})

// Export type for client
export type AppRouter = typeof appRouter
