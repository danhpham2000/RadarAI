import { AuthForm } from "@/components/scamradar/auth-form"
import { FadeIn } from "@/components/scamradar/motion"

export default function LoginPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-16">
      <FadeIn className="space-y-6">
        <div className="inline-flex rounded-full border border-black/8 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--ink-strong)]">
          Secure access
        </div>
        <div className="space-y-4">
          <h1 className="font-[family:var(--font-heading)] text-5xl leading-[0.98] text-[color:var(--ink-strong)]">
            Sign in to save reports and review past scans.
          </h1>
          <p className="max-w-xl text-base leading-8 text-[color:var(--ink-soft)]">
            Anonymous checks stay available on the Analyze page. Sign in when you want persistent report history,
            screenshot access, and account-backed analytics.
          </p>
        </div>
      </FadeIn>
      <FadeIn delay={0.1}>
        <AuthForm mode="login" />
      </FadeIn>
    </main>
  )
}
