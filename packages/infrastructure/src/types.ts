/**
 * Type-only exports for edge-safe imports
 *
 * This file contains only TypeScript types and interfaces
 * that can be safely imported in Edge Runtime contexts
 * (like Next.js middleware or client components).
 */

// HTTP/tRPC types
export type { AppRouter } from './http/routers'
export type { Context as TRPCContext } from './http/context'
