import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
    // Optimize images for M2 GPU acceleration
    formats: ['image/webp', 'image/avif'],
  },
  // Optimize fonts and assets
  optimizeFonts: true,
  // Webpack optimizations for M2 multi-core performance
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Enable parallel processing for production builds
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }
    return config;
  },
  // Enable SWC compiler optimizations
  swcMinify: true,
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default bundleAnalyzer(nextConfig);
