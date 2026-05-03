"use client"

import Link from "next/link"
import { useState } from "react"
import { Copy, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RiskPill } from "@/components/scamradar/risk-pill"
import { getApiBaseUrl } from "@/lib/api"
import type { MatchedPattern, RiskLevel, UrlCheckSummary } from "@/lib/types"

export interface AnalysisPanelData {
  id?: string
  createdAt?: string
  inputType?: string
  platform?: string | null
  rawText?: string
  url?: string
  screenshotUrl?: string | null
  riskScore: number
  riskLevel: RiskLevel
  scamCategories: string[]
  summary: string
  redFlags: string[]
  explanation: string
  recommendedAction: string
  safeReply: string
  reportSummary: string
  confidence: number
  matchedPatterns: MatchedPattern[]
  detectedUrls: UrlCheckSummary[]
}

export function AnalysisReportPanel({ data }: { data: AnalysisPanelData }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const screenshotHref =
    data.screenshotUrl && !data.screenshotUrl.startsWith("http")
      ? `${getApiBaseUrl()}${data.screenshotUrl}`
      : data.screenshotUrl
  const uploadedAssetLabel = getUploadedAssetLabel(data.inputType)
  const uploadedAssetLinkLabel = getUploadedAssetLinkLabel(data.inputType)

  async function copy(key: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopiedKey(key)
    window.setTimeout(() => setCopiedKey(null), 1200)
  }

  return (
    <div className="space-y-5">
      <Card className="border-0 bg-[color:var(--surface-strong)] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <RiskPill level={data.riskLevel} />
            <CardTitle className="font-[family:var(--font-heading)] text-3xl text-[color:var(--ink-strong)]">
              {data.riskScore}/100
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-[color:var(--ink-soft)]">
              {data.summary}
            </CardDescription>
          </div>
          <div className="space-y-2 text-right text-sm text-[color:var(--ink-soft)]">
            <p>Confidence {Math.round(data.confidence * 100)}%</p>
            {data.id ? (
              <Link
                href={`/reports/${data.id}`}
                className="inline-flex items-center gap-1 text-[color:var(--accent-foreground)] hover:underline"
              >
                Open full report <ExternalLink className="size-4" />
              </Link>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Primary category" value={data.scamCategories[0] || "Unknown"} />
          <MetricCard label="Platform" value={data.platform || "Not specified"} />
          <MetricCard
            label="Evidence"
            value={data.detectedUrls.length > 0 ? `${data.detectedUrls.length} link signal(s)` : "Message-based"}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="result" className="space-y-5">
        <TabsList
          variant="line"
          className="w-full justify-start gap-2 rounded-2xl bg-white/55 p-2"
        >
          <TabsTrigger
            value="result"
            className="rounded-xl px-4 py-2 hover:bg-white/80 hover:text-[color:var(--ink-strong)]"
          >
            Result
          </TabsTrigger>
          <TabsTrigger
            value="flags"
            className="rounded-xl px-4 py-2 hover:bg-white/80 hover:text-[color:var(--ink-strong)]"
          >
            Flags
          </TabsTrigger>
          <TabsTrigger
            value="action"
            className="rounded-xl px-4 py-2 hover:bg-white/80 hover:text-[color:var(--ink-strong)]"
          >
            Recommended action
          </TabsTrigger>
        </TabsList>

        <TabsContent value="result">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-0 bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
              <CardHeader>
                <CardTitle className="font-[family:var(--font-heading)]">Result summary</CardTitle>
                <CardDescription>{data.explanation}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-[color:var(--ink-soft)]">
                <p>{data.summary}</p>
                {data.rawText ? (
                  <div className="rounded-2xl border border-black/5 bg-white/70 px-4 py-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                      Submitted content
                    </p>
                    <p>{data.rawText}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <div className="space-y-5">
              <CopyCard
                title="Safe reply"
                description={data.safeReply}
                buttonLabel={copiedKey === "safeReply" ? "Copied" : "Copy"}
                onCopy={() => copy("safeReply", data.safeReply)}
              />

              <CopyCard
                title="Report summary"
                description={data.reportSummary}
                buttonLabel={copiedKey === "reportSummary" ? "Copied" : "Copy"}
                onCopy={() => copy("reportSummary", data.reportSummary)}
              />

              {data.screenshotUrl ? (
                <Card className="border-0 bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
                  <CardHeader>
                    <CardTitle className="font-[family:var(--font-heading)]">{uploadedAssetLabel}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={screenshotHref ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[color:var(--accent-foreground)] hover:underline"
                    >
                      {uploadedAssetLinkLabel} <ExternalLink className="size-4" />
                    </a>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="flags">
          <Card className="border-0 bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
            <CardHeader>
              <CardTitle className="font-[family:var(--font-heading)]">Why this was flagged</CardTitle>
              <CardDescription>Signals and matching patterns that pushed the risk score higher.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-[color:var(--ink-strong)]">Red flags</h3>
                <ul className="space-y-2 text-sm text-[color:var(--ink-soft)]">
                  {data.redFlags.map((flag) => (
                    <li key={flag} className="rounded-2xl border border-black/5 bg-white/70 px-4 py-3">
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>

              {data.detectedUrls.length > 0 ? (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-[color:var(--ink-strong)]">Detected links</h3>
                  <div className="space-y-3">
                    {data.detectedUrls.map((item) => (
                      <div key={item.url} className="rounded-2xl border border-black/5 bg-white/70 px-4 py-3">
                        <p className="text-sm font-medium text-[color:var(--ink-strong)]">{item.domain}</p>
                        <p className="mt-1 text-xs text-[color:var(--ink-soft)]">{item.url}</p>
                        <ul className="mt-3 space-y-1 text-sm text-[color:var(--ink-soft)]">
                          {item.suspicious_indicators.length > 0 ? (
                            item.suspicious_indicators.map((flag) => <li key={flag}>{flag}</li>)
                          ) : (
                            <li>No specific URL flags were extracted.</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {data.matchedPatterns.length > 0 ? (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-[color:var(--ink-strong)]">Closest pattern matches</h3>
                  <div className="space-y-3">
                    {data.matchedPatterns.map((pattern) => (
                      <div key={pattern.id} className="rounded-2xl border border-black/5 bg-white/70 px-4 py-3">
                        <p className="text-sm font-medium text-[color:var(--ink-strong)]">
                          {pattern.scamCategory}
                        </p>
                        <p className="mt-1 text-sm text-[color:var(--ink-soft)]">{pattern.patternDescription}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="action">
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <Card className="border-0 bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
              <CardHeader>
                <CardTitle className="font-[family:var(--font-heading)]">Recommended action</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">{data.recommendedAction}</p>
              </CardContent>
            </Card>

            <CopyCard
              title="Safe reply"
              description={data.safeReply}
              buttonLabel={copiedKey === "safeReply" ? "Copied" : "Copy"}
              onCopy={() => copy("safeReply", data.safeReply)}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/75 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[color:var(--ink-strong)]">{value}</p>
    </div>
  )
}

function CopyCard({
  title,
  description,
  buttonLabel,
  onCopy,
}: {
  title: string
  description: string
  buttonLabel: string
  onCopy: () => Promise<void>
}) {
  return (
    <Card className="border-0 bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="font-[family:var(--font-heading)]">{title}</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={onCopy}>
          <Copy className="size-4" />
          {buttonLabel}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">{description}</p>
      </CardContent>
    </Card>
  )
}

function getUploadedAssetLabel(inputType: string | undefined): string {
  if (inputType === "audio") return "Uploaded audio"
  if (inputType === "pdf") return "Uploaded PDF"
  return "Screenshot"
}

function getUploadedAssetLinkLabel(inputType: string | undefined): string {
  if (inputType === "audio") return "Open uploaded audio"
  if (inputType === "pdf") return "Open uploaded PDF"
  return "Open uploaded screenshot"
}
