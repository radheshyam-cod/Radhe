from typing import Optional
from pydantic import BaseModel

class UserBase(BaseModel):
    phone: str
    name: Optional[str] = None
    school: Optional[str] = None
    class_name: Optional[str] = None
    year: Optional[int] = None
    role: str = "student" # student, teacher, admin

class UserCreate(UserBase):
    pass

class UserUpdate(UserBase):
    pass

class UserInDBBase(UserBase):
    id: str
    
    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    id_token: str

class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str
