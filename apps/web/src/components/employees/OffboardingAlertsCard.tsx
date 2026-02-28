import { useTranslations } from 'next-intl'
import { formatCurrency } from '@/lib/format'

interface OffboardingAlert {
  id: string
  name: string
  email: string
  offboardingDate: string
  timeAgo: string
  licenses: Array<{ name: string; icon: string; color: string }>
  totalCost: number
}

interface OffboardingAlertsCardProps {
  alerts: OffboardingAlert[]
}

export function OffboardingAlertsCard({ alerts }: OffboardingAlertsCardProps) {
  const t = useTranslations('employees.offboardingAlerts')

  return (
    <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(16,185,129,0.15)]">
        <div className="flex items-center gap-3">
          <h2 className="font-sora text-base font-semibold text-[#f0fdf4]">
            {t('title')}
          </h2>
          <span className="bg-[#ef4444] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {alerts.length}
          </span>
        </div>
        <button className="text-sm text-[#10b981] hover:text-[#f0fdf4] transition-colors">
          {t('viewHistory')} →
        </button>
      </div>
      <div className="max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[rgba(16,185,129,0.15)] [&::-webkit-scrollbar-thumb]:rounded">
        {alerts.map((alert, index) => (
          <div
            key={alert.id}
            className={`px-6 py-5 hover:bg-[rgba(5,150,105,0.08)] transition-colors ${
              index !== alerts.length - 1
                ? 'border-b border-[rgba(16,185,129,0.15)]'
                : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                <span className="font-semibold text-[#f0fdf4]">
                  {alert.name}
                </span>
              </div>
              <span className="text-xs text-[#6ee7b7] bg-[#022c22] px-2.5 py-1 rounded-full">
                {alert.timeAgo}
              </span>
            </div>
            <div className="text-sm text-[#6ee7b7] mb-3">
              {t('terminationDate')}: {alert.offboardingDate}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {alert.licenses.slice(0, 4).map((license, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#022c22] border border-[rgba(16,185,129,0.15)] rounded-md text-xs text-[#a7f3d0]"
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: license.color }}
                  >
                    {license.icon}
                  </div>
                  {license.name}
                </div>
              ))}
              {alert.licenses.length > 4 && (
                <div className="px-2.5 py-1.5 bg-[rgba(5,150,105,0.08)] rounded-md text-xs text-[#6ee7b7]">
                  +{alert.licenses.length - 4}
                </div>
              )}
            </div>
            <div className="text-sm text-[#6ee7b7] mb-4">
              <strong className="text-[#f0fdf4] font-jetbrains">
                {formatCurrency(alert.totalCost)}
                {t('perMonth')}
              </strong>{' '}
              {t('activeLicenses')}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent border border-[rgba(16,185,129,0.15)] text-[#a7f3d0] text-sm font-semibold rounded-lg hover:bg-[rgba(5,150,105,0.08)] hover:border-[rgba(16,185,129,0.3)] transition-all">
                {t('viewLicenses')}
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] text-sm font-semibold rounded-lg hover:bg-[#ef4444] hover:text-white transition-all">
                {t('revokeAccess')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
