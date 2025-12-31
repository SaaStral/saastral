'use client'

import { Users, UserX, DollarSign, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KPICard } from '@/components/dashboard/KPICard'
import {
  OffboardingAlertsCard,
  DepartmentBreakdownCard,
  EmployeesTable,
} from '@/components/employees'
import {
  mockEmployeeKPIs,
  mockOffboardingAlerts,
  mockDepartmentBreakdown,
  mockEmployees,
  formatCurrency,
} from '@/lib/mockData'

export default function EmployeesPage() {
  const t = useTranslations('employees')

  return (
    <div className="space-y-7">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title={t('kpis.totalEmployees')}
          value={mockEmployeeKPIs.totalEmployees.toString()}
          trend={{
            value: mockEmployeeKPIs.trend,
            isPositive: true,
          }}
          icon={Users}
          subtitle={t('kpis.thisMonth')}
        />
        <KPICard
          title={t('kpis.pendingOffboarding')}
          value={mockEmployeeKPIs.pendingOffboardings.toString()}
          subtitle={t('kpis.withActiveLicenses')}
          highlight
          icon={UserX}
        />
        <KPICard
          title={t('kpis.avgCostPerEmployee')}
          value={formatCurrency(mockEmployeeKPIs.averageCostPerEmployee)}
          trend={{
            value: Math.abs(mockEmployeeKPIs.costTrend),
            isPositive: false,
          }}
          icon={DollarSign}
          subtitle={t('kpis.perEmployeeMonth')}
        />
        <KPICard
          title={t('kpis.licenseUtilization')}
          value={`${mockEmployeeKPIs.licenseUtilization}%`}
          subtitle={t('kpis.assignedInUse')}
          icon={TrendingUp}
        />
      </div>

      {/* Two Column Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <OffboardingAlertsCard alerts={mockOffboardingAlerts} />
        <DepartmentBreakdownCard departments={mockDepartmentBreakdown} />
      </div>

      {/* Employees Table */}
      <EmployeesTable employees={mockEmployees} />
    </div>

    // {/* Empty State - Commented out for now */}
    // <div>
    //   <EmptyState
    //     icon={Users}
    //     title={t('manageTeam')}
    //     description={t('subtitle')}
    //     action={{
    //       label: t('form.create'),
    //       onClick: () => console.log('Add employee'),
    //     }}
    //   >
    //     <div className="mt-8 text-sm text-[#6ee7b7] max-w-md">
    //       <p>{t('getStarted')}</p>
    //     </div>
    //   </EmptyState>
    // </div>
  )
}
