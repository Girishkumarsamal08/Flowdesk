import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Required for Docker deployment — bundles a minimal standalone Node server
  output: 'standalone',

  // Allow images from the backend API domain in production
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.onrender.com',
      },
      {
        protocol: 'https',
        hostname: '**.railway.app',
      },
    ],
  },
};

export default nextConfig;
