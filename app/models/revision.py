from sqlalchemy import Column, Integer, ForeignKey, DateTime, Float, String
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid

def generate_id():
    return str(uuid.uuid4())

class RevisionSchedule(Base):
    __tablename__ = "revision_schedules"

    id = Column(String, primary_key=True, index=True, default=generate_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    interval = Column(Integer, default=1) # Days
    ease_factor = Column(Float, default=2.5)

    user = relationship("User", back_populates="revision_schedules")
    topic = relationship("Topic", back_populates="revision_schedules")
