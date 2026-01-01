'use client'

import { MoreVertical } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatCurrency, type Subscription } from '@/lib/mockData'

interface SubscriptionsTableProps {
  subscriptions: Subscription[]
  onSubscriptionClick?: (subscription: Subscription) => void
}

export function SubscriptionsTable({ subscriptions, onSubscriptionClick }: SubscriptionsTableProps) {
  const t = useTranslations('subscriptions')

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-[#033a2d] rounded-2xl overflow-hidden">
        <thead>
          <tr className="bg-[#022c22] border-b border-[rgba(16,185,129,0.15)]">
            <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6ee7b7]">
              {t('list.columns.name')}
            </th>
            <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6ee7b7]">
              {t('list.columns.category')}
            </th>
            <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6ee7b7]">
              {t('list.columns.cost')}
            </th>
            <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6ee7b7]">
              {t('list.columns.seats')}
            </th>
            <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6ee7b7]">
              {t('list.columns.usage')}
            </th>
            <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6ee7b7]">
              {t('list.columns.renewal')}
            </th>
            <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6ee7b7]">
              Status
            </th>
            <th className="w-12 px-4 py-3.5"></th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((subscription, index) => (
            <SubscriptionRow
              key={subscription.id}
              subscription={subscription}
              t={t}
              isLast={index === subscriptions.length - 1}
              onClick={() => onSubscriptionClick?.(subscription)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SubscriptionRow({
  subscription,
  t,
  isLast,
  onClick,
}: {
  subscription: Subscription
  t: ReturnType<typeof useTranslations>
  isLast: boolean
  onClick: () => void
}) {
  const statusColors = {
    active: 'bg-[rgba(34,197,94,0.15)] text-[#22c55e]',
    warning: 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]',
    critical: 'bg-[rgba(239,68,68,0.15)] text-[#ef4444]',
  }

  const statusLabels = {
    active: t('statusLabels.active'),
    warning: t('statusLabels.lowUse'),
    critical: t('statusLabels.lowUse'),
  }

  const getAdoptionDotColor = (rate: number) => {
    if (rate >= 80) return 'bg-[#22c55e]'
    if (rate >= 50) return 'bg-[#f59e0b]'
    return 'bg-[#ef4444]'
  }

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer transition-colors hover:bg-[rgba(5,150,105,0.08)] ${!isLast ? 'border-b border-[rgba(16,185,129,0.15)]' : ''}`}
    >
      {/* App name */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs"
            style={{
              background: `linear-gradient(135deg, ${subscription.icon.gradient.from} 0%, ${subscription.icon.gradient.to} 100%)`,
              color: subscription.icon.textColor,
            }}
          >
            {subscription.icon.text}
          </div>
          <h4 className="text-[0.9375rem] font-medium text-[#f0fdf4]">
            {subscription.name}
          </h4>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-4">
        <span
          className={`text-[0.6875rem] px-2 py-0.5 rounded-xl inline-block`}
          style={{
            backgroundColor: `${subscription.icon.gradient.from}20`,
            color: subscription.icon.gradient.from,
          }}
        >
          {t(`categories.${subscription.category}`)}
        </span>
      </td>

      {/* Cost */}
      <td className="px-4 py-4">
        <span className="font-jetbrains font-medium text-[#f0fdf4]">
          {formatCurrency(subscription.monthlyCostCents)}
        </span>
      </td>

      {/* Seats */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#f0fdf4]">
            {subscription.usedSeats}/{subscription.totalSeats}
          </span>
          <div className="w-[60px] h-1.5 bg-[#022c22] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(subscription.usedSeats / subscription.totalSeats) * 100}%`,
                backgroundColor: '#10b981',
              }}
            />
          </div>
        </div>
      </td>

      {/* Adoption */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#f0fdf4] w-10">
            {subscription.adoptionRate.toFixed(0)}%
          </span>
          <div
            className={`w-2 h-2 rounded-full ${getAdoptionDotColor(subscription.adoptionRate)}`}
          />
        </div>
      </td>

      {/* Renewal */}
      <td className="px-4 py-4">
        <span className="text-sm text-[#a7f3d0]">{subscription.renewalDate}</span>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <span
          className={`text-xs px-2.5 py-1 rounded-xl ${statusColors[subscription.status]}`}
        >
          {statusLabels[subscription.status]}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <button className="w-8 h-8 flex items-center justify-center text-[#6ee7b7] hover:bg-[#044d3a] hover:text-[#f0fdf4] rounded-lg transition-all">
          <MoreVertical className="w-4 h-4" />
        </button>
      </td>
    </tr>
  )
}
