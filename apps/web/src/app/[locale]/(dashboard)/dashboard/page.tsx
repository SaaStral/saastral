'use client'

import { LayoutDashboard } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { EmptyState } from '@/components/ui/EmptyState'

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tStats = useTranslations('dashboard.stats')

  return (
    <div>
      <EmptyState
        icon={LayoutDashboard}
        title={t('underConstruction')}
        description={t('comingSoon')}
        action={{
          label: 'Explore features',
          onClick: () => console.log('Explore features'),
        }}
      >
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-2xl">
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-2xl font-bold text-[#f0fdf4] mb-1">0</div>
            <div className="text-sm text-[#6ee7b7]">{tStats('activeSubscriptions')}</div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-2xl font-bold text-[#f0fdf4] mb-1">$ 0</div>
            <div className="text-sm text-[#6ee7b7]">{tStats('monthlySpend')}</div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-2xl font-bold text-[#f0fdf4] mb-1">0</div>
            <div className="text-sm text-[#6ee7b7]">Active Alerts</div>
          </div>
        </div>
      </EmptyState>
    </div>
  )
}
