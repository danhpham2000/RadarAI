from __future__ import annotations

import re
from datetime import UTC, datetime
from uuid import uuid4

from schemas import AnalysisResult, AnalyzeRequest, MatchedPattern, ReportRecord, RiskLevel, UploadedFileRecord
from services.patterns import pattern_matcher
from services.url_analysis import extract_urls, inspect_url

SIGNAL_RULES: tuple[tuple[str, int, str, tuple[str, ...]], ...] = (
    (
        "Pressure language",
        10,
        "The message uses urgency or countdown pressure to push a quick decision.",
        ("urgent", "immediately", "right now", "final notice", "expires today", "act now"),
    ),
    (
        "Money request",
        16,
        "The sender is asking for money, deposits, or unusual payment methods.",
        ("send money", "deposit", "wire", "gift card", "zelle", "cash app", "crypto"),
    ),
    (
        "Credential request",
        20,
        "The content asks for passwords, one-time codes, or sensitive account details.",
        ("password", "otp", "one-time code", "verification code", "bank login", "ssn"),
    ),
    (
        "Off-platform pressure",
        8,
        "The sender wants to move the conversation or payment away from the safer platform flow.",
        ("contact me on telegram", "whatsapp me", "outside the app", "private payment"),
    ),
    (
        "Unrealistic financial promise",
        16,
        "The pitch claims returns or rewards that are not realistic.",
        ("guaranteed return", "risk-free profit", "double your money", "easy income", "guaranteed payout"),
    ),
    (
        "Impersonation signal",
        14,
        "The content suggests a trusted person or company without enough proof.",
        ("official support", "customer service", "i am the owner", "company representative", "security team"),
    ),
    (
        "Threat or coercion",
        18,
        "Threats, blackmail, or account-loss language are common high-risk scam tactics.",
        ("or your account will be closed", "legal action", "police report", "you will be charged", "final warning"),
    ),
    (
        "Manipulative emotional language",
        8,
        "The message leans on panic, secrecy, or emotional leverage instead of verifiable details.",
        ("keep this secret", "trust me", "only you can help", "please don't tell anyone", "i'm desperate"),
    ),
)

CATEGORY_HINTS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("Cryptocurrency scam", ("crypto", "wallet", "blockchain", "trading signal")),
    ("Tech support scam", ("support desk", "device infected", "remote access", "security alert")),
    ("Scholarship scam", ("scholarship", "grant disbursement", "student aid fee")),
    ("Housing scam", ("rental", "lease", "deposit before viewing", "landlord abroad")),
    ("Fake charity scam", ("donation", "charity", "relief fund", "medical fundraiser")),
    ("Deepfake or celebrity endorsement scam", ("celebrity", "endorsed by", "deepfake", "viral interview")),
    ("Giveaway scam", ("winner", "claim prize", "free iphone", "limited giveaway")),
)


