const withNextIntl = require('next-intl/plugin')('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@saastral/core', '@saastral/infrastructure', '@saastral/shared'],
  experimental: {
    typedRoutes: true,
  },
}

module.exports = withNextIntl(nextConfig)
