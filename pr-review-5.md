# PR #5 Review: feat(employees): complete employees page with actions, export, and dynamic departments

**Reviewer:** Claude (AI)
**Branch:** `feat/employees-page-completion` -> `main`
**Files changed:** 10 | **+364 / -101**

---

## Summary

This PR removes `mockData` dependencies from the employees page and wires up interactive elements: employee action mutations (offboard/suspend/reactivate), CSV export, a new `DropdownMenu` component, and dynamic department badge colors. The approach is solid overall and the frontend work is clean. There are a few issues that should be addressed before merge.

---

## Must Fix (Blocking)

### 1. Missing tests for new tRPC mutation endpoints

**File:** `packages/infrastructure/src/http/routers/employee.router.ts`

The existing router has comprehensive integration tests covering all four query endpoints (getKPIs, list, getOffboardingAlerts, getDepartmentBreakdown) with auth, authorization, and validation tests. The three new mutations (`offboard`, `suspend`, `reactivate`) have **zero test coverage**.

Per the project's testing guide (`docs/testing/guide.md`):

> | Change Type | Required Tests |
> | New tRPC endpoint | Integration test in `packages/infrastructure/src/http/routers/` |

**Required:** Add integration tests to `employee.router.test.ts` covering at minimum:
- UNAUTHORIZED when not authenticated
- FORBIDDEN when accessing another org's employee
- Successful offboard/suspend/reactivate
- Error case when employee not found
- Input validation (non-UUID ids)

### 2. Service errors surface as INTERNAL_SERVER_ERROR

**File:** `packages/infrastructure/src/http/routers/employee.router.ts` (lines 92-141)

The mutation handlers don't catch or map domain errors. The `EmployeeService` throws raw `Error` instances (e.g., `throw new Error('Employee not found')`), which tRPC will surface as `INTERNAL_SERVER_ERROR` to the client. Other routers in the codebase (subscription, integration) explicitly map errors to `TRPCError` with appropriate codes.

**Suggested fix:** Wrap service calls in try/catch and map to appropriate TRPCErrors:

```typescript
offboard: protectedProcedure
  .input(z.object({ id: z.string().uuid(), organizationId: z.string().uuid() }))
  .mutation(async ({ input, ctx }) => {
    await validateOrganizationAccess(ctx.userId, input.organizationId)
    const container = getContainer()
    try {
      const employee = await container.employeeService.offboardEmployee(input.id, input.organizationId)
      return employee.toJSON()
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
      }
      throw error
    }
  }),
```

Alternatively, the service could throw typed domain errors (e.g., `EmployeeNotFoundError`) that can be matched more precisely.

### 3. Unused `organizationId` prop in OffboardingAlertsCard

**File:** `apps/web/src/components/employees/OffboardingAlertsCard.tsx`

The interface declares `organizationId: string` and the parent passes it in, but the component destructures only `{ alerts }` -- `organizationId` is silently ignored:

```typescript
interface OffboardingAlertsCardProps {
  alerts: OffboardingAlert[]
  organizationId: string  // declared...
}

export function OffboardingAlertsCard({ alerts }: OffboardingAlertsCardProps) {
  // ...organizationId never used
```

Either remove the prop from the interface and the parent call, or destructure and use it. Since the "Revoke Access" button is disabled pending a future endpoint, it seems like a premature prop. Clean it up now to avoid confusion.

---

## Should Fix (Non-blocking)

### 4. DropdownMenu lacks keyboard accessibility and ARIA attributes

**File:** `apps/web/src/components/ui/DropdownMenu.tsx`

The custom dropdown has no:
- `role="menu"` / `role="menuitem"` attributes
- `aria-expanded` / `aria-haspopup` on the trigger
- Keyboard navigation (Escape to close, Arrow keys to navigate items)
- Focus management (focus trap, return focus on close)

This is a shared UI component that will likely be reused. Consider either:
- Adding basic ARIA attributes and Escape-key handling now
- Using an existing accessible dropdown library (Radix UI, Headless UI) -- the project already uses shadcn/ui components which are Radix-based

### 5. CSV export doesn't escape values containing commas or quotes

**File:** `apps/web/src/components/employees/EmployeesTable.tsx` (handleExport function)

The export wraps values in double quotes but doesn't escape embedded double quotes. If an employee name or department contains `"`, the CSV will be malformed:

```typescript
const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n')
```

**Fix:** Escape double quotes per RFC 4180:
```typescript
const csv = [headers, ...rows]
  .map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(','))
  .join('\n')
```

### 6. No user feedback on mutation success/failure

**File:** `apps/web/src/components/employees/EmployeesTable.tsx`

The mutations invalidate queries on success but provide no visual feedback:
- No toast/notification on success ("Employee offboarded successfully")
- No error handling on failure (no `onError` callback)

Users clicking "Offboard" after confirming will see no feedback until the query refetches. Consider adding `onError` handlers and success toasts.

### 7. Input schemas for mutations should be extracted

**File:** `packages/infrastructure/src/http/routers/employee.router.ts`

The existing query endpoints use an extracted `listEmployeesSchema`. The new mutations define inline schemas:

```typescript
.input(z.object({ id: z.string().uuid(), organizationId: z.string().uuid() }))
```

This same schema is repeated 3 times. Extract it for consistency:

```typescript
const employeeActionSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
})
```

---

## Nitpicks (Optional)

### 8. `formatCurrency` is hardcoded to BRL

**File:** `apps/web/src/lib/format.ts`

This is consistent with the rest of the codebase (the old `mockData.formatCurrency` was also BRL-only), so it's not a regression. But since it's now a shared utility, it might be worth noting for future multi-currency support.

### 9. `mockData` is not fully removed

The PR description says it "removes all mockData dependencies from the employees page," which is accurate for the employees page specifically. However, `@/lib/mockData` is still imported by 6+ other components (dashboard, reports, alerts). Not a problem for this PR, but worth tracking.

### 10. Seed data change is test-only concern

**File:** `packages/database/prisma/seed.ts`

The seed change assigns 5 subscriptions to the first offboarded employee (using hardcoded indices `[1, 2, 4, 3, 6]`). Minor: consider adding a comment explaining *why* these specific subscriptions, and note `subIdx 6` will fail if fewer than 7 subscriptions exist.

---

## What's Good

- Clean extraction of `formatCurrency` into a shared utility
- Proper `validateOrganizationAccess` on all new endpoints
- Smart hash-based department color palette instead of hardcoded map
- Good i18n coverage -- both en-US and pt-BR have all new keys
- "Revoke Access" correctly disabled with TODO comment explaining why
- Expand/collapse for license lists is a nice UX touch
- The `window.confirm` for destructive offboard action is appropriate

---

## Verdict

**Request changes.** Items 1-3 should be addressed before merge. The missing mutation tests are the biggest gap -- the rest of the router has solid test coverage, and these new write operations are higher-risk than reads.
