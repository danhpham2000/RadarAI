from __future__ import annotations

import ipaddress
import re
from urllib.parse import parse_qs, urlparse

from schemas import UrlCheckSummary

SHORTENER_DOMAINS = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "cutt.ly",
    "rebrand.ly",
}

SUSPICIOUS_TERMS = {
    "login",
    "verify",
    "wallet",
    "secure",
    "bonus",
    "claim",
    "gift",
    "winner",
    "crypto",
    "payout",
    "bank",
    "password",
}

TRUSTED_BRANDS = {
    "paypal": "paypal.com",
    "apple": "apple.com",
    "netflix": "netflix.com",
    "amazon": "amazon.com",
    "microsoft": "microsoft.com",
    "chase": "chase.com",
    "instagram": "instagram.com",
}


def inspect_url(raw_url: str) -> UrlCheckSummary:
    candidate = raw_url.strip()
    if not candidate.startswith(("http://", "https://")):
        candidate = f"https://{candidate}"

    parsed = urlparse(candidate)
    domain = parsed.netloc.lower()
    indicators: list[str] = []
    score = 0

    if parsed.scheme != "https":
        indicators.append("Link does not use HTTPS.")
        score += 8

    if domain.count(".") >= 3:
        indicators.append("Domain uses an unusual number of subdomains.")
        score += 8

    if len(candidate) >= 90:
        indicators.append("URL is unusually long or obfuscated.")
        score += 6

    if any(term in candidate.lower() for term in SUSPICIOUS_TERMS):
        indicators.append("URL contains high-risk keywords often used in phishing or payment scams.")
        score += 8

    if "@" in candidate or "%40" in candidate.lower():
        indicators.append("URL contains obfuscation that can hide the true destination.")
        score += 10

    if domain in SHORTENER_DOMAINS:
        indicators.append("Shortened links hide the final destination.")
        score += 10

    if _looks_like_ip_address(domain):
        indicators.append("Link points directly to an IP address instead of a normal domain.")
        score += 10

    if domain.startswith("xn--"):
        indicators.append("Domain uses punycode, which can be abused for lookalike links.")
        score += 10

    brand_mismatch = _find_brand_mismatch(candidate, domain)
    if brand_mismatch:
        indicators.append(brand_mismatch)
        score += 12

    query = parse_qs(parsed.query)
    if any(len(values) > 2 for values in query.values()):
        indicators.append("Link carries unusually dense tracking or redirect parameters.")
        score += 5

    reputation = "suspicious" if score >= 18 else "unknown"
    return UrlCheckSummary(
        url=raw_url,
        domain=domain,
        https_enabled=parsed.scheme == "https",
        suspicious_indicators=indicators,
        reputation_status=reputation,
        score_contribution=min(score, 30),
    )


def extract_urls(text: str) -> list[str]:
    pattern = re.compile(r"(https?://[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)")
    found: list[str] = []
    for match in pattern.findall(text):
        trimmed = match.rstrip(".,);]")
        if "." not in trimmed:
            continue
        found.append(trimmed)
    return list(dict.fromkeys(found))


def _looks_like_ip_address(domain: str) -> bool:
    try:
        ipaddress.ip_address(domain)
        return True
    except ValueError:
        return False


def _find_brand_mismatch(url: str, domain: str) -> str | None:
    lowered = url.lower()
    for brand, canonical_domain in TRUSTED_BRANDS.items():
        if brand in lowered and canonical_domain not in domain:
            return f"Link mentions {brand.title()} but points to a different domain."
    return None
