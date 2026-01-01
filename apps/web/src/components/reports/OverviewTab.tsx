import { useTranslations } from 'next-intl'
import { KPICard } from '@/components/dashboard/KPICard'
import {
  mockReportKPIData,
  mockTopSpenders,
  mockPeriodActions,
  mockHighlights,
  formatCurrency,
} from '@/lib/mockData'

export function OverviewTab() {
  const t = useTranslations('reports.overview')
  const tActions = useTranslations('reports.overview.actions')
  const tHighlights = useTranslations('reports.overview.highlights')

  return (
    <div className="space-y-7">
      {/* Section Title */}
      <h2 className="font-sora text-xl font-semibold text-[#f0fdf4]">
        {t('title')} <span className="text-[#6ee7b7] font-normal text-base">{t('periodLabel', { period: 'Dezembro 2024' })}</span>
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-5">
        <KPICard
          title={t('kpis.totalSpend')}
          value={formatCurrency(mockReportKPIData.totalSpend)}
          trend={{ value: mockReportKPIData.spendTrend, isPositive: false }}
        />
        <KPICard
          title={t('kpis.savedThisMonth')}
          value={formatCurrency(mockReportKPIData.savedThisMonth)}
          subtitle={t('trends.savings')}
          highlight
        />
        <KPICard
          title={t('kpis.averageAdoption')}
          value={`${mockReportKPIData.averageAdoption}%`}
          trend={{ value: mockReportKPIData.adoptionTrend, isPositive: true }}
        />
        <KPICard
          title={t('kpis.activeTools')}
          value={mockReportKPIData.activeTools.toString()}
          subtitle={t('kpis.thisMonth')}
        />
      </div>

      {/* Top Spenders */}
      <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(16,185,129,0.15)]">
          <h3 className="font-sora text-base font-semibold text-[#f0fdf4]">{t('topSpendersTitle')}</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-3">
            {mockTopSpenders.map((spender, index) => (
              <div
                key={spender.id}
                className="flex items-center justify-between px-4 py-3 bg-[#022c22] border border-[rgba(16,185,129,0.15)] rounded-xl hover:border-[rgba(16,185,129,0.3)] transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="font-jetbrains text-sm text-[#6ee7b7] w-6">{index + 1}</span>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: spender.icon.color }}
                  >
                    {spender.icon.text}
                  </div>
                  <span className="font-medium text-[#f0fdf4]">{spender.name}</span>
                </div>
                <span className="font-jetbrains font-semibold text-[#f0fdf4]">{formatCurrency(spender.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Period Actions */}
      <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(16,185,129,0.15)]">
          <h3 className="font-sora text-base font-semibold text-[#f0fdf4]">{t('periodActionsTitle')}</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-3">
            {mockPeriodActions.map((action) => (
              <div key={action.type} className="flex items-center gap-3 py-3 border-b border-[rgba(16,185,129,0.15)] last:border-b-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${
                  action.type === 'resolved' ? 'bg-[rgba(34,197,94,0.15)]' :
                  action.type === 'saved' ? 'bg-[rgba(16,185,129,0.15)]' :
                  action.type === 'pending' ? 'bg-[rgba(239,68,68,0.15)]' :
                  'bg-[rgba(59,130,246,0.15)]'
                }`}>
                  {action.type === 'resolved' && '✅'}
                  {action.type === 'saved' && '💰'}
                  {action.type === 'pending' && '🔴'}
                  {action.type === 'renewals' && '📅'}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-[#f0fdf4]">{tActions(action.label)}</div>
                </div>
                <span className="font-jetbrains text-sm font-medium text-[#f0fdf4]">
                  {typeof action.value === 'number' && action.type === 'saved'
                    ? formatCurrency(action.value)
                    : action.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl p-6">
        <h3 className="font-sora text-base font-semibold text-[#f0fdf4] mb-4">{t('highlightsTitle')}</h3>
        <div className="flex flex-col gap-3">
          {mockHighlights.map((highlight, index) => (
            <div key={index} className="flex items-start gap-3 py-3 border-b border-[rgba(16,185,129,0.15)] last:border-b-0">
              <span className="text-xl">{highlight.icon}</span>
              <p className="text-[0.9375rem] text-[#a7f3d0]">
                <strong className="text-[#f0fdf4]">{tHighlights(highlight.label)}</strong> {highlight.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
