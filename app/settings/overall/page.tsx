"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import AuthGuard from "@/components/auth-guard"

export default function OverallSettingsPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/settings/overall/main")
  }, [router])

  return (
    <AuthGuard>
      <div className="flex min-h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </AuthGuard>
  )
}
