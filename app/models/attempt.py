from sqlalchemy import Column, Integer, ForeignKey, Boolean, DateTime, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import uuid

def generate_id():
    return str(uuid.uuid4())

class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(String, primary_key=True, index=True, default=generate_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    question_id = Column(String, ForeignKey("questions.id"), nullable=True) # Optional if question is dynamic
    topic_id = Column(String, ForeignKey("topics.id"), nullable=False)
    
    is_correct = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="attempts")
    topic = relationship("Topic", back_populates="attempts")
