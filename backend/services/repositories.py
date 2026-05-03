from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from sqlalchemy import delete, desc, select

from core.database import PatternTable, ReportTable, UploadedFileTable, UserTable, session_scope
from core.config import settings
from schemas import (
    AuthUser,
    DashboardMetricPoint,
    DashboardResponse,
    PatternCreateRequest,
    PatternRecord,
    ReportRecord,
    UploadedFileRecord,
)


class Repository:
    def create_user(self, *, email: str, password_hash: str, role: str = "user") -> AuthUser:
        with session_scope() as session:
            existing = session.scalar(select(UserTable).where(UserTable.email == email.lower()))
            if existing is not None:
                raise ValueError("An account with this email already exists.")

            row = UserTable(
                id=str(uuid4()),
                email=email.lower(),
                password_hash=password_hash,
                role=role,
            )
            session.add(row)
            session.flush()
            return AuthUser(id=row.id, email=row.email)

    def get_user_credentials(self, email: str) -> tuple[AuthUser, str, str, str | None] | None:
        with session_scope() as session:
            row = session.scalar(select(UserTable).where(UserTable.email == email.lower()))
            if row is None:
                return None
            return AuthUser(id=row.id, email=row.email), row.password_hash, row.role, row.organization_id

    def get_user(self, user_id: str) -> AuthUser | None:
        with session_scope() as session:
            row = session.get(UserTable, user_id)
            if row is None:
                return None
            return AuthUser(id=row.id, email=row.email)

    def get_user_context(self, user_id: str) -> tuple[AuthUser, str, str | None] | None:
        with session_scope() as session:
            row = session.get(UserTable, user_id)
            if row is None:
                return None
            return AuthUser(id=row.id, email=row.email), row.role, row.organization_id

    def save_report(self, report: ReportRecord) -> ReportRecord:
        with session_scope() as session:
            row = ReportTable(
                id=report.id,
                user_id=report.user_id,
                organization_id=report.organization_id,
                platform=report.platform,
                input_type=report.input_type,
                raw_text=report.raw_text,
                url=report.url,
                screenshot_url=report.screenshot_url,
                risk_score=report.risk_score,
                risk_level=report.risk_level,
                scam_categories=report.scam_categories,
                summary=report.summary,
                red_flags=report.red_flags,
                explanation=report.explanation,
                recommended_action=report.recommended_action,
                safe_reply=report.safe_reply,
                report_summary=report.report_summary,
                confidence=report.confidence,
                matched_patterns=[pattern.model_dump(mode="json") for pattern in report.matched_patterns],
                url_checks=[url_check.model_dump(mode="json") for url_check in report.url_checks],
                created_at=report.created_at,
            )
            session.merge(row)
            return report

    def list_reports(self, user_id: str | None = None) -> list[ReportRecord]:
        with session_scope() as session:
            query = select(ReportTable).order_by(desc(ReportTable.created_at))
            if user_id:
                query = query.where(ReportTable.user_id == user_id)
            rows = session.scalars(query).all()
            return [self._report_from_row(row) for row in rows]

    def get_report(self, report_id: str, user_id: str | None = None) -> ReportRecord | None:
        with session_scope() as session:
            row = session.get(ReportTable, report_id)
            if row is None:
                return None
            if user_id and row.user_id != user_id:
                return None
            return self._report_from_row(row)

    def delete_report(self, report_id: str, user_id: str | None = None) -> bool:
        with session_scope() as session:
            query = delete(ReportTable).where(ReportTable.id == report_id)
            if user_id:
                query = query.where(ReportTable.user_id == user_id)
            result = session.execute(query)
            return bool(result.rowcount)

    def save_uploaded_file(self, file_record: UploadedFileRecord) -> UploadedFileRecord:
        with session_scope() as session:
            row = UploadedFileTable(
                id=file_record.id,
                user_id=file_record.user_id,
                scam_report_id=file_record.scam_report_id,
                file_url=file_record.file_url,
                file_type=file_record.file_type,
                file_size=file_record.file_size,
                ocr_text=file_record.ocr_text,
                created_at=file_record.created_at,
            )
            session.merge(row)
            return file_record

    def get_uploaded_file(self, file_id: str) -> UploadedFileRecord | None:
        with session_scope() as session:
            row = session.get(UploadedFileTable, file_id)
            if row is None:
                return None
            return UploadedFileRecord(
                id=row.id,
                user_id=row.user_id,
                scam_report_id=row.scam_report_id,
                file_url=row.file_url,
                file_type=row.file_type,
                file_size=row.file_size,
                ocr_text=row.ocr_text,
                created_at=row.created_at,
            )

    def list_uploaded_files(self, user_id: str) -> list[UploadedFileRecord]:
        with session_scope() as session:
            rows = session.scalars(
                select(UploadedFileTable)
                .where(UploadedFileTable.user_id == user_id)
                .order_by(desc(UploadedFileTable.created_at))
            ).all()
            return [
                UploadedFileRecord(
                    id=row.id,
                    user_id=row.user_id,
                    scam_report_id=row.scam_report_id,
                    file_url=row.file_url,
                    file_type=row.file_type,
                    file_size=row.file_size,
                    ocr_text=row.ocr_text,
                    created_at=row.created_at,
                )
                for row in rows
            ]

    def attach_uploaded_file_to_report(self, *, file_id: str, report_id: str, user_id: str) -> None:
        with session_scope() as session:
            row = session.get(UploadedFileTable, file_id)
            if row is None:
                return
            if row.user_id != user_id:
                return
            # The ownership check above prevents a user from attaching someone else's upload
            # to their report if an arbitrary file id is submitted.
            row.scam_report_id = report_id

    def create_pattern(self, payload: PatternCreateRequest) -> PatternRecord:
        with session_scope() as session:
            now = datetime.utcnow()
            row = PatternTable(
                id=str(uuid4()),
                scam_category=payload.scamCategory,
                platform=payload.platform,
                pattern_description=payload.patternDescription,
                red_flags=payload.redFlags,
                severity=payload.severity,
                recommended_action=payload.recommendedAction,
                source_reference=payload.sourceReference,
                embedding=payload.embedding,
                created_at=now,
                updated_at=now,
            )
            session.add(row)
            session.flush()
            return self._pattern_from_row(row)

    def list_patterns(self) -> list[PatternRecord]:
        with session_scope() as session:
            rows = session.scalars(select(PatternTable).order_by(desc(PatternTable.created_at))).all()
            return [self._pattern_from_row(row) for row in rows]

    def build_dashboard(self, user_id: str | None = None) -> DashboardResponse:
        return _build_dashboard_from_reports(self.list_reports(user_id=user_id))

    @staticmethod
    def _report_from_row(row: ReportTable) -> ReportRecord:
        return ReportRecord(
            id=row.id,
            user_id=row.user_id,
            organization_id=row.organization_id,
            platform=row.platform,
            input_type=row.input_type,
            raw_text=row.raw_text,
            url=row.url,
            screenshot_url=row.screenshot_url,
            risk_score=row.risk_score,
            risk_level=row.risk_level,
            scam_categories=row.scam_categories or [],
            summary=row.summary,
            red_flags=row.red_flags or [],
            explanation=row.explanation,
            recommended_action=row.recommended_action,
            safe_reply=row.safe_reply,
            report_summary=row.report_summary,
            confidence=row.confidence,
            matched_patterns=row.matched_patterns or [],
            url_checks=row.url_checks or [],
            created_at=row.created_at,
        )

    @staticmethod
    def _pattern_from_row(row: PatternTable) -> PatternRecord:
        return PatternRecord(
            id=row.id,
            scamCategory=row.scam_category,
            platform=row.platform,
            patternDescription=row.pattern_description,
            redFlags=row.red_flags or [],
            severity=row.severity,
            recommendedAction=row.recommended_action,
            sourceReference=row.source_reference,
            embedding=row.embedding or [],
            created_at=row.created_at,
            updated_at=row.updated_at,
        )


