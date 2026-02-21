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
import { Skeleton } from '@/components/ui/skeleton'
import { useOrganization } from '@/contexts/OrganizationContext'
import { trpc } from '@/lib/trpc/client'
import {
  formatCurrency,
  toSubscriptionDisplay,
  toRenewalDisplay,
  toCategorySpendingDisplay,
  type SubscriptionDisplay,
} from '@/lib/subscription-helpers'

type ViewMode = 'grid' | 'table'
type CategoryFilter = 'all' | 'productivity' | 'development' | 'design' | 'infrastructure' | 'sales_marketing' | 'communication' | 'finance' | 'hr' | 'security' | 'analytics' | 'support' | 'other'
type StatusFilter = 'all' | 'active' | 'trial' | 'suspended' | 'cancelled' | 'expired'

export default function SubscriptionsPage() {
  const { selectedOrgId } = useOrganization()
  const t = useTranslations('subscriptions')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [selectedSubscription, setSelectedSubscription] =
    useState<SubscriptionDisplay | undefined>(undefined)

  // Fetch KPIs
  const { data: kpis, isLoading: kpisLoading } = trpc.subscription.getKPIs.useQuery(
    { organizationId: selectedOrgId || '' },
    { enabled: !!selectedOrgId }
  )

  // Fetch subscriptions list
  const { data: listData, isLoading: listLoading } = trpc.subscription.list.useQuery(
    {
      organizationId: selectedOrgId || '',
      search: searchQuery || undefined,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
    },
    { enabled: !!selectedOrgId }
  )

  // Fetch upcoming renewals
  const { data: renewalsData = [] } = trpc.subscription.getUpcomingRenewals.useQuery(
    { organizationId: selectedOrgId || '' },
    { enabled: !!selectedOrgId }
  )

  // Fetch category breakdown
  const { data: categoryData = [] } = trpc.subscription.getCategoryBreakdown.useQuery(
    { organizationId: selectedOrgId || '' },
    { enabled: !!selectedOrgId }
  )

  // Create mutation
  const utils = trpc.useUtils()
  const createMutation = trpc.subscription.create.useMutation({
    onSuccess: () => {
      utils.subscription.list.invalidate()
      utils.subscription.getKPIs.invalidate()
      utils.subscription.getCategoryBreakdown.invalidate()
      utils.subscription.getUpcomingRenewals.invalidate()
      handleCloseDrawer()
    },
  })

  // Map backend data to display types
  const subscriptions = (listData?.subscriptions ?? []).map(toSubscriptionDisplay)
  const renewals = renewalsData.map(toRenewalDisplay)
  const categories = categoryData.map(toCategorySpendingDisplay)

  const handleOpenDrawer = (mode: DrawerMode, subscription?: SubscriptionDisplay) => {
    setDrawerMode(mode)
    setSelectedSubscription(subscription)
  }

  const handleCloseDrawer = () => {
    setDrawerMode(null)
    setSelectedSubscription(undefined)
  }

  const handleSave = (data: any) => {
    if (!selectedOrgId) return
    createMutation.mutate({
      ...data,
      organizationId: selectedOrgId,
    })
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
            title={t('kpis.totalMonthlySpend')}
            value={formatCurrency(kpis.totalMonthlyCost)}
            subtitle={`${kpis.totalSubscriptions} ${t('kpis.activeSubscriptions')}`}
            trend={{
              value: 0,
              isPositive: false,
              label: t('kpis.vsLastMonth'),
            }}
            icon={CreditCard}
          />
          <KPICard
            title={t('kpis.potentialSavings')}
            value={formatCurrency(kpis.potentialSavings)}
            subtitle={`${kpis.unusedSeats} ${t('kpis.opportunities')}`}
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
            value={kpis.upcomingRenewals.toString()}
            subtitle={t('kpis.inNext30Days')}
            icon={Calendar}
            warning
          >
            <div className="text-sm text-[#6ee7b7] mt-2">
              {renewals.length > 0
                ? `${renewals.length} ${t('kpis.inRenewals')}`
                : t('kpis.inRenewals')}
            </div>
          </KPICard>
          <KPICard
            title={t('kpis.averageAdoptionRate')}
            value={`${Math.round(kpis.overallUtilization)}%`}
            subtitle={t('kpis.averageUsageRate')}
            icon={TrendingUp}
          />
        </div>
      ) : null}

      {/* Two Column Grid - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
        <SpendingByCategoryCard categories={categories} />
        <RenewalsCard renewals={renewals} />
      </div>

      {/* Subscriptions Section Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-sora text-base font-semibold text-[#f0fdf4]">
            {t('subscriptionList.count', { count: subscriptions.length })}
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
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
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
            <option value="sales_marketing">{t('categories.sales')}</option>
            <option value="infrastructure">{t('categories.infrastructure')}</option>
            <option value="communication">{t('categories.communication')}</option>
          </select>

          <select
            className="px-4 py-2.5 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl text-[#f0fdf4] text-sm focus:outline-none focus:border-[#059669] appearance-none cursor-pointer transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236ee7b7' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '36px',
            }}
          >
            <option value="all">{t('subscriptionList.allStatuses')}</option>
            <option value="active">{t('subscriptionList.activeStatus')}</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
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
      {listLoading ? (
        <SubscriptionsListSkeleton viewMode={viewMode} />
      ) : viewMode === 'grid' ? (
        <SubscriptionsGrid
          subscriptions={subscriptions}
          onSubscriptionClick={(sub) => handleOpenDrawer('view', sub)}
        />
      ) : (
        <SubscriptionsTable
          subscriptions={subscriptions}
          onSubscriptionClick={(sub) => handleOpenDrawer('view', sub)}
        />
      )}

      {/* Drawer */}
      <SubscriptionDrawer
        mode={drawerMode}
        subscription={selectedSubscription}
        onClose={handleCloseDrawer}
        onSave={handleSave}
        isSaving={createMutation.isPending}
      />
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

function SubscriptionsListSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-12 w-12 rounded-xl bg-[#064e3b]" />
              <div>
                <Skeleton className="h-4 w-24 mb-2 bg-[#064e3b]" />
                <Skeleton className="h-3 w-16 bg-[#064e3b]" />
              </div>
            </div>
            <Skeleton className="h-6 w-28 mb-4 bg-[#064e3b]" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-10 bg-[#064e3b]" />
              <Skeleton className="h-10 bg-[#064e3b]" />
              <Skeleton className="h-10 bg-[#064e3b]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-[rgba(16,185,129,0.15)] last:border-b-0">
          <Skeleton className="h-9 w-9 rounded-lg bg-[#064e3b]" />
          <Skeleton className="h-4 w-24 bg-[#064e3b]" />
          <Skeleton className="h-4 w-16 bg-[#064e3b]" />
          <Skeleton className="h-4 w-20 bg-[#064e3b]" />
          <Skeleton className="h-4 w-12 bg-[#064e3b]" />
          <Skeleton className="h-4 w-16 bg-[#064e3b]" />
        </div>
      ))}
    </div>
  )
}
