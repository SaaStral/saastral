'use client'

import { Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { EmptyState } from '@/components/ui/EmptyState'

export default function EmployeesPage() {
  const t = useTranslations('employees')

  return (
    <div>
      <EmptyState
        icon={Users}
        title={t('manageTeam')}
        description={t('subtitle')}
        action={{
          label: t('form.create'),
          onClick: () => console.log('Add employee'),
        }}
      >
        <div className="mt-8 text-sm text-[#6ee7b7] max-w-md">
          <p>{t('getStarted')}</p>
        </div>
      </EmptyState>
    </div>
  )
}
