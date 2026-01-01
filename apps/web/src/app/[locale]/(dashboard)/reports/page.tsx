'use client'

import { useState } from 'react'
import { Download, FileText, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { OverviewTab } from '@/components/reports/OverviewTab'
import { SpendingTab } from '@/components/reports/SpendingTab'
import { UsageTab } from '@/components/reports/UsageTab'
import { SavingsTab } from '@/components/reports/SavingsTab'
import { HistoryTab } from '@/components/reports/HistoryTab'

type TabType = 'overview' | 'spending' | 'usage' | 'savings' | 'history'

export default function ReportsPage() {
  const t = useTranslations('reports')
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [period, setPeriod] = useState('thisMonth')

  return (
    <div className="space-y-0">
      {/* Page Header */}
      <div className="flex flex-col gap-5 px-8 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-sora text-[1.75rem] font-bold text-[#f0fdf4]">
              {t('title')}
            </h1>
            <p className="text-[0.9375rem] text-[#6ee7b7]">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl">
              <span className="text-[0.8125rem] text-[#6ee7b7]">{t('period.label')}</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-[#022c22] border border-[rgba(16,185,129,0.15)] rounded-lg px-3 py-1.5 text-sm text-[#f0fdf4] focus:outline-none focus:border-[#059669] form-select"
              >
                <option value="thisMonth">{t('period.thisMonth')}</option>
                <option value="last6Months">{t('period.last6Months')}</option>
                <option value="last12Months">{t('period.last12Months')}</option>
                <option value="thisYear">{t('period.thisYear')}</option>
              </select>
              <span className="text-[0.8125rem] text-[#a7f3d0] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#10b981]" />
                01/12/2024 — 29/12/2024
              </span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#059669] to-[#0d9488] rounded-xl hover:shadow-[0_0_20px_rgba(5,150,105,0.3)] transition-all">
              <Download className="w-4 h-4" />
              {t('buttons.exportPDF')}
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-xl hover:bg-[rgba(5,150,105,0.08)] hover:border-[rgba(16,185,129,0.3)] transition-all">
              <FileText className="w-4 h-4" />
              {t('buttons.exportCSV')}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-8 py-4 bg-[#022c22] border-y border-[rgba(16,185,129,0.15)]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 rounded-xl text-[0.9375rem] font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-[#059669] to-[#0d9488] text-[#f0fdf4]'
              : 'text-[#6ee7b7] hover:text-[#f0fdf4] hover:bg-[rgba(5,150,105,0.08)]'
          }`}
        >
          {t('tabs.overview')}
        </button>
        <button
          onClick={() => setActiveTab('spending')}
          className={`px-6 py-3 rounded-xl text-[0.9375rem] font-medium transition-all ${
            activeTab === 'spending'
              ? 'bg-gradient-to-r from-[#059669] to-[#0d9488] text-[#f0fdf4]'
              : 'text-[#6ee7b7] hover:text-[#f0fdf4] hover:bg-[rgba(5,150,105,0.08)]'
          }`}
        >
          {t('tabs.spending')}
        </button>
        <button
          onClick={() => setActiveTab('usage')}
          className={`px-6 py-3 rounded-xl text-[0.9375rem] font-medium transition-all ${
            activeTab === 'usage'
              ? 'bg-gradient-to-r from-[#059669] to-[#0d9488] text-[#f0fdf4]'
              : 'text-[#6ee7b7] hover:text-[#f0fdf4] hover:bg-[rgba(5,150,105,0.08)]'
          }`}
        >
          {t('tabs.usage')}
        </button>
        <button
          onClick={() => setActiveTab('savings')}
          className={`px-6 py-3 rounded-xl text-[0.9375rem] font-medium transition-all ${
            activeTab === 'savings'
              ? 'bg-gradient-to-r from-[#059669] to-[#0d9488] text-[#f0fdf4]'
              : 'text-[#6ee7b7] hover:text-[#f0fdf4] hover:bg-[rgba(5,150,105,0.08)]'
          }`}
        >
          {t('tabs.savings')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 rounded-xl text-[0.9375rem] font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-[#059669] to-[#0d9488] text-[#f0fdf4]'
              : 'text-[#6ee7b7] hover:text-[#f0fdf4] hover:bg-[rgba(5,150,105,0.08)]'
          }`}
        >
          {t('tabs.history')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="px-8 py-7">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'spending' && <SpendingTab />}
        {activeTab === 'usage' && <UsageTab />}
        {activeTab === 'savings' && <SavingsTab />}
        {activeTab === 'history' && <HistoryTab />}
      </div>
    </div>
  )
}
