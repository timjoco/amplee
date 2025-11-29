import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'osqneaoalcivslqvhjqk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/band-avatars/**',
      },
    ],

    // If you ever need more hosts later, add more entries to remotePatterns
  },

  async redirects() {
    return [];
  },
};

export default nextConfig;
