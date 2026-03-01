/**
 * Cloud environment detection.
 *
 * The cloud package is only imported in the cloud deployment.
 * Self-hosted users never install @saastral/cloud, so this code
 * is never bundled into the community edition.
 *
 * This module provides a runtime check for code that lives in
 * shared packages (like @saastral/infrastructure) and needs to
 * know whether cloud features are active.
 */

export function isCloudEnvironment(): boolean {
  return process.env.SAASTRAL_CLOUD === 'true'
}

export function requireCloudEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required cloud environment variable: ${name}. ` +
        `This is required for SaaStral Cloud but not for self-hosted deployments.`
    )
  }
  return value
}

export function getStripeConfig() {
  return {
    secretKey: requireCloudEnv('STRIPE_SECRET_KEY'),
    webhookSecret: requireCloudEnv('STRIPE_WEBHOOK_SECRET'),
    publishableKey: requireCloudEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  }
}

export function getCloudConfig() {
  return {
    isCloud: true as const,
    stripe: getStripeConfig(),
    plans: {
      community: { priceId: null, limits: { members: 3, integrations: 1 } },
      team: {
        priceId: process.env.STRIPE_TEAM_PRICE_ID || null,
        limits: { members: 20, integrations: 5 },
      },
      enterprise: {
        priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || null,
        limits: { members: Infinity, integrations: Infinity },
      },
    },
  }
}
