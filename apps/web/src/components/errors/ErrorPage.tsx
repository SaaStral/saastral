'use client'

import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface ErrorPageProps {
  title?: string
  message?: string
  showReset?: boolean
  onReset?: () => void
}

export function ErrorPage({
  title,
  message,
  showReset = true,
  onReset,
}: ErrorPageProps) {
  const router = useRouter()
  const t = useTranslations('errors')

  const handleReset = () => {
    if (onReset) {
      onReset()
    } else {
      router.refresh()
    }
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#001a14] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-500/10 p-6">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-[#f0fdf4] mb-3">
          {title || t('generic.title')}
        </h1>
        <p className="text-[#6ee7b7] mb-8">
          {message || t('generic.description')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showReset && (
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#10b981] text-[#001a14] rounded-lg font-medium hover:bg-[#059669] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t('actions.tryAgain')}
            </button>
          )}
          <button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#033a2d] text-[#10b981] border border-[rgba(16,185,129,0.15)] rounded-lg font-medium hover:bg-[#044d3a] transition-colors"
          >
            <Home className="w-4 h-4" />
            {t('actions.goToDashboard')}
          </button>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-[#6ee7b7]/60">
          {t('actions.support')}
        </p>
      </div>
    </div>
  )
}
