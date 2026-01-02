import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

// Create auth instance with database pool
export function createAuth(pool: Pool) {
  return betterAuth({
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-min-32-characters-long',
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },

    socialProviders: {
      // TODO: Add Google provider for Google Workspace integration
    },

    user: {
      modelName: 'users',
      fields: {
        emailVerified: 'email_verified',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      additionalFields: {
        preferences: {
          type: 'string',
          required: false,
          defaultValue: '{"language":"pt-BR","notifications":{"email":true,"inApp":true}}',
        },
        avatarUrl: {
          type: 'string',
          required: false,
          fieldName: 'avatar_url',
        },
        emailVerifiedAt: {
          type: 'date',
          required: false,
          fieldName: 'email_verified_at',
        },
        lastLoginAt: {
          type: 'date',
          required: false,
          fieldName: 'last_login_at',
        },
        failedLoginAttempts: {
          type: 'number',
          required: false,
          defaultValue: 0,
          fieldName: 'failed_login_attempts',
        },
        lockedUntil: {
          type: 'date',
          required: false,
          fieldName: 'locked_until',
        },
        deletedAt: {
          type: 'date',
          required: false,
          fieldName: 'deleted_at',
        },
      },
    },

    session: {
      modelName: 'betterauth_sessions',
      fields: {
        userId: 'user_id',
        expiresAt: 'expires_at',
        ipAddress: 'ip_address',
        userAgent: 'user_agent',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },

    account: {
      modelName: 'betterauth_accounts',
      fields: {
        userId: 'user_id',
        accountId: 'account_id',
        providerId: 'provider_id',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        idToken: 'id_token',
        accessTokenExpiresAt: 'access_token_expires_at',
        refreshTokenExpiresAt: 'refresh_token_expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },

    verification: {
      modelName: 'betterauth_verifications',
      fields: {
        expiresAt: 'expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },

    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      database: {
        generateId: 'uuid', // Generate UUIDs for all tables
      },
    },
  })
}
