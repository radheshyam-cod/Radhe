from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import uuid

def generate_id():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=generate_id)
    role = Column(String, default="student") # student, teacher, admin
    name = Column(String, nullable=True)
    school = Column(String, nullable=True)
    class_name = Column("class", String, nullable=True) # 'class' is a reserved keyword
    year = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    notes = relationship("Note", back_populates="user")
    mastery = relationship("Mastery", back_populates="user")
    revision_schedules = relationship("RevisionSchedule", back_populates="user")
    attempts = relationship("Attempt", back_populates="user")
