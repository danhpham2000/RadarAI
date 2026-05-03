"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CalendarDays, ChevronRight } from "lucide-react"

import { useAuth } from "@/components/scamradar/auth-provider"
import { LoadingState } from "@/components/scamradar/loading-state"
import { fetchReports } from "@/lib/api"
import type { ReportRecord } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RiskPill } from "@/components/scamradar/risk-pill"

export function HistoryView() {
  const { isAuthenticated, ready, token } = useAuth()
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) {
      return
    }
    if (!isAuthenticated || !token) {
      setLoading(false)
      return
    }
    void (async () => {
      try {
        const data = await fetchReports(token)
        setReports(data)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load reports.")
      } finally {
        setLoading(false)
      }
    })()
  }, [isAuthenticated, ready, token])

  if (!ready) {
    return <LoadingState title="Loading history..." description="Retrieving your account session." />
  }

  if (!isAuthenticated) {
    return (
      <HistoryShell
        title="Sign in to view history"
        description="Anonymous scans are available on the Analyze page, but saved report history is only available for registered accounts."
      />
    )
  }

  if (loading) {
    return <LoadingState title="Loading history..." description="Retrieving saved scans." />
  }

  if (error) {
    return <HistoryShell title="History unavailable" description={error} />
  }

  if (reports.length === 0) {
    return (
      <HistoryShell
        title="No reports yet"
        description="Run a scan from the Analyze page to start building your report history."
      />
    )
  }

  return (
    <div className="space-y-5">
      {reports.map((report) => (
        <Link key={report.id} href={`/reports/${report.id}`} className="block">
          <Card className="border-0 bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <RiskPill level={report.risk_level} />
                <CardTitle className="font-[family:var(--font-heading)] text-xl">
                  {report.summary}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  {new Date(report.created_at).toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-[color:var(--ink-soft)]">
                <span className="text-sm">{report.platform || "Other"}</span>
                <ChevronRight className="size-5" />
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-sm text-[color:var(--ink-soft)]">
              {report.scam_categories.slice(0, 3).map((category) => (
                <span key={category} className="rounded-full bg-[color:var(--surface-muted)] px-3 py-1">
                  {category}
                </span>
              ))}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function HistoryShell({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-0 bg-[color:var(--surface)]">
      <CardHeader>
        <CardTitle className="font-[family:var(--font-heading)] text-2xl">{title}</CardTitle>
        <CardDescription className="max-w-xl text-sm leading-6">{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
