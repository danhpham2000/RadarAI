import { AccountWorkspace } from "@/components/scamradar/account-workspace"
import { StorageView } from "@/components/scamradar/storage-view"

export default function StoragePage() {
  return (
    <AccountWorkspace
      title="Storage"
      description="Review screenshots saved to your account and the OCR text extracted from each upload."
    >
      <StorageView />
    </AccountWorkspace>
  )
}
