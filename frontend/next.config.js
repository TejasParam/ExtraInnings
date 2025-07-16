/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: false,
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  async redirects() {
    return []
  },
}

module.exports = nextConfig
