'use client'

import { useState } from 'react'
import {
  CreditCard,
  Lightbulb,
  Calendar,
  TrendingUp,
  Grid3x3,
  List,
  Download,
  Plus,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { KPICard } from '@/components/dashboard/KPICard'
import {
  SpendingByCategoryCard,
  RenewalsCard,
  SubscriptionsGrid,
  SubscriptionsTable,
  SubscriptionDrawer,
  type DrawerMode,
} from '@/components/subscriptions'
import {
  mockSubscriptionKPIs,
  mockCategorySpending,
  mockRenewals,
  mockSubscriptions,
  formatCurrency,
  type Subscription,
} from '@/lib/mockData'

type ViewMode = 'grid' | 'table'

export default function SubscriptionsPage() {
  const t = useTranslations('subscriptions')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | undefined>(undefined)

  const filteredSubscriptions = mockSubscriptions.filter((sub) => {
    const matchesSearch =
      searchQuery === '' ||
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      categoryFilter === 'all' || sub.category === categoryFilter
    const matchesStatus =
      statusFilter === 'all' || sub.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleOpenDrawer = (mode: DrawerMode, subscription?: Subscription) => {
    setDrawerMode(mode)
    setSelectedSubscription(subscription)
  }

  const handleCloseDrawer = () => {
    setDrawerMode(null)
    setSelectedSubscription(undefined)
  }

  const handleSave = (data: any) => {
    console.log('Save subscription:', data)
    handleCloseDrawer()
  }

  return (
    <div className="space-y-7">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title={t('kpis.totalMonthlySpend')}
          value={formatCurrency(mockSubscriptionKPIs.totalMonthlyCost)}
          subtitle={`34 ${t('kpis.activeSubscriptions')}`}
          trend={{
            value: mockSubscriptionKPIs.costTrend,
            isPositive: false,
            label: t('kpis.vsLastMonth'),
          }}
          icon={CreditCard}
        />
        <KPICard
          title={t('kpis.potentialSavings')}
          value={formatCurrency(mockSubscriptionKPIs.potentialSavings)}
          subtitle={`${mockSubscriptionKPIs.savingsOpportunities} ${t('kpis.opportunities')}`}
          highlight
          icon={Lightbulb}
          trend={{
            value: 0,
            isPositive: true,
            label: t('kpis.viewAlerts'),
          }}
        />
        <KPICard
          title={t('kpis.upcomingRenewals')}
          value={mockSubscriptionKPIs.upcomingRenewals.toString()}
          subtitle={t('kpis.inNext30Days')}
          icon={Calendar}
          warning
        >
          <div className="text-sm text-[#6ee7b7] mt-2">
            {formatCurrency(mockSubscriptionKPIs.upcomingRenewalsCost)}{' '}
            {t('kpis.inRenewals')}
          </div>
        </KPICard>
        <KPICard
          title={t('kpis.averageAdoptionRate')}
          value={`${mockSubscriptionKPIs.averageAdoptionRate}%`}
          subtitle={t('kpis.averageUsageRate')}
          icon={TrendingUp}
        />
      </div>

      {/* Two Column Grid - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
        <SpendingByCategoryCard categories={mockCategorySpending} />
        <RenewalsCard renewals={mockRenewals} />
      </div>

      {/* Subscriptions Section Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-sora text-base font-semibold text-[#f0fdf4]">
            {t('subscriptionList.count', { count: filteredSubscriptions.length })}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <input
            type="text"
            className="flex-1 lg:w-64 px-4 py-2.5 pl-10 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl text-[#f0fdf4] text-sm placeholder:text-[#6ee7b7] focus:outline-none focus:border-[#059669] transition-all"
            placeholder={t('subscriptionList.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236ee7b7' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '12px center',
            }}
          />

          <select
            className="px-4 py-2.5 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl text-[#f0fdf4] text-sm focus:outline-none focus:border-[#059669] appearance-none cursor-pointer transition-all"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236ee7b7' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '36px',
            }}
          >
            <option value="all">{t('subscriptionList.allCategories')}</option>
            <option value="productivity">{t('categories.productivity')}</option>
            <option value="development">{t('categories.development')}</option>
            <option value="design">{t('categories.design')}</option>
            <option value="sales">{t('categories.sales')}</option>
          </select>

          <select
            className="px-4 py-2.5 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl text-[#f0fdf4] text-sm focus:outline-none focus:border-[#059669] appearance-none cursor-pointer transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236ee7b7' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '36px',
            }}
          >
            <option value="all">{t('subscriptionList.allStatuses')}</option>
            <option value="active">{t('subscriptionList.activeStatus')}</option>
            <option value="warning">{t('subscriptionList.lowUseStatus')}</option>
          </select>

          <div className="flex gap-2">
            <div className="flex bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#059669] text-white'
                    : 'text-[#6ee7b7] hover:text-[#f0fdf4]'
                }`}
                title={t('viewToggle.grid')}
              >
                <Grid3x3 className="w-[18px] h-[18px]" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2.5 transition-all ${
                  viewMode === 'table'
                    ? 'bg-[#059669] text-white'
                    : 'text-[#6ee7b7] hover:text-[#f0fdf4]'
                }`}
                title={t('viewToggle.table')}
              >
                <List className="w-[18px] h-[18px]" />
              </button>
            </div>

            <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-xl hover:bg-[rgba(5,150,105,0.08)] hover:border-[rgba(16,185,129,0.3)] transition-all">
              <Download className="w-3.5 h-3.5" />
              {t('subscriptionList.export')}
            </button>

            <button
              onClick={() => handleOpenDrawer('create')}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#059669] to-[#0d9488] rounded-xl hover:shadow-[0_0_20px_rgba(5,150,105,0.3)] hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              {t('form.create')}
            </button>
          </div>
        </div>
      </div>

      {/* Subscriptions List */}
      {viewMode === 'grid' ? (
        <SubscriptionsGrid
          subscriptions={filteredSubscriptions}
          onSubscriptionClick={(sub) => handleOpenDrawer('view', sub)}
        />
      ) : (
        <SubscriptionsTable
          subscriptions={filteredSubscriptions}
          onSubscriptionClick={(sub) => handleOpenDrawer('view', sub)}
        />
      )}

      {/* Empty State - Commented out for now */}
      {/* <div>
        <EmptyState
          icon={Package}
          title={t('manageSubscriptions')}
          description={t('subtitle')}
          action={{
            label: t('form.create'),
            onClick: () => console.log('Add subscription'),
          }}
        >
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg">
            <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-left">
              <div className="text-sm text-[#6ee7b7] mb-2">{t('categoriesLabel')}</div>
              <div className="text-xs text-[#4ade80]">
                {t('categories.communication')} • {t('categories.productivity')} • {t('categories.design')} • {t('categories.development')} • {t('categories.marketing')}
              </div>
            </div>
            <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-left">
              <div className="text-sm text-[#6ee7b7] mb-2">{t('autoTracking')}</div>
              <div className="text-xs text-[#4ade80]">
                {t('autoTrackingDesc')}
              </div>
            </div>
          </div>
        </EmptyState>
      </div> */}

      {/* Drawer */}
      <SubscriptionDrawer
        mode={drawerMode}
        subscription={selectedSubscription}
        onClose={handleCloseDrawer}
        onSave={handleSave}
      />
    </div>
  )
}
