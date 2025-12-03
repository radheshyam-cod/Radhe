from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.models.attempt import Attempt
from app.models.mastery import Mastery
from app.schemas.attempt import AttemptCreate, Attempt as AttemptSchema
from app.services.mastery_service import calculate_mastery_score

router = APIRouter()

@router.post("/submit", response_model=AttemptSchema)
def submit_attempt(
    attempt_in: AttemptCreate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
) -> Any:
    """
    Submit a single question attempt, log it, and update the user's mastery score for the topic.
    """
    # Create and log the attempt
    db_attempt = Attempt(
        user_id=current_user.id,
        topic_id=attempt_in.topicId,
        question_id=attempt_in.questionId,
        is_correct=attempt_in.isCorrect,
        solving_time=attempt_in.solvingTime,
        confidence=attempt_in.confidence,
    )
    db.add(db_attempt)

    # Calculate the new mastery score
    new_mastery_score = calculate_mastery_score(
        is_correct=attempt_in.isCorrect,
        solving_time=attempt_in.solvingTime,
        confidence=attempt_in.confidence,
    )

    # Upsert mastery score
    mastery = (
        db.query(Mastery)
        .filter(Mastery.user_id == current_user.id, Mastery.topic_id == attempt_in.topicId)
        .first()
    )
    if not mastery:
        mastery = Mastery(
            user_id=current_user.id, 
            topic_id=attempt_in.topicId, 
            score=new_mastery_score
        )
        db.add(mastery)
    else:
        mastery.score = new_mastery_score

    db.commit()
    db.refresh(db_attempt)

    return db_attempt
