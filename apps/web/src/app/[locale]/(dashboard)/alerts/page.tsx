'use client'

import { useState } from 'react'
import { RefreshCw, Settings, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AlertCard } from '@/components/alerts/AlertCard'
import { mockAlerts, mockAlertKPIs, formatCurrency, type Alert } from '@/lib/mockData'

type TabType = 'all' | 'pending' | 'resolved' | 'dismissed'

export default function AlertsPage() {
  const t = useTranslations('alerts')
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set(['offboarding']))
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate counts for tabs
  const allCount = mockAlerts.length
  const pendingCount = mockAlerts.filter((a) => a.status === 'pending').length
  const resolvedCount = mockAlerts.filter((a) => a.status === 'resolved').length
  const dismissedCount = mockAlerts.filter((a) => a.status === 'dismissed').length

  // Filter alerts
  const filteredAlerts = mockAlerts.filter((alert) => {
    // Tab filter
    if (activeTab !== 'all' && alert.status !== activeTab) {
      return false
    }

    // Search filter
    if (searchQuery && !alert.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Quick filters
    if (activeQuickFilters.size > 0) {
      const filterMap: Record<string, string> = {
        offboarding: 'offboarding',
        renewals: 'renewal',
        unused: 'unused',
        lowAdoption: 'adoption',
        duplicates: 'duplicate',
      }

      const hasMatch = Array.from(activeQuickFilters).some(
        (filter) => filterMap[filter] === alert.type
      )

      if (!hasMatch) return false
    }

    return true
  })

  const toggleQuickFilter = (filter: string) => {
    const newFilters = new Set(activeQuickFilters)
    if (newFilters.has(filter)) {
      newFilters.delete(filter)
    } else {
      newFilters.add(filter)
    }
    setActiveQuickFilters(newFilters)
  }

  const handleAlertAction = (alert: Alert, action: string) => {
    console.log('Alert action:', action, alert)
    // Handle alert actions here
  }

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-sora text-[1.75rem] font-bold text-[#f0fdf4]">
              {t('title')}
            </h1>
            <p className="text-[0.9375rem] text-[#6ee7b7]">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-xl hover:bg-[rgba(5,150,105,0.08)] hover:border-[rgba(16,185,129,0.3)] transition-all">
              <RefreshCw className="w-4 h-4" />
              {t('buttons.refresh')}
            </button>
            <button className="w-10 h-10 flex items-center justify-center border border-[rgba(16,185,129,0.15)] rounded-xl text-[#6ee7b7] hover:bg-[rgba(5,150,105,0.08)] hover:border-[rgba(16,185,129,0.3)] transition-all">
              <Settings className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 px-5 py-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444]" />
            <span className="font-semibold text-[#f0fdf4]">{mockAlertKPIs.criticalCount}</span>
            <span className="text-[#6ee7b7]">{t('stats.critical')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
            <span className="font-semibold text-[#f0fdf4]">{mockAlertKPIs.highCount}</span>
            <span className="text-[#6ee7b7]">{t('stats.high')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            <span className="font-semibold text-[#f0fdf4]">{mockAlertKPIs.mediumCount}</span>
            <span className="text-[#6ee7b7]">{t('stats.medium')}</span>
          </div>
          <div className="w-px h-6 bg-[rgba(16,185,129,0.15)]" />
          <div className="flex items-center gap-2 text-sm text-[#10b981]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span className="font-semibold text-[#f0fdf4]">
              {formatCurrency(mockAlertKPIs.totalPotentialSavings)}
            </span>
            <span className="text-[#6ee7b7]">{t('stats.potentialSavings')}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Tab Filters */}
        <div className="flex gap-1 p-1 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-[#059669] text-[#f0fdf4]'
                : 'text-[#6ee7b7] hover:text-[#f0fdf4]'
            }`}
          >
            {t('filters.all')}
            <span className="ml-1.5 opacity-70">({allCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-[#059669] text-[#f0fdf4]'
                : 'text-[#6ee7b7] hover:text-[#f0fdf4]'
            }`}
          >
            {t('filters.pending')}
            <span className="ml-1.5 opacity-70">({pendingCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'resolved'
                ? 'bg-[#059669] text-[#f0fdf4]'
                : 'text-[#6ee7b7] hover:text-[#f0fdf4]'
            }`}
          >
            {t('filters.resolved')}
            <span className="ml-1.5 opacity-70">({resolvedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('dismissed')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'dismissed'
                ? 'bg-[#059669] text-[#f0fdf4]'
                : 'text-[#6ee7b7] hover:text-[#f0fdf4]'
            }`}
          >
            {t('filters.dismissed')}
            <span className="ml-1.5 opacity-70">({dismissedCount})</span>
          </button>
        </div>

        {/* Quick Filters and Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-[#6ee7b7]">{t('quickFilters.label')}</span>
          <button
            onClick={() => toggleQuickFilter('offboarding')}
            className={`px-3.5 py-2 text-sm rounded-full border transition-all ${
              activeQuickFilters.has('offboarding')
                ? 'bg-[rgba(5,150,105,0.15)] border-[#059669] text-[#10b981]'
                : 'bg-[#033a2d] border-[rgba(16,185,129,0.15)] text-[#a7f3d0] hover:border-[rgba(16,185,129,0.3)]'
            }`}
          >
            {t('quickFilters.offboarding')}
          </button>
          <button
            onClick={() => toggleQuickFilter('renewals')}
            className={`px-3.5 py-2 text-sm rounded-full border transition-all ${
              activeQuickFilters.has('renewals')
                ? 'bg-[rgba(5,150,105,0.15)] border-[#059669] text-[#10b981]'
                : 'bg-[#033a2d] border-[rgba(16,185,129,0.15)] text-[#a7f3d0] hover:border-[rgba(16,185,129,0.3)]'
            }`}
          >
            {t('quickFilters.renewals')}
          </button>
          <button
            onClick={() => toggleQuickFilter('unused')}
            className={`px-3.5 py-2 text-sm rounded-full border transition-all ${
              activeQuickFilters.has('unused')
                ? 'bg-[rgba(5,150,105,0.15)] border-[#059669] text-[#10b981]'
                : 'bg-[#033a2d] border-[rgba(16,185,129,0.15)] text-[#a7f3d0] hover:border-[rgba(16,185,129,0.3)]'
            }`}
          >
            {t('quickFilters.unused')}
          </button>
          <button
            onClick={() => toggleQuickFilter('lowAdoption')}
            className={`px-3.5 py-2 text-sm rounded-full border transition-all ${
              activeQuickFilters.has('lowAdoption')
                ? 'bg-[rgba(5,150,105,0.15)] border-[#059669] text-[#10b981]'
                : 'bg-[#033a2d] border-[rgba(16,185,129,0.15)] text-[#a7f3d0] hover:border-[rgba(16,185,129,0.3)]'
            }`}
          >
            {t('quickFilters.lowAdoption')}
          </button>
          <button
            onClick={() => toggleQuickFilter('duplicates')}
            className={`px-3.5 py-2 text-sm rounded-full border transition-all ${
              activeQuickFilters.has('duplicates')
                ? 'bg-[rgba(5,150,105,0.15)] border-[#059669] text-[#10b981]'
                : 'bg-[#033a2d] border-[rgba(16,185,129,0.15)] text-[#a7f3d0] hover:border-[rgba(16,185,129,0.3)]'
            }`}
          >
            {t('quickFilters.duplicates')}
          </button>

          <div className="flex-1" />

          {/* Search */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg min-w-[220px]">
            <Search className="w-4 h-4 text-[#6ee7b7]" />
            <input
              type="text"
              placeholder={t('list.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[#f0fdf4] text-sm placeholder:text-[#6ee7b7]"
            />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 text-[#6ee7b7]">
            {t('list.empty')}
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onAction={handleAlertAction} />
          ))
        )}
      </div>
    </div>
  )

  // return (
  //   <div>
  //     <EmptyState
  //       icon={Bell}
  //       title={t('alertCenter')}
  //       description={t('subtitle')}
  //     >
  //       <div className="mt-8 grid grid-cols-2 gap-3 max-w-xl text-sm">
  //         <div className="p-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg flex items-center gap-2">
  //           <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
  //           <span className="text-[#f0fdf4]">{t('types.offboarding')}</span>
  //         </div>
  //         <div className="p-3 bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.3)] rounded-lg flex items-center gap-2">
  //           <span className="w-2 h-2 rounded-full bg-[#f97316]" />
  //           <span className="text-[#f0fdf4]">{t('types.renewal')}</span>
  //         </div>
  //         <div className="p-3 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] rounded-lg flex items-center gap-2">
  //           <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
  //           <span className="text-[#f0fdf4]">{t('types.unusedLicense')}</span>
  //         </div>
  //         <div className="p-3 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] rounded-lg flex items-center gap-2">
  //           <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
  //           <span className="text-[#f0fdf4]">{t('types.lowAdoption')}</span>
  //         </div>
  //       </div>
  //       <div className="mt-6 text-sm text-[#6ee7b7]">
  //         {t('getStarted')}
  //       </div>
  //     </EmptyState>
  //   </div>
  // )
}
