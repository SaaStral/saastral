'use client'

import { FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { EmptyState } from '@/components/ui/EmptyState'

export default function ReportsPage() {
  const t = useTranslations('reports')
  const tCat = useTranslations('reports.categories')

  return (
    <div>
      <EmptyState
        icon={FileText}
        title={t('reportsAnalytics')}
        description={t('subtitle')}
      >
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-3xl text-sm">
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-[#10b981] font-semibold mb-2">📊 {tCat('spendByCategory')}</div>
            <div className="text-xs text-[#6ee7b7]">
              {tCat('spendByCategoryDesc')}
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-[#10b981] font-semibold mb-2">📈 {tCat('monthlyTrends')}</div>
            <div className="text-xs text-[#6ee7b7]">
              {tCat('monthlyTrendsDesc')}
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-[#10b981] font-semibold mb-2">💰 {tCat('potentialSavings')}</div>
            <div className="text-xs text-[#6ee7b7]">
              {tCat('potentialSavingsDesc')}
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-[#10b981] font-semibold mb-2">👥 {tCat('byDepartment')}</div>
            <div className="text-xs text-[#6ee7b7]">
              {tCat('byDepartmentDesc')}
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-[#10b981] font-semibold mb-2">📅 {tCat('futureRenewals')}</div>
            <div className="text-xs text-[#6ee7b7]">
              {tCat('futureRenewalsDesc')}
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-[#10b981] font-semibold mb-2">🎯 {tCat('utilizationRate')}</div>
            <div className="text-xs text-[#6ee7b7]">
              {tCat('utilizationRateDesc')}
            </div>
          </div>
        </div>
      </EmptyState>
    </div>
  )
}
