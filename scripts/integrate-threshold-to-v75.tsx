#!/usr/bin/env bun

/**
 * Integration script to add threshold management to recovered v75 settings
 * This merges the new threshold features with the v75 settings structure
 */

import fs from "fs/promises"
import path from "path"

async function integrateThresholdFeatures() {
  console.log("\n🔧 Integrating Threshold Management into v75 Settings...\n")

  const settingsPath = path.join(process.cwd(), "app/settings/page.tsx")

  try {
    // Read the recovered v75 settings page
    let content = await fs.readFile(settingsPath, "utf-8")

    console.log("📖 Reading recovered v75 settings page...")

    // Check if threshold features are already integrated
    if (content.includes("ThresholdManagement") && content.includes("AutoRecoveryControl")) {
      console.log("✅ Threshold features already integrated!")
      return
    }

    console.log("🔨 Adding threshold management imports...")

    // Add threshold management imports after existing imports
    const importSection = content.match(/(import.*from.*\n)+/)?.[0] || ""
    const lastImportIndex = content.lastIndexOf("import")
    const importEndIndex = content.indexOf("\n", lastImportIndex) + 1

    const newImports = `import { ThresholdManagement } from "@/components/settings/threshold-management"
import { AutoRecoveryControl } from "@/components/settings/auto-recovery-control"
import { Tabs, TabsContent } from "@/components/ui/tabs" // Import Tabs component
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card" // Import Card components
`

    content = content.slice(0, importEndIndex) + newImports + content.slice(importEndIndex)

    console.log("🔨 Adding threshold components to System tab...")

    // Find the System tab content section
    const systemTabMatch = content.match(/<TabsContent value="system"[^>]*>([\s\S]*?)<\/TabsContent>/)

    if (systemTabMatch) {
      const systemTabContent = systemTabMatch[1]
      const systemTabIndex = systemTabMatch.index!

      // Add threshold management before the closing </TabsContent>
      const enhancedSystemTab = `<TabsContent value="system" className="space-y-6">
${systemTabContent.trim()}

              <Card>
                <CardHeader>
                  <CardTitle>Position Threshold Management</CardTitle>
                  <CardDescription>
                    Configure position limits and automatic cleanup thresholds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ThresholdManagement />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Auto-Recovery System</CardTitle>
                  <CardDescription>
                    Monitor and manage automatic recovery for critical services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AutoRecoveryControl />
                </CardContent>
              </Card>
            </TabsContent>`

      // Find the Tabs component section
      const tabsMatch = content.match(/<Tabs[^>]*>([\s\S]*?)<\/Tabs>/)

      if (tabsMatch) {
        const tabsContent = tabsMatch[1]
        const tabsIndex = tabsMatch.index!

        // Replace the existing TabsContent with the enhanced one
        const enhancedTabs = `<Tabs>
${tabsContent.trim().replace(systemTabMatch[0], enhancedSystemTab)}
</Tabs>`

        content = content.slice(0, tabsIndex) + enhancedTabs + content.slice(tabsIndex + tabsMatch[0].length)
      } else {
        console.error("❌ Tabs component not found in the settings page.")
        process.exit(1)
      }
    }

    // Write the enhanced settings page
    await fs.writeFile(settingsPath, content)

    console.log("✅ Successfully integrated threshold management features!")
    console.log("📝 Updated: app/settings/page.tsx")
    console.log("\n✨ Integration complete!\n")
  } catch (error) {
    console.error("❌ Error during integration:", error)
    process.exit(1)
  }
}

// Execute integration
integrateThresholdFeatures().catch(console.error)
