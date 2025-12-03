from sqlalchemy import Column, Integer, ForeignKey, Date, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    slots = Column(JSON, nullable=False)  # e.g., [{"start_time": "09:00", "topic": "Calculus"}]

    user = relationship("User")
