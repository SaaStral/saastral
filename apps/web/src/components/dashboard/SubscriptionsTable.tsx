'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search, ChevronLeft, ChevronRight, MoreVertical, Edit2, Calendar } from 'lucide-react'
import { Subscription, formatCurrency, formatPercentage } from '@/lib/mockData'

interface SubscriptionsTableProps {
  subscriptions: Subscription[]
}

type CategoryType = 'productivity' | 'design' | 'development' | 'sales' | 'infrastructure' | 'video'
type StatusType = 'active' | 'warning' | 'critical'

const categoryColors: Record<CategoryType, string> = {
  productivity: 'bg-[rgba(96,165,250,0.2)] text-[#60a5fa]',
  design: 'bg-[rgba(192,132,252,0.2)] text-[#c084fc]',
  development: 'bg-[rgba(74,222,128,0.2)] text-[#4ade80]',
  sales: 'bg-[rgba(251,146,60,0.2)] text-[#fb923c]',
  infrastructure: 'bg-[rgba(244,114,182,0.2)] text-[#f472b6]',
  video: 'bg-[rgba(56,189,248,0.2)] text-[#38bdf8]',
}

const statusColors: Record<StatusType, string> = {
  active: 'bg-[rgba(34,197,94,0.15)] text-[#22c55e]',
  warning: 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]',
  critical: 'bg-[rgba(239,68,68,0.15)] text-[#ef4444]',
}

export function SubscriptionsTable({ subscriptions }: SubscriptionsTableProps) {
  const t = useTranslations('dashboard.subscriptions')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSubscriptions = filteredSubscriptions.slice(startIndex, endIndex)

  return (
    <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl p-6 hover:border-[rgba(16,185,129,0.3)] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#f0fdf4]">{t('title')}</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6ee7b7]" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              pl-10 pr-4 py-2 bg-[#022c22] border border-[rgba(16,185,129,0.15)] rounded-lg
              text-sm text-[#f0fdf4] placeholder-[#6ee7b7]
              focus:outline-none focus:border-[rgba(16,185,129,0.3)]
              transition-colors duration-200
            "
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(16,185,129,0.15)]">
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider">
                {t('columns.app')}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider">
                {t('columns.category')}
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider">
                {t('columns.monthlyCost')}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider">
                {t('columns.seats')}
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider">
                {t('columns.adoption')}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider">
                {t('columns.renewal')}
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider">
                {t('columns.status')}
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider">
                {t('columns.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentSubscriptions.map((subscription) => {
              const categoryColor = categoryColors[subscription.category as CategoryType]
              const statusColor = statusColors[subscription.status as StatusType]
              const usagePercentage = (subscription.usedSeats / subscription.totalSeats) * 100

              return (
                <tr
                  key={subscription.id}
                  className="
                    border-b border-[rgba(16,185,129,0.08)]
                    hover:bg-[rgba(5,150,105,0.05)] transition-colors duration-150
                    group
                  "
                >
                  {/* App */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm shadow-md"
                        style={{
                          background: `linear-gradient(135deg, ${subscription.icon.gradient.from}, ${subscription.icon.gradient.to})`,
                          color: subscription.icon.textColor,
                        }}
                      >
                        {subscription.icon.text}
                      </div>
                      <span className="font-medium text-[#f0fdf4]">{subscription.name}</span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-4">
                    <span
                      className={`
                        inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium
                        ${categoryColor}
                      `}
                    >
                      {t(`categories.${subscription.category}`)}
                    </span>
                  </td>

                  {/* Monthly Cost */}
                  <td className="py-4 px-4 text-right">
                    <span className="font-mono font-semibold text-[#f0fdf4]">
                      {formatCurrency(subscription.monthlyCostCents)}
                    </span>
                  </td>

                  {/* Seats */}
                  <td className="py-4 px-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#a7f3d0]">
                          {t('seatsUsed', { used: subscription.usedSeats, total: subscription.totalSeats })}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#022c22] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            usagePercentage >= 90
                              ? 'bg-[#22c55e]'
                              : usagePercentage >= 60
                              ? 'bg-[#f59e0b]'
                              : 'bg-[#ef4444]'
                          }`}
                          style={{ width: `${usagePercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Adoption */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          subscription.adoptionRate >= 80
                            ? 'bg-[#22c55e]'
                            : subscription.adoptionRate >= 60
                            ? 'bg-[#f59e0b]'
                            : 'bg-[#ef4444]'
                        }`}
                      />
                      <span className="font-mono text-sm text-[#f0fdf4]">
                        {formatPercentage(subscription.adoptionRate)}
                      </span>
                    </div>
                  </td>

                  {/* Renewal */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#6ee7b7]" />
                      <div>
                        <div className="text-sm text-[#f0fdf4]">{subscription.renewalDate}</div>
                        <div className="text-xs text-[#6ee7b7]">{t('renewalIn', { days: subscription.daysUntilRenewal })}</div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`
                        inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium
                        ${statusColor}
                      `}
                    >
                      {t(`status.${subscription.status}`)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        className="
                          p-2 rounded-lg bg-[rgba(5,150,105,0.1)] text-[#10b981]
                          hover:bg-[rgba(5,150,105,0.2)] transition-colors duration-150
                        "
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        className="
                          p-2 rounded-lg bg-[rgba(5,150,105,0.1)] text-[#10b981]
                          hover:bg-[rgba(5,150,105,0.2)] transition-colors duration-150
                        "
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(16,185,129,0.15)]">
        <div className="text-sm text-[#6ee7b7]">
          {t('showing', {
            start: startIndex + 1,
            end: Math.min(endIndex, filteredSubscriptions.length),
            total: filteredSubscriptions.length,
          })}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="
              p-2 rounded-lg bg-[rgba(5,150,105,0.1)] text-[#10b981]
              hover:bg-[rgba(5,150,105,0.2)] transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${page === currentPage
                    ? 'bg-gradient-to-r from-[#059669] to-[#0d9488] text-[#f0fdf4]'
                    : 'bg-[rgba(5,150,105,0.1)] text-[#10b981] hover:bg-[rgba(5,150,105,0.2)]'
                  }
                `}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="
              p-2 rounded-lg bg-[rgba(5,150,105,0.1)] text-[#10b981]
              hover:bg-[rgba(5,150,105,0.2)] transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
