"use client"

import { useAuth } from "@/components/scamradar/auth-provider"
import { AccountGate } from "@/components/scamradar/account-gate"
import { LoadingState } from "@/components/scamradar/loading-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SettingsView() {
  const { isAuthenticated, ready, user } = useAuth()

  if (!ready) {
    return <LoadingState title="Loading settings..." description="Preparing your account preferences." />
  }

  if (!isAuthenticated) {
    return (
      <AccountGate
        title="Sign in to open settings"
        description="Settings are available for registered accounts only."
      />
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="border-0 bg-[color:var(--surface)]">
        <CardHeader>
          <CardTitle className="font-[family:var(--font-heading)] text-2xl text-[color:var(--ink-strong)]">
            Account
          </CardTitle>
          <CardDescription className="text-[color:var(--ink-soft)]">
            Your registered account can store report history and uploaded screenshots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-[color:var(--ink-strong)]">
          <p>Email</p>
          <p className="rounded-2xl border border-black/5 bg-white/75 px-4 py-3 font-medium">
            {user?.email}
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 bg-[color:var(--surface)]">
        <CardHeader>
          <CardTitle className="font-[family:var(--font-heading)] text-2xl text-[color:var(--ink-strong)]">
            Storage
          </CardTitle>
          <CardDescription className="text-[color:var(--ink-soft)]">
            Saved reports and screenshots remain tied to your signed-in account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-[color:var(--ink-strong)]">
          <p>Account-backed report history is available from the History page.</p>
          <p>Uploaded screenshots can be linked to saved reports for later review.</p>
          <p>Anonymous scans remain available on the Analyze page without being stored in account history.</p>
        </CardContent>
      </Card>
    </div>
  )
}
