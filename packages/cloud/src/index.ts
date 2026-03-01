/**
 * @saastral/cloud — Cloud-only features for SaaStral.
 *
 * This package is PRIVATE and never published to npm.
 * It lives in a separate private repository and is only
 * included in the cloud deployment's build pipeline.
 *
 * Self-hosted users never install or import this package.
 *
 * Exports:
 * - createCloudAppRouter(): Merged tRPC router (core + cloud)
 * - CloudContainer / initCloudContainer(): Extended DI container
 * - Plan enforcement middleware for tRPC
 * - Stripe webhook handler
 * - Environment utilities
 */

// Router factory
export { createCloudAppRouter, type CloudAppRouter } from './create-app-router'
export { cloudRouter, type CloudRouter } from './routers'
export { billingRouter } from './routers/billing.router'

// DI Container
export { CloudContainer, initCloudContainer, getCloudContainer } from './cloud-container'

// Middleware
export {
  planAwareProcedure,
  requirePlan,
  requireWithinLimit,
} from './middleware/plan-enforcement'

// Services
export { StripeService, getStripeService } from './services/stripe.service'

// Webhooks
export { handleStripeWebhook } from './webhooks/stripe.webhook'

// Environment
export { isCloudEnvironment, getCloudConfig, getStripeConfig } from './env'
