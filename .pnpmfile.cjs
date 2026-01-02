'use strict'

// This fixes the "Ignored build scripts" warning

function readPackage(pkg, context) {
  // Allow build scripts for these critical packages
  const allowedBuildPackages = [
    'better-sqlite3',
    'sharp',
    '@tailwindcss/oxide',
    '@nestjs/core',
    'unrs-resolver',
    'esbuild',
    'swc'
  ]

  if (allowedBuildPackages.includes(pkg.name)) {
    context.log(`Allowing build scripts for ${pkg.name}`)
  }

  return pkg
}

module.exports = {
  hooks: {
    readPackage
  }
}