class AnalysisService:
    def analyze(
        self,
        request: AnalyzeRequest,
        uploaded_file: UploadedFileRecord | None = None,
    ) -> AnalysisResult:
        extracted_text = uploaded_file.ocr_text if uploaded_file else ""
        normalized_text = self._normalize_text(request, extracted_text)
        detected_urls = self._inspect_urls(request, normalized_text)
        matched_patterns = pattern_matcher.match(normalized_text, request.platform.value if request.platform else None)
        signal_hits = self._score_signals(normalized_text)
        categories = self._resolve_categories(normalized_text, matched_patterns)

        risk_score = min(
            sum(score for _, score, _ in signal_hits)
            + sum(item.score_contribution for item in detected_urls)
            + int(sum(match.confidence * 14 for match in matched_patterns)),
            100,
        )
        if not normalized_text.strip():
            risk_score = max(risk_score, 20 if request.url else 0)

        risk_level = self._risk_level_for_score(risk_score)
        red_flags = self._build_red_flags(signal_hits, detected_urls, matched_patterns)
        summary = self._build_summary(request, risk_level, categories, detected_urls)
        explanation = self._build_explanation(risk_level, signal_hits, detected_urls, matched_patterns)
        recommended_action = self._build_recommended_action(risk_level, detected_urls)
        safe_reply = self._build_safe_reply(risk_level)
        report_summary = self._build_report_summary(request, risk_score, risk_level, categories, red_flags)
        confidence = self._build_confidence(signal_hits, detected_urls, matched_patterns)

        return AnalysisResult(
            riskScore=risk_score,
            riskLevel=risk_level,
            scamCategories=categories,
            summary=summary,
            redFlags=red_flags,
            explanation=explanation,
            recommendedAction=recommended_action,
            safeReply=safe_reply,
            reportSummary=report_summary,
            confidence=confidence,
            matchedPatterns=matched_patterns,
            detectedUrls=detected_urls,
            normalizedText=normalized_text,
            extractedText=extracted_text,
        )

    @staticmethod
    def build_report_record(
        request: AnalyzeRequest,
        result: AnalysisResult,
        uploaded_file: UploadedFileRecord | None,
        user_id: str | None,
        organization_id: str | None,
    ) -> ReportRecord:
        return ReportRecord(
            id=str(uuid4()),
            user_id=user_id,
            organization_id=organization_id,
            platform=request.platform.value if request.platform else None,
            input_type=request.inputType.value,
            raw_text=request.text or result.extractedText,
            url=request.url,
            screenshot_url=uploaded_file.file_url if uploaded_file else None,
            risk_score=result.riskScore,
            risk_level=result.riskLevel.value,
            scam_categories=result.scamCategories,
            summary=result.summary,
            red_flags=result.redFlags,
            explanation=result.explanation,
            recommended_action=result.recommendedAction,
            safe_reply=result.safeReply,
            report_summary=result.reportSummary,
            confidence=result.confidence,
            matched_patterns=result.matchedPatterns,
            url_checks=result.detectedUrls,
            created_at=datetime.now(UTC),
        )

    @staticmethod
    def _normalize_text(request: AnalyzeRequest, extracted_text: str) -> str:
        raw = " ".join(part for part in [request.text, request.url, extracted_text] if part)
        normalized = re.sub(r"\s+", " ", raw).strip()
        return normalized[:5000]

    @staticmethod
    def _inspect_urls(request: AnalyzeRequest, normalized_text: str):
        urls = []
        if request.url:
            urls.append(request.url)
        urls.extend(extract_urls(normalized_text))
        unique_urls = list(dict.fromkeys(urls))
        return [inspect_url(url) for url in unique_urls[:5]]

    @staticmethod
    def _score_signals(text: str) -> list[tuple[str, int, str]]:
        lowered = text.lower()
        hits: list[tuple[str, int, str]] = []
        for label, score, explanation, keywords in SIGNAL_RULES:
            if any(keyword in lowered for keyword in keywords):
                hits.append((label, score, explanation))
        if len(lowered.split()) <= 10 and any(token in lowered for token in ("dm me", "click", "verify")):
            hits.append(
                (
                    "Sparse but directive wording",
                    6,
                    "Extremely short messages with direct instructions often hide context and rely on impulse.",
                )
            )
        return hits

    @staticmethod
    def _resolve_categories(text: str, matches: list[MatchedPattern]) -> list[str]:
        categories = {match.scamCategory for match in matches}
        lowered = text.lower()
        for category, keywords in CATEGORY_HINTS:
            if any(keyword in lowered for keyword in keywords):
                categories.add(category)
        if "job" in lowered or "internship" in lowered:
            categories.add("Job or internship scam")
        if "romance" in lowered or "baby" in lowered or "love" in lowered:
            categories.add("Romance scam")
        if "recover your account" in lowered or "verify your login" in lowered:
            categories.add("Account recovery scam")
        if not categories:
            categories.add("Unknown or unclear scam type")
        return sorted(categories)

    @staticmethod
    def _risk_level_for_score(score: int) -> RiskLevel:
        if score >= 80:
            return RiskLevel.CRITICAL
        if score >= 50:
            return RiskLevel.HIGH
        if score >= 25:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW

    @staticmethod
    def _build_red_flags(
        signal_hits: list[tuple[str, int, str]],
        detected_urls,
        matched_patterns: list[MatchedPattern],
    ) -> list[str]:
        flags = [label for label, _, _ in signal_hits]
        for url in detected_urls:
            flags.extend(url.suspicious_indicators[:2])
        for match in matched_patterns:
            flags.extend(match.redFlags[:2])
        # The de-dup keeps the API response predictable for the UI and export summaries.
        return list(dict.fromkeys(flags))[:8]

    @staticmethod
    def _build_summary(
        request: AnalyzeRequest,
        risk_level: RiskLevel,
        categories: list[str],
        detected_urls,
    ) -> str:
        platform = request.platform.value if request.platform else "the submitted platform"
        if risk_level in {RiskLevel.HIGH, RiskLevel.CRITICAL}:
            return (
                f"This content shows multiple scam indicators on {platform}, especially around "
                f"{categories[0].lower()} behavior and risky engagement prompts."
            )
        if detected_urls:
            return f"The submission is not conclusive, but the link and wording contain signals that deserve verification before any response."
        return f"The submission has limited evidence, but there are enough warning signs to verify the sender before engaging further."

    @staticmethod
    def _build_explanation(
        risk_level: RiskLevel,
        signal_hits: list[tuple[str, int, str]],
        detected_urls,
        matched_patterns: list[MatchedPattern],
    ) -> str:
        parts = [explanation for _, _, explanation in signal_hits[:3]]
        if detected_urls and detected_urls[0].suspicious_indicators:
            parts.append(detected_urls[0].suspicious_indicators[0])
        if matched_patterns:
            parts.append(
                f"The content also overlaps with known {matched_patterns[0].scamCategory.lower()} patterns."
            )
        if not parts:
            parts.append("Evidence is limited, so the result should be treated as a cautionary assessment instead of a final verdict.")
        prefix = "This is a critical risk assessment." if risk_level == RiskLevel.CRITICAL else "This assessment is based on the submitted wording and any detected links."
        return f"{prefix} {' '.join(parts)}"

    @staticmethod
    def _build_recommended_action(risk_level: RiskLevel, detected_urls) -> str:
        if risk_level == RiskLevel.CRITICAL:
            return "Do not reply, click links, send money, or share codes. Block the sender, preserve screenshots, and report the account through the platform."
        if risk_level == RiskLevel.HIGH:
            return "Pause contact until the identity, listing, or offer is verified through an official channel. Keep all payment and communication on the original platform."
        if detected_urls:
            return "Do not open the link until you verify the domain independently. Visit the official site manually if you need to confirm the claim."
        return "Ask for verifiable details, confirm them through a trusted source, and avoid sharing personal or financial information."

    @staticmethod
    def _build_safe_reply(risk_level: RiskLevel) -> str:
        if risk_level == RiskLevel.CRITICAL:
            return "No response is recommended. If a reply is unavoidable: I will only continue through the platform's verified support or official website."
        if risk_level == RiskLevel.HIGH:
            return "I will not proceed until I can verify your identity or this offer through an official source."
        return "Before I continue, please provide a verifiable website, business contact, and any official reference for this request."

    @staticmethod
    def _build_report_summary(
        request: AnalyzeRequest,
        risk_score: int,
        risk_level: RiskLevel,
        categories: list[str],
        red_flags: list[str],
    ) -> str:
        platform = request.platform.value if request.platform else "Other"
        category_text = ", ".join(categories[:2])
        red_flag_text = "; ".join(red_flags[:4]) if red_flags else "No specific red flags captured."
        return (
            f"RadarAI assessed this {request.inputType.value} submission from {platform} as {risk_level.value} risk "
            f"(score {risk_score}/100). Potential scam category: {category_text}. Key red flags: {red_flag_text}."
        )

    @staticmethod
    def _build_confidence(signal_hits, detected_urls, matched_patterns: list[MatchedPattern]) -> float:
        raw = 0.35 + (len(signal_hits) * 0.1) + (len(detected_urls) * 0.08)
        if matched_patterns:
            raw += matched_patterns[0].confidence * 0.22
        return round(min(raw, 0.98), 2)


analysis_service = AnalysisService()
