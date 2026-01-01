'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Calendar } from 'lucide-react'
import { formatCurrency, type RenewalItem } from '@/lib/mockData'

interface RenewalsCardProps {
  renewals: RenewalItem[]
}

type ViewType = 'list' | 'calendar'

export function RenewalsCard({ renewals }: RenewalsCardProps) {
  const t = useTranslations('subscriptions')
  const [view, setView] = useState<ViewType>('list')

  const next7Days = renewals.filter((r) => r.daysUntilRenewal <= 7)
  const next30Days = renewals.filter(
    (r) => r.daysUntilRenewal > 7 && r.daysUntilRenewal <= 30
  )
  const totalRenewals = 34 // Mock total for "more renewals" message

  return (
    <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(16,185,129,0.15)]">
        <h2 className="font-sora text-base font-semibold text-[#f0fdf4]">
          {t('charts.upcomingRenewalsTitle')}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${
              view === 'list'
                ? 'bg-[#059669] text-white'
                : 'text-[#6ee7b7] hover:text-[#f0fdf4]'
            }`}
          >
            {t('charts.listView')}
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${
              view === 'calendar'
                ? 'bg-[#059669] text-white'
                : 'text-[#6ee7b7] hover:text-[#f0fdf4]'
            }`}
          >
            {t('charts.calendarView')}
          </button>
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="flex flex-col gap-4">
          {/* Next 7 days */}
          {next7Days.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#f59e0b]">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
                {t('charts.next7Days')}
              </div>
              {next7Days.map((renewal) => (
                <RenewalItem
                  key={renewal.id}
                  renewal={renewal}
                  t={t}
                />
              ))}
            </div>
          )}

          {/* Next 30 days */}
          {next30Days.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#10b981]">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
                {t('charts.next30Days')}
              </div>
              {next30Days.map((renewal) => (
                <RenewalItem
                  key={renewal.id}
                  renewal={renewal}
                  t={t}
                />
              ))}
            </div>
          )}

          {/* More renewals */}
          <div className="text-sm text-[#6ee7b7] px-4 py-2">
            <Calendar className="inline w-3.5 h-3.5 mr-1.5 align-middle" />
            {t('charts.moreRenewals', {
              count: totalRenewals - renewals.length,
              month: 'Jun 2025',
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function RenewalItem({
  renewal,
  t,
}: {
  renewal: RenewalItem
  t: ReturnType<typeof useTranslations>
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#022c22] border border-[rgba(16,185,129,0.15)] rounded-xl hover:border-[rgba(16,185,129,0.3)] hover:bg-[#044d3a] transition-all cursor-pointer">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
          style={{ backgroundColor: renewal.color }}
        >
          {renewal.icon}
        </div>
        <div>
          <h4 className="text-sm font-medium text-[#f0fdf4]">
            {renewal.name}
          </h4>
          <p className="text-xs text-[#6ee7b7]">
            {formatCurrency(renewal.monthlyCostCents)}/mês
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-[#a7f3d0]">
          {renewal.daysUntilRenewal <= 7
            ? t('charts.inDays', { count: renewal.daysUntilRenewal })
            : renewal.renewalDate}
        </div>
        <div className="text-xs text-[#10b981] cursor-pointer hover:underline">
          {t('charts.review')}
        </div>
      </div>
    </div>
  )
}
