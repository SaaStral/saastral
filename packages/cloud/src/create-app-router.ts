/**
 * Router factory that merges the core appRouter with cloud-only routes.
 *
 * The cloud deployment imports this instead of using `appRouter` directly.
 *
 * Architecture:
 * ┌─────────────────────────────────────────────┐
 * │  Combined App Router (cloud deployment)     │
 * │                                             │
 * │  ┌─ organization  (from core appRouter)     │
 * │  ├─ user          (from core appRouter)     │
 * │  ├─ employee      (from core appRouter)     │
 * │  ├─ integration   (from core appRouter)     │
 * │  ├─ subscription  (from core appRouter)     │
 * │  └─ cloud         (from cloudRouter)        │
 * │      ├─ billing                             │
 * │      └─ (future: metering, provisioning)    │
 * └─────────────────────────────────────────────┘
 *
 * Usage in the Next.js tRPC route handler:
 *
 *   // apps/web/src/app/api/trpc/[trpc]/route.ts
 *   import { createCloudAppRouter } from '@saastral/cloud'
 *   const router = createCloudAppRouter()
 *
 * Self-hosted deployments continue to use:
 *
 *   import { appRouter } from '@saastral/infrastructure'
 */

import { router, appRouter } from '@saastral/infrastructure'
import { cloudRouter } from './routers'

export function createCloudAppRouter() {
  return router({
    // Spread all core routes
    organization: appRouter.organization,
    user: appRouter.user,
    employee: appRouter.employee,
    integration: appRouter.integration,
    subscription: appRouter.subscription,

    // Add cloud-only namespace
    cloud: cloudRouter,
  })
}

export type CloudAppRouter = ReturnType<typeof createCloudAppRouter>
