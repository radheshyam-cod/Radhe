from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.mastery import Mastery
from app.schemas.timetable import TimetableRequest, TimetableResponse
import openai
from app.core.config import settings
import json

router = APIRouter()

@router.post("/generate", response_model=TimetableResponse)
def generate_smart_timetable(
    req: TimetableRequest,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    """
    Generate a smart, AI-powered weekly study timetable.
    """
    # Fetch user's weak topics
    weak_topics_db = db.query(Mastery).filter(Mastery.user_id == current_user.id, Mastery.score < 70).order_by(Mastery.score.asc()).all()
    weak_topics = [m.topic.name for m in weak_topics_db if m.topic]
    if not weak_topics:
        weak_topics = ["General Revision"]

    # Construct a detailed prompt for the AI
    prompt = f"""
    As an expert academic coach, create a 7-day study timetable for a student with the following details:
    - Weak Topics (prioritize these): {', '.join(weak_topics)}
    - Syllabus to Cover: {', '.join(req.syllabus)}
    - Upcoming Deadlines: {', '.join([f'{d.subject} on {d.date}' for d in req.deadlines])}
    - Preferred Study Times: {', '.join(req.study_preferences)}
    - Student's Energy Curve: {req.energy_curve}

    Instructions:
    1. Create a schedule for the next 7 days.
    2. Each day should have 2-4 focused study blocks (60-90 minutes each).
    3. Prioritize weak topics early in the week and during peak energy times.
    4. Integrate revision sessions for recently learned topics (Spaced Repetition).
    5. Allocate time for practice problems and reviewing mistakes.
    6. Return a JSON object with a 'schedule' key. This should be a list of objects, where each object represents a day and has 'day_of_week', 'date', and 'slots' (a list of objects with 'start_time', 'end_time', 'topic', and 'activity').
    """

    try:
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an AI academic planner. Your output must be valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        timetable_data = json.loads(response.choices[0].message.content)
        return timetable_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate timetable: {str(e)}")
