from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api import deps
from app.models.user import User
from app.models.mastery import Mastery
from app.models.attempt import Attempt
from app.schemas.user import User as UserSchema

router = APIRouter()

def check_teacher_role(current_user: User):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

@router.get("/students", response_model=List[UserSchema])
def get_students(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get list of all students (Teacher/Admin only)
    """
    check_teacher_role(current_user)
    students = db.query(User).filter(User.role == "student").all()
    return students

@router.get("/analytics/heatmap")
def get_class_heatmap(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get mastery heatmap for all students (Teacher/Admin only)
    Returns: { topic_name: average_score }
    """
    check_teacher_role(current_user)
    
    # Aggregate mastery scores by topic
    results = db.query(
        Mastery.topic_id,
        func.avg(Mastery.score).label("avg_score")
    ).group_by(Mastery.topic_id).all()
    
    heatmap = []
    for topic_id, avg_score in results:
        # In a real app, we'd join with Topic table to get names
        # For now, returning ID and score
        heatmap.append({"topicId": topic_id, "averageScore": float(avg_score)})
        
    return heatmap

@router.get("/analytics/difficulty")
def get_difficulty_map(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Identify difficult concepts based on low average mastery
    """
    check_teacher_role(current_user)
    
    # Find topics with avg score < 50
    results = db.query(
        Mastery.topic_id,
        func.avg(Mastery.score).label("avg_score")
    ).group_by(Mastery.topic_id).having(func.avg(Mastery.score) < 50).all()
    
    difficult_topics = []
    for topic_id, avg_score in results:
        difficult_topics.append({"topicId": topic_id, "averageScore": float(avg_score)})
        
    return difficult_topics
