#!/bin/bash

# CTS v3.1 - Post-Install Native Module Rebuild Prompt
# This script prompts the user to rebuild native modules (better-sqlite3, sharp)

# Check if running in CI/CD environment
if [ -n "$CI" ] || [ -n "$VERCEL" ] || [ -n "$NETLIFY" ]; then
    echo "CI/CD environment detected, skipping rebuild prompt"
    exit 0
fi

# Check if running in non-interactive mode
if [ ! -t 0 ]; then
    echo "Non-interactive mode detected, skipping rebuild"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CTS v3.1 - Native Module Rebuild"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Some native modules (better-sqlite3, sharp) may need"
echo "to be rebuilt for your specific platform."
echo ""
echo "This is typically needed when:"
echo "  • Switching between different Node.js versions"
echo "  • Moving between different operating systems"
echo "  • Encountering 'Module did not self-register' errors"
echo ""
read -p "Would you like to rebuild native modules now? [y/N]: " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Rebuilding native modules..."
    npm rebuild better-sqlite3 sharp 2>&1
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Native modules rebuilt successfully!"
    else
        echo ""
        echo "⚠ Warning: Some modules failed to rebuild."
        echo "  This is usually fine for development."
        echo "  If you encounter errors, try:"
        echo "    npm rebuild better-sqlite3"
        echo "    npm rebuild sharp"
    fi
else
    echo ""
    echo "Skipping rebuild. You can rebuild later with:"
    echo "  npm rebuild better-sqlite3"
    echo "  npm rebuild sharp"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
