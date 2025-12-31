export const locales = ['en-US', 'pt-BR'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en-US'

export const localeNames: Record<Locale, string> = {
  'en-US': 'English (US)',
  'pt-BR': 'Português (Brasil)',
}

export const localeFlags: Record<Locale, string> = {
  'en-US': '🇺🇸',
  'pt-BR': '🇧🇷',
}

// Configuration for formatting by locale
export const localeConfig: Record<Locale, {
  currency: string
  dateFormat: Intl.DateTimeFormatOptions
  numberFormat: Intl.NumberFormatOptions
}> = {
  'en-US': {
    currency: 'USD',
    dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
    numberFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  },
  'pt-BR': {
    currency: 'BRL',
    dateFormat: { day: '2-digit', month: '2-digit', year: 'numeric' },
    numberFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  },
}
