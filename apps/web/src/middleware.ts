import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'

// Create the i18n middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export async function middleware(request: NextRequest) {
  // First, handle i18n
  const response = intlMiddleware(request)

  // Check if the path is a dashboard route
  const pathname = request.nextUrl.pathname
  const isDashboardRoute = pathname.includes('/dashboard')

  if (isDashboardRoute) {
    // Check for session cookie (BetterAuth uses 'better-auth.session_token' by default)
    const sessionToken = request.cookies.get('better-auth.session_token')

    if (!sessionToken) {
      // No session, redirect to auth page
      const locale = pathname.split('/')[1]
      const authUrl = new URL(`/${locale}/auth`, request.url)
      return NextResponse.redirect(authUrl)
    }
  }

  return response
}

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
