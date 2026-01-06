'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useOrganization } from '@/contexts/OrganizationContext'

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
  const { selectedOrgId } = useOrganization()
  const searchParams = useSearchParams()

  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showGoogleOAuthModal, setShowGoogleOAuthModal] = useState(false)
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleClientSecret, setGoogleClientSecret] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Fetch integrations for this organization
  const { data: integrations, refetch: refetchIntegrations } = trpc.integration.list.useQuery(
    { organizationId: selectedOrgId || '' },
    { enabled: !!selectedOrgId }
  )

  // Find Google Workspace integration
  const googleIntegration = integrations?.find(i => i.provider === 'google_workspace')
  const isGoogleConnected = googleIntegration?.status === 'active'
  const googleLastSync = googleIntegration?.lastSyncAt
    ? t('googleWorkspace.lastSync', {
        date: new Date(googleIntegration.lastSyncAt).toLocaleString()
      })
    : undefined

  // Handle OAuth callback status
  useEffect(() => {
    const integration = searchParams?.get('integration')
    const status = searchParams?.get('status')
    const error = searchParams?.get('error')

    if (integration && status === 'connected') {
      setSuccessMessage(`${integration} successfully connected!`)
      // Refetch integrations to update UI
      refetchIntegrations()
      // Clear message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    }

    if (error) {
      setErrorMessage(error)
      // Clear message after 8 seconds
      setTimeout(() => setErrorMessage(null), 8000)
    }
  }, [searchParams, refetchIntegrations, t])

  const handleConfigure = (integration: string) => {
    if (integration === 'google-workspace') {
      // Show modal to configure OAuth credentials first
      setShowGoogleOAuthModal(true)
      // Clear any previous modal errors
      setModalError(null)
    } else {
      console.log(`Configure ${integration}`)
    }
  }

  const handleSaveGoogleOAuthCredentials = async () => {
    // Clear previous errors
    setModalError(null)

    if (!selectedOrgId) {
      setModalError('No organization selected')
      return
    }

    if (!googleClientId || !googleClientSecret) {
      setModalError(t('oauthModal.errorRequired'))
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/trpc/integration.saveGoogleOAuthCredentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: selectedOrgId,
          oauthClientId: googleClientId,
          oauthClientSecret: googleClientSecret,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save OAuth credentials')
      }

      setSuccessMessage(t('oauthModal.successSave'))
      setShowGoogleOAuthModal(false)
      setGoogleClientId('')
      setGoogleClientSecret('')
      setModalError(null)

      // Now redirect to OAuth authorize endpoint
      const redirectUrl = `/settings`
      window.location.href = `/api/integrations/google/authorize?orgId=${selectedOrgId}&redirectUrl=${encodeURIComponent(redirectUrl)}`
    } catch (error) {
      console.error('Error saving OAuth credentials:', error)
      setModalError(t('oauthModal.errorSave'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisconnect = (integration: string) => {
    // TODO: Implement disconnect functionality
    // This should call the integration service to disable the integration
    console.log(`Disconnect ${integration}`)
  }

  return (
    <div>
      <h2 className="font-sora text-xl font-semibold text-[#f0fdf4] mb-2">{t('title')}</h2>
      <p className="text-[0.9375rem] text-[#6ee7b7] mb-6">{t('description')}</p>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-[rgba(5,150,105,0.1)] border border-[rgba(5,150,105,0.3)] rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#10b981] flex-shrink-0" />
          <p className="text-[0.9375rem] text-[#6ee7b7]">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0" />
          <p className="text-[0.9375rem] text-[#fca5a5]">{errorMessage}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Google Workspace */}
        <IntegrationCard
          name={t('googleWorkspace.name')}
          description={t('googleWorkspace.description')}
          isConnected={isGoogleConnected}
          lastSync={googleLastSync}
          onConfigure={() => handleConfigure('google-workspace')}
          onDisconnect={() => handleDisconnect('google-workspace')}
        />

        {/* Okta */}
        <IntegrationCard
          name={t('okta.name')}
          description={t('okta.description')}
          isConnected={false}
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

      {/* Google OAuth Credentials Modal */}
      {showGoogleOAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#022820] border border-[rgba(16,185,129,0.3)] rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="font-sora text-lg font-semibold text-[#f0fdf4] mb-2">
              {t('oauthModal.title')}
            </h3>
            <p className="text-[0.875rem] text-[#6ee7b7] mb-6">
              {t('oauthModal.description')}
            </p>

            {/* Modal Error Message */}
            {modalError && (
              <div className="mb-4 p-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#ef4444] flex-shrink-0" />
                <p className="text-[0.8125rem] text-[#fca5a5]">{modalError}</p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[0.875rem] font-medium text-[#a7f3d0] mb-2">
                  {t('oauthModal.clientId')}
                </label>
                <input
                  type="text"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  placeholder={t('oauthModal.clientIdPlaceholder')}
                  className="w-full px-4 py-2 bg-[#033a2d] border border-[rgba(16,185,129,0.2)] rounded-xl text-[#f0fdf4] placeholder-[#059669] focus:outline-none focus:border-[#10b981] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[0.875rem] font-medium text-[#a7f3d0] mb-2">
                  {t('oauthModal.clientSecret')}
                </label>
                <input
                  type="password"
                  value={googleClientSecret}
                  onChange={(e) => setGoogleClientSecret(e.target.value)}
                  placeholder={t('oauthModal.clientSecretPlaceholder')}
                  className="w-full px-4 py-2 bg-[#033a2d] border border-[rgba(16,185,129,0.2)] rounded-xl text-[#f0fdf4] placeholder-[#059669] focus:outline-none focus:border-[#10b981] transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveGoogleOAuthCredentials}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-[0.875rem] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? t('oauthModal.saving') : t('oauthModal.saveAndConnect')}
              </button>
              <button
                onClick={() => setShowGoogleOAuthModal(false)}
                disabled={isSaving}
                className="px-4 py-2 bg-transparent border border-[rgba(239,68,68,0.3)] rounded-xl text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors text-[0.875rem] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('oauthModal.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
