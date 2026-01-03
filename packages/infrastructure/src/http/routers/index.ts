import { router } from '../trpc'
import { organizationRouter } from './organization.router'
import { userRouter } from './user.router'

export const appRouter = router({
  organization: organizationRouter,
  user: userRouter,
})

// Export type for client
export type AppRouter = typeof appRouter
