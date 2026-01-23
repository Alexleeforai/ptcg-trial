import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for better error detection
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'snkrdunk.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.snkrdunk.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.snkrdunk.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pokemontcg.io',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Production URL (optional - add your actual domain)
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : '',
};

export default withNextIntl(nextConfig);
