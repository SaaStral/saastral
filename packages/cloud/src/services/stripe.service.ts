/**
 * Stripe service for cloud billing.
 *
 * Wraps the Stripe SDK with SaaStral-specific operations:
 * - Checkout session creation (plan upgrade)
 * - Customer portal (self-serve billing management)
 * - Webhook event processing (subscription lifecycle)
 * - Billing status queries
 *
 * This service is only instantiated in the cloud deployment.
 */

import Stripe from 'stripe'
import { getContainer } from '@saastral/infrastructure'
import { getStripeConfig, getCloudConfig } from '../env'

let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    const config = getStripeConfig()
    stripeInstance = new Stripe(config.secretKey, { apiVersion: '2025-01-27.acacia' })
  }
  return stripeInstance
}

interface CreateCheckoutParams {
  organizationId: string
  plan: 'team' | 'enterprise'
  userId: string
  successUrl: string
  cancelUrl: string
}

interface CreatePortalParams {
  organizationId: string
  returnUrl: string
}

interface BillingStatus {
  plan: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'none'
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
}

export class StripeService {
  /**
   * Creates a Stripe Checkout session for upgrading an organization's plan.
   *
   * Flow:
   * 1. Look up or create the Stripe customer for the org
   * 2. Create a checkout session with the plan's price ID
   * 3. Return the session URL for redirect
   */
  async createCheckoutSession(params: CreateCheckoutParams) {
    const stripe = getStripe()
    const cloudConfig = getCloudConfig()
    const planConfig = cloudConfig.plans[params.plan]

    if (!planConfig?.priceId) {
      throw new Error(`No Stripe price ID configured for plan: ${params.plan}`)
    }

    const customerId = await this.getOrCreateCustomer(params.organizationId)

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        organizationId: params.organizationId,
        userId: params.userId,
        plan: params.plan,
      },
    })

    return { url: session.url }
  }

  /**
   * Creates a Stripe Customer Portal session for self-serve billing management.
   */
  async createPortalSession(params: CreatePortalParams) {
    const stripe = getStripe()
    const customerId = await this.getOrCreateCustomer(params.organizationId)

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: params.returnUrl,
    })

    return { url: session.url }
  }

  /**
   * Returns the current billing status for an organization.
   */
  async getBillingStatus(organizationId: string): Promise<BillingStatus> {
    const container = getContainer()
    const org = await container.organizationRepo.findById(organizationId)

    if (!org) {
      return {
        plan: 'community',
        status: 'none',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripeCustomerId: null,
      }
    }

    // For now, plan info is on the Organization record.
    // Once Stripe is wired up, this would also query the Stripe subscription.
    return {
      plan: org.plan,
      status: org.planStartedAt ? 'active' : 'none',
      currentPeriodEnd: null, // TODO: store from Stripe webhook
      cancelAtPeriodEnd: false,
      stripeCustomerId: null, // TODO: add stripeCustomerId to Organization model
    }
  }

  /**
   * Processes a Stripe webhook event.
   *
   * Handles:
   * - checkout.session.completed → upgrade org plan
   * - customer.subscription.updated → sync plan status
   * - customer.subscription.deleted → downgrade to community
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    const container = getContainer()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const organizationId = session.metadata?.organizationId
        const plan = session.metadata?.plan

        if (organizationId && plan) {
          await container.organizationRepo.update(organizationId, {
            plan,
            planStartedAt: new Date(),
          })
          container.logger.info({ organizationId, plan }, 'Organization upgraded via Stripe checkout')
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const organizationId = subscription.metadata?.organizationId

        if (organizationId && subscription.status === 'active') {
          // Subscription renewed or changed — keep plan in sync
          container.logger.info({ organizationId }, 'Stripe subscription updated')
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const organizationId = subscription.metadata?.organizationId

        if (organizationId) {
          await container.organizationRepo.update(organizationId, {
            plan: 'community',
          })
          container.logger.info({ organizationId }, 'Organization downgraded — subscription canceled')
        }
        break
      }

      default:
        // Unhandled event type — log but don't error
        container.logger.debug({ type: event.type }, 'Unhandled Stripe webhook event')
    }
  }

  /**
   * Gets or creates a Stripe customer for the organization.
   *
   * TODO: Once stripeCustomerId is added to the Organization model,
   * this should read/write that field instead of searching by metadata.
   */
  private async getOrCreateCustomer(organizationId: string): Promise<string> {
    const stripe = getStripe()
    const container = getContainer()
    const org = await container.organizationRepo.findById(organizationId)

    if (!org) {
      throw new Error(`Organization not found: ${organizationId}`)
    }

    // Search for existing customer by org ID in metadata
    const existing = await stripe.customers.search({
      query: `metadata["organizationId"]:"${organizationId}"`,
    })

    if (existing.data.length > 0) {
      return existing.data[0].id
    }

    // Create new customer
    const customer = await stripe.customers.create({
      name: org.name,
      metadata: { organizationId },
    })

    return customer.id
  }
}

// Singleton accessor
let stripeService: StripeService | null = null

export function getStripeService(): StripeService {
  if (!stripeService) {
    stripeService = new StripeService()
  }
  return stripeService
}
