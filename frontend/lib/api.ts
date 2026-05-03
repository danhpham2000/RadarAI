import type {
  AuthRequest,
  AuthResponse,
  AuthUser,
  AnalysisResponse,
  AnalyzeRequest,
  DashboardResponse,
  ReportRecord,
  UploadedFileRecord,
  UploadResponse,
} from "@/lib/types"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000"

interface HealthResponse {
  status: string
}

function buildHeaders(token?: string, contentType = true): HeadersInit {
  const headers: Record<string, string> = {}
  if (contentType) {
    headers["Content-Type"] = "application/json"
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const fallbackMessage = "Something went wrong while contacting RadarAI."
    let detailMessage: string | null = null

    try {
      const body = (await response.json()) as { detail?: unknown }
      if (typeof body.detail === "string") {
        detailMessage = body.detail
      } else if (Array.isArray(body.detail)) {
        detailMessage = body.detail
          .map((item) => {
            if (typeof item === "string") return item
            if (item && typeof item === "object" && "msg" in item) {
              return String(item.msg)
            }
            return JSON.stringify(item)
          })
          .join(", ")
      } else if (body.detail != null) {
        detailMessage = JSON.stringify(body.detail)
      }
    } catch {
      detailMessage = null
    }

    throw new Error(detailMessage || fallbackMessage)
  }

  return (await response.json()) as T
}

export async function analyzeSubmission(
  payload: AnalyzeRequest,
  token?: string
): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  })

  return parseResponse<AnalysisResponse>(response)
}

export async function fetchBackendHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    cache: "no-store",
  })

  return parseResponse<HealthResponse>(response)
}

export async function uploadScreenshot(file: File, token?: string): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    headers: buildHeaders(token, false),
    body: formData,
  })

  return parseResponse<UploadResponse>(response)
}

export async function fetchReports(token: string): Promise<ReportRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/reports`, {
    cache: "no-store",
    headers: buildHeaders(token, false),
  })

  return parseResponse<ReportRecord[]>(response)
}

export async function fetchReport(reportId: string, token: string): Promise<ReportRecord> {
  const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
    cache: "no-store",
    headers: buildHeaders(token, false),
  })

  return parseResponse<ReportRecord>(response)
}

export async function fetchDashboard(token: string): Promise<DashboardResponse> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
    cache: "no-store",
    headers: buildHeaders(token, false),
  })

  return parseResponse<DashboardResponse>(response)
}

export async function deleteReport(reportId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
    method: "DELETE",
    headers: buildHeaders(token, false),
  })

  await parseResponse<{ deleted: boolean; id: string }>(response)
}

export async function fetchStorage(token: string): Promise<UploadedFileRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/storage`, {
    cache: "no-store",
    headers: buildHeaders(token, false),
  })

  return parseResponse<UploadedFileRecord[]>(response)
}

export async function registerUser(payload: AuthRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })

  return parseResponse<AuthResponse>(response)
}

export async function loginUser(payload: AuthRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })

  return parseResponse<AuthResponse>(response)
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    cache: "no-store",
    headers: buildHeaders(token, false),
  })

  return parseResponse<AuthUser>(response)
}

export function getApiBaseUrl(): string {
  return API_BASE_URL
}
