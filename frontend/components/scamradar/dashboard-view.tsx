"use client"

import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { fetchDashboard } from "@/lib/api"
import { useAuth } from "@/components/scamradar/auth-provider"
import { LoadingState } from "@/components/scamradar/loading-state"
import type { DashboardResponse } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const chartColors = ["#1f575b", "#cf6a32", "#b5405e", "#6c8f6b", "#9a6c1a", "#315d9b"]
const riskChartColors: Record<string, string> = {
  Low: "#2f8f63",
  Medium: "#d4a017",
  High: "#d94f3d",
  Critical: "#a61e2f",
}

export function DashboardView() {
  const { isAuthenticated, ready, token } = useAuth()
  const [data, setData] = useState<DashboardResponse | null>(null)
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
        const result = await fetchDashboard(token)
        setData(result)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Dashboard unavailable.")
      }
    })()
  }, [isAuthenticated, ready, token])

  if (!ready) {
    return <LoadingState title="Loading dashboard..." description="Retrieving your account session." />
  }

  if (!isAuthenticated) {
    return (
      <Card className="border-0 bg-[color:var(--surface)]">
        <CardHeader>
          <CardTitle className="font-[family:var(--font-heading)] text-2xl">Sign in to view dashboard</CardTitle>
          <CardDescription>
            Dashboard analytics are available for registered accounts with saved reports.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 bg-[color:var(--surface)]">
        <CardHeader>
          <CardTitle className="font-[family:var(--font-heading)] text-2xl">Dashboard unavailable</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!data) {
    return <LoadingState title="Loading dashboard..." description="Preparing your saved analytics." />
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard label="Total scans" value={String(data.totalScans)} />
        <DashboardMetricCard label="Average risk score" value={String(data.averageRiskScore)} />
        <DashboardMetricCard label="High-risk scans" value={String(data.highRiskCount)} />
        <DashboardMetricCard label="Critical-risk scans" value={String(data.criticalRiskCount)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Risk level distribution" description="How reports are currently spread across the four risk bands.">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.scansByRiskLevel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d5d8d4" />
              <XAxis dataKey="label" stroke="#64706c" />
              <YAxis stroke="#64706c" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {data.scansByRiskLevel.map((item) => (
                  <Cell
                    key={item.label}
                    fill={riskChartColors[item.label] ?? "#1f575b"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Activity over time" description="Recent scan volume to help spot bursts in suspicious activity.">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.activityTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d5d8d4" />
              <XAxis dataKey="label" stroke="#64706c" />
              <YAxis stroke="#64706c" allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#cf6a32" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ListCard
          title="Top categories"
          description="The most frequent scam categories in the current dataset."
          items={data.scansByCategory}
        />
        <ListCard
          title="Most common red flags"
          description="Signals appearing most often across recent reports."
          items={data.commonRedFlags}
        />
      </div>

      <ChartCard title="Platform breakdown" description="Where suspicious content is being reported.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.scansByPlatform.map((item, index) => (
            <div key={item.label} className="rounded-3xl border border-black/5 bg-white/75 px-4 py-4">
              <div
                className="mb-3 h-2 rounded-full"
                style={{ backgroundColor: chartColors[index % chartColors.length] }}
              />
              <p className="text-sm font-medium text-[color:var(--ink-strong)]">{item.label}</p>
              <p className="mt-1 text-sm text-[color:var(--ink-soft)]">{item.value} report(s)</p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}

function DashboardMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-0 bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-[family:var(--font-heading)] text-4xl text-[color:var(--ink-strong)]">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="border-0 bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
      <CardHeader>
        <CardTitle className="font-[family:var(--font-heading)] text-2xl">{title}</CardTitle>
        <CardDescription className="max-w-xl text-sm leading-6">{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function ListCard({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: DashboardResponse["scansByCategory"]
}) {
  return (
    <Card className="border-0 bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
      <CardHeader>
        <CardTitle className="font-[family:var(--font-heading)] text-2xl">{title}</CardTitle>
        <CardDescription className="max-w-xl text-sm leading-6">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/75 px-4 py-3">
              <span className="text-sm text-[color:var(--ink-strong)]">{item.label}</span>
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: `${chartColors[index % chartColors.length]}20`,
                  color: chartColors[index % chartColors.length],
                }}
              >
                {item.value}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-[color:var(--ink-soft)]">No report data is available yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
