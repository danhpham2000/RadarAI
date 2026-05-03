import { Suspense } from "react"

import { AccountWorkspace } from "@/components/scamradar/account-workspace"
import { LoadingState } from "@/components/scamradar/loading-state"
import { ReportPageClient } from "@/components/scamradar/report-page-client"

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <AccountWorkspace
      title="Saved report"
      description="Review the full risk breakdown, evidence, and next-step guidance for a stored analysis."
    >
      <Suspense fallback={<LoadingState title="Loading report..." description="Preparing the report view." />}>
        <ReportPageClient reportId={id} />
      </Suspense>
    </AccountWorkspace>
  )
}
