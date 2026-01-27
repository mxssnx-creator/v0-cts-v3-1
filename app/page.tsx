'use client'

import { useEffect, useState } from 'react'
import { Dashboard } from '@/components/dashboard'
import { AppStartup } from '@/components/app-startup'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
          <p className="text-muted-foreground">Initializing trading system</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <AppStartup />
      <main className="min-h-screen bg-background">
        <Dashboard />
      </main>
    </>
  )
}
