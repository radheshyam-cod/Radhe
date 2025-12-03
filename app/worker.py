from celery import Celery
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.note import Note
from app.models.topic import Topic
import pytesseract
from PIL import Image
import io
import openai
import json

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_track_started=True,
    result_expires=3600, # 1 hour
)

@celery_app.task(acks_late=True)
def process_note_ocr_and_ai(note_id: int):
    """
    Celery task to perform OCR and AI topic extraction.
    """
    db = SessionLocal()
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        return {"status": "error", "message": "Note not found"}

    try:
        # Read file from storage
        with open(note.file_url, "rb") as f:
            contents = f.read()

        # --- OCR Processing ---
        # Basic preprocessing - can be expanded with OpenCV for better results
        image = Image.open(io.BytesIO(contents)).convert('L') # Convert to grayscale
        text = pytesseract.image_to_string(image, config='--psm 6')
        note.content = text
        note.status = "ocr_complete"
        db.commit()

        # --- AI Topic Extraction ---
        if not text.strip():
            raise ValueError("OCR did not produce any text.")

        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL, 
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Extract the main title, main topics, and subtopics from this text. Return a JSON object with keys 'title', and 'topics' which is a list of objects, each having 'name' and 'subtopics' (a list of strings)."},
                {"role": "user", "content": text[:4000]}
            ],
            response_format={"type": "json_object"}
        )
        
        ai_data = json.loads(response.choices[0].message.content)
        extracted_topics = ai_data.get("topics", [])
        extracted_title = ai_data.get("title", note.title) # Use AI title or fallback to filename

        if not extracted_topics:
            raise ValueError("AI could not extract topics.")

        note.title = extracted_title

        # Save topics and subtopics
        topics_to_add = []
        for t_data in extracted_topics:
            topic = Topic(note_id=note.id, name=t_data["name"], confidence=0.75) # Default confidence
            # Subtopics can be handled similarly if your model supports it
            topics_to_add.append(topic)
        
        db.add_all(topics_to_add)
        note.status = "complete"
        db.commit()

        return {"status": "success", "note_id": note.id}

    except Exception as e:
        note.status = "failed"
        note.content = f"Processing failed: {str(e)}"
        db.commit()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
