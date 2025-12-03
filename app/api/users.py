from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.user import User, UserUpdate
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/update", response_model=User)
def update_user(
    user_in: UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    """
    Update user profile
    """
    user = db.query(UserModel).filter(UserModel.id == current_user.id).first()
    if user_in.name:
        user.name = user_in.name
    if user_in.school:
        user.school = user_in.school
    if user_in.class_name:
        user.class_name = user_in.class_name
    if user_in.year:
        user.year = user_in.year
    
    db.commit()
    db.refresh(user)
    return user

@router.get("/me", response_model=User)
def get_current_user_info(
    current_user: UserModel = Depends(deps.get_current_user)
) -> Any:
    """
    Get current user profile
    """
    return current_user
