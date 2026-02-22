'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { TRPCClientError } from '@trpc/client'
import { trpc } from './client'
import superjson from 'superjson'

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

/**
 * Redirect to auth page when an UNAUTHORIZED error is received.
 * This acts as a global interceptor so individual components don't need
 * to handle session expiry themselves.
 */
function handleAuthError(error: unknown) {
  if (
    error instanceof TRPCClientError &&
    error.data?.code === 'UNAUTHORIZED' &&
    typeof window !== 'undefined'
  ) {
    // Extract locale from current path (e.g. /en/dashboard → en)
    const pathSegments = window.location.pathname.split('/')
    const locale = pathSegments[1] || 'en'
    window.location.href = `/${locale}/auth`
  }
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000, // 5 seconds
            retry: (failureCount, error) => {
              // Don't retry on auth errors — redirect instead
              if (error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED') {
                return false
              }
              return failureCount < 1
            },
            refetchOnWindowFocus: false,
          },
        },
        queryCache: new QueryCache({
          onError: handleAuthError,
        }),
        mutationCache: new MutationCache({
          onError: handleAuthError,
        }),
      })
  )

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: 'include',
            })
          },
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
