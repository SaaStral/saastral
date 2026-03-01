import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createContext } from '@saastral/infrastructure'

// Force Node.js runtime (required for pg and crypto modules)
export const runtime = 'nodejs'

/**
 * Resolve the tRPC router to use.
 *
 * In the cloud deployment, @saastral/cloud is installed and provides
 * a merged router that adds billing, metering, and plan enforcement
 * on top of the core appRouter.
 *
 * In self-hosted deployments, @saastral/cloud is NOT installed,
 * so the dynamic import fails and we fall back to the core appRouter.
 */
async function getRouter() {
  if (process.env.SAASTRAL_CLOUD === 'true') {
    try {
      const { createCloudAppRouter, initCloudContainer } = await import('@saastral/cloud')
      initCloudContainer()
      return createCloudAppRouter()
    } catch {
      // @saastral/cloud not installed — use core router
    }
  }
  return appRouter
}

// Cache the router promise so we only resolve once
const routerPromise = getRouter()

const handler = async (req: Request) => {
  const router = await routerPromise

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router,
    createContext: (opts) => createContext(opts),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`tRPC error on ${path}:`, error)
          }
        : undefined,
  })
}

export { handler as GET, handler as POST }
