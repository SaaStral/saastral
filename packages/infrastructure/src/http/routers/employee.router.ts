import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { getContainer } from '../../container'
import { validateOrganizationAccess } from '../middleware/validate-org-access'
import {
  EmployeeNotFoundError,
  EmployeeAlreadyOffboardedError,
  InvalidEmployeeStatusError,
} from '@saastral/core'

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

const employeeActionSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
})

// ============================================================================
// Helpers
// ============================================================================

function mapEmployeeError(error: unknown): never {
  if (error instanceof EmployeeNotFoundError) {
    throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
  }
  if (error instanceof EmployeeAlreadyOffboardedError || error instanceof InvalidEmployeeStatusError) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
  }
  if (error instanceof Error && error.message.includes('not found')) {
    throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
  }
  throw error
}

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
    .input(employeeActionSchema)
    .mutation(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      try {
        const employee = await container.employeeService.offboardEmployee(input.id, input.organizationId)
        return employee.toJSON()
      } catch (error) {
        mapEmployeeError(error)
      }
    }),

  /**
   * Suspend an employee
   */
  suspend: protectedProcedure
    .input(employeeActionSchema)
    .mutation(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      try {
        const employee = await container.employeeService.suspendEmployee(input.id, input.organizationId)
        return employee.toJSON()
      } catch (error) {
        mapEmployeeError(error)
      }
    }),

  /**
   * Reactivate an employee
   */
  reactivate: protectedProcedure
    .input(employeeActionSchema)
    .mutation(async ({ input, ctx }) => {
      await validateOrganizationAccess(ctx.userId, input.organizationId)

      const container = getContainer()
      try {
        const employee = await container.employeeService.reactivateEmployee(input.id, input.organizationId)
        return employee.toJSON()
      } catch (error) {
        mapEmployeeError(error)
      }
    }),
})
