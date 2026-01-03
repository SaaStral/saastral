'use client'

import { useTranslations } from 'next-intl'
import { SignupForm } from '@/components/auth/SignupForm'
import { LoginForm } from '@/components/auth/LoginForm'
import { trpc } from '@/lib/trpc/client'

export default function AuthPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common.app')

  // Check if there are existing users in the database
  const { data, isLoading } = trpc.user.hasUsers.useQuery()
  const hasExistingUsers = data?.hasUsers ?? false

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#011815]">
        <div className="text-[#6ee7b7]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#011815]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" opacity="0.4"/>
              <circle cx="20" cy="20" r="12" stroke="#10b981" strokeWidth="2" opacity="0.6"/>
              <circle cx="20" cy="20" r="6" fill="#059669"/>
              <circle cx="20" cy="2" r="3" fill="#10b981"/>
              <circle cx="35" cy="14" r="2.5" fill="#14b8a6"/>
              <circle cx="8" cy="28" r="2" fill="#10b981" opacity="0.7"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-['Sora',sans-serif] mb-2">
            Saa<span className="text-[#10b981]">Stral</span>
          </h1>
          <p className="text-sm text-[#6ee7b7]">{tCommon('tagline')}</p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.2)] rounded-2xl p-8 shadow-xl">
          {/* Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#f0fdf4] mb-2">
              {hasExistingUsers ? t('login.title') : t('signup.title')}
            </h2>
            <p className="text-sm text-[#6ee7b7]">
              {hasExistingUsers ? t('login.subtitle') : t('signup.subtitle')}
            </p>
          </div>

          {/* Forms */}
          {hasExistingUsers ? <LoginForm /> : <SignupForm />}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-[#6ee7b7]">
            <span>{t('footer.version', { version: '0.1.0' })}</span>
            <span className="w-1 h-1 rounded-full bg-[#6ee7b7]" />
            <a
              href="https://github.com/saastral/saastral"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#10b981] transition-colors"
            >
              {t('footer.openSource')}
            </a>
            <span className="w-1 h-1 rounded-full bg-[#6ee7b7]" />
            <a
              href="https://docs.saastral.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#10b981] transition-colors"
            >
              {t('footer.documentation')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
