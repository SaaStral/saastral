import { Suspense } from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getServerCaller, createQueryClient } from '@/lib/trpc/server'
import { Users, UserX, DollarSign, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KPICard } from '@/components/dashboard/KPICard'
import {
  OffboardingAlertsCard,
  DepartmentBreakdownCard,
  EmployeesTable,
} from '@/components/employees'
import { Skeleton } from '@/components/ui/skeleton'

// Force dynamic rendering - this page needs database access
export const dynamic = 'force-dynamic'

// TODO: Get this from auth context once implemented
// Using Acme Corporation from seeded data
const TEMP_ORGANIZATION_ID = 'ef5ce4d6-4834-499b-87fb-3c9215ff1639'

/**
 * Employees Page - Server Component with Hybrid Data Fetching
 *
 * Strategy:
 * 1. Prefetch critical data (KPIs, employee list) in parallel
 * 2. Use Suspense boundaries for secondary data (alerts, departments)
 * 3. Client components handle interactivity
 */
export default async function EmployeesPage() {
  // Create query client for prefetching
  const queryClient = createQueryClient()
  const caller = await getServerCaller()

  // Prefetch critical data in PARALLEL
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['employee', 'getKPIs', { organizationId: TEMP_ORGANIZATION_ID }],
      queryFn: () => caller.employee.getKPIs({ organizationId: TEMP_ORGANIZATION_ID }),
    }),
    queryClient.prefetchQuery({
      queryKey: ['employee', 'list', { organizationId: TEMP_ORGANIZATION_ID, page: 1, pageSize: 20, status: 'all' }],
      queryFn: () => caller.employee.list({ organizationId: TEMP_ORGANIZATION_ID, page: 1, pageSize: 20, status: 'all' }),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-7">
        {/* Section 1: KPIs - Already prefetched, renders immediately */}
        <Suspense fallback={<KPICardsSkeleton />}>
          <KPICardsServer organizationId={TEMP_ORGANIZATION_ID} />
        </Suspense>

        {/* Section 2: Two Column Row - Streaming */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Suspense fallback={<CardSkeleton />}>
            <OffboardingAlertsServer organizationId={TEMP_ORGANIZATION_ID} />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <DepartmentBreakdownServer organizationId={TEMP_ORGANIZATION_ID} />
          </Suspense>
        </div>

        {/* Section 3: Employees Table - Already prefetched */}
        <Suspense fallback={<TableSkeleton />}>
          <EmployeesTableServer organizationId={TEMP_ORGANIZATION_ID} />
        </Suspense>
      </div>
    </HydrationBoundary>
  )
}

/**
 * Server Component - KPI Cards
 * Uses prefetched data for instant render
 */
async function KPICardsServer({ organizationId }: { organizationId: string }) {
  const caller = await getServerCaller()
  const kpis = await caller.employee.getKPIs({ organizationId })

  return <KPICardsClient kpis={kpis} />
}

/**
 * Client Component - KPI Cards Display
 * Needs to be client component for useTranslations
 */
function KPICardsClient({ kpis }: { kpis: any }) {
  'use client'

  const t = useTranslations('employees')

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <KPICard
        title={t('kpis.totalEmployees')}
        value={kpis.totalEmployees.toString()}
        trend={{
          value: kpis.trend,
          isPositive: true,
        }}
        icon={Users}
        subtitle={t('kpis.thisMonth')}
      />
      <KPICard
        title={t('kpis.pendingOffboarding')}
        value={kpis.pendingOffboardings.toString()}
        subtitle={t('kpis.withActiveLicenses')}
        highlight
        icon={UserX}
      />
      <KPICard
        title={t('kpis.avgCostPerEmployee')}
        value={formatCurrency(kpis.averageCostPerEmployee)}
        trend={{
          value: Math.abs(kpis.costTrend),
          isPositive: false,
        }}
        icon={DollarSign}
        subtitle={t('kpis.perEmployeeMonth')}
      />
      <KPICard
        title={t('kpis.licenseUtilization')}
        value={`${kpis.licenseUtilization}%`}
        subtitle={t('kpis.assignedInUse')}
        icon={TrendingUp}
      />
    </div>
  )
}

/**
 * Server Component - Offboarding Alerts
 * Streams after initial page load
 */
async function OffboardingAlertsServer({ organizationId }: { organizationId: string}) {
  const caller = await getServerCaller()
  const alerts = await caller.employee.getOffboardingAlerts({ organizationId, limit: 10 })

  return <OffboardingAlertsCard alerts={alerts} />
}

/**
 * Server Component - Department Breakdown
 * Streams after initial page load
 */
async function DepartmentBreakdownServer({ organizationId }: { organizationId: string }) {
  const caller = await getServerCaller()
  const departments = await caller.employee.getDepartmentBreakdown({ organizationId })

  return <DepartmentBreakdownCard departments={departments} />
}

/**
 * Server Component - Employees Table Wrapper
 * Passes prefetched data to client component
 */
async function EmployeesTableServer({ organizationId }: { organizationId: string }) {
  const caller = await getServerCaller()
  const data = await caller.employee.list({
    organizationId,
    page: 1,
    pageSize: 20,
    status: 'all'
  })

  return <EmployeesTable initialData={data} organizationId={organizationId} />
}

// ============================================================================
// Loading Skeletons
// ============================================================================

function KPICardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl p-5">
          <Skeleton className="h-4 w-32 mb-3 bg-[#064e3b]" />
          <Skeleton className="h-8 w-20 bg-[#064e3b]" />
        </div>
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl p-6">
      <Skeleton className="h-6 w-48 mb-4 bg-[#064e3b]" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-[#064e3b]" />
        ))}
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl p-6">
      <Skeleton className="h-10 w-64 mb-4 bg-[#064e3b]" />
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full bg-[#064e3b]" />
        ))}
      </div>
    </div>
  )
}
