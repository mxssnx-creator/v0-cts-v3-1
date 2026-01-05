#!/bin/bash


echo "🚀 Executing Settings Page Recovery..."
echo "======================================"

# Run the recovery
bun scripts/recover-settings-now.ts

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Recovery completed successfully!"
    echo "   You can now deploy to Vercel."
    exit 0
else
    echo ""
    echo "❌ Recovery failed!"
    echo "   Please check the error messages above."
    exit 1
fi