def _build_dashboard_from_reports(reports: list[ReportRecord]) -> DashboardResponse:
    if not reports:
        return DashboardResponse()

    risk_counter = Counter(report.risk_level for report in reports)
    category_counter = Counter(category for report in reports for category in report.scam_categories)
    platform_counter = Counter((report.platform or "Unknown") for report in reports)
    flag_counter = Counter(flag for report in reports for flag in report.red_flags)

    activity_counter: dict[str, int] = defaultdict(int)
    for report in reports:
        activity_counter[report.created_at.strftime("%b %d")] += 1

    return DashboardResponse(
        totalScans=len(reports),
        averageRiskScore=round(sum(report.risk_score for report in reports) / len(reports), 1),
        highRiskCount=sum(1 for report in reports if report.risk_level == "High"),
        criticalRiskCount=sum(1 for report in reports if report.risk_level == "Critical"),
        scansByRiskLevel=[DashboardMetricPoint(label=key, value=value) for key, value in risk_counter.items()],
        scansByCategory=[
            DashboardMetricPoint(label=key, value=value) for key, value in category_counter.most_common(6)
        ],
        scansByPlatform=[
            DashboardMetricPoint(label=key, value=value) for key, value in platform_counter.most_common(6)
        ],
        commonRedFlags=[
            DashboardMetricPoint(label=key, value=value) for key, value in flag_counter.most_common(6)
        ],
        activityTimeline=[
            DashboardMetricPoint(label=key, value=value)
            for key, value in sorted(activity_counter.items(), key=lambda item: item[0])
        ],
    )


repository = Repository()
local_upload_dir = Path(settings.uploads_dir)
local_upload_dir.mkdir(parents=True, exist_ok=True)
