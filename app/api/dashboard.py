from typing import Any, List, Dict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.models.mastery import Mastery
from app.models.revision import RevisionSchedule
from app.models.attempt import Attempt

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
) -> Any:
    """Return high-level progress stats for the current user.

    This powers the Dashboard, Progress, and Revision pages. The response is
    intentionally shaped in camelCase to match the frontend expectations.
    """
    # Mastery-based aggregates
    masteries: List[Mastery] = db.query(Mastery).filter(Mastery.user_id == current_user.id).all()

    weak_topics: List[Dict[str, Any]] = []
    mastered_topics: List[str] = []

    for m in masteries:
        topic_name = m.topic.name if m.topic else "Unknown"
        if m.score is None:
            continue
        if m.score < 60:
            weak_topics.append({"topic": topic_name, "score": float(m.score)})
        if m.score >= 80:
            mastered_topics.append(topic_name)

    # Upcoming revisions in the next 7 days
    now = datetime.utcnow()
    window_end = now + timedelta(days=7)
    schedules: List[RevisionSchedule] = (
        db.query(RevisionSchedule)
        .filter(
            RevisionSchedule.user_id == current_user.id,
            RevisionSchedule.scheduled_date >= now,
            RevisionSchedule.scheduled_date <= window_end,
        )
        .all()
    )

    upcoming_revisions: List[Dict[str, Any]] = []
    for s in schedules:
        topic_name = s.topic.name if s.topic else "Unknown"
        upcoming_revisions.append(
            {
                "topic": topic_name,
                "date": s.scheduled_date.isoformat(),
                "topicId": s.topic_id,
            }
        )

    # Very simple approximation for total "study minutes":
    # treat each attempt as ~2 minutes of focused work. This is deterministic
    # and based on actual data (no random numbers involved).
    attempt_count = db.query(Attempt).filter(Attempt.user_id == current_user.id).count()
    total_study_minutes = attempt_count * 2

    return {
        "weakTopics": weak_topics,
        "masteredTopics": mastered_topics,
        "upcomingRevisions": upcoming_revisions,
        "totalStudyMinutes": total_study_minutes,
    }
