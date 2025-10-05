import type { NextConfig } from 'next';

import '@/environment-variables';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['pino'],
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],

  experimental: {
    browserDebugInfoInTerminal: true,
    devtoolSegmentExplorer: true,
    devtoolNewPanelUI: true,
    reactCompiler: true,
    staleTimes: {
      dynamic: 0,
      static: 90,
    },
  },
};

export default nextConfig;
