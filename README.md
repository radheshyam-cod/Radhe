# ConceptPulse - AI-Powered Adaptive Learning Platform

ConceptPulse is a next-generation learning platform that uses AI to diagnose weak concepts, generate adaptive questions, and create personalized study schedules.

## 🚀 Features

-   **AI Diagnosis Engine**: Analyzes student performance to identify weak spots.
-   **Adaptive Learning**: Generates questions and explanations (Feynman, Analogies, Mind Maps) tailored to the user.
-   **Note Scanning**: OCR + AI to extract topics from handwritten notes.
-   **Spaced Repetition**: Automated revision scheduling based on mastery levels.
-   **Offline Mode**: Full functionality without internet, syncing when online.
-   **Dark Nebula Theme**: Immersive, student-focused UI with neon aesthetics.

## 🛠️ Tech Stack

-   **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, ShadCN UI, PWA.
-   **Backend**: FastAPI (Python), SQLAlchemy, PostgreSQL, Redis, Celery.
-   **AI**: OpenAI GPT-4o, Gemini Flash.
-   **Auth**: Firebase (Phone OTP) + JWT.

## 📂 Project Structure

```
concept-pulse/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/             # API Routes (auth, users, notes, ai, etc.)
│   │   ├── core/            # Config & Security
│   │   ├── db/              # Database Session & Base
│   │   ├── models/          # SQLAlchemy Models
│   │   ├── schemas/         # Pydantic Schemas
│   │   ├── main.py          # App Entrypoint
│   │   └── worker.py        # Celery Worker
│   ├── alembic/             # Migrations
│   └── requirements.txt     # Python Dependencies
├── src/                     # Next.js Frontend
│   ├── app/                 # App Router Pages
│   ├── components/          # UI Components
│   ├── lib/                 # Utilities (API client, IndexedDB, Firebase)
│   └── styles/              # Global Styles
├── public/                  # Static Assets
└── prisma/                  # Prisma Schema (for reference/generation)
```

## ⚡ Quick Start

### Prerequisites
-   Node.js 18+
-   Python 3.10+
-   PostgreSQL & Redis running locally.

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run Migrations
alembic upgrade head

# Seed Admin User
python3 app/db/init_db.py

# Start Server
uvicorn app.main:app --reload
```

### 2. Frontend Setup

```bash
# Install Dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Start Dev Server
npm run dev
```

### 3. Default Admin Credentials
-   **URL**: `http://localhost:3000/login` (or via API `POST /api/v1/auth/login-demo`)
-   **Email**: `admin@conceptpulse.ed`
-   **Password**: `admin123` (Pre-configured for development environment)

## 🧪 Verification

-   **Health Check**: `GET http://localhost:8000/health`
-   **Swagger UI**: `http://localhost:8000/docs`

## 🎨 Theme

The "Dark Nebula" theme is enforced in `src/app/globals.css`. It features a deep space blue background (`#121221`) with neon cyan accents (`#00FFFF`) and a floating particle background effect.
