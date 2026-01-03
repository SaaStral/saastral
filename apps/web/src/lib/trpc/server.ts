import { cache } from 'react'
import { appRouter, createContext } from '@saastral/infrastructure'
import { QueryClient } from '@tanstack/react-query'

/**
 * Creates a QueryClient for each request
 * IMPORTANT: Do NOT reuse between requests
 */
export const createQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          // Pre-loaded data is always "fresh" on the server
          staleTime: 60 * 1000, // 1 minute
        },
      },
    })
)

/**
 * Server-side tRPC caller
 * Uses React cache() to deduplicate calls within a single request
 * In tRPC v11, use router.createCaller() instead of createCallerFactory
 */
export const getServerCaller = cache(async () => {
  const context = await createContext()
  return appRouter.createCaller(context)
})
