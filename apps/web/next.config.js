const withNextIntl = require('next-intl/plugin')(
  // Path to request config
  './src/i18n/request.ts'
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@saastral/core', '@saastral/infrastructure', '@saastral/shared', '@saastral/cloud'],

  // Prevent Node.js modules from being bundled in Edge Runtime
  experimental: {
    serverComponentsExternalPackages: ['pg', 'better-auth', '@prisma/client'],
  },
}

module.exports = withNextIntl(nextConfig)
