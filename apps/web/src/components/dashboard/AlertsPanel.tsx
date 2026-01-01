import { UserX, Calendar, Clock, TrendingDown, Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Alert } from '@/lib/mockData'
import Link from 'next/link'

interface AlertsPanelProps {
  alerts: Alert[]
}

const priorityConfig = {
  critical: {
    bgColor: 'bg-[rgba(239,68,68,0.15)]',
    iconColor: 'text-[#ef4444]',
  },
  high: {
    bgColor: 'bg-[rgba(249,115,22,0.15)]',
    iconColor: 'text-[#f97316]',
  },
  medium: {
    bgColor: 'bg-[rgba(245,158,11,0.15)]',
    iconColor: 'text-[#f59e0b]',
  },
  low: {
    bgColor: 'bg-[rgba(59,130,246,0.15)]',
    iconColor: 'text-[#3b82f6]',
  },
}

const alertIcons = {
  offboarding: UserX,
  renewal: Calendar,
  unused: Clock,
  adoption: TrendingDown,
  duplicate: Copy,
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const t = useTranslations('dashboard.alerts')

  return (
    <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl overflow-hidden hover:border-[rgba(16,185,129,0.3)] transition-all duration-300 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 pb-0">
        <h3 className="text-lg font-semibold text-[#f0fdf4]">{t('title')}</h3>
      </div>

      {/* Alert Items */}
      <div className="flex-1 overflow-y-auto">
        {alerts.map((alert, index) => {
          const config = priorityConfig[alert.priority]
          const Icon = alertIcons[alert.type]

          return (
            <div
              key={alert.id}
              className={`
                flex items-start gap-3.5 px-6 py-4
                ${index < alerts.length - 1 ? 'border-b border-[rgba(16,185,129,0.15)]' : ''}
                hover:bg-[rgba(5,150,105,0.08)] transition-colors duration-150 cursor-pointer
              `}
            >
              {/* Icon */}
              <div
                className={`
                  w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0
                  ${config.bgColor} ${config.iconColor}
                `}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#f0fdf4] mb-1">
                  {alert.message}
                </div>
                <div className="text-[0.8125rem] text-[#6ee7b7]">
                  {alert.detail || alert.timeAgo}
                </div>
              </div>

              {/* Action */}
              <button
                className="
                  px-3 py-1.5 text-xs font-medium rounded-md
                  bg-transparent border border-[rgba(16,185,129,0.15)]
                  text-[#a7f3d0]
                  hover:bg-[#059669] hover:border-[#059669] hover:text-[#f0fdf4]
                  transition-all duration-150 flex-shrink-0
                "
              >
                Ver
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[rgba(16,185,129,0.15)] text-center">
        <Link
          href="/alerts"
          className="text-sm text-[#a7f3d0] hover:text-[#10b981] transition-colors"
        >
          {t('viewAll', { count: 12 })} →
        </Link>
      </div>
    </div>
  )
}
