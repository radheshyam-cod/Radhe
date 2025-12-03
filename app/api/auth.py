from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from firebase_admin import auth as firebase_auth, credentials
import firebase_admin
import json

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.schemas.user import Token, VerifyOtpRequest
from app.core.security import get_password_hash

router = APIRouter()

# Initialize Firebase Admin if credentials are available
if settings.FIREBASE_SERVICE_ACCOUNT_KEY_JSON and not firebase_admin._apps:
    try:
        cred = credentials.Certificate(json.loads(settings.FIREBASE_SERVICE_ACCOUNT_KEY_JSON))
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Warning: Could not initialize Firebase Admin: {e}")

@router.post("/admin-login", response_model=Token)
def login_admin(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Admin login using email and password.
    """
    if form_data.username != "admin@conceptpulse.edu" or form_data.password != "admin123":
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        # Create admin user if it doesn't exist
        hashed_password = get_password_hash(form_data.password)
        user = User(
            email=form_data.username,
            hashed_password=hashed_password,
            is_superuser=True,
            full_name="Admin User"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    access_token = security.create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/verify-otp", response_model=Token)
def verify_otp_and_login(
    req: VerifyOtpRequest,
    db: Session = Depends(deps.get_db)
):
    """
    Verify Firebase OTP and return a JWT token for the user.
    """
    if not firebase_admin._apps:
        raise HTTPException(status_code=503, detail="Firebase service is unavailable.")

    try:
        decoded_token = firebase_auth.verify_id_token(req.firebase_token)
        phone_number = decoded_token.get("phone_number")
        if not phone_number:
            raise HTTPException(status_code=400, detail="Invalid Firebase token: phone number missing.")

        user = db.query(User).filter(User.phone == phone_number).first()
        if not user:
            user = User(phone=phone_number, firebase_uid=decoded_token.get("uid"))
            db.add(user)
            db.commit()
            db.refresh(user)
        
        access_token = security.create_access_token(subject=user.id)
        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {e}")
