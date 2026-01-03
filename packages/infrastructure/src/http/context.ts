import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { auth } from '../auth/index'

export async function createContext(opts?: FetchCreateContextFnOptions) {
  // Get session from BetterAuth
  const session = await auth.api.getSession({
    headers: opts?.req.headers || new Headers(),
  })

  return {
    userId: session?.user?.id || undefined,
    session,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
