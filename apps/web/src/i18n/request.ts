import { getRequestConfig } from 'next-intl/server'
import { locales, defaultLocale, Locale } from './config'

export default getRequestConfig(async ({ locale }) => {
  // Validate locale
  const validLocale = locales.includes(locale as Locale)
    ? locale as Locale
    : defaultLocale

  // Load messages
  const messages = await import(`../messages/${validLocale}`).then(
    (module) => module.default
  )

  return {
    locale: validLocale,
    messages,
    timeZone: 'America/New_York',
    now: new Date(),
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        },
      },
      number: {
        currency: {
          style: 'currency',
          currency: validLocale === 'pt-BR' ? 'BRL' : 'USD',
        },
        percent: {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        },
      },
    },
  }
})
