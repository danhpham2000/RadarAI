"use client"

import Link from "next/link"

import { useAuth } from "@/components/scamradar/auth-provider"
import { Button } from "@/components/ui/button"

const publicLinks = [
  { href: "/analyze", label: "Analyze" },
]

export function SiteHeader() {
  const { isAuthenticated, logout, ready, user } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-[color:var(--surface)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[color:var(--accent)] font-[family:var(--font-heading)] text-sm font-semibold text-[color:var(--accent-foreground)]">
            RA
            </span>
          <div>
            <p className="font-[family:var(--font-heading)] text-sm font-semibold text-[color:var(--ink-strong)]">
              RadarAI
            </p>
            <p className="text-xs text-[color:var(--ink-soft)]">
              Scam checks for social messages, listings, and links
            </p>
          </div>
        </Link>
        <div className="hidden items-center gap-4 md:flex">
          {!isAuthenticated ? (
            <nav className="flex items-center gap-6 text-sm font-medium text-[color:var(--ink-soft)]">
              {publicLinks.map((link) => (
                <Link key={link.href} href={link.href} className="transition hover:text-[color:var(--ink-strong)]">
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
          {ready ? (
            isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[color:var(--ink-soft)]">{user?.email}</span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-[color:var(--accent)] text-[color:var(--accent-foreground)] hover:bg-[color:var(--accent)]/90"
                >
                  <Link href="/register">Create account</Link>
                </Button>
              </div>
            )
          ) : null}
        </div>
      </div>
    </header>
  )
}
