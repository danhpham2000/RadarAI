import type { Metadata } from "next"
import { Instrument_Sans, Space_Grotesk } from "next/font/google"

import "./globals.css"
import { AuthProvider } from "@/components/scamradar/auth-provider"
import { SiteHeader } from "@/components/scamradar/site-header"
import { cn } from "@/lib/utils"

const bodyFont = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
})

export const metadata: Metadata = {
  title: "RadarAI",
  description: "AI-powered scam analysis for suspicious messages, listings, links, and screenshots.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn(bodyFont.variable, headingFont.variable)}>
      <body className="min-h-screen bg-[color:var(--page)] text-[color:var(--ink)] antialiased">
        <AuthProvider>
          <div className="page-shell">
            <div className="page-orb page-orb-a" />
            <div className="page-orb page-orb-b" />
            <SiteHeader />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
