from sqlalchemy import Column, Integer, ForeignKey, Float, UniqueConstraint, String
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid

def generate_id():
    return str(uuid.uuid4())

class Mastery(Base):
    __tablename__ = "mastery"

    id = Column(String, primary_key=True, index=True, default=generate_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=False)
    score = Column(Float, default=0.0)

    user = relationship("User", back_populates="mastery")
    topic = relationship("Topic", back_populates="mastery")

    __table_args__ = (UniqueConstraint('user_id', 'topic_id', name='_user_topic_uc'),)
