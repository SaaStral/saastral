import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'

// Define context type - for now simple, will expand later
export interface Context {
  userId?: string
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

// Base exports
export const router = t.router
export const publicProcedure = t.procedure
export const middleware = t.middleware

// Authenticated procedure — rejects unauthenticated requests early
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } })
})

export const protectedProcedure = t.procedure.use(enforceAuth)
