"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CalendarDays, FileAudio, FileImage, FileText, HardDrive, ScanSearch } from "lucide-react"

import { AccountGate } from "@/components/scamradar/account-gate"
import { useAuth } from "@/components/scamradar/auth-provider"
import { LoadingState } from "@/components/scamradar/loading-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchStorage, getApiBaseUrl } from "@/lib/api"
import type { UploadedFileRecord } from "@/lib/types"

export function StorageView() {
  const { isAuthenticated, ready, token } = useAuth()
  const [files, setFiles] = useState<UploadedFileRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) {
      return
    }
    if (!isAuthenticated || !token) {
      setLoading(false)
      return
    }

    void loadFiles()
  }, [isAuthenticated, ready, token])

  async function loadFiles() {
    if (!token) {
      return
    }

    try {
      const data = await fetchStorage(token)
      setFiles(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Storage could not be loaded.")
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return <LoadingState title="Loading storage..." description="Retrieving your account session." />
  }

  if (!isAuthenticated) {
    return (
      <AccountGate
        title="Sign in to view storage"
        description="Uploaded files are stored only for registered accounts."
      />
    )
  }

  if (loading) {
    return <LoadingState title="Loading storage..." description="Retrieving saved uploads." />
  }

  if (error) {
    return <StorageState title="Storage unavailable" description={error} />
  }

  if (files.length === 0) {
    return (
      <StorageState
        title="No uploads yet"
        description="Files saved during account-backed scans will appear here."
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {files.map((file) => {
          const fileUrl = file.file_url.startsWith("http") ? file.file_url : `${getApiBaseUrl()}${file.file_url}`
          const href = file.scam_report_id ? `/reports/${file.scam_report_id}` : fileUrl
          const isReportLink = Boolean(file.scam_report_id)

          return (
            <Link
              key={file.id}
              href={href}
              target={isReportLink ? undefined : "_blank"}
              rel={isReportLink ? undefined : "noreferrer"}
              className="overflow-hidden rounded-[26px] border border-black/5 bg-[color:var(--surface)] p-2 text-left shadow-[0_18px_44px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5"
            >
              {isImageFile(file.file_type) ? (
                <div className="aspect-[4/3] overflow-hidden rounded-[20px] bg-[color:var(--surface-muted)]">
                  <img src={fileUrl} alt="Uploaded file preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-[20px] bg-[color:var(--surface-muted)]">
                  {isPdfFile(file.file_type) ? (
                    <FileText className="size-14 text-[color:var(--accent-foreground)]" />
                  ) : (
                    <FileAudio className="size-14 text-[color:var(--accent-foreground)]" />
                  )}
                </div>
              )}
              <div className="space-y-3 px-3 pb-3 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-[family:var(--font-heading)] text-lg text-[color:var(--ink-strong)]">
                    {getStoredFileTitle(file.file_type)}
                  </p>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[color:var(--ink-soft)]">
                    {file.scam_report_id ? "Open report" : "Open file"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[color:var(--ink-soft)]">
                  <CalendarDays className="size-4" />
                  <span>{new Date(file.created_at).toLocaleDateString()}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StorageStat icon={HardDrive} label="Size" value={formatBytes(file.file_size)} />
                  <StorageStat icon={FileImage} label="Type" value={formatStoredType(file.file_type)} />
                  <StorageStat
                    icon={ScanSearch}
                    label="Linked report"
                    value={file.scam_report_id ? "Attached" : "Stored"}
                  />
                </div>
                <p className="line-clamp-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                  {file.ocr_text || "No text could be extracted from this file."}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function StorageState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-0 bg-[color:var(--surface)]">
      <CardHeader>
        <CardTitle className="font-[family:var(--font-heading)] text-2xl text-[color:var(--ink-strong)]">
          {title}
        </CardTitle>
        <CardDescription className="max-w-xl text-sm leading-6">{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function StorageStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof HardDrive
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-white/75 px-4 py-3">
      <div className="flex items-center gap-2 text-[color:var(--ink-soft)]">
        <Icon className="size-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-[color:var(--ink-strong)]">{value}</p>
    </div>
  )
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function isImageFile(contentType: string): boolean {
  return contentType.startsWith("image/")
}

function isPdfFile(contentType: string): boolean {
  return contentType === "application/pdf"
}

function formatStoredType(contentType: string): string {
  if (contentType === "application/pdf") return "pdf"
  if (contentType.startsWith("audio/")) return contentType.replace("audio/", "")
  if (contentType.startsWith("video/")) return contentType.replace("video/", "")
  if (contentType.startsWith("image/")) return contentType.replace("image/", "")
  return contentType
}

function getStoredFileTitle(contentType: string): string {
  if (contentType === "application/pdf") return "PDF transcript"
  if (contentType.startsWith("audio/") || contentType.startsWith("video/")) return "Audio transcript"
  return "Screenshot"
}
