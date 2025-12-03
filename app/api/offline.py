from typing import Any, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.models.attempt import Attempt

router = APIRouter()


class OfflineAttemptPayload(dict):
    """Loose typing for offline attempts payload.

    We intentionally keep this flexible because offline queues may evolve over
    time. The frontend should, at minimum, send topicId and isCorrect.
    """


@router.post("/sync")
def sync_offline_data(
    data: dict,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
) -> Any:
    """Sync offline data (primarily question attempts) to the backend.

    Expected payload shape (frontend offline queue):

    {
      "attempts": [
        {
          "topicId": 1,
          "questionId": 10,          # optional
          "isCorrect": true,
          "solvingTime": 23,        # optional (seconds)
          "confidence": 0.8,        # optional (0-1)
          "createdAt": "..."       # optional ISO timestamp
        }
      ]
    }
    """
    attempts_data: List[OfflineAttemptPayload] = data.get("attempts", []) or []
    synced_count = 0

    for attempt in attempts_data:
        topic_id: Optional[str] = attempt.get("topicId") # Changed to str
        if topic_id is None:
            continue

        created_at_raw = attempt.get("createdAt")
        created_at: Optional[datetime] = None
        if isinstance(created_at_raw, str):
            try:
                created_at = datetime.fromisoformat(created_at_raw)
            except Exception:
                created_at = None

        is_correct = bool(attempt.get("isCorrect"))
        
        db_attempt = Attempt(
            user_id=current_user.id,
            topic_id=topic_id,
            question_id=attempt.get("questionId"), # Add questionId
            is_correct=is_correct,
            timestamp=created_at or None,
        )
        db.add(db_attempt)
        synced_count += 1
        
        # Update Mastery (Simple heuristic for offline sync)
        from app.models.mastery import Mastery
        mastery = db.query(Mastery).filter(Mastery.user_id == current_user.id, Mastery.topic_id == topic_id).first()
        score_change = 5 if is_correct else -2
        if not mastery:
            mastery = Mastery(user_id=current_user.id, topic_id=topic_id, score=50.0 + score_change)
            db.add(mastery)
        else:
            mastery.score = max(0.0, min(100.0, float(mastery.score) + score_change))

    db.commit()
    return {"status": "synced", "count": synced_count}
