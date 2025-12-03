from fastapi import APIRouter

from app.api import auth, notes, quiz, attempts, learning, revision, timetable, users, dashboard

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(notes.router, prefix="/notes", tags=["Notes & OCR"])
api_router.include_router(quiz.router, prefix="/quiz", tags=["Quizzes & Questions"])
api_router.include_router(attempts.router, prefix="/attempts", tags=["Attempts"])
api_router.include_router(learning.router, prefix="/learning", tags=["Multi-Format Learning"])
api_router.include_router(revision.router, prefix="/revision", tags=["Spaced Repetition"])
api_router.include_router(timetable.router, prefix="/timetable", tags=["Smart Timetable"])
api_router.include_router(dashboard.router, prefix="/progress", tags=["Progress & Dashboard"])
