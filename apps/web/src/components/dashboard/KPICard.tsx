import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  subtitle?: string
  highlight?: boolean
  warning?: boolean
  icon?: LucideIcon
  children?: React.ReactNode
}

export function KPICard({ title, value, trend, subtitle, highlight, warning, icon: Icon, children }: KPICardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border p-6 transition-all duration-300
        ${highlight
          ? 'bg-gradient-to-br from-[rgba(217,119,6,0.1)] to-[rgba(251,191,36,0.05)] border-[rgba(217,119,6,0.3)]'
          : 'bg-[#033a2d] border-[rgba(16,185,129,0.15)]'
        }
        hover:border-[rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-lg
      `}
    >
      {/* Top gradient line */}
      <div
        className={`
          absolute top-0 left-0 right-0 h-[3px] opacity-0 transition-opacity duration-200
          ${warning
            ? 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] opacity-100'
            : highlight
              ? 'bg-gradient-to-r from-[#d97706] to-[#fbbf24] opacity-100'
              : 'bg-gradient-to-r from-[#059669] to-[#0d9488]'
          }
          group-hover:opacity-100
        `}
      />

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-[#6ee7b7] mb-1">{title}</div>
          <div className="text-3xl font-bold text-[#f0fdf4] font-['JetBrains_Mono']">{value}</div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${highlight ? 'bg-[rgba(217,119,6,0.2)]' : 'bg-[rgba(5,150,105,0.15)]'}`}>
            <Icon className={`w-6 h-6 ${highlight ? 'text-[#fbbf24]' : 'text-[#10b981]'}`} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {trend && trend.value !== 0 && (
          <div
            className={`
              flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold
              ${trend.isPositive
                ? 'bg-[rgba(34,197,94,0.15)] text-[#22c55e]'
                : 'bg-[rgba(239,68,68,0.15)] text-[#ef4444]'
              }
            `}
          >
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend.label || `${Math.abs(trend.value)}%`}</span>
          </div>
        )}
        {subtitle && (
          <div className="text-sm text-[#6ee7b7]">{subtitle}</div>
        )}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}
