'use client'

import { useState, useTransition } from 'react'
import { useLocale } from 'next-intl'
import { usePathname as useNextPathname, useRouter as useNextRouter } from 'next/navigation'
import { Globe, Check } from 'lucide-react'
import { locales, localeNames, localeFlags, Locale } from '@/i18n/config'

export function LocaleSwitcher() {
  const locale = useLocale() as Locale
  const router = useNextRouter()
  const pathname = useNextPathname()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsOpen(false)
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
      setIsOpen(false)
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-[#a7f3d0] hover:bg-[rgba(5,150,105,0.08)] rounded-lg transition-colors disabled:opacity-50"
        disabled={isPending}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{localeFlags[locale]}</span>
        <span className="hidden md:inline">{localeNames[locale]}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
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
  )
}
