/**
 * Plan enforcement middleware for tRPC.
 *
 * Creates procedure chains that gate features by organization plan.
 * Used in cloud-only routers and can wrap existing community routers
 * to add plan checks.
 *
 * Design:
 * - Composes on top of `protectedProcedure` from @saastral/infrastructure
 * - Loads the org plan from the database once per request
 * - Makes plan info available in context for downstream procedures
 */

import { TRPCError } from '@trpc/server'
import { middleware, protectedProcedure } from '@saastral/infrastructure'
import { getContainer } from '@saastral/infrastructure'

type Plan = 'community' | 'team' | 'enterprise'

const PLAN_HIERARCHY: Record<Plan, number> = {
  community: 0,
  team: 1,
  enterprise: 2,
}

/**
 * tRPC middleware that loads the organization's plan into context.
 *
 * Expects `organizationId` in the raw input (which every org-scoped
 * endpoint already requires). Falls back gracefully if organizationId
 * is not present — some endpoints (like user profile) don't need it.
 */
const withOrgPlan = middleware(async ({ ctx, next, rawInput }) => {
  const input = rawInput as Record<string, unknown> | undefined
  const organizationId = input?.organizationId as string | undefined

  if (!organizationId || !ctx.userId) {
    return next({ ctx })
  }

  const container = getContainer()
  const org = await container.organizationRepo.findById(organizationId)
  const plan = (org?.plan ?? 'community') as Plan

  return next({
    ctx: {
      ...ctx,
      organizationPlan: plan,
      organizationId,
    },
  })
})

/**
 * Procedure that includes the org plan in context.
 * Use this as a base for cloud-specific endpoints.
 */
export const planAwareProcedure = protectedProcedure.use(withOrgPlan)

/**
 * Creates a middleware that enforces a minimum plan tier.
 *
 * Usage in a cloud router:
 *   const teamProcedure = planAwareProcedure.use(requirePlan('team'))
 */
export function requirePlan(minimumPlan: Plan) {
  return middleware(async ({ ctx, next }) => {
    const currentPlan = (ctx as Record<string, unknown>).organizationPlan as Plan | undefined

    if (!currentPlan) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Organization context required for this endpoint',
      })
    }

    if (PLAN_HIERARCHY[currentPlan] < PLAN_HIERARCHY[minimumPlan]) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `This feature requires the ${minimumPlan} plan or higher. Current plan: ${currentPlan}`,
      })
    }

    return next({ ctx })
  })
}

/**
 * Creates a middleware that enforces a resource limit based on plan.
 *
 * Usage:
 *   const limitedProcedure = planAwareProcedure.use(
 *     requireWithinLimit('members', async (orgId) => getMemberCount(orgId))
 *   )
 */
export function requireWithinLimit(
  resource: 'members' | 'integrations',
  getCurrentCount: (organizationId: string) => Promise<number>
) {
  const LIMITS: Record<Plan, Record<string, number>> = {
    community: { members: 3, integrations: 1 },
    team: { members: 20, integrations: 5 },
    enterprise: { members: Infinity, integrations: Infinity },
  }

  return middleware(async ({ ctx, next }) => {
    const context = ctx as Record<string, unknown>
    const plan = (context.organizationPlan as Plan) ?? 'community'
    const orgId = context.organizationId as string

    if (!orgId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Organization context required',
      })
    }

    const limit = LIMITS[plan]?.[resource] ?? 0
    const current = await getCurrentCount(orgId)

    if (current >= limit) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You have reached the ${resource} limit for the ${plan} plan (${limit}). Upgrade to add more.`,
      })
    }

    return next({ ctx })
  })
}
