'use client'

import { Settings as SettingsIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { EmptyState } from '@/components/ui/EmptyState'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tInt = useTranslations('settings.integrations')
  const tNotif = useTranslations('settings.notifications')
  const tPref = useTranslations('settings.preferences')

  return (
    <div>
      <EmptyState
        icon={SettingsIcon}
        title={t('title')}
        description={t('subtitle')}
      >
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-2xl text-sm">
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-left">
            <div className="text-[#10b981] font-semibold mb-2">🔗 {tInt('title')}</div>
            <div className="text-xs text-[#6ee7b7] mb-3">
              {tInt('description')}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span className="text-xs text-[#a7f3d0]">{tInt('configured', { count: 2 })}</span>
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-left">
            <div className="text-[#10b981] font-semibold mb-2">🔔 {tNotif('title')}</div>
            <div className="text-xs text-[#6ee7b7] mb-3">
              Email • Slack • Teams • Webhooks
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6b7280]" />
              <span className="text-xs text-[#a7f3d0]">{tInt('notConfigured')}</span>
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-left">
            <div className="text-[#10b981] font-semibold mb-2">👤 {t('team.title')}</div>
            <div className="text-xs text-[#6ee7b7] mb-3">
              Manage who has access to SaaStral
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-left">
            <div className="text-[#10b981] font-semibold mb-2">⚙️ Preferences</div>
            <div className="text-xs text-[#6ee7b7] mb-3">
              {tPref('language')} • {tPref('timezone')} • {tPref('currency')} • {tPref('dateFormat')}
            </div>
          </div>
        </div>
      </EmptyState>
    </div>
  )
}
