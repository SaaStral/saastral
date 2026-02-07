'use client'

import { useState, useTransition, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname as useNextPathname, useRouter as useNextRouter } from 'next/navigation'
import { Search, Bell, HelpCircle, Globe, Check, LogOut, Building2 } from 'lucide-react'
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config'
import { authClient } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc/client'
import { useOrganization } from '@/contexts/OrganizationContext'

export function Header() {
  const locale = useLocale() as Locale
  const router = useNextRouter()
  const pathname = useNextPathname()
  const [isPending, startTransition] = useTransition()
  const [isLocaleOpen, setIsLocaleOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false)
  const t = useTranslations('common.header')

  const { selectedOrgId, setSelectedOrgId, clearSelectedOrg } = useOrganization()

  // Fetch user's organizations (userId comes from session in tRPC context)
  const { data: organizations = [], error: orgError } = trpc.organization.listUserOrganizations.useQuery(undefined, {
    retry: 1, // Only retry once
  })

  // Handle error redirect after all hooks
  useEffect(() => {
    if (orgError) {
      console.error('Failed to load organizations:', orgError)
      // Redirect to error page
      router.push(`/${locale}/error-page`)
    }
  }, [orgError, router, locale])

  // Validate and set organization when data loads
  useEffect(() => {
    if (organizations.length === 0) return

    // Check if selected org is valid for current user
    const isValidOrg = selectedOrgId && organizations.some(org => org.id === selectedOrgId)

    if (!isValidOrg) {
      // Clear invalid selection and select first org
      setSelectedOrgId(organizations[0]!.id)
    }
  }, [organizations, selectedOrgId, setSelectedOrgId])

  const selectedOrg = organizations.find(org => org.id === selectedOrgId)

  // Don't render header if there's an error (while redirecting)
  if (orgError) {
    return null
  }

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsLocaleOpen(false)
      return
    }

    startTransition(() => {
      // Extract pathname without locale
      // pathname is like /en-US/dashboard or /pt-BR/dashboard
      const segments = pathname.split('/')
      // Remove empty string and locale from segments
      const pathWithoutLocale = segments.slice(2).join('/') || ''

      // Build new path with new locale
      const newPath = `/${newLocale}${pathWithoutLocale ? `/${pathWithoutLocale}` : ''}`

      router.replace(newPath)
      setIsLocaleOpen(false)
    })
  }

  const handleLogout = async () => {
    // Clear organization selection before logout
    clearSelectedOrg()

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(`/${locale}/auth`)
        },
      },
    })
  }

  return (
    <header className="h-16 bg-[rgba(2,44,34,0.8)] backdrop-blur-[12px] border-b border-[rgba(16,185,129,0.15)] flex items-center justify-between px-8 sticky top-0 z-50">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-['Sora',sans-serif] text-xl font-semibold">Dashboard</h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <button className="flex items-center gap-2.5 px-4 py-2 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-[10px] text-[#6ee7b7] text-sm cursor-pointer transition-all duration-[150ms] hover:border-[rgba(16,185,129,0.3)] hover:bg-[#044d3a]">
          <Search className="w-4 h-4" />
          <span>Buscar...</span>
          <span className="bg-[#022c22] px-2 py-0.5 rounded text-[0.75rem] font-['JetBrains_Mono',monospace]">
            ⌘K
          </span>
        </button>

        {/* Organization Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsOrgMenuOpen(!isOrgMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#a7f3d0] hover:bg-[rgba(5,150,105,0.08)] rounded-lg transition-colors"
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{selectedOrg?.name || 'Select Organization'}</span>
          </button>

          {isOrgMenuOpen && organizations.length > 0 && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOrgMenuOpen(false)}
              />

              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-56 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg shadow-lg z-50">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setSelectedOrgId(org.id)
                      setIsOrgMenuOpen(false)
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#f0fdf4] hover:bg-[rgba(5,150,105,0.08)] transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <Building2 className="h-4 w-4" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{org.name}</div>
                      <div className="text-xs text-[#6ee7b7]">{org.role}</div>
                    </div>
                    {selectedOrgId === org.id && <Check className="h-4 w-4 text-[#10b981]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Locale Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsLocaleOpen(!isLocaleOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#a7f3d0] hover:bg-[rgba(5,150,105,0.08)] rounded-lg transition-colors disabled:opacity-50"
            disabled={isPending}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{localeFlags[locale]}</span>
            <span className="hidden md:inline">{localeNames[locale]}</span>
          </button>

          {isLocaleOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsLocaleOpen(false)}
              />

              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg shadow-lg z-50">
                {locales.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLocaleChange(loc)}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#f0fdf4] hover:bg-[rgba(5,150,105,0.08)] transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <span>{localeFlags[loc]}</span>
                    <span className="flex-1 text-left">{localeNames[loc]}</span>
                    {locale === loc && <Check className="h-4 w-4 text-[#10b981]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Help Button */}
        <button className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-transparent border border-transparent text-[#a7f3d0] cursor-pointer transition-all duration-[150ms] hover:bg-[#033a2d] hover:border-[rgba(16,185,129,0.15)]">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-transparent border border-transparent text-[#a7f3d0] cursor-pointer transition-all duration-[150ms] relative hover:bg-[#033a2d] hover:border-[rgba(16,185,129,0.15)]">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ef4444] rounded-full border-2 border-[#022c22]" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#059669] to-[#0d9488] flex items-center justify-center font-semibold text-sm cursor-pointer transition-transform duration-[150ms] hover:scale-105"
          >
            CF
          </button>

          {isUserMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />

              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg shadow-lg z-50">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#f0fdf4] hover:bg-[rgba(5,150,105,0.08)] transition-colors rounded-lg"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
