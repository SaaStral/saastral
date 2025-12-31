import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
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
