/**
 * Cloud router aggregator.
 *
 * Merges all cloud-only routers into a single `cloudRouter` that can
 * be combined with the core `appRouter` from @saastral/infrastructure.
 */

import { router } from '@saastral/infrastructure'
import { billingRouter } from './billing.router'

export const cloudRouter = router({
  billing: billingRouter,
  // Future cloud-only routers:
  // metering: meteringRouter,
  // provisioning: provisioningRouter,
})

export type CloudRouter = typeof cloudRouter
