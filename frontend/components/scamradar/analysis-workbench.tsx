"use client"

import Link from "next/link"
import { useState } from "react"
import { FileAudio, FileText, ImageIcon, LoaderCircle, Paperclip, ShieldAlert, Upload, X } from "lucide-react"

import { analyzeSubmission, uploadScreenshot } from "@/lib/api"
import { useAuth } from "@/components/scamradar/auth-provider"
import { AnimatedPanel, FadeIn, HoverLift } from "@/components/scamradar/motion"
import type { AnalysisResponse, AnalyzeRequest, InputType, Platform } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AnalysisReportPanel } from "@/components/scamradar/report-view"

const PLATFORM_OPTIONS: Platform[] = [
  "Instagram",
  "Facebook",
  "TikTok",
  "WhatsApp",
  "Online marketplace",
  "LinkedIn",
  "Telegram",
  "Dating app",
  "Email",
  "SMS",
  "Other",
]

type DisplayMode = "text" | "url" | "file" | "audio"

const DISPLAY_MODES: DisplayMode[] = ["text", "url", "file", "audio"]

const modeMeta: Record<DisplayMode, { label: string; helper: string }> = {
  text: {
    label: "Text",
    helper: "Paste a message, listing, or bio",
  },
  url: {
    label: "URL",
    helper: "Check a suspicious link",
  },
  file: {
    label: "File",
    helper: "Upload a screenshot or PDF ",
  },
  audio: {
    label: "Audio",
    helper: "Upload a voice clip",
  },
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export function AnalysisWorkbench() {
  const { isAuthenticated, token } = useAuth()
  const [displayMode, setDisplayMode] = useState<DisplayMode>("text")
  const [platform, setPlatform] = useState<Platform>("Instagram")
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function resolveInputType(): InputType {
    if (displayMode === "file") {
      return file?.type === "application/pdf" ? "pdf" : "screenshot"
    }
    return displayMode as InputType
  }

  function handleModeChange(mode: DisplayMode) {
    setDisplayMode(mode)
    setFile(null)
    setError(null)
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setResult(null)
    setIsSubmitting(true)

    try {
      const inputType = resolveInputType()
      let fileId: string | undefined

      if (inputType === "screenshot" || inputType === "pdf" || inputType === "audio") {
        if (!file) throw new Error("Upload a file before running the analysis.")
        if (inputType === "audio" && file.size > 10 * 1024 * 1024)
          throw new Error("Audio file must be smaller than 10 MB.")
        const upload = await uploadScreenshot(file, token ?? undefined)
        fileId = upload.fileId
      }

      const payload: AnalyzeRequest = {
        inputType,
        platform,
        text: inputType === "text" ? text : "",
        url: inputType === "url" ? url : "",
        fileId,
      }

      const analysis = await analyzeSubmission(payload, token ?? undefined)
      setResult(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "RadarAI could not complete the analysis.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isPdf = file?.type === "application/pdf"

  return (
    <div className="space-y-6">
      <AnimatedPanel>
        <Card className="border-0 bg-[color:var(--surface)] shadow-[0_24px_64px_rgba(15,23,42,0.07)]">
          <CardHeader className="space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[color:var(--accent)]/12 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--accent-foreground)]">
              <ShieldAlert className="size-4" />
              Core analysis
            </div>
            <CardTitle className="font-[family:var(--font-heading)] text-3xl text-[color:var(--ink-strong)]">
              Analyze suspicious content
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-[color:var(--ink-soft)]">
              Choose a submission type, select the platform, and RadarAI will return a risk score,
              red flags, recommended action, a safe reply, and a report-ready summary.
            </CardDescription>
            <p className="text-sm font-medium text-[color:var(--ink-strong)]">
              {isAuthenticated
                ? "Signed-in scans are saved to your account history."
                : "Anonymous scans are allowed but are not saved to history."}
            </p>
          </CardHeader>

          <CardContent>
            <form className="space-y-6" onSubmit={onSubmit}>
              {/* Mode selector — 4 cards */}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {DISPLAY_MODES.map((mode, index) => (
                  <FadeIn key={mode} delay={index * 0.05} className="h-full">
                    <HoverLift className="h-full">
                      <button
                        type="button"
                        onClick={() => handleModeChange(mode)}
                        className={[
                          "h-full w-full rounded-3xl border px-4 py-4 text-left transition",
                          displayMode === mode
                            ? "border-transparent bg-[color:var(--accent)] text-[color:var(--accent-foreground)] shadow-[0_18px_36px_rgba(31,87,91,0.18)]"
                            : "border-black/8 bg-white/75 text-[color:var(--ink-soft)] hover:border-[color:var(--accent)]/30",
                        ].join(" ")}
                      >
                        <p className="font-[family:var(--font-heading)] text-lg">
                          {modeMeta[mode].label}
                        </p>
                        <p className="mt-2 text-sm leading-6 opacity-90">
                          {modeMeta[mode].helper}
                        </p>
                      </button>
                    </HoverLift>
                  </FadeIn>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
                {/* Left column: platform + hint */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform-trigger">Platform</Label>
                    <Select
                      value={platform}
                      onValueChange={(v) => setPlatform(v as Platform)}
                    >
                      <SelectTrigger
                        id="platform-trigger"
                        size="default"
                        className="h-11 w-full rounded-2xl border-black/8 bg-white px-4 text-sm text-[color:var(--ink-strong)]"
                      >
                        <SelectValue placeholder="Choose a platform" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border border-black/8 bg-white">
                        {PLATFORM_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <FadeIn delay={0.12}>
                    <div className="rounded-3xl border border-black/5 bg-[color:var(--surface-muted)] px-4 py-4">
                      <p className="font-[family:var(--font-heading)] text-base text-[color:var(--ink-strong)]">
                        {modeMeta[displayMode].label}
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-[color:var(--ink-soft)]">
                        {modeMeta[displayMode].helper}
                      </p>
                    </div>
                  </FadeIn>
                </div>

                {/* Right column: input area */}
                <div className="space-y-4">
                  {displayMode === "text" && (
                    <div className="space-y-2">
                      <Label htmlFor="text">Suspicious message or listing</Label>
                      <Textarea
                        id="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste the suspicious message, listing, ad copy, or profile text."
                        className="min-h-48 rounded-3xl border-black/8 bg-white px-4 py-4"
                      />
                    </div>
                  )}

                  {displayMode === "url" && (
                    <div className="space-y-2">
                      <Label htmlFor="url">Suspicious URL</Label>
                      <Input
                        id="url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://suspicious-link.example.com"
                        className="h-12 rounded-3xl border-black/8 bg-white px-4"
                      />
                    </div>
                  )}

                  {displayMode === "file" && (
                    <div className="space-y-2">
                      <Label htmlFor="file-upload">Screenshot or PDF</Label>
                      {file ? (
                        <div className="flex items-center gap-3 rounded-3xl border border-black/8 bg-white px-5 py-4">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
                            {isPdf ? (
                              <FileText className="size-5 text-[color:var(--accent-foreground)]" />
                            ) : (
                              <ImageIcon className="size-5 text-[color:var(--accent-foreground)]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[color:var(--ink-strong)]">
                              {file.name}
                            </p>
                            <p className="text-xs text-[color:var(--ink-soft)]">
                              {isPdf ? "PDF document" : "Image"} · {formatBytes(file.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFile(null)}
                            className="shrink-0 rounded-full p-1.5 text-[color:var(--ink-soft)] transition hover:bg-black/5 hover:text-[color:var(--ink-strong)]"
                            aria-label="Remove file"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="file-upload"
                          className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-black/10 bg-white px-6 py-8 text-center transition hover:border-[color:var(--accent)]/40 hover:bg-[color:var(--accent)]/3"
                        >
                          <div className="flex size-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
                            <Paperclip className="size-5 text-[color:var(--accent-foreground)]" />
                          </div>
                          <div>
                            <p className="font-medium text-[color:var(--ink-strong)]">
                              Choose a screenshot or PDF
                            </p>
                            <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                              PNG, JPEG, WEBP, HEIC, or PDF — up to 8 MB
                            </p>
                          </div>
                        </label>
                      )}
                      <Input
                        id="file-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/heic,application/pdf"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="sr-only"
                      />
                    </div>
                  )}

                  {displayMode === "audio" && (
                    <div className="space-y-2">
                      <Label htmlFor="audio">Audio file</Label>
                      {file ? (
                        <div className="flex items-center gap-3 rounded-3xl border border-black/8 bg-white px-5 py-4">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
                            <FileAudio className="size-5 text-[color:var(--accent-foreground)]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[color:var(--ink-strong)]">
                              {file.name}
                            </p>
                            <p className="text-xs text-[color:var(--ink-soft)]">
                              Audio · {formatBytes(file.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFile(null)}
                            className="shrink-0 rounded-full p-1.5 text-[color:var(--ink-soft)] transition hover:bg-black/5 hover:text-[color:var(--ink-strong)]"
                            aria-label="Remove file"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="audio"
                          className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-black/10 bg-white px-6 py-8 text-center transition hover:border-[color:var(--accent)]/40 hover:bg-[color:var(--accent)]/3"
                        >
                          <div className="flex size-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
                            <FileAudio className="size-5 text-[color:var(--accent-foreground)]" />
                          </div>
                          <div>
                            <p className="font-medium text-[color:var(--ink-strong)]">
                              Choose an audio file
                            </p>
                            <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                              MP3, WAV, OGG, WEBM, AAC, or FLAC — max 10 MB
                            </p>
                          </div>
                        </label>
                      )}
                      <Input
                        id="audio"
                        type="file"
                        accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/webm,audio/ogg,audio/flac,audio/mp4,audio/aac,video/mp4,video/webm"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="sr-only"
                      />
                    </div>
                  )}

                  {error && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="h-12 rounded-full bg-[color:var(--accent)] px-6 text-[color:var(--accent-foreground)] hover:bg-[color:var(--accent)]/90"
                    >
                      {isSubmitting ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Upload className="size-4" />
                      )}
                      {isSubmitting ? "Analyzing…" : "Run analysis"}
                    </Button>
                    <Link
                      href="/history"
                      className="text-sm text-[color:var(--ink-soft)] hover:text-[color:var(--ink-strong)]"
                    >
                      View saved results
                    </Link>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </AnimatedPanel>

      {result && (
        <AnimatedPanel>
          <AnalysisReportPanel
            data={{
              id: result.reportId ?? undefined,
              inputType: resolveInputType(),
              platform,
              rawText: result.normalizedText,
              riskScore: result.riskScore,
              riskLevel: result.riskLevel,
              scamCategories: result.scamCategories,
              summary: result.summary,
              redFlags: result.redFlags,
              explanation: result.explanation,
              recommendedAction: result.recommendedAction,
              safeReply: result.safeReply,
              reportSummary: result.reportSummary,
              confidence: result.confidence,
              matchedPatterns: result.matchedPatterns,
              detectedUrls: result.detectedUrls,
            }}
          />
        </AnimatedPanel>
      )}
    </div>
  )
}
