"use client"

import Link from "next/link"

import { useAuth } from "@/components/scamradar/auth-provider"
import { LoadingState } from "@/components/scamradar/loading-state"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AccountGate({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const { ready, isAuthenticated } = useAuth()

  if (!ready) {
    return <LoadingState title="Loading account..." description="Checking your account session." />
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <Card className="border-0 bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
      <CardHeader className="space-y-3">
        <CardTitle className="font-[family:var(--font-heading)] text-2xl text-[color:var(--ink-strong)]">
          {title}
        </CardTitle>
        <CardDescription className="max-w-xl text-sm leading-6 text-[color:var(--ink-soft)]">
          {description}
        </CardDescription>
        <div className="flex flex-wrap gap-3 pt-2">
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
      </CardHeader>
    </Card>
  )
}
