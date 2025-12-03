from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.topic import Topic
from app.schemas.learning import LearningContent
import openai
from app.core.config import settings
import json

router = APIRouter()

@router.post("/generate/{topic_id}", response_model=LearningContent)
def generate_learning_content(
    topic_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
):
    """
    Generate multi-format learning content for a specific topic.
    """
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    prompts = {
        "feynman": f"Explain '{topic.name}' using the Feynman Technique. Keep it simple, intuitive, and use an analogy.",
        "alternate_explanations": f"Provide two alternative explanations for '{topic.name}'. One should be highly technical, and the other should be historical or context-based.",
        "analogies": f"Give two distinct and vivid analogies for '{topic.name}' that relate to everyday life.",
        "mind_map": f"Generate a text-based mind map for '{topic.name}' in ASCII format. It should have a central topic and at least 4 branches with sub-points.",
        "flowchart": f"Create a simple, text-based flowchart in ASCII to explain a process related to '{topic.name}'."
    }

    try:
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # In a real app, these could be parallel API calls
        content = {}
        for key, prompt in prompts.items():
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a world-class teacher. Your explanations are clear, concise, and engaging."},
                    {"role": "user", "content": prompt}
                ]
            )
            content[key] = response.choices[0].message.content

        return content

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate learning content: {str(e)}")
