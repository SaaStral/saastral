'use client'

import { Users, UserX, DollarSign, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KPICard } from '@/components/dashboard/KPICard'
import {
  OffboardingAlertsCard,
  DepartmentBreakdownCard,
  EmployeesTable,
} from '@/components/employees'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrganization } from '@/contexts/OrganizationContext'
import { trpc } from '@/lib/trpc/client'

/**
 * Employees Page - Client Component
 * Fetches data based on selected organization from context
 */
export default function EmployeesPage() {
  const { selectedOrgId } = useOrganization()
  const t = useTranslations('employees')

  // Fetch KPIs
  const { data: kpis, isLoading: kpisLoading } = trpc.employee.getKPIs.useQuery(
    { organizationId: selectedOrgId || '' },
    { enabled: !!selectedOrgId }
  )

  // Fetch offboarding alerts
  const { data: alerts = [] } = trpc.employee.getOffboardingAlerts.useQuery(
    { organizationId: selectedOrgId || '', limit: 10 },
    { enabled: !!selectedOrgId }
  )

  // Fetch department breakdown
  const { data: departments = [] } = trpc.employee.getDepartmentBreakdown.useQuery(
    { organizationId: selectedOrgId || '' },
    { enabled: !!selectedOrgId }
  )

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  if (!selectedOrgId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#6ee7b7]">Please select an organization from the header</p>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      {/* KPI Cards */}
      {kpisLoading ? (
        <KPICardsSkeleton />
      ) : kpis ? (
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
      ) : null}

      {/* Two Column Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <OffboardingAlertsCard alerts={alerts} />
        <DepartmentBreakdownCard departments={departments} />
      </div>

      {/* Employees Table */}
      <EmployeesTable organizationId={selectedOrgId} />
    </div>
  )
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
