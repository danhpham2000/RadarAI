from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, model_validator


class InputType(str, Enum):
    TEXT = "text"
    URL = "url"
    SCREENSHOT = "screenshot"
    PDF = "pdf"
    AUDIO = "audio"


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class Platform(str, Enum):
    FACEBOOK = "Facebook"
    INSTAGRAM = "Instagram"
    TIKTOK = "TikTok"
    WHATSAPP = "WhatsApp"
    YOUTUBE = "YouTube"
    X = "X"
    REDDIT = "Reddit"
    SNAPCHAT = "Snapchat"
    LINKEDIN = "LinkedIn"
    DISCORD = "Discord"
    TELEGRAM = "Telegram"
    MARKETPLACE = "Online marketplace"
    DATING_APP = "Dating app"
    EMAIL = "Email"
    SMS = "SMS"
    OTHER = "Other"


class AnalyzeRequest(BaseModel):
    inputType: InputType
    platform: Platform | None = None
    text: str = ""
    url: str = ""
    screenshotId: str | None = None
    fileId: str | None = None

    @model_validator(mode="after")
    def validate_payload(self) -> "AnalyzeRequest":
        has_text = bool(self.text.strip())
        has_url = bool(self.url.strip())
        has_file = bool(self.fileId or self.screenshotId)

        if self.inputType == InputType.TEXT and not has_text:
            raise ValueError("Text input is required for text analysis.")
        if self.inputType == InputType.URL and not has_url:
            raise ValueError("A URL is required for URL analysis.")
        if self.inputType == InputType.SCREENSHOT and not has_file:
            raise ValueError("A screenshot upload is required for screenshot analysis.")
        if self.inputType == InputType.PDF and not has_file:
            raise ValueError("A PDF upload is required for document analysis.")
        if self.inputType == InputType.AUDIO and not has_file:
            raise ValueError("An audio upload is required for transcript analysis.")
        return self


class UrlCheckSummary(BaseModel):
    url: str
    domain: str
    https_enabled: bool
    redirect_count: int = 0
    suspicious_indicators: list[str] = Field(default_factory=list)
    reputation_status: str = "unknown"
    score_contribution: int = 0


class MatchedPattern(BaseModel):
    id: str
    scamCategory: str
    platform: str
    patternDescription: str
    redFlags: list[str]
    severity: str
    recommendedAction: str
    sourceReference: str
    confidence: float = Field(ge=0, le=1)


class AnalysisResult(BaseModel):
    riskScore: int = Field(ge=0, le=100)
    riskLevel: RiskLevel
    scamCategories: list[str] = Field(default_factory=list)
    summary: str
    redFlags: list[str] = Field(default_factory=list)
    explanation: str
    recommendedAction: str
    safeReply: str
    reportSummary: str
    confidence: float = Field(ge=0, le=1)
    matchedPatterns: list[MatchedPattern] = Field(default_factory=list)
    detectedUrls: list[UrlCheckSummary] = Field(default_factory=list)
    normalizedText: str = ""
    extractedText: str = ""


class AnalyzeResponse(AnalysisResult):
    reportId: str | None = None


class UploadResponse(BaseModel):
    fileId: str
    fileUrl: str
    ocrText: str = ""
    extractedText: str = ""


class AuthUser(BaseModel):
    id: str
    email: str


class AuthRequest(BaseModel):
    email: str
    password: str

    @model_validator(mode="after")
    def validate_credentials(self) -> "AuthRequest":
        if "@" not in self.email or "." not in self.email:
            raise ValueError("A valid email address is required.")
        if len(self.password) < 8:
            raise ValueError("Passwords must be at least 8 characters long.")
        return self


class AuthResponse(BaseModel):
    user: AuthUser
    accessToken: str | None = None
    refreshToken: str | None = None
    requiresEmailConfirmation: bool = False


class UploadedFileRecord(BaseModel):
    id: str
    user_id: str | None = None
    scam_report_id: str | None = None
    file_url: str
    file_type: str
    file_size: int
    ocr_text: str = ""
    created_at: datetime


class ReportRecord(BaseModel):
    id: str
    user_id: str | None = None
    organization_id: str | None = None
    platform: str | None = None
    input_type: str
    raw_text: str = ""
    url: str = ""
    screenshot_url: str | None = None
    risk_score: int
    risk_level: str
    scam_categories: list[str] = Field(default_factory=list)
    summary: str
    red_flags: list[str] = Field(default_factory=list)
    explanation: str
    recommended_action: str
    safe_reply: str
    report_summary: str
    confidence: float
    matched_patterns: list[MatchedPattern] = Field(default_factory=list)
    url_checks: list[UrlCheckSummary] = Field(default_factory=list)
    created_at: datetime


class DashboardMetricPoint(BaseModel):
    label: str
    value: int


class DashboardResponse(BaseModel):
    totalScans: int = 0
    averageRiskScore: float = 0
    highRiskCount: int = 0
    criticalRiskCount: int = 0
    scansByRiskLevel: list[DashboardMetricPoint] = Field(default_factory=list)
    scansByCategory: list[DashboardMetricPoint] = Field(default_factory=list)
    scansByPlatform: list[DashboardMetricPoint] = Field(default_factory=list)
    commonRedFlags: list[DashboardMetricPoint] = Field(default_factory=list)
    activityTimeline: list[DashboardMetricPoint] = Field(default_factory=list)


class PatternCreateRequest(BaseModel):
    scamCategory: str
    platform: str = "Other"
    patternDescription: str
    redFlags: list[str] = Field(default_factory=list)
    severity: str
    recommendedAction: str
    sourceReference: str = ""
    embedding: list[float] = Field(default_factory=list)


class PatternRecord(PatternCreateRequest):
    id: str
    created_at: datetime
    updated_at: datetime


class DeleteResponse(BaseModel):
    deleted: bool
    id: str


class ErrorResponse(BaseModel):
    detail: str | dict[str, Any]
