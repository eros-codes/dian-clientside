/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'utf-8-validate': require.resolve('./mocks/empty.js'),
      'bufferutil': require.resolve('./mocks/empty.js'),
    };
    // Use in-memory cache to avoid webpack PackFileCacheStrategy filesystem
    // serialization warnings when building in some environments (Vercel).
    try {
      if (!config.cache) {
        config.cache = { type: 'memory' };
      } else if (config.cache && config.cache.type === 'filesystem') {
        config.cache.type = 'memory';
      }
    } catch (e) {
      // if anything goes wrong, keep original config
    }

    return config;
  },
};

module.exports = withNextIntl(nextConfig);