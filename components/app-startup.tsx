'use client'

import { useEffect, useState } from 'react'

export function AppStartup() {
  const [initialized, setInitialized] = useState(true)

  if (!initialized) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-card border rounded-lg p-8 shadow-lg max-w-sm w-full mx-4">
          <div className="space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-center text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
