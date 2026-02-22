import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { getContainer } from '../../container'
import { TRPCError } from '@trpc/server'
import { SubscriptionNotFoundError } from '@saastral/core'
import { validateOrganizationAccess } from '../middleware/validate-org-access'

// ============================================================================
// Input Schemas
// ============================================================================

const subscriptionCategorySchema = z.enum([
  'productivity',
  'development',
  'design',
  'infrastructure',
  'sales_marketing',
  'communication',
  'finance',
  'hr',
  'security',
  'analytics',
  'support',
  'other',
])

const subscriptionStatusSchema = z.enum(['active', 'trial', 'suspended', 'cancelled', 'expired'])

const billingCycleSchema = z.enum([
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
  'biennial',
  'usage_based',
  'one_time',
])

const pricingModelSchema = z.enum([
  'per_seat',
  'per_active_user',
  'flat_rate',
  'tiered',
  'usage_based',
  'freemium',
  'hybrid',
])

const licenseTypeSchema = z.enum(['named', 'concurrent', 'floating', 'unlimited'])

const paymentMethodSchema = z.enum([
  'credit_card',
  'debit_card',
  'invoice',
  'bank_transfer',
  'pix',
  'paypal',
  'wire_transfer',
  'marketplace',
  'other',
])

const contractTypeSchema = z.enum(['saas', 'enterprise', 'free', 'trial'])

const listSubscriptionsSchema = z.object({
  organizationId: z.string().uuid(),
  search: z.string().optional(),
  category: subscriptionCategorySchema.or(z.literal('all')).optional().default('all'),
  status: subscriptionStatusSchema.or(z.literal('all')).optional().default('all'),
  departmentId: z.string().uuid().optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['name', 'totalMonthlyCost', 'renewalDate', 'usagePercentage']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
})

const createSubscriptionSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  vendor: z.string().max(255).optional(),
  category: subscriptionCategorySchema,
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  status: subscriptionStatusSchema.optional(),
  contractType: contractTypeSchema.optional(),
  billingCycle: billingCycleSchema,
  pricingModel: pricingModelSchema,
  currency: z.string().length(3).optional().default('BRL'),
  pricePerUnit: z.coerce.bigint().optional(),
  totalMonthlyCost: z.coerce.bigint(),
  annualValue: z.coerce.bigint().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  totalSeats: z.number().int().positive().optional(),
  seatsUnlimited: z.boolean().optional(),
  licenseType: licenseTypeSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  billingEmail: z.string().email().optional().or(z.literal('')),
  autoRenew: z.boolean().optional(),
  costCenter: z.string().optional(),
  budgetCode: z.string().optional(),
  startDate: z.coerce.date(),
  renewalDate: z.coerce.date(),
  cancellationDeadline: z.coerce.date().optional(),
  trialEndDate: z.coerce.date().optional(),
  reminderDays: z.array(z.number().int().positive()).optional(),
  ownerId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  approverId: z.string().uuid().optional(),
  notes: z.string().optional(),
  integrationId: z.string().uuid().optional(),
  ssoAppId: z.string().optional(),
})

const updateSubscriptionSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  vendor: z.string().max(255).optional(),
  category: subscriptionCategorySchema.optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  // status is intentionally excluded — use dedicated cancel/suspend/reactivate endpoints
  contractType: contractTypeSchema.optional(),
  billingCycle: billingCycleSchema.optional(),
  pricingModel: pricingModelSchema.optional(),
  pricePerUnit: z.coerce.bigint().optional(),
  totalMonthlyCost: z.coerce.bigint().optional(),
  annualValue: z.coerce.bigint().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  totalSeats: z.number().int().positive().optional(),
  seatsUnlimited: z.boolean().optional(),
  licenseType: licenseTypeSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  billingEmail: z.string().email().optional().or(z.literal('')),
  autoRenew: z.boolean().optional(),
  costCenter: z.string().optional(),
  budgetCode: z.string().optional(),
  renewalDate: z.coerce.date().optional(),
  cancellationDeadline: z.coerce.date().optional(),
  reminderDays: z.array(z.number().int().positive()).optional(),
  ownerId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  approverId: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
})

