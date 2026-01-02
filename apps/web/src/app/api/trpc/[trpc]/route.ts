import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@saastral/infrastructure'
import { createContext } from '@saastral/infrastructure'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`❌ tRPC error on ${path}:`, error)
          }
        : undefined,
  })

export { handler as GET, handler as POST }
