import { Badge } from "@/components/ui/badge"
import type { RiskLevel } from "@/lib/types"

const styles: Record<RiskLevel, string> = {
  Low: "bg-emerald-100 text-emerald-800",
  Medium: "bg-amber-100 text-amber-900",
  High: "bg-orange-100 text-orange-900",
  Critical: "bg-rose-100 text-rose-900",
}

export function RiskPill({ level }: { level: RiskLevel }) {
  return <Badge className={styles[level]}>{level} risk</Badge>
}
