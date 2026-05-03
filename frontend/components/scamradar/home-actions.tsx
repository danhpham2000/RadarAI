"use client"

import Link from "next/link"

import { useAuth } from "@/components/scamradar/auth-provider"
import { Button } from "@/components/ui/button"

export function HomeActions() {
  const { isAuthenticated, ready } = useAuth()

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        asChild
        size="lg"
        className="h-12 rounded-full bg-[color:var(--accent)] px-6 text-[color:var(--accent-foreground)] hover:bg-[color:var(--accent)]/90"
      >
        <Link href="/analyze">Start analysis</Link>
      </Button>

      {ready && isAuthenticated ? (
        <>
          <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6">
            <Link href="/dashboard">View dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6">
            <Link href="/settings">Open settings</Link>
          </Button>
        </>
      ) : (
        <>
          <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6">
            <Link href="/register">Create account</Link>
          </Button>
        </>
      )}
    </div>
  )
}
