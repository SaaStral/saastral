/**
 * Google Workspace OAuth Authorization Endpoint
 *
 * Initiates OAuth flow by redirecting to Google consent screen.
 *
 * Flow:
 * 1. User clicks "Connect Google Workspace" in settings
 * 2. This endpoint generates OAuth URL with required scopes
 * 3. Redirects to Google consent screen
 * 4. Google redirects back to callback endpoint with code
 */

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import crypto from 'crypto'
import { getContainer, auth } from '@saastral/infrastructure'

// Force Node.js runtime (required for crypto and pg modules)
export const runtime = 'nodejs'

/**
 * GET /api/integrations/google/authorize
 *
 * Query params:
 * - orgId: Organization ID to link integration to
 * - redirectUrl: Optional URL to redirect after success (default: /settings/integrations)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const orgId = searchParams.get('orgId')
    const redirectUrl = searchParams.get('redirectUrl') || '/settings/integrations'

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId parameter' }, { status: 400 })
    }

    // Validate user has access to this organization
    const container = getContainer()
    const userOrgs = await container.organizationService.listUserOrganizations(session.user.id)
    if (!userOrgs.some(org => org.id === orgId)) {
      return NextResponse.json({ error: 'You do not have access to this organization' }, { status: 403 })
    }

    // Get OAuth credentials from database (required)
    const integration = await container.integrationRepo.findByOrganizationAndProvider(
      orgId,
      'google_workspace',
    )

    if (!integration) {
      console.error(`No Google Workspace integration found for organization ${orgId}`)
      return NextResponse.json(
        {
          error:
            'Google OAuth not configured. Please configure OAuth credentials in settings first.',
        },
        { status: 400 },
      )
    }

    const config = integration.toObject().config
    const clientId = config?.oauthClientId as string | undefined
    const clientSecret = config?.oauthClientSecret as string | undefined

    if (!clientId || !clientSecret) {
      console.error(`OAuth credentials not configured for organization ${orgId}`)
      return NextResponse.json(
        {
          error:
            'Google OAuth credentials missing. Please configure Client ID and Secret in settings.',
        },
        { status: 400 },
      )
    }

    // Redirect URI comes from env (same for all orgs)
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    if (!redirectUri) {
      console.error('GOOGLE_REDIRECT_URI environment variable not set')
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 },
      )
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

    // Generate state parameter for CSRF protection
    // State format: orgId:redirectUrl:randomToken
    const randomToken = crypto.randomBytes(32).toString('hex')
    const state = Buffer.from(
      JSON.stringify({
        orgId,
        redirectUrl,
        token: randomToken,
      }),
    ).toString('base64url')

    // Store state in session/cookie for validation in callback
    // For now, we'll validate in callback by decoding the state
    // In production, consider storing in Redis with expiration

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Request refresh token
      scope: [
        'https://www.googleapis.com/auth/admin.directory.user.readonly',
        'https://www.googleapis.com/auth/admin.directory.orgunit.readonly',
      ],
      state,
      prompt: 'consent', // Force consent screen to get refresh token
      // hd: 'example.com', // Optional: restrict to specific domain
    })

    // Redirect to Google consent screen
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error initiating Google OAuth:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Google authorization' },
      { status: 500 },
    )
  }
}
