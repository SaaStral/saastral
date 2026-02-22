import { router } from '../trpc'
import { organizationRouter } from './organization.router'
import { userRouter } from './user.router'
import { employeeRouter } from './employee.router'
import { integrationRouter } from './integration.router'
import { subscriptionRouter } from './subscription.router'

export const appRouter = router({
  organization: organizationRouter,
  user: userRouter,
  employee: employeeRouter,
  integration: integrationRouter,
  subscription: subscriptionRouter,
})

// Export type for client
export type AppRouter = typeof appRouter
