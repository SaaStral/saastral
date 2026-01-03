import { router, publicProcedure } from '../trpc'
import { getContainer } from '../../container'

export const userRouter = router({
  /**
   * Check if any users exist in the database
   * Used to determine if this is first-time setup (show signup) or not (show login)
   */
  hasUsers: publicProcedure.query(async () => {
    const container = getContainer()
    return await container.userService.hasUsers()
  }),
})
