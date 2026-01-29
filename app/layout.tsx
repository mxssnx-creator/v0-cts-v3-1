import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { SiteLoggerProvider } from "@/components/site-logger-provider"
import { SidebarProvider } from "@/components/ui/sidebar"

export const metadata: Metadata = {
  title: "CTS v3.1 - Crypto Trading System",
  description: "Advanced cryptocurrency trading system with AI-powered strategies",
  viewport: "width=device-width, initial-scale=1, user-scalable=no",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <AuthProvider>
            <SiteLoggerProvider>
              <SidebarProvider>
                {children}
              </SidebarProvider>
            </SiteLoggerProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
