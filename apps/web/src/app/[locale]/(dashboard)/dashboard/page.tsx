'use client'

import { DollarSign, TrendingDown, Users, Package } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KPICard } from '@/components/dashboard/KPICard'
import { SpendingChart } from '@/components/dashboard/SpendingChart'
import { AlertsPanel } from '@/components/dashboard/AlertsPanel'
import { SubscriptionsTable } from '@/components/dashboard/SubscriptionsTable'
import {
  mockKPIData,
  mockChartData,
  mockAlerts,
  mockSubscriptions,
  formatCurrency
} from '@/lib/mockData'

export default function DashboardPage() {
  const t = useTranslations('dashboard')

  // TODO: Replace with empty state when user has no data
  // const hasData = true

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title={t('stats.totalMonthlySpending')}
          value={formatCurrency(mockKPIData.totalMonthlyCost)}
          trend={{
            value: mockKPIData.costTrend,
            isPositive: false, // Spending increase is negative
          }}
          icon={DollarSign}
        />
        <KPICard
          title={t('stats.potentialSavings')}
          value={formatCurrency(mockKPIData.potentialSavings)}
          subtitle={`${mockKPIData.savingsOpportunities} ${t('stats.opportunities')}`}
          highlight
          icon={TrendingDown}
        />
        <KPICard
          title={t('stats.activeEmployees')}
          value={mockKPIData.activeEmployees.toString()}
          subtitle={`${mockKPIData.pendingOffboardings} ${t('stats.pendingOffboarding')}`}
          icon={Users}
        />
        <KPICard
          title={t('stats.trackedSubscriptions')}
          value={mockKPIData.trackedSubscriptions.toString()}
          subtitle={`${mockKPIData.ssoConnectedSubscriptions} ${t('stats.viaSSO')}`}
          icon={Package}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SpendingChart data={mockChartData} />
        </div>
        <div className="lg:col-span-1">
          <AlertsPanel alerts={mockAlerts} />
        </div>
      </div>

      {/* Subscriptions Table */}
      <SubscriptionsTable subscriptions={mockSubscriptions} />
    </div>
  )
}
