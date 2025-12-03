from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class NoteBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    file_url: Optional[str] = None
    status: Optional[str] = "pending"

class NoteCreate(NoteBase):
    pass

class Note(NoteBase):
    id: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TopicBase(BaseModel):
    name: str
    confidence: float = 0.0

class Topic(TopicBase):
    id: str
    note_id: Optional[str] = None
    
    class Config:
        from_attributes = True

class WeakTopicRequest(BaseModel):
    topic_id: str
    attempts: List[dict] # simplified

class DiagnosisResponse(BaseModel):
    mastery_score: float
    weak_subtopics: List[str]
    suggested_questions: List[dict]
