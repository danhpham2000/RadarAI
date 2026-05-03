import { AccountWorkspace } from "@/components/scamradar/account-workspace"
import { SettingsView } from "@/components/scamradar/settings-view"

export default function SettingsPage() {
  return (
    <AccountWorkspace
      title="Settings"
      description="Manage how RadarAI handles your scans, uploaded screenshots, and account access."
    >
      <SettingsView />
    </AccountWorkspace>
  )
}
