'use client'

import { Package } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { EmptyState } from '@/components/ui/EmptyState'

export default function SubscriptionsPage() {
  const t = useTranslations('subscriptions')

  return (
    <div>
      <EmptyState
        icon={Package}
        title={t('manageSubscriptions')}
        description={t('subtitle')}
        action={{
          label: t('form.create'),
          onClick: () => console.log('Add subscription'),
        }}
      >
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg">
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-left">
            <div className="text-sm text-[#6ee7b7] mb-2">{t('categories')}</div>
            <div className="text-xs text-[#4ade80]">
              {t('categories.communication')} • {t('categories.productivity')} • {t('categories.design')} • {t('categories.development')} • {t('categories.marketing')}
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-left">
            <div className="text-sm text-[#6ee7b7] mb-2">{t('autoTracking')}</div>
            <div className="text-xs text-[#4ade80]">
              {t('autoTrackingDesc')}
            </div>
          </div>
        </div>
      </EmptyState>
    </div>
  )
}
