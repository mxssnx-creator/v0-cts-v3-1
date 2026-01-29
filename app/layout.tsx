import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { StyleInitializer } from "@/components/style-initializer"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/sonner"
import { SiteLoggerProvider } from "@/components/site-logger-provider"
import { DatabaseInitAlert } from "@/components/database-init-alert"
import { DatabaseInitializer } from "@/components/database-initializer"

export const metadata: Metadata = {
  title: "CTS v3 - Crypto Trading System",
  description: "Advanced crypto trading system with real-time analytics and automated strategies",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="antialiased style-default" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans">
        <StyleInitializer />
        <DatabaseInitializer />
        <ThemeProvider
          attribute="class"
          defaultTheme="white"
          enableSystem={false}
          themes={["dark", "white", "grey", "blackwhite"]}
        >
          <AuthProvider>
            <SiteLoggerProvider>
              <DatabaseInitAlert />
              <SidebarProvider defaultOpen={true}>
                <AppSidebar />
                <main className="flex-1 w-full">{children}</main>
              </SidebarProvider>
            </SiteLoggerProvider>
          </AuthProvider>
          <Toaster position="top-right" expand={true} richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
