"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, LoaderCircle, WifiOff } from "lucide-react"

import { fetchBackendHealth } from "@/lib/api"

type StatusState = "loading" | "online" | "offline"

export function BackendStatus() {
  const [status, setStatus] = useState<StatusState>("loading")

  useEffect(() => {
    void (async () => {
      try {
        await fetchBackendHealth()
        setStatus("online")
      } catch {
        setStatus("offline")
      }
    })()
  }, [])

  if (status === "loading") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs text-[color:var(--ink-soft)]">
        <LoaderCircle className="size-3.5 animate-spin" />
        Checking backend
      </div>
    )
  }

  if (status === "online") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800">
        <CheckCircle2 className="size-3.5" />
        Backend connected
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-800">
      <WifiOff className="size-3.5" />
      Backend unavailable
    </div>
  )
}
