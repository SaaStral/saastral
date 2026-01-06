/**
 * Google Workspace OAuth Callback Endpoint
 *
 * CRITICAL - Handles OAuth callback from Google.
 *
 * Flow:
 * 1. Google redirects here with authorization code
 * 2. Exchange code for access + refresh tokens
 * 3. Create Integration entity via IntegrationService
 * 4. Encrypt and save credentials
 * 5. Enqueue initial sync job
 * 6. Redirect to success page
 */

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getContainer } from '@saastral/infrastructure'
import { Integration } from '@saastral/core'

/**
 * GET /api/integrations/google/callback
 *
 * Query params:
 * - code: Authorization code from Google
 * - state: CSRF token with orgId and redirectUrl
 * - error: Optional error from Google
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle user denial
    if (error) {
      console.error('Google OAuth error:', error)
      const errorMessage = error === 'access_denied' ? 'Authorization was cancelled' : error
      return NextResponse.redirect(
        new URL(
          `/settings/integrations?error=${encodeURIComponent(errorMessage)}`,
          request.url,
        ),
      )
    }

    // Validate parameters
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 },
      )
    }

    // Decode and validate state
    let stateData: { orgId: string; redirectUrl: string; token: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
      if (!stateData.orgId || !stateData.token) {
        throw new Error('Invalid state format')
      }
    } catch (err) {
      console.error('Invalid state parameter:', err)
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 })
    }

    const { orgId, redirectUrl } = stateData

    // Get container for database access
    const container = getContainer()

    // Get OAuth credentials from database (required)
    const existingIntegration = await container.integrationRepo.findByOrganizationAndProvider(
      orgId,
      'google_workspace',
    )

    if (!existingIntegration) {
      console.error(`No Google Workspace integration found for organization ${orgId}`)
      return NextResponse.redirect(
        new URL(
          `/settings/integrations?error=${encodeURIComponent('Integration not found. Please configure OAuth credentials first.')}`,
          request.url,
        ),
      )
    }

    const config = existingIntegration.toObject().config
    const clientId = config?.oauthClientId as string | undefined
    const clientSecret = config?.oauthClientSecret as string | undefined

    if (!clientId || !clientSecret) {
      console.error(`OAuth credentials not configured for organization ${orgId}`)
      return NextResponse.redirect(
        new URL(
          `/settings/integrations?error=${encodeURIComponent('OAuth credentials missing. Please configure Client ID and Secret.')}`,
          request.url,
        ),
      )
    }

    // Redirect URI comes from env (same for all orgs)
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    if (!redirectUri) {
      console.error('GOOGLE_REDIRECT_URI environment variable not set')
      return NextResponse.redirect(
        new URL(
          `/settings/integrations?error=${encodeURIComponent('Server configuration error')}`,
          request.url,
        ),
      )
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('Missing tokens from Google:', tokens)
      return NextResponse.json(
        { error: 'Failed to obtain tokens from Google' },
        { status: 500 },
      )
    }

    // Get user info to extract admin email
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()

    const adminEmail = userInfo.data.email
    if (!adminEmail) {
      console.error('Failed to get admin email from Google')
      return NextResponse.json(
        { error: 'Failed to get admin email from Google' },
        { status: 500 },
      )
    }

    // Update existing integration with OAuth tokens
    // The integration already exists with OAuth client credentials from the UI
    // Now we add the OAuth tokens obtained from the authorization flow
    const integrationData = existingIntegration.toObject()
    const updatedConfig = {
      ...integrationData.config,
      adminEmail,
      oauthTokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date,
        scope: tokens.scope,
        tokenType: tokens.token_type || 'Bearer',
      },
      scopes: [
        'https://www.googleapis.com/auth/admin.directory.user.readonly',
        'https://www.googleapis.com/auth/admin.directory.orgunit.readonly',
      ],
    }

    // Reconstruct integration with updated config
    const integration = Integration.fromPersistence({
      ...integrationData,
      config: updatedConfig,
      status: 'active', // Activate the integration
      updatedAt: new Date(),
    })

    // Activate integration (sets status to active and validates)
    integration.activate()

    // Save updated integration
    await container.integrationRepo.save(integration)

    // TODO: Enqueue initial sync job
    // This will be implemented in Phase 6 (Background Jobs)
    // For now, we could trigger a manual sync or just set status to active
    console.log(
      `Integration ${integration.id} created for org ${orgId}. Ready for initial sync.`,
    )

    // Redirect to success page
    const successUrl = new URL(redirectUrl, request.url)
    successUrl.searchParams.set('integration', 'google')
    successUrl.searchParams.set('status', 'connected')

    return NextResponse.redirect(successUrl)
  } catch (error) {
    console.error('Error in Google OAuth callback:', error)

    // Extract error message
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to complete Google authorization'

    // Redirect to error page
    return NextResponse.redirect(
      new URL(
        `/settings/integrations?error=${encodeURIComponent(errorMessage)}`,
        request.url,
      ),
    )
  }
}
