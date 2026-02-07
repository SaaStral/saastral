'use client'

import { useTranslations } from 'next-intl'
import { ErrorPage } from '@/components/errors/ErrorPage'

export default function ErrorPageRoute() {
  const t = useTranslations('errors')

  return (
    <ErrorPage
      title={t('generic.title')}
      message={t('generic.description')}
      showReset={true}
    />
  )
}
