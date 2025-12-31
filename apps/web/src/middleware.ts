import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'

export default createMiddleware({
  locales,
  defaultLocale,

  // Locale detection strategy
  localeDetection: true,

  // Locale prefix configuration
  localePrefix: 'as-needed', // 'always' | 'as-needed' | 'never'

  // Cookie disabled - using locale prefix in URL
  // localeCookie: {
  //   name: 'NEXT_LOCALE',
  //   maxAge: 60 * 60 * 24 * 365, // 1 year
  // },
})

export const config = {
  // Matcher for routes that need i18n
  matcher: [
    // Match all routes except:
    // - API routes
    // - Next.js internals (_next)
    // - Static files (.*\..*)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
