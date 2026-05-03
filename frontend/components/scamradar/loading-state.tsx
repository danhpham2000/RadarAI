"use client"

import { Spinner } from "@/components/ui/spinner"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LoadingState({
  title = "Loading...",
  description,
}: {
  title?: string
  description?: string
}) {
  return (
    <Card className="border-0 bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
      <CardHeader className="space-y-3">
        <div className="inline-flex w-fit items-center gap-3 rounded-full bg-white/80 px-3 py-2 text-[color:var(--ink-strong)]">
          <Spinner className="size-4" />
          <span className="text-sm font-medium">Loading</span>
        </div>
        <CardTitle className="font-[family:var(--font-heading)] text-2xl text-[color:var(--ink-strong)]">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="max-w-xl text-sm leading-6 text-[color:var(--ink-soft)]">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
    </Card>
  )
}
