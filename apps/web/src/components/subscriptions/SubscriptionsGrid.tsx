'use client'

import { Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatCurrency, type SubscriptionDisplay } from '@/lib/subscription-helpers'

interface SubscriptionsGridProps {
  subscriptions: SubscriptionDisplay[]
  onSubscriptionClick?: (subscription: SubscriptionDisplay) => void
}

export function SubscriptionsGrid({ subscriptions, onSubscriptionClick }: SubscriptionsGridProps) {
  const t = useTranslations('subscriptions')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {subscriptions.map((subscription) => (
        <SubscriptionCard
          key={subscription.id}
          subscription={subscription}
          t={t}
          onClick={() => onSubscriptionClick?.(subscription)}
        />
      ))}
    </div>
  )
}

function SubscriptionCard({
  subscription,
  t,
  onClick,
}: {
  subscription: SubscriptionDisplay
  t: ReturnType<typeof useTranslations>
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

  const getAdoptionColor = (rate: number) => {
    if (rate >= 80) return '#10b981'
    if (rate >= 50) return '#f59e0b'
    return '#ef4444'
  }

  const borderClass =
    subscription.status === 'warning'
      ? 'border-l-[3px] border-l-[#f59e0b]'
      : subscription.status === 'critical'
        ? 'border-l-[3px] border-l-[#ef4444]'
        : ''

  return (
    <div
      onClick={onClick}
      className={`bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl overflow-hidden hover:border-[rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-pointer ${borderClass}`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base"
            style={{
              background: `linear-gradient(135deg, ${subscription.icon.gradient.from} 0%, ${subscription.icon.gradient.to} 100%)`,
              color: subscription.icon.textColor,
            }}
          >
            {subscription.icon.text}
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#f0fdf4]">
              {subscription.name}
            </h3>
            <p className="text-xs text-[#6ee7b7]">
              {t(`categories.${subscription.category}`)}
            </p>
          </div>
        </div>
        <span
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl ${statusColors[subscription.status]}`}
        >
          {subscription.status === 'active' ? '●' : '⚠'}{' '}
          {statusLabels[subscription.status]}
        </span>
      </div>

      {/* Card Body */}
      <div className="px-5 pb-5">
        <div className="mb-4">
          <div className="text-xl font-semibold font-jetbrains text-[#f0fdf4]">
            {formatCurrency(subscription.monthlyCostCents)}
            <span className="text-sm font-normal text-[#6ee7b7]">/mês</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-[0.6875rem] text-[#6ee7b7] uppercase tracking-wide mb-1">
              {t('subscriptionList.seats')}
            </label>
            <div className="text-sm font-medium font-jetbrains text-[#f0fdf4]">
              {subscription.usedSeats}/{subscription.totalSeats}
            </div>
            <div className="h-1 bg-[#022c22] rounded-full mt-1 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(subscription.usedSeats / subscription.totalSeats) * 100}%`,
                  backgroundColor: getAdoptionColor(
                    (subscription.usedSeats / subscription.totalSeats) * 100
                  ),
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-[0.6875rem] text-[#6ee7b7] uppercase tracking-wide mb-1">
              {t('subscriptionList.adoption')}
            </label>
            <div className="text-sm font-medium font-jetbrains text-[#f0fdf4]">
              {subscription.adoptionRate.toFixed(0)}%
            </div>
            <div className="h-1 bg-[#022c22] rounded-full mt-1 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${subscription.adoptionRate}%`,
                  backgroundColor: getAdoptionColor(subscription.adoptionRate),
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-[0.6875rem] text-[#6ee7b7] uppercase tracking-wide mb-1">
              {t('subscriptionList.renews')}
            </label>
            <div className="text-sm font-medium font-jetbrains text-[#f0fdf4]">
              {subscription.renewalDate.slice(0, 5)}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-[rgba(16,185,129,0.15)]">
        <span className="flex items-center gap-1.5 text-sm text-[#6ee7b7]">
          <Users className="w-3.5 h-3.5" />
          {t('subscriptionList.activeUsers', {
            count: subscription.usedSeats,
          })}
        </span>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm font-semibold text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-lg hover:bg-[rgba(5,150,105,0.08)] hover:border-[rgba(16,185,129,0.3)] transition-all">
            {t('subscriptionList.viewDetails')}
          </button>
        </div>
      </div>
    </div>
  )
}
