/**
 * Cloud billing router.
 *
 * Handles Stripe checkout, portal sessions, and plan management.
 * This router only exists in the cloud deployment — self-hosted
 * users never see these endpoints.
 */

import { z } from 'zod'
import { router } from '@saastral/infrastructure'
import { TRPCError } from '@trpc/server'
import { planAwareProcedure, requirePlan } from '../middleware/plan-enforcement'
import { getStripeService } from '../services/stripe.service'
import { validateOrganizationAccess } from '../utils/validate-access'

const teamProcedure = planAwareProcedure.use(requirePlan('team'))

export const billingRouter = router({
  /**
   * Create a Stripe Checkout session to upgrade or start a subscription.
   * Available to any authenticated org member (billing page shows the button).
   */
  createCheckoutSession: planAwareProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        plan: z.enum(['team', 'enterprise']),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const stripe = getStripeService()
      const session = await stripe.createCheckoutSession({
        organizationId: input.organizationId,
        plan: input.plan,
        userId: ctx.userId,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
      })

      return { checkoutUrl: session.url }
    }),

  /**
   * Create a Stripe Customer Portal session for managing billing.
   * Requires at least team plan (community users have nothing to manage).
   */
  createPortalSession: teamProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const stripe = getStripeService()
      const session = await stripe.createPortalSession({
        organizationId: input.organizationId,
        returnUrl: input.returnUrl,
      })

      return { portalUrl: session.url }
    }),

  /**
   * Get the current billing status for an organization.
   */
  getStatus: planAwareProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const stripe = getStripeService()
      return stripe.getBillingStatus(input.organizationId)
    }),

  /**
   * Get available plans and pricing.
   * Public within the app (no plan restriction) so upgrade prompts can show pricing.
   */
  getPlans: planAwareProcedure.query(async () => {
    return {
      plans: [
        {
          id: 'community',
          name: 'Community',
          price: 0,
          interval: null,
          limits: { members: 3, integrations: 1 },
          features: [
            'Up to 3 team members',
            '1 SSO integration',
            'Basic SaaS tracking',
            'Community support',
          ],
        },
        {
          id: 'team',
          name: 'Team',
          price: 4900, // $49.00 in cents
          interval: 'month' as const,
          limits: { members: 20, integrations: 5 },
          features: [
            'Up to 20 team members',
            '5 SSO integrations',
            'Advanced analytics & reports',
            'Cost optimization alerts',
            'Priority support',
          ],
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: null, // Contact sales
          interval: null,
          limits: { members: Infinity, integrations: Infinity },
          features: [
            'Unlimited team members',
            'Unlimited integrations',
            'Custom reporting',
            'Dedicated support',
            'SSO for your team',
            'SLA guarantee',
          ],
        },
      ],
    }
  }),
})
