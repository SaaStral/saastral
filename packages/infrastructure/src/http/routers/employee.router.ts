import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { getContainer } from '../../container'

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
  getKPIs: publicProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ input }) => {
      const container = getContainer()
      const employeeService = container.employeeService

      return await employeeService.getKPIs({
        organizationId: input.organizationId,
      })
    }),

  /**
   * List employees with pagination and search
   */
  list: publicProcedure
    .input(listEmployeesSchema)
    .query(async ({ input }) => {
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
  getOffboardingAlerts: publicProcedure
    .input(z.object({ organizationId: z.string().uuid(), limit: z.number().int().positive().optional() }))
    .query(async ({ input }) => {
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
  getDepartmentBreakdown: publicProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ input }) => {
      const container = getContainer()
      const employeeService = container.employeeService

      return await employeeService.getDepartmentBreakdown({
        organizationId: input.organizationId,
      })
    }),
})
