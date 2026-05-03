import Link from "next/link"
import { ArrowRight, Link2, MessageSquareWarning, ShieldCheck, Upload } from "lucide-react"

import { HomeActions } from "@/components/scamradar/home-actions"
import { FadeIn, HoverLift, StaggerGroup } from "@/components/scamradar/motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: MessageSquareWarning,
    title: "Message and listing analysis",
    description: "Check suspicious DMs, marketplace posts, bios, ads, and pitches before you respond.",
  },
  {
    icon: Link2,
    title: "URL risk inspection",
    description: "Spot brand mismatches, risky domains, shorteners, and other phishing-style link signals.",
  },
  {
    icon: Upload,
    title: "Screenshot intake",
    description: "Upload screenshots from social apps or marketplaces when copying the text is inconvenient.",
  },
]

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-20">
        <FadeIn className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/6 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            <ShieldCheck className="size-4 text-[color:var(--accent-foreground)]" />
            Safer decisions before you engage
          </div>

          <div className="space-y-5">
            <h1 className="max-w-3xl font-[family:var(--font-heading)] text-5xl leading-[0.94] text-[color:var(--ink-strong)] sm:text-6xl">
              Scam checks for suspicious social content, links, and screenshots.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[color:var(--ink-soft)]">
              RadarAI reviews what you were sent, highlights red flags, and returns a risk score, safe next
              steps, a reply suggestion, and a report-ready summary.
            </p>
          </div>

          <FadeIn delay={0.12}>
            <HomeActions />
          </FadeIn>
        </FadeIn>

        <FadeIn delay={0.12}>
          <Card className="border-0 bg-[linear-gradient(160deg,rgba(31,87,91,0.98),rgba(17,44,57,0.98))] text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
            <CardHeader className="space-y-3">
              <div className="inline-flex w-fit rounded-full bg-white/12 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/80">
                Core output
              </div>
              <CardTitle className="font-[family:var(--font-heading)] text-3xl">What you get back</CardTitle>
              <CardDescription className="text-sm leading-6 text-white/72">
                The analysis stays focused on the decision you need to make next, not long generic safety content.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <StaggerGroup className="grid gap-3">
                {[
                  "Risk score from 0 to 100 with a clear risk level",
                  "Specific red flags tied to the submission",
                  "Recommended action for safer next steps",
                  "A short safe reply when responding still makes sense",
                  "A report-ready summary you can copy",
                ].map((item) => (
                  <FadeIn key={item}>
                    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/85">
                      {item}
                    </div>
                  </FadeIn>
                ))}
              </StaggerGroup>
            </CardContent>
          </Card>
        </FadeIn>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14 sm:px-6 lg:px-8 lg:pb-20">
        <StaggerGroup className="grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <FadeIn key={feature.title}>
              <HoverLift>
                <Card className="border-0 bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
                  <CardHeader>
                    <feature.icon className="mb-3 size-7 text-[color:var(--accent-foreground)]" />
                    <CardTitle className="font-[family:var(--font-heading)] text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-[color:var(--ink-soft)]">{feature.description}</p>
                  </CardContent>
                </Card>
              </HoverLift>
            </FadeIn>
          ))}
        </StaggerGroup>
      </section>
    </main>
  )
}
