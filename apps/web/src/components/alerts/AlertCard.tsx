'use client'

import {
  UserX,
  Calendar,
  Users,
  TrendingDown,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  DollarSign,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type Alert, formatCurrency } from '@/lib/mockData'

interface AlertCardProps {
  alert: Alert
  onAction?: (alert: Alert, action: string) => void
}

export function AlertCard({ alert, onAction }: AlertCardProps) {
  const t = useTranslations('alerts')

  const priorityColors = {
    critical: 'text-[#ef4444]',
    high: 'text-[#f97316]',
    medium: 'text-[#f59e0b]',
    low: 'text-[#3b82f6]',
  }

  const priorityDotColors = {
    critical: 'bg-[#ef4444] shadow-[0_0_8px_#ef4444]',
    high: 'bg-[#f97316]',
    medium: 'bg-[#f59e0b]',
    low: 'bg-[#3b82f6]',
  }

  const typeIcons = {
    offboarding: UserX,
    renewal: Calendar,
    unused: Users,
    adoption: TrendingDown,
    duplicate: RefreshCw,
  }

  const Icon = typeIcons[alert.type]

  // Resolved alert rendering
  if (alert.status === 'resolved') {
    return (
      <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl overflow-hidden opacity-70">
        <div className="flex items-center justify-between px-6 py-4 bg-[rgba(34,197,94,0.1)] border-b border-[rgba(16,185,129,0.15)]">
          <div className="flex items-center gap-2 text-[#22c55e] font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            {t('labels.resolved')}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[#10b981] text-sm">
              <DollarSign className="w-3.5 h-3.5" />
              {t('labels.savings')}: {formatCurrency(alert.data?.savedAmount || 0)}
            </div>
            <span className="text-sm text-[#6ee7b7]">{alert.timeAgo}</span>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="text-[#6ee7b7] text-[0.9375rem]">
            <strong className="text-[#f0fdf4]">{alert.title}:</strong> {alert.message}
          </p>
        </div>
      </div>
    )
  }

  // Regular alert rendering
  return (
    <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl overflow-hidden hover:border-[rgba(16,185,129,0.3)] hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#022c22] border-b border-[rgba(16,185,129,0.15)]">
        <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${priorityColors[alert.priority]}`}>
          <span className={`w-2 h-2 rounded-full ${priorityDotColors[alert.priority]}`} />
          {t(`priority.${alert.priority}`)}
        </div>
        <span className="text-sm text-[#6ee7b7]">{alert.timeAgo}</span>
      </div>

      {/* Body */}
      <div className="px-6 py-6">
        {/* Type */}
        <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wide text-[#a7f3d0] mb-3">
          <Icon className="w-[18px] h-[18px]" />
          {t(`types.${alert.type}`)}
        </div>

        {/* Message */}
        <p className="text-[1.0625rem] font-medium text-[#f0fdf4] mb-1.5">
          {alert.message}
        </p>
        {alert.detail && (
          <p className="text-[0.9375rem] text-[#6ee7b7] mb-5">{alert.detail}</p>
        )}

        {/* Type-specific content */}
        {alert.type === 'offboarding' && alert.data?.licenses && (
          <div className="bg-[#022c22] border border-[rgba(16,185,129,0.15)] rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 text-[0.9375rem] text-[#a7f3d0] mb-3">
              <DollarSign className="w-4 h-4 text-[#fbbf24]" />
              {t('labels.monthlyCost')}: <strong className="font-jetbrains text-[#f0fdf4]">{formatCurrency(alert.data.monthlyCost || 0)}</strong>
            </div>
            <div className="flex flex-wrap gap-2">
              {alert.data.licenses.map((license, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-xs text-[#a7f3d0]"
                >
                  <span
                    className="w-[18px] h-[18px] rounded flex items-center justify-center font-bold text-[0.55rem]"
                    style={{ backgroundColor: license.color, color: '#fff' }}
                  >
                    {license.icon}
                  </span>
                  {license.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {alert.type === 'renewal' && alert.data && (
          <div className="bg-[#022c22] border border-[rgba(16,185,129,0.15)] rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 text-[0.9375rem] text-[#a7f3d0] mb-2">
              <DollarSign className="w-4 h-4 text-[#fbbf24]" />
              {t('labels.currentValue')}: <strong className="font-jetbrains text-[#f0fdf4]">{formatCurrency(alert.data.monthlyCost || 0)}{t('labels.perMonth')}</strong> ({formatCurrency(alert.data.annualCost || 0)}{t('labels.perYear')})
            </div>
            <p className="text-sm text-[#6ee7b7]">
              👥 {t('labels.seats')}: {alert.data.seats?.used} utilizados de {alert.data.seats?.total} contratados • 📊 {t('labels.adoption')}: {alert.data.adoptionRate}%
            </p>
          </div>
        )}

        {alert.data?.suggestion && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] rounded-xl mb-5 text-sm text-[#10b981]">
            <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {t('labels.suggestion')}: {alert.data.suggestion}
          </div>
        )}

        {alert.type === 'unused' && alert.data && (
          <div className="bg-[#022c22] border border-[rgba(16,185,129,0.15)] rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 text-[0.9375rem] text-[#a7f3d0] mb-3">
              <DollarSign className="w-4 h-4 text-[#fbbf24]" />
              {t('labels.potentialSavings')}: <strong className="font-jetbrains text-[#f0fdf4]">{formatCurrency(alert.data.potentialSavings || 0)}{t('labels.perMonth')}</strong>
            </div>
            {alert.data.unusedUsers && (
              <div className="space-y-1.5">
                {alert.data.unusedUsers.slice(0, 3).map((user, idx) => (
                  <div key={idx} className="text-sm text-[#6ee7b7]">
                    • {user.name} ({user.daysInactive} dias)
                  </div>
                ))}
                {alert.data.unusedCount && alert.data.unusedCount > 3 && (
                  <div className="text-sm text-[#4ade80]">
                    +{alert.data.unusedCount - 3} {t('labels.others')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {alert.type === 'duplicate' && alert.data?.tools && (
          <>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center mb-5">
              {alert.data.tools[0] && (
                <div className="bg-[#022c22] border border-[rgba(16,185,129,0.15)] rounded-xl p-4 text-center">
                  <div className="font-semibold mb-2 text-[#f0fdf4]">{alert.data.tools[0].name}</div>
                  <div className="font-jetbrains text-[0.9375rem] text-[#a7f3d0] mb-1">
                    {alert.data.tools[0].cost}
                  </div>
                  <div className="text-sm text-[#6ee7b7] mb-1">
                    {alert.data.tools[0].users} usuários
                  </div>
                  <div className="text-sm text-[#6ee7b7]">
                    {alert.data.tools[0].adoption}% adoção
                  </div>
                </div>
              )}
              <div className="text-sm font-semibold text-[#6ee7b7] text-center">
                {t('labels.vs')}
              </div>
              {alert.data.tools[1] && (
                <div className="bg-[#022c22] border border-[rgba(16,185,129,0.15)] rounded-xl p-4 text-center">
                  <div className="font-semibold mb-2 text-[#f0fdf4]">{alert.data.tools[1].name}</div>
                  <div className="font-jetbrains text-[0.9375rem] text-[#a7f3d0] mb-1">
                    {alert.data.tools[1].cost}
                  </div>
                  <div className="text-sm text-[#6ee7b7] mb-1">
                    {alert.data.tools[1].users} usuários
                  </div>
                  <div className="text-sm text-[#6ee7b7]">
                    {alert.data.tools[1].adoption}% adoção
                  </div>
                </div>
              )}
            </div>
            {alert.data.potentialSavings && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] rounded-xl mb-5 text-sm text-[#10b981]">
                <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {t('labels.potentialSavings')}: {formatCurrency(alert.data.potentialSavings)}{t('labels.perMonth')} ({t('labels.consolidating')} {alert.data.tools[1]?.name})
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {alert.type === 'offboarding' && (
            <>
              <button
                onClick={() => onAction?.(alert, 'revokeAll')}
                className="px-3 py-1.5 text-sm font-semibold bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] rounded-lg text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-all"
              >
                {t('actions.revokeAll')}
              </button>
              <button
                onClick={() => onAction?.(alert, 'reviewOneByOne')}
                className="px-3 py-1.5 text-sm font-semibold text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-lg hover:bg-[rgba(5,150,105,0.08)] hover:border-[rgba(16,185,129,0.3)] transition-all"
              >
                {t('actions.reviewOneByOne')}
              </button>
            </>
          )}

          {alert.type === 'renewal' && (
            <>
              <button
                onClick={() => onAction?.(alert, 'startNegotiation')}
                className="px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-[#059669] to-[#0d9488] rounded-lg hover:shadow-[0_0_20px_rgba(5,150,105,0.3)] transition-all"
              >
                {t('actions.startNegotiation')}
              </button>
              <button
                onClick={() => onAction?.(alert, 'scheduleReminder')}
                className="px-3 py-1.5 text-sm font-semibold text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-lg hover:bg-[rgba(5,150,105,0.08)] hover:border-[rgba(16,185,129,0.3)] transition-all"
              >
                {t('actions.scheduleReminder')}
              </button>
            </>
          )}

          {alert.type === 'unused' && (
            <>
              <button
                onClick={() => onAction?.(alert, 'viewAllUsers')}
                className="px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-[#059669] to-[#0d9488] rounded-lg hover:shadow-[0_0_20px_rgba(5,150,105,0.3)] transition-all"
              >
                {t('actions.viewAllUsers')}
              </button>
              <button
                onClick={() => onAction?.(alert, 'notifyUsers')}
                className="px-3 py-1.5 text-sm font-semibold text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-lg hover:bg-[rgba(5,150,105,0.08)] hover:border-[rgba(16,185,129,0.3)] transition-all"
              >
                {t('actions.notifyUsers')}
              </button>
            </>
          )}

          {alert.type === 'duplicate' && (
            <>
              <button
                onClick={() => onAction?.(alert, 'compareDetails')}
                className="px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-[#059669] to-[#0d9488] rounded-lg hover:shadow-[0_0_20px_rgba(5,150,105,0.3)] transition-all"
              >
                {t('actions.compareDetails')}
              </button>
              <button
                onClick={() => onAction?.(alert, 'planMigration')}
                className="px-3 py-1.5 text-sm font-semibold text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-lg hover:bg-[rgba(5,150,105,0.08)] hover:border-[rgba(16,185,129,0.3)] transition-all"
              >
                {t('actions.planMigration')}
              </button>
            </>
          )}

          <button
            onClick={() => onAction?.(alert, 'dismiss')}
            className="text-sm text-[#6ee7b7] hover:text-[#f0fdf4] transition-colors"
          >
            {t('actions.dismiss')}
          </button>
        </div>
      </div>
    </div>
  )
}
