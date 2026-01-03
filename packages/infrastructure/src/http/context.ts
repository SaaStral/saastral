import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

export async function createContext(_opts?: FetchCreateContextFnOptions) {
  // For now, simple context. Will expand later with auth
  return {
    userId: undefined as string | undefined,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
