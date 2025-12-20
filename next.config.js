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
    return config;
  },
};

module.exports = withNextIntl(nextConfig);