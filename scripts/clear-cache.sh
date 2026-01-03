#!/bin/bash

# Clear all build caches for CTS v3.1
# This script removes all cached build artifacts

echo "🧹 Clearing CTS v3.1 build caches..."

# Remove Next.js cache
if [ -d ".next" ]; then
  echo "  ✓ Removing .next directory..."
  rm -rf .next
fi

# Remove Turbopack cache
if [ -d ".turbo" ]; then
  echo "  ✓ Removing .turbo directory..."
  rm -rf .turbo
fi

# Remove TypeScript cache
if [ -f "tsconfig.tsbuildinfo" ]; then
  echo "  ✓ Removing TypeScript build info..."
  rm -f tsconfig.tsbuildinfo
fi

# Remove node_modules/.cache
if [ -d "node_modules/.cache" ]; then
  echo "  ✓ Removing node_modules cache..."
  rm -rf node_modules/.cache
fi

# Remove Vercel cache
if [ -d ".vercel" ]; then
  echo "  ✓ Removing .vercel directory..."
  rm -rf .vercel
fi

echo ""
echo "✅ All caches cleared!"
echo ""
echo "Next steps:"
echo "  1. Run: npm install"
echo "  2. Run: npm run dev"
echo ""
