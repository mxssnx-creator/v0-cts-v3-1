"use client"

import { useState } from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Activity,
  Target,
  Zap,
  TrendingUp,
  PieChart,
  Cog,
  Calculator,
  Layers,
  Home,
  Monitor,
  Workflow,
  LogOut,
  MessageSquare,
  FlaskConical,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { StyleSwitcher } from "@/components/style-switcher"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import type React from "react"

type MenuItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  subItems?: Array<{ title: string; href: string }>
}

const menuItems: MenuItem[] = [
  {
    title: "Overview",
    href: "/",
    icon: Home,
  },
  {
    title: "Live Trading",
    href: "/live-trading",
    icon: Activity,
  },
  {
    title: "Presets",
    href: "/presets",
    icon: Target,
  },
  {
    title: "Indications",
    href: "/indications",
    icon: Zap,
  },
  {
    title: "Strategies",
    href: "/strategies",
    icon: TrendingUp,
  },
  {
    title: "Statistics",
    href: "/statistics",
    icon: PieChart,
  },
  {
    title: "Position Analysis",
    href: "/analysis",
    icon: Calculator,
  },
  {
    title: "Structure",
    href: "/structure",
    icon: Layers,
  },
  {
    title: "Logistics",
    href: "/logistics",
    icon: Workflow,
  },
  {
    title: "Monitoring",
    href: "/monitoring",
    icon: Monitor,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Cog,
    subItems: [
      { title: "Overall", href: "/settings/overall" },
      { title: "Exchange", href: "/settings/exchange" },
      { title: "Indication", href: "/settings/indication" },
      { title: "Strategy", href: "/settings/strategy" },
      { title: "System", href: "/settings/system" },
    ],
  },
]

// Adding Additional menu items section for new features
const additionalItems: Array<{
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    title: "Chat History",
    href: "/additional/chat-history",
    icon: MessageSquare,
  },
  {
    title: "Volume Corrections",
    href: "/additional/volume-corrections",
    icon: FlaskConical,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">CT</span>
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-semibold text-xs">CTS v3</span>
              <span className="text-[10px] text-muted-foreground">Trading System</span>
            </div>
          </div>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.href || (item.subItems && item.subItems.some((sub) => pathname === sub.href))
                const hasSubItems = item.subItems && item.subItems.length > 0
                const isOpen = openSubmenu === item.title

                return (
                  <div key={item.href}>
                    <SidebarMenuItem>
                      {hasSubItems ? (
                        <SidebarMenuButton
                          onClick={() => toggleSubmenu(item.title)}
                          isActive={isActive}
                          tooltip={item.title}
                          className="h-9"
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.title}</span>
                          {isOpen ? (
                            <ChevronDown className="ml-auto h-4 w-4" />
                          ) : (
                            <ChevronRight className="ml-auto h-4 w-4" />
                          )}
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="h-9">
                          <Link href={item.href} className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span className="text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>

                    {hasSubItems && isOpen && (
                      <div className="ml-6 mt-1 space-y-1 group-data-[collapsible=icon]:hidden">
                        {item.subItems?.map((subItem) => {
                          const isSubActive = pathname === subItem.href
                          return (
                            <SidebarMenuItem key={subItem.href}>
                              <SidebarMenuButton asChild isActive={isSubActive} className="h-8">
                                <Link href={subItem.href} className="flex items-center gap-2">
                                  <span className="text-xs">{subItem.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Adding Additional section for new features */}
        {additionalItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs">Additional</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {additionalItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="h-9">
                        <Link href={item.href} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-1.5 space-y-2">
        {user && (
          <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-medium truncate">{user.username}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="w-full mt-1 h-7 text-xs justify-start">
              <LogOut className="h-3 w-3 mr-2" />
              Logout
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between gap-1 group-data-[collapsible=icon]:justify-center">
          <span className="text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">Appearance</span>
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col">
            <StyleSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
