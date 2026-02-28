import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { getContainer } from '../../container'
import { validateOrganizationAccess } from '../middleware/validate-org-access'

// ============================================================================
// Input Schemas
// ============================================================================

const listEmployeesSchema = z.object({
  organizationId: z.string().uuid(),
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'offboarding', 'offboarded']).optional().default('all'),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
})

// ============================================================================
// Employee Router
// ============================================================================

export const employeeRouter = router({
  /**
   * Get KPI statistics for employee dashboard
   * Returns: total employees, trends, average cost, license utilization
   */
  getKPIs: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      const employeeService = container.employeeService

      return await employeeService.getKPIs({
        organizationId: input.organizationId,
      })
    }),

  /**
   * List employees with pagination and search
   */
  list: protectedProcedure
    .input(listEmployeesSchema)
    .query(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      const employeeService = container.employeeService

      return await employeeService.list({
        organizationId: input.organizationId,
        search: input.search,
        status: input.status,
        page: input.page,
        pageSize: input.pageSize,
      })
    }),

  /**
   * Get offboarding alerts (employees who left but still have active licenses)
   */
  getOffboardingAlerts: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid(), limit: z.number().int().positive().optional() }))
    .query(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      const employeeService = container.employeeService

      return await employeeService.getOffboardingAlerts({
        organizationId: input.organizationId,
        limit: input.limit,
      })
    }),

  /**
   * Get department breakdown (employee count and cost by department)
   */
  getDepartmentBreakdown: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      const employeeService = container.employeeService

      return await employeeService.getDepartmentBreakdown({
        organizationId: input.organizationId,
      })
    }),

  // ============================================================================
  // Mutations
  // ============================================================================

  /**
   * Offboard an employee
   */
  offboard: protectedProcedure
    .input(z.object({ id: z.string().uuid(), organizationId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      const employeeService = container.employeeService

      const employee = await employeeService.offboardEmployee(input.id, input.organizationId)
      return employee.toJSON()
    }),

  /**
   * Suspend an employee
   */
  suspend: protectedProcedure
    .input(z.object({ id: z.string().uuid(), organizationId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      const employeeService = container.employeeService

      const employee = await employeeService.suspendEmployee(input.id, input.organizationId)
      return employee.toJSON()
    }),

  /**
   * Reactivate an employee
   */
  reactivate: protectedProcedure
    .input(z.object({ id: z.string().uuid(), organizationId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      const employeeService = container.employeeService

      const employee = await employeeService.reactivateEmployee(input.id, input.organizationId)
      return employee.toJSON()
    }),
})