// ============================================================================
// Subscription Router
// ============================================================================

export const subscriptionRouter = router({
  /**
   * Get KPI statistics for subscription dashboard
   */
  getKPIs: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      return container.subscriptionService.getKPIs(input.organizationId)
    }),

  /**
   * List subscriptions with pagination, filters, and sorting
   */
  list: protectedProcedure.input(listSubscriptionsSchema).query(async ({ input, ctx }) => {
    await validateOrganizationAccess(ctx.userId, input.organizationId)

    const container = getContainer()
    return container.subscriptionService.list(input)
  }),

  /**
   * Get a single subscription by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid(), organizationId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      try {
        const container = getContainer()
        const subscription = await container.subscriptionService.getById(
          input.id,
          input.organizationId
        )
        return subscription.toJSON()
      } catch (error) {
        if (error instanceof SubscriptionNotFoundError) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          })
        }
        throw error
      }
    }),

  /**
   * Get upcoming renewal alerts
   */
  getUpcomingRenewals: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        withinDays: z.number().int().positive().optional().default(30),
        limit: z.number().int().positive().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      return container.subscriptionService.getUpcomingRenewals(
        input.organizationId,
        input.withinDays,
        input.limit
      )
    }),

  /**
   * Get spending breakdown by category
   */
  getCategoryBreakdown: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      return container.subscriptionService.getCategoryBreakdown(input.organizationId)
    }),

  /**
   * Create a new subscription
   */
  create: protectedProcedure.input(createSubscriptionSchema).mutation(async ({ input, ctx }) => {
    await validateOrganizationAccess(ctx.userId, input.organizationId)

    const container = getContainer()

    // Clean up optional URL fields that might be empty strings
    const cleanedInput = {
      ...input,
      website: input.website || undefined,
      logoUrl: input.logoUrl || undefined,
      billingEmail: input.billingEmail || undefined,
      createdBy: ctx.userId,
    }

    const subscription = await container.subscriptionService.create(cleanedInput)
    return subscription.toJSON()
  }),

  /**
   * Update an existing subscription
   */
  update: protectedProcedure.input(updateSubscriptionSchema).mutation(async ({ input, ctx }) => {
    await validateOrganizationAccess(ctx.userId, input.organizationId)

    const { id, organizationId, ...updateData } = input

    // Clean up optional URL fields that might be empty strings
    const cleanedInput = {
      ...updateData,
      website: updateData.website || undefined,
      logoUrl: updateData.logoUrl || undefined,
      billingEmail: updateData.billingEmail || undefined,
      updatedBy: ctx.userId,
    }

    const container = getContainer()
    const subscription = await container.subscriptionService.update(
      id,
      organizationId,
      cleanedInput
    )
    return subscription.toJSON()
  }),

  /**
   * Cancel a subscription
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid(), organizationId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      const subscription = await container.subscriptionService.cancel(
        input.id,
        input.organizationId
      )
      return subscription.toJSON()
    }),

  /**
   * Suspend a subscription
   */
  suspend: protectedProcedure
    .input(z.object({ id: z.string().uuid(), organizationId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      const subscription = await container.subscriptionService.suspend(
        input.id,
        input.organizationId
      )
      return subscription.toJSON()
    }),

  /**
   * Reactivate a subscription
   */
  reactivate: protectedProcedure
    .input(z.object({ id: z.string().uuid(), organizationId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      const subscription = await container.subscriptionService.reactivate(
        input.id,
        input.organizationId
      )
      return subscription.toJSON()
    }),

  /**
   * Delete a subscription (soft delete)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid(), organizationId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      await container.subscriptionService.delete(input.id, input.organizationId)
      return { success: true }
    }),
})
