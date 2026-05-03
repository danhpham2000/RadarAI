import { AccountWorkspace } from "@/components/scamradar/account-workspace"
import { DashboardView } from "@/components/scamradar/dashboard-view"

export default function DashboardPage() {
  return (
    <AccountWorkspace
      title="Dashboard"
      description="Monitor scan volume, category mix, risk levels, and recurring red flags across recent reports."
    >
      <DashboardView />
    </AccountWorkspace>
  )
}
