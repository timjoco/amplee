// next.config.ts
import type { NextConfig } from 'next';

const isProd =
  process.env.VERCEL_ENV === 'production' ||
  process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { domains: ['images.unsplash.com'] },

  async redirects() {
    if (!isProd) return [];
    return [
      {
        source:
          '/((?!waitlist|_next|api|static|images|assets|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
        destination: '/waitlist',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
