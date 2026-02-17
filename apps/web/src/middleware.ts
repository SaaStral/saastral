import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'

/**
 * Middleware for i18n routing
 *
 * Note: Authentication is handled at the page/layout level using server components,
 * not in middleware, because middleware runs in Edge Runtime and cannot access
 * Node.js modules like 'pg' or 'crypto' required by better-auth.
 */
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
