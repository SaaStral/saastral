import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'
import { auth } from '@saastral/infrastructure'

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
    // Validate session using BetterAuth
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || !session.user) {
      // No valid session, redirect to auth page
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
