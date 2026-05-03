from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from schemas import MatchedPattern


@dataclass(frozen=True, slots=True)
class PatternDefinition:
    id: str
    scam_category: str
    platform: str
    pattern_description: str
    red_flags: list[str]
    severity: str
    recommended_action: str
    source_reference: str
    keywords: list[str]


BUILT_IN_PATTERNS: tuple[PatternDefinition, ...] = (
    PatternDefinition(
        id="investment-guaranteed-returns",
        scam_category="Fake investment scam",
        platform="Other",
        pattern_description="Promises unusually high returns with little or no risk.",
        red_flags=["Guaranteed profits", "Urgent deposit request", "Pressure to act privately"],
        severity="critical",
        recommended_action="Do not send money. Verify the entity independently and report the account.",
        source_reference="Internal risk rules",
        keywords=[
            "guaranteed return",
            "double your money",
            "crypto opportunity",
            "investment secret",
            "profit in 24 hours",
        ],
    ),
    PatternDefinition(
        id="marketplace-payment-redirect",
        scam_category="Marketplace scam",
        platform="Online marketplace",
        pattern_description="Attempts to move the buyer or seller off-platform for payment or shipping.",
        red_flags=["Off-platform payment", "Wire transfer or gift card request", "Refusal to use platform checkout"],
        severity="high",
        recommended_action="Keep payment and messaging on the marketplace platform only.",
        source_reference="Internal risk rules",
        keywords=[
            "zelle only",
            "cash app only",
            "pay outside",
            "shipping agent",
            "kindly send deposit",
        ],
    ),
    PatternDefinition(
        id="job-upfront-fee",
        scam_category="Job or internship scam",
        platform="LinkedIn",
        pattern_description="Requests payment, gift cards, or bank details before a legitimate hiring step.",
        red_flags=["Upfront fee", "Interview skipped", "Immediate personal data request"],
        severity="high",
        recommended_action="Do not pay for a job. Verify the employer through a public company channel.",
        source_reference="Internal risk rules",
        keywords=[
            "pay for training",
            "equipment reimbursement",
            "remote assistant",
            "send your ssn",
            "instant hire",
        ],
    ),
    PatternDefinition(
        id="romance-emergency-money",
        scam_category="Romance scam",
        platform="Dating app",
        pattern_description="Builds emotional urgency and then requests money, travel support, or secrecy.",
        red_flags=["Fast emotional escalation", "Emergency money request", "Avoids verifiable identity"],
        severity="critical",
        recommended_action="Do not send money or identity documents. Stop the conversation and report the profile.",
        source_reference="Internal risk rules",
        keywords=[
            "i love you already",
            "medical emergency",
            "need help with travel",
            "keep this between us",
            "send me money today",
        ],
    ),
    PatternDefinition(
        id="impersonation-account-recovery",
        scam_category="Account recovery scam",
        platform="Instagram",
        pattern_description="Claims to help recover or secure an account while requesting credentials or codes.",
        red_flags=["Requests login code", "Pretends to be platform support", "Credential phishing"],
        severity="critical",
        recommended_action="Do not share passwords or one-time codes. Use the platform's official recovery page.",
        source_reference="Internal risk rules",
        keywords=[
            "send the code",
            "confirm your password",
            "recover your account",
            "instagram support",
            "verify your login",
        ],
    ),
    PatternDefinition(
        id="phishing-brand-spoof",
        scam_category="Phishing scam",
        platform="Other",
        pattern_description="Uses a trusted brand name but directs the victim to a mismatched or obfuscated domain.",
        red_flags=["Brand-domain mismatch", "Credential request", "Urgent account action"],
        severity="critical",
        recommended_action="Do not click the link. Visit the brand's official website manually instead.",
        source_reference="Internal risk rules",
        keywords=[
            "confirm account",
            "suspended today",
            "verify billing",
            "reset login",
            "unusual sign-in",
        ],
    ),
)


class PatternMatcher:
    def match(self, text: str, platform: str | None = None) -> list[MatchedPattern]:
        normalized = text.lower()
        if not normalized:
            return []

        matches: list[MatchedPattern] = []
        for definition in BUILT_IN_PATTERNS:
            confidence = self._score_match(normalized, definition.keywords)
            if confidence <= 0:
                continue
            if definition.platform != "Other" and platform and definition.platform != platform:
                confidence *= 0.9

            matches.append(
                MatchedPattern(
                    id=definition.id,
                    scamCategory=definition.scam_category,
                    platform=definition.platform,
                    patternDescription=definition.pattern_description,
                    redFlags=definition.red_flags,
                    severity=definition.severity,
                    recommendedAction=definition.recommended_action,
                    sourceReference=definition.source_reference,
                    confidence=min(round(confidence, 2), 0.98),
                )
            )

        matches.sort(key=lambda item: item.confidence, reverse=True)
        return matches[:3]

    @staticmethod
    def _score_match(text: str, keywords: Iterable[str]) -> float:
        hits = sum(1 for keyword in keywords if keyword in text)
        if hits == 0:
            return 0
        return min(0.35 + (hits * 0.18), 0.95)


pattern_matcher = PatternMatcher()
