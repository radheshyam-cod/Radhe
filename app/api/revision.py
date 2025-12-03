from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.revision import RevisionSchedule
from app.models.topic import Topic
from app.services.spaced_repetition import SM2
from datetime import datetime

router = APIRouter()

@router.post("/schedule/{topic_id}")
def schedule_initial_revision(
    topic_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
):
    """
    Schedules the first revision for a new topic (Day 1).
    """
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    existing_schedule = db.query(RevisionSchedule).filter_by(user_id=current_user.id, topic_id=topic_id).first()
    if existing_schedule:
        raise HTTPException(status_code=400, detail="Revision already scheduled")

    sm2 = SM2()
    sm2.schedule_first_review()

    schedule = RevisionSchedule(
        user_id=current_user.id,
        topic_id=topic_id,
        **sm2.to_dict()
    )
    db.add(schedule)
    db.commit()
    return {"message": f"Revision for '{topic.name}' scheduled for {schedule.scheduled_date}."}

@router.post("/log-review/{topic_id}")
def log_revision_review(
    topic_id: int,
    quality: int, # User's self-assessed quality of recall (0-5)
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
):
    """
    Log a user's review and calculate the next revision date.
    """
    schedule = db.query(RevisionSchedule).filter_by(user_id=current_user.id, topic_id=topic_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="No revision schedule found for this topic.")

    sm2 = SM2.from_dict(schedule.to_dict())
    sm2.review(quality)

    # Update schedule with new values
    for key, value in sm2.to_dict().items():
        setattr(schedule, key, value)
    
    db.commit()
    return {"message": f"Review logged. Next review on {schedule.scheduled_date}."}

@router.get("/upcoming", response_model=List[RevisionSchedule])
def get_upcoming_revisions(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
):
    """
    Get all revision schedules that are due.
    """
    now = datetime.utcnow()
    revisions = db.query(RevisionSchedule).filter(
        RevisionSchedule.user_id == current_user.id,
        RevisionSchedule.scheduled_date <= now
    ).all()
    return revisions
