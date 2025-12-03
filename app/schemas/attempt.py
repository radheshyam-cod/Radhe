from typing import Optional, List

from pydantic import BaseModel


class AttemptCreate(BaseModel):
    """Payload for logging a single online attempt.

    Field names are camelCase to match the frontend, but the backend will map
    them onto the SQLAlchemy model's snake_case fields.
    """

    topicId: str
    questionId: Optional[str] = None
    isCorrect: bool
    solvingTime: Optional[int] = None
    confidence: Optional[float] = None


class AttemptDiagnosis(BaseModel):
    masteryScore: float
    isWeak: bool
    feedback: str
    prerequisiteGaps: List[str]