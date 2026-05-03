"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FolderOpen, LayoutDashboard, Search, Settings2, ShieldCheck } from "lucide-react"

import { useAuth } from "@/components/scamradar/auth-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const workspaceLinks = [
  { href: "/analyze", label: "Analyze", icon: Search },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: ShieldCheck },
  { href: "/storage", label: "Storage", icon: FolderOpen },
  { href: "/settings", label: "Settings", icon: Settings2 },
]

export function AccountWorkspace({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { isAuthenticated, ready } = useAuth()

  if (!ready || !isAuthenticated) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 max-w-2xl">
          <h1 className="font-[family:var(--font-heading)] text-4xl text-[color:var(--ink-strong)]">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">{description}</p>
        </div>
        {children}
      </main>
    )
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        variant="floating"
        className="top-[88px] h-[calc(100svh-104px)] px-4"
      >
        <SidebarContent className="rounded-[28px] border border-black/5 bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              Workspace
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {workspaceLinks.map((link) => {
                  const Icon = link.icon
                  const isActive =
                    pathname === link.href ||
                    (link.href === "/history" && pathname.startsWith("/reports/"))
                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="h-11 rounded-2xl text-[color:var(--ink-strong)] data-[active=true]:bg-[color:var(--accent)] data-[active=true]:text-[color:var(--accent-foreground)] hover:bg-white/85"
                      >
                        <Link href={link.href}>
                          <Icon className="size-4" />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="bg-transparent">
        <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mb-8 max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <SidebarTrigger className="rounded-full border border-black/8 bg-white text-[color:var(--ink-strong)] shadow-sm md:hidden" />
            </div>
            <h1 className="font-[family:var(--font-heading)] text-4xl text-[color:var(--ink-strong)]">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">{description}</p>
          </div>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
