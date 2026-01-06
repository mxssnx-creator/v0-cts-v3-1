#!/bin/bash

echo "🔍 Verifying Settings Page Integrity..."
echo ""

# Check if the settings page exists
if [ -f "app/settings/page.tsx" ]; then
    echo "✅ Settings page exists"
else
    echo "❌ Settings page missing!"
    exit 1
fi

# Check for export default
if grep -q "export default function SettingsPage" app/settings/page.tsx; then
    echo "✅ Export default found"
else
    echo "❌ Export default missing!"
    exit 1
fi

# Check for key components
components=(
    "ThresholdManagement"
    "AutoRecoveryControl"
    "ExchangeConnectionManager"
    "InstallManager"
    "AutoIndicationSettings"
)

for component in "${components[@]}"; do
    if grep -q "$component" app/settings/page.tsx; then
        echo "✅ $component integrated"
    else
        echo "⚠️  $component not found"
    fi
done

# Check for tabs
tabs=("overall" "indications" "system" "advanced" "statistics")

for tab in "${tabs[@]}"; do
    if grep -q "value=\"$tab\"" app/settings/page.tsx; then
        echo "✅ Tab '$tab' configured"
    else
        echo "⚠️  Tab '$tab' missing"
    fi
done

# Count lines
lines=$(wc -l < app/settings/page.tsx)
echo ""
echo "📝 Total lines: $lines"

if [ $lines -gt 200 ]; then
    echo "✅ Page has substantial content"
else
    echo "⚠️  Page seems incomplete (less than 200 lines)"
fi

echo ""
echo "✨ Verification complete!"
