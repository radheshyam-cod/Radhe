from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid

def generate_id():
    return str(uuid.uuid4())

class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, index=True, default=generate_id)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=False)
    question = Column(String, nullable=False)
    options = Column(JSON, nullable=False) # List of strings
    correct_answer = Column(String, nullable=False)
    explanation = Column(String, nullable=True)
    difficulty = Column(String, default="MEDIUM")

    topic = relationship("Topic", back_populates="questions")
