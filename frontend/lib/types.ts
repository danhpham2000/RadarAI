export type InputType = "text" | "url" | "screenshot" | "pdf" | "audio"

export type RiskLevel = "Low" | "Medium" | "High" | "Critical"

export type Platform =
  | "Facebook"
  | "Instagram"
  | "TikTok"
  | "WhatsApp"
  | "YouTube"
  | "X"
  | "Reddit"
  | "Snapchat"
  | "LinkedIn"
  | "Discord"
  | "Telegram"
  | "Online marketplace"
  | "Dating app"
  | "Email"
  | "SMS"
  | "Other"

export interface AnalyzeRequest {
  inputType: InputType
  platform: Platform
  text: string
  url: string
  fileId?: string
  screenshotId?: string
}

export interface UrlCheckSummary {
  url: string
  domain: string
  https_enabled: boolean
  redirect_count: number
  suspicious_indicators: string[]
  reputation_status: string
  score_contribution: number
}

export interface MatchedPattern {
  id: string
  scamCategory: string
  platform: string
  patternDescription: string
  redFlags: string[]
  severity: string
  recommendedAction: string
  sourceReference: string
  confidence: number
}

export interface AnalysisResponse {
  reportId: string | null
  riskScore: number
  riskLevel: RiskLevel
  scamCategories: string[]
  summary: string
  redFlags: string[]
  explanation: string
  recommendedAction: string
  safeReply: string
  reportSummary: string
  confidence: number
  matchedPatterns: MatchedPattern[]
  detectedUrls: UrlCheckSummary[]
  normalizedText: string
  extractedText: string
}

export interface UploadResponse {
  fileId: string
  fileUrl: string
  ocrText: string
  extractedText: string
}

export interface AuthUser {
  id: string
  email: string
}

export interface AuthRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string | null
  refreshToken: string | null
  requiresEmailConfirmation: boolean
}

export interface ReportRecord {
  id: string
  user_id: string | null
  organization_id: string | null
  platform: string | null
  input_type: string
  raw_text: string
  url: string
  screenshot_url: string | null
  risk_score: number
  risk_level: RiskLevel
  scam_categories: string[]
  summary: string
  red_flags: string[]
  explanation: string
  recommended_action: string
  safe_reply: string
  report_summary: string
  confidence: number
  matched_patterns: MatchedPattern[]
  url_checks: UrlCheckSummary[]
  created_at: string
}

export interface UploadedFileRecord {
  id: string
  user_id: string | null
  scam_report_id: string | null
  file_url: string
  file_type: string
  file_size: number
  ocr_text: string
  created_at: string
}

export interface MetricPoint {
  label: string
  value: number
}

export interface DashboardResponse {
  totalScans: number
  averageRiskScore: number
  highRiskCount: number
  criticalRiskCount: number
  scansByRiskLevel: MetricPoint[]
  scansByCategory: MetricPoint[]
  scansByPlatform: MetricPoint[]
  commonRedFlags: MetricPoint[]
  activityTimeline: MetricPoint[]
}
