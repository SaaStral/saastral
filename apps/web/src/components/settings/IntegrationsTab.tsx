'use client'

import { useTranslations } from 'next-intl'
import { CheckCircle2, Circle } from 'lucide-react'

interface IntegrationCardProps {
  name: string
  description: string
  isConnected: boolean
  isPremium?: boolean
  lastSync?: string
  onConfigure: () => void
  onDisconnect?: () => void
}

function IntegrationCard({
  name,
  description,
  isConnected,
  isPremium,
  lastSync,
  onConfigure,
  onDisconnect,
}: IntegrationCardProps) {
  const t = useTranslations('settings.integrations')

  return (
    <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-sora text-[1.0625rem] font-semibold text-[#f0fdf4]">{name}</h3>
            {isPremium && (
              <span className="px-2 py-0.5 bg-[#f59e0b] text-[#1e1e1e] text-[0.6875rem] font-semibold rounded-md">
                Enterprise
              </span>
            )}
          </div>
          <p className="text-[0.875rem] text-[#6ee7b7]">{description}</p>
        </div>
        {isConnected ? (
          <CheckCircle2 className="w-5 h-5 text-[#10b981] flex-shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-[#059669] flex-shrink-0" />
        )}
      </div>

      {isConnected && lastSync && (
        <p className="text-[0.8125rem] text-[#059669] mb-4">{lastSync}</p>
      )}

      <div className="flex gap-3">
        {isConnected ? (
          <>
            <button className="px-4 py-2 bg-[#022820] border border-[rgba(16,185,129,0.2)] rounded-xl text-[#6ee7b7] hover:bg-[#033a2d] hover:border-[#10b981] transition-colors text-[0.875rem] font-medium">
              {t('googleWorkspace.configure')}
            </button>
            {onDisconnect && (
              <button
                onClick={onDisconnect}
                className="px-4 py-2 bg-transparent border border-[rgba(239,68,68,0.3)] rounded-xl text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors text-[0.875rem] font-medium"
              >
                {t('googleWorkspace.disconnect')}
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onConfigure}
            disabled={isPremium}
            className={`px-4 py-2 rounded-xl text-[0.875rem] font-medium transition-colors ${
              isPremium
                ? 'bg-[#022820] border border-[rgba(16,185,129,0.2)] text-[#059669] cursor-not-allowed'
                : 'bg-[#059669] hover:bg-[#047857] text-white'
            }`}
          >
            {t('googleWorkspace.configure')}
          </button>
        )}
      </div>
    </div>
  )
}

export function IntegrationsTab() {
  const t = useTranslations('settings.integrations')

  const handleConfigure = (integration: string) => {
    console.log(`Configure ${integration}`)
  }

  const handleDisconnect = (integration: string) => {
    console.log(`Disconnect ${integration}`)
  }

  return (
    <div>
      <h2 className="font-sora text-xl font-semibold text-[#f0fdf4] mb-2">{t('title')}</h2>
      <p className="text-[0.9375rem] text-[#6ee7b7] mb-6">{t('description')}</p>

      <div className="space-y-4">
        {/* Google Workspace */}
        <IntegrationCard
          name={t('googleWorkspace.name')}
          description={t('googleWorkspace.description')}
          isConnected={true}
          lastSync={t('googleWorkspace.lastSync', { date: '2 hours ago' })}
          onConfigure={() => handleConfigure('google-workspace')}
          onDisconnect={() => handleDisconnect('google-workspace')}
        />

        {/* Okta */}
        <IntegrationCard
          name={t('okta.name')}
          description={t('okta.description')}
          isConnected={true}
          lastSync={t('okta.lastSync', { date: '15 minutes ago' })}
          onConfigure={() => handleConfigure('okta')}
          onDisconnect={() => handleDisconnect('okta')}
        />

        {/* Microsoft 365 - Premium */}
        <IntegrationCard
          name={t('microsoft365.name')}
          description={t('microsoft365.description')}
          isConnected={false}
          isPremium={true}
          onConfigure={() => handleConfigure('microsoft365')}
        />

        {/* Slack */}
        <IntegrationCard
          name={t('slack.name')}
          description={t('slack.description')}
          isConnected={false}
          onConfigure={() => handleConfigure('slack')}
        />
      </div>
    </div>
  )
}
