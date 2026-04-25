from sqlalchemy.orm import Session

from app.db.detected_sheets import get_detected_sheets_by_analysis_id
from app.db.drawing_lists import get_drawing_lists_by_analysis_id
from app.db.footer_audit import get_footer_audit_by_analysis_id
from app.db.issues import list_issues_with_evidences_by_analysis_id
from app.db.ld_sheet_crosscheck import get_ld_sheet_crosscheck_by_analysis_id
from app.db.memorial_audit import get_memorial_audit_by_analysis_id
from app.db.package_summary import get_package_summary_by_analysis_id
from app.worker.audit_summary import build_audit_summary


def get_audit_summary_by_analysis_id(
    session: Session,
    analysis_id: int,
) -> dict:
    package_summary = get_package_summary_by_analysis_id(session, analysis_id)
    drawing_lists = get_drawing_lists_by_analysis_id(session, analysis_id)
    detected_sheets = get_detected_sheets_by_analysis_id(session, analysis_id)
    ld_sheet_crosscheck = get_ld_sheet_crosscheck_by_analysis_id(session, analysis_id)
    memorial_audit = get_memorial_audit_by_analysis_id(session, analysis_id)
    footer_audit = get_footer_audit_by_analysis_id(session, analysis_id)
    issues = list_issues_with_evidences_by_analysis_id(session, analysis_id)

    return build_audit_summary(
        issues=issues,
        package_summary=package_summary,
        drawing_lists=drawing_lists,
        detected_sheets=detected_sheets,
        ld_sheet_crosscheck=ld_sheet_crosscheck,
        memorial_audit=memorial_audit,
        footer_audit=footer_audit,
    )
