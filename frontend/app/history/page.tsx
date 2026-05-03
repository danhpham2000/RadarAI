import { AccountWorkspace } from "@/components/scamradar/account-workspace"
import { HistoryView } from "@/components/scamradar/history-view"

export default function HistoryPage() {
  return (
    <AccountWorkspace
      title="History"
      description="Review previous scans, reopen a report, and keep a record of the content you decided not to trust."
    >
      <HistoryView />
    </AccountWorkspace>
  )
}
