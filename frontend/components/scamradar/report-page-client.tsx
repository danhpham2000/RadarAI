"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/scamradar/auth-provider"
import { LoadingState } from "@/components/scamradar/loading-state"
import { fetchReport } from "@/lib/api"
import type { ReportRecord } from "@/lib/types"
import { AnalysisReportPanel } from "@/components/scamradar/report-view"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ReportPageClient({ reportId }: { reportId: string }) {
  const { isAuthenticated, ready, token } = useAuth()
  const [report, setReport] = useState<ReportRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) {
      return
    }
    if (!isAuthenticated || !token) {
      return
    }
    void (async () => {
      try {
        const data = await fetchReport(reportId, token)
        setReport(data)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load this report.")
      }
    })()
  }, [isAuthenticated, ready, reportId, token])

  if (!ready) {
    return <LoadingState title="Loading report..." description="Retrieving your account session." />
  }

  if (!isAuthenticated) {
    return (
      <Card className="border-0 bg-[color:var(--surface)]">
        <CardHeader>
          <CardTitle className="font-[family:var(--font-heading)] text-2xl">Sign in to open saved reports</CardTitle>
          <CardDescription>This report belongs to an account-backed history view.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 bg-[color:var(--surface)]">
        <CardHeader>
          <CardTitle className="font-[family:var(--font-heading)] text-2xl">Report unavailable</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!report) {
    return <LoadingState title="Loading report..." description="Retrieving the saved analysis." />
  }

  return (
    <AnalysisReportPanel
      data={{
        id: report.id,
        createdAt: report.created_at,
        inputType: report.input_type,
        platform: report.platform,
        rawText: report.raw_text,
        url: report.url,
        screenshotUrl: report.screenshot_url,
        riskScore: report.risk_score,
        riskLevel: report.risk_level,
        scamCategories: report.scam_categories,
        summary: report.summary,
        redFlags: report.red_flags,
        explanation: report.explanation,
        recommendedAction: report.recommended_action,
        safeReply: report.safe_reply,
        reportSummary: report.report_summary,
        confidence: report.confidence,
        matchedPatterns: report.matched_patterns,
        detectedUrls: report.url_checks,
      }}
    />
  )
}
