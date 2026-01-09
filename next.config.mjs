/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['lucide-react'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  productionBrowserSourceMaps: false,
  compress: true,
  output: 'standalone',
}

export default nextConfig
