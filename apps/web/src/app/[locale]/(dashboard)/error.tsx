'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ErrorPage } from '@/components/errors/ErrorPage'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errors')

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <ErrorPage
      title={t('dashboard.title')}
      message={t('dashboard.description')}
      showReset={true}
      onReset={reset}
    />
  )
}
