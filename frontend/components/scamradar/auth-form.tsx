"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react"

import { useAuth } from "@/components/scamradar/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AuthMode = "login" | "register"

function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Authentication could not be completed."
  }

  const message = error.message.toLowerCase()

  if (message.includes("email rate limit exceeded")) {
    return "Too many sign-up attempts were made just now. Wait a moment, then try again."
  }

  if (message.includes("invalid login credentials")) {
    return "The email or password is incorrect."
  }

  if (message.includes("already exists")) {
    return "An account with this email already exists. Sign in instead."
  }

  return error.message
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter()
  const { login, register } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isRegister = mode === "register"

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setIsSubmitting(true)

    try {
      if (isRegister) {
        await register({ email, password })
        router.push("/history")
        router.refresh()
        return
      }

      await login({ email, password })
      router.push("/history")
      router.refresh()
    } catch (submissionError) {
      setError(getAuthErrorMessage(submissionError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-0 bg-[color:var(--surface-strong)] shadow-[0_28px_70px_rgba(15,23,42,0.1)]">
      <CardHeader className="space-y-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[color:var(--accent)]/18 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-foreground)]">
          <LockKeyhole className="size-4" />
          Account access
        </div>
        <CardTitle className="font-[family:var(--font-heading)] text-3xl text-[color:var(--ink-strong)]">
          {isRegister ? "Create your account" : "Sign in to your account"}
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-[color:var(--ink-soft)]">
          {isRegister
            ? "Create an account to save reports, uploaded screenshots, and your scan history."
            : "Sign in to access your report history, saved screenshots, and dashboard."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[color:var(--ink-soft)]" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-2xl border-black/10 bg-white pl-11 text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)]"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[color:var(--ink-soft)]" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="h-12 rounded-2xl border-black/10 bg-white pl-11 text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)]"
                required
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {error}
            </div>
          ) : null}

          {info ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
              {info}
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-12 w-full rounded-full bg-[color:var(--accent)] text-[color:var(--accent-foreground)] hover:bg-[color:var(--accent)]/90"
          >
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {isRegister ? "Create account" : "Sign in"}
          </Button>

          <p className="text-center text-sm font-medium text-[color:var(--ink-soft)]">
            {isRegister ? "Already have an account?" : "Need an account?"}{" "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="text-[color:var(--accent-foreground)] hover:underline"
            >
              {isRegister ? "Sign in" : "Create one"}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
