import { AccountWorkspace } from "@/components/scamradar/account-workspace"
import { AnalysisWorkbench } from "@/components/scamradar/analysis-workbench"

export default function AnalyzePage() {
  return (
    <AccountWorkspace
      title="Analyze"
      description="Paste suspicious content, inspect a link, or upload a screenshot to generate a risk score, red flags, and a report-ready summary."
    >
      <AnalysisWorkbench />
    </AccountWorkspace>
  )
}
