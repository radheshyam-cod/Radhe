from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.api import deps
from app.models.note import Note
from app.models.topic import Topic, Subtopic
from app.schemas.note import Note as NoteSchema, NoteCreate
import pytesseract
from PIL import Image
import io
import openai
from app.core.config import settings
from app.worker import process_note_ocr_and_ai

router = APIRouter()

@router.post("/upload", response_model=NoteSchema)
async def upload_note(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    """
    Upload file and trigger background processing for OCR and AI analysis.
    """
    contents = await file.read()

    # In a real production environment, you would upload this to a cloud storage like S3
    # and pass the URL to the worker.
    file_location = f"local_uploads/{file.filename}"
    with open(file_location, "wb") as f:
        f.write(contents)

    # Create a note entry with a "pending" status
    note = Note(
        user_id=current_user.id,
        title=file.filename or "Untitled Note",
        content="Processing...",
        file_url=file_location,
        status="pending"
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    # Trigger the background task
    try:
        process_note_ocr_and_ai.delay(note.id)
    except Exception as e:
        # If Celery is down, mark the note as failed and return an error
        note.status = "failed"
        note.content = f"Failed to queue processing task: {str(e)}"
        db.commit()
        raise HTTPException(
            status_code=500,
            detail="Could not start note processing. Please try again later."
        )

    return note

@router.get("/", response_model=List[NoteSchema])
def read_notes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieve all notes for the current user.
    """
    notes = db.query(Note).filter(Note.user_id == current_user.id).offset(skip).limit(limit).all()
    return notes

@router.get("/{note_id}", response_model=NoteSchema)
def read_note(
    note_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieve a single note by its ID.
    """
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note
