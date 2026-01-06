/**
 * Google API Client
 *
 * Low-level wrapper for Google Admin SDK API with:
 * - OAuth2 authentication (user consent flow)
 * - Token refresh handling
 * - Rate limiting and retry with exponential backoff
 * - Error mapping to domain errors
 */

import { google } from 'googleapis'
import type { admin_directory_v1 } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'

export interface OAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt?: number
  scope?: string
  tokenType?: string
}

export interface GoogleAPIClientConfig {
  oauthClientId: string
  oauthClientSecret: string
  oauthTokens: OAuthTokens
  onTokensRefreshed?: (tokens: OAuthTokens) => Promise<void> // Callback to save refreshed tokens
  customerId?: string // Optional Google Workspace customer ID
}

/**
 * Google API Client
 *
 * Handles OAuth2 authentication and API calls to Google Admin SDK.
 */
export class GoogleAPIClient {
  private admin: admin_directory_v1.Admin
  private oauth2Client: OAuth2Client
  private config: GoogleAPIClientConfig

  constructor(config: GoogleAPIClientConfig) {
    this.config = config

    // Create OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      config.oauthClientId,
      config.oauthClientSecret,
    )

    // Set credentials from stored tokens
    this.oauth2Client.setCredentials({
      access_token: config.oauthTokens.accessToken,
      refresh_token: config.oauthTokens.refreshToken,
      expiry_date: config.oauthTokens.expiresAt,
      scope: config.oauthTokens.scope,
      token_type: config.oauthTokens.tokenType || 'Bearer',
    })

    // Listen for token refresh events
    this.oauth2Client.on('tokens', async (tokens) => {
      // Update internal config
      if (tokens.access_token) {
        this.config.oauthTokens.accessToken = tokens.access_token
      }
      if (tokens.refresh_token) {
        this.config.oauthTokens.refreshToken = tokens.refresh_token
      }
      if (tokens.expiry_date) {
        this.config.oauthTokens.expiresAt = tokens.expiry_date
      }

      // Notify caller to persist refreshed tokens
      if (this.config.onTokensRefreshed) {
        await this.config.onTokensRefreshed({
          accessToken: tokens.access_token || this.config.oauthTokens.accessToken,
          refreshToken: tokens.refresh_token || this.config.oauthTokens.refreshToken,
          expiresAt: tokens.expiry_date || this.config.oauthTokens.expiresAt,
          scope: tokens.scope || this.config.oauthTokens.scope,
          tokenType: tokens.token_type || this.config.oauthTokens.tokenType,
        })
      }
    })

    // Initialize Admin SDK client with OAuth2
    this.admin = google.admin({
      version: 'directory_v1',
      auth: this.oauth2Client,
    })
  }

  /**
   * Get Admin SDK client
   */
  getAdmin(): admin_directory_v1.Admin {
    return this.admin
  }

  /**
   * Test connection to Google Workspace
   *
   * Verifies credentials by attempting to fetch the customer info.
   */
  async testConnection(): Promise<void> {
    try {
      // Try to list users with a small page size to test connection
      await this.admin.users.list({
        customer: this.config.customerId || 'my_customer',
        maxResults: 1,
      })
    } catch (error) {
      throw this.mapGoogleError(error, 'Connection test failed')
    }
  }

  /**
   * List users with pagination
   *
   * @param pageSize - Number of users per page (max 500)
   * @param pageToken - Token for next page
   * @param includeDeleted - Include deleted users in results
   */
  async listUsers(pageSize = 500, pageToken?: string, includeDeleted = false): Promise<{
    users: admin_directory_v1.Schema$User[]
    nextPageToken?: string
  }> {
    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.admin.users.list({
          customer: this.config.customerId || 'my_customer',
          maxResults: Math.min(pageSize, 500), // Google max is 500
          pageToken,
          projection: 'full', // Get all user fields
          orderBy: 'email',
          showDeleted: includeDeleted ? 'true' : undefined, // Include deleted users if requested
        })
      })

      return {
        users: response.data.users || [],
        nextPageToken: response.data.nextPageToken || undefined,
      }
    } catch (error) {
      throw this.mapGoogleError(error, 'Failed to list users')
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<admin_directory_v1.Schema$User | null> {
    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.admin.users.get({
          userKey: email,
          projection: 'full',
        })
      })

      return response.data
    } catch (error: any) {
      // Return null if user not found
      if (error.code === 404 || error.status === 404) {
        return null
      }
      throw this.mapGoogleError(error, `Failed to get user ${email}`)
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<admin_directory_v1.Schema$User | null> {
    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.admin.users.get({
          userKey: userId,
          projection: 'full',
        })
      })

      return response.data
    } catch (error: any) {
      // Return null if user not found
      if (error.code === 404 || error.status === 404) {
        return null
      }
      throw this.mapGoogleError(error, `Failed to get user ${userId}`)
    }
  }

  /**
   * List organizational units
   */
  async listOrgUnits(): Promise<admin_directory_v1.Schema$OrgUnit[]> {
    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.admin.orgunits.list({
          customerId: this.config.customerId || 'my_customer',
          type: 'all', // Get all org units
        })
      })

      return response.data.organizationUnits || []
    } catch (error) {
      throw this.mapGoogleError(error, 'Failed to list organizational units')
    }
  }

  /**
   * Get organizational unit by ID
   */
  async getOrgUnitById(orgUnitPath: string): Promise<admin_directory_v1.Schema$OrgUnit | null> {
    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.admin.orgunits.get({
          customerId: this.config.customerId || 'my_customer',
          orgUnitPath: orgUnitPath,
        })
      })

      return response.data
    } catch (error: any) {
      // Return null if not found
      if (error.code === 404 || error.status === 404) {
        return null
      }
      throw this.mapGoogleError(error, `Failed to get org unit ${orgUnitPath}`)
    }
  }

  /**
   * Retry with exponential backoff
   *
   * Handles rate limiting (429) and transient errors (500, 503).
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 5,
    baseDelay = 1000,
  ): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error: any) {
        lastError = error

        // Check if error is retryable
        const isRateLimited = error.code === 429 || error.status === 429
        const isServerError =
          error.code === 500 ||
          error.status === 500 ||
          error.code === 503 ||
          error.status === 503

        if (!isRateLimited && !isServerError) {
          // Not retryable, throw immediately
          throw error
        }

        // Last attempt, don't retry
        if (attempt === maxRetries - 1) {
          throw error
        }

        // Calculate delay with exponential backoff and jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError || new Error('Retry failed')
  }

  /**
   * Map Google API errors to domain errors
   */
  private mapGoogleError(error: any, context: string): Error {
    const message = error.message || error.toString()
    const code = error.code || error.status

    // Build error message with context
    let errorMessage = `${context}: ${message}`

    if (code === 401 || code === 403) {
      errorMessage = `Authentication failed: ${message}. Check OAuth tokens or re-authorize the integration.`
    } else if (code === 404) {
      errorMessage = `${context}: Resource not found`
    } else if (code === 429) {
      errorMessage = `${context}: Rate limit exceeded`
    } else if (code === 500 || code === 503) {
      errorMessage = `${context}: Google API server error`
    }

    const mappedError = new Error(errorMessage)
    ;(mappedError as any).originalError = error
    ;(mappedError as any).code = code

    return mappedError
  }
}
