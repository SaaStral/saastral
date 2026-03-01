/**
 * Stripe webhook handler for Next.js App Router.
 *
 * This file is meant to be imported by the cloud-specific API route:
 *   apps/web/src/app/api/webhooks/stripe/route.ts
 *
 * It handles signature verification and delegates to StripeService.
 *
 * Self-hosted deployments don't have this route at all — it only
 * exists when @saastral/cloud is installed.
 */

import Stripe from 'stripe'
import { getStripeConfig } from '../env'
import { getStripeService } from '../services/stripe.service'

export async function handleStripeWebhook(request: Request): Promise<Response> {
  const config = getStripeConfig()
  const stripe = new Stripe(config.secretKey, { apiVersion: '2025-01-27.acacia' })

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, config.webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(`Webhook signature verification failed: ${message}`, { status: 400 })
  }

  try {
    const stripeService = getStripeService()
    await stripeService.handleWebhookEvent(event)
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Stripe webhook processing error:', message)
    // Return 200 to prevent Stripe from retrying — log the error instead
    return new Response(JSON.stringify({ received: true, error: message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
