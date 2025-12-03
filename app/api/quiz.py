from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.topic import Topic
from app.models.mastery import Mastery
from app.schemas.question import Question, QuestionCreate
import openai
from app.core.config import settings
import json

router = APIRouter()

@router.post("/generate", response_model=List[Question])
def generate_quiz(
    topic_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
):
    """
    Generate an adaptive quiz with 5-12 questions for a given topic.
    """
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    mastery = db.query(Mastery).filter(Mastery.topic_id == topic_id, Mastery.user_id == current_user.id).first()
    difficulty = "easy"
    if mastery and mastery.score < 40:
        difficulty = "hard"
    elif mastery and mastery.score < 75:
        difficulty = "medium"

    try:
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": f"Generate 8 {difficulty} multiple-choice questions about '{topic.name}'. Return a JSON object with a 'questions' key, which is a list of objects. Each object must have 'question_text', 'options' (a list of 4 strings), and 'correct_answer' (the string of the correct option)."},
            ],
            response_format={"type": "json_object"}
        )
        quiz_data = json.loads(response.choices[0].message.content)
        questions = quiz_data.get("questions", [])

        # Here you would persist the questions to the database

        return questions

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")
