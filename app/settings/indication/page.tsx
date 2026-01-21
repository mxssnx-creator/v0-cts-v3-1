"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import AuthGuard from "@/components/auth-guard"

export default function IndicationSettingsPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/settings/indications/main")
  }, [router])

  return (
    <AuthGuard>
      <div className="flex min-h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </AuthGuard>
  )
}
