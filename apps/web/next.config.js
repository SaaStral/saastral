/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@saastral/core', '@saastral/infrastructure', '@saastral/shared'],
  experimental: {
    typedRoutes: true,
  },
}

module.exports = nextConfig
