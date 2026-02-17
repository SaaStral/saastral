import { createTRPCReact, type CreateTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@saastral/infrastructure/types'

export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>()
