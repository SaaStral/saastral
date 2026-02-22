import { cache } from 'react'
import { headers } from 'next/headers'
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
 * Uses React cache() to deduplicate calls within a single request.
 * Passes the incoming request headers so that the session cookie
 * is forwarded and the caller is authenticated.
 */
export const getServerCaller = cache(async () => {
  const headersList = await headers()
  const context = await createContext({
    req: new Request('https://localhost', { headers: headersList }),
    resHeaders: new Headers(),
  })
  return appRouter.createCaller(context)
})
