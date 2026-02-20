const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent mailparser (CJS module) from being bundled by webpack
  serverExternalPackages: ['mailparser'],

  webpack(config) {
    // Resolve cross-boundary imports for adapters/ and backend/ outside sentinel-web/
    config.resolve.alias = {
      ...config.resolve.alias,
      '@adapters': path.resolve(__dirname, '../adapters'),
      '@backend': path.resolve(__dirname, '../backend'),
    };
    return config;
  },
};

module.exports = nextConfig;
