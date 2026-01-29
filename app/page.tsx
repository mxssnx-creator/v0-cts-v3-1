"use client"

import { Suspense, lazy } from "react"
import { DatabaseInitAlert } from "@/components/database-init-alert"
import { Dashboard } from "@/components/dashboard"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/app-sidebar"
import { SiteLogger } from "@/components/site-logger"

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DatabaseInitAlert />
      <SiteLogger />
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto">
            <Dashboard />
          </main>
        </div>
      </div>
    </Suspense>
  )
}
