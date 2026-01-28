/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['lucide-react'],
  serverExternalPackages: [
    'ccxt',
    'protobufjs',
    '@dydxprotocol/v4-proto',
    'long',
    'protobufjs/minimal',
  ],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  productionBrowserSourceMaps: false,
  compress: true,
  turbopack: {},
}

export default nextConfig
