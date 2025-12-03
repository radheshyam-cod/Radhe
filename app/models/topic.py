from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid

def generate_id():
    return str(uuid.uuid4())

class Topic(Base):
    __tablename__ = "topics"

    id = Column(String, primary_key=True, index=True, default=generate_id)
    note_id = Column(String, ForeignKey("notes.id"), nullable=True)
    name = Column(String, nullable=False)
    confidence = Column(Float, default=0.0)

    note = relationship("Note", back_populates="topics")
    subtopics = relationship("Subtopic", back_populates="topic")
    questions = relationship("Question", back_populates="topic")
    mastery = relationship("Mastery", back_populates="topic")
    revision_schedules = relationship("RevisionSchedule", back_populates="topic")
    attempts = relationship("Attempt", back_populates="topic")

class Subtopic(Base):
    __tablename__ = "subtopics"

    id = Column(String, primary_key=True, index=True, default=generate_id)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=False)
    name = Column(String, nullable=False)
    status = Column(String, default="pending") # pending, mastered, weak

    topic = relationship("Topic", back_populates="subtopics")
