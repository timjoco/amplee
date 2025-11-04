import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { domains: ['images.unsplash.com'] },

  async redirects() {
    return [
      {
        source:
          '/((?!waitlist|_next|api|static|images|assets|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
        destination: '/waitlist',
        permanent: true, // set to true (308) when ready
      },
    ];
  },
};

export default nextConfig;
