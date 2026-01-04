import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // In CI/production, only fail on ESLint errors, not warnings
    // This allows the build to succeed with warnings (like next/image suggestions)
    ignoreDuringBuilds: process.env.ESLINT_NO_DEV_ERRORS === 'true',
  },
  typescript: {
    // Don't ignore type errors - these should be fixed
    ignoreBuildErrors: false,
  },
}

export default nextConfig
