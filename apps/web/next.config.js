const withNextIntl = require('next-intl/plugin')(
  // Path to request config
  './src/i18n/request.ts'
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@saastral/core', '@saastral/infrastructure', '@saastral/shared'],
}

module.exports = withNextIntl(nextConfig)
