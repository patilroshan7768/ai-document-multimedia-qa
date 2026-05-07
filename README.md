# AI-Powered Document & Multimedia Q&A System

A full-stack AI-powered RAG (Retrieval-Augmented Generation) application that allows users to upload PDFs, audio, and video files, generate summaries, and ask contextual questions using semantic search and Large Language Models.

---

# Features

## Core Features

* Upload PDF, MP3, WAV, MP4, and MOV files
* AI-powered question answering using RAG
* Semantic search using FAISS vector database
* AI-generated summaries
* Audio/video transcription using Whisper
* Timestamp-based responses for multimedia files
* Play media directly from relevant timestamps
* Modern responsive React frontend
* FastAPI backend with PostgreSQL
* Dockerized multi-container setup

---

# Bonus Features Implemented

* FAISS vector search for semantic retrieval
* Docker Compose multi-container architecture
* Multimedia timestamp navigation
* Responsive modern UI
* Modular scalable backend architecture

---

# Tech Stack

## Frontend

* React + Vite
* JavaScript
* Tailwind CSS
* Axios

## Backend

* FastAPI
* PostgreSQL
* SQLAlchemy
* Alembic
* Groq API
* Sentence Transformers
* FAISS
* Faster-Whisper
* FFmpeg

## Infrastructure

* Docker
* Docker Compose
* GitHub Actions

---

# Project Structure

```bash
ai-document-multimedia-qa/
│
├── backend/
│   ├── app/
│   ├── tests/
│   ├── uploads/
│   ├── vector_store/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# System Architecture

## Backend Workflow

1. User uploads a document/audio/video file

2. Backend extracts text/transcripts
3. Content is chunked into smaller sections
4. Embeddings are generated using sentence-transformers
5. Embeddings are stored in FAISS vector database
6. User asks questions
7. Relevant chunks are retrieved using semantic search
8. Groq LLM generates contextual AI responses
9. Timestamp information is returned for multimedia content

---

# Supported File Types

| File Type | Supported |
| --------- | --------- |
| PDF       | Yes       |
| MP3       | Yes       |
| WAV       | Yes       |
| MP4       | Yes       |
| MOV       | Yes       |

---

# Frontend Setup

## Navigate to frontend

```bash
cd frontend
```

## Install dependencies

```bash
npm install
```

## Start frontend

```bash
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# Backend Setup

## Navigate to backend

```bash
cd backend
```

## Create virtual environment

### Windows

```bash
python -m venv venv
```

## Activate virtual environment

### Windows PowerShell

```bash
.\venv\Scripts\Activate
```

## Install dependencies

```bash
pip install -r requirements.txt
```

---

# Environment Variables

Create a `.env` file inside the backend folder.

Example:

```env
APP_NAME="Document & Multimedia Q&A API"
APP_VERSION="1.0.0"
DEBUG=false

DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/docqa

GROQ_API_KEY=your_groq_api_key

SECRET_KEY=your_secret_key

UPLOAD_DIR=uploads
VECTOR_STORE_DIR=vector_store

EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

WHISPER_MODEL_SIZE=base

CHUNK_SIZE=500
CHUNK_OVERLAP=50

GROQ_MODEL=llama-3.3-70b-versatile

CORS_ORIGINS=["*"]
```

---

# PostgreSQL Setup

Create a PostgreSQL database named:

```bash
docqa
```

Run database migrations:

```bash
alembic upgrade head
```

---

# Run Backend

```bash
uvicorn app.main:app --reload
```

Backend runs on:

```bash
http://localhost:8000
```

Swagger API docs:

```bash
http://localhost:8000/docs
```

---

# Docker Setup

## Run complete application

```bash
docker-compose up --build
```

Services:

| Service    | Port |
| ---------- | ---- |
| Frontend   | 5173 |
| Backend    | 8000 |
| PostgreSQL | 5432 |

---

# API Endpoints

## Upload File

```http
POST /api/upload
```

Supports:

* PDF
* MP3
* WAV
* MP4
* MOV

---

## Chat API

```http
POST /api/chat
```

Example Request:

```json
{
  "question": "What is this document about?",
  "file_id": "your_file_id"
}
```

---

## Summary API

```http
GET /api/summary/{file_id}
```

---

## Health Check

```http
GET /api/health
```


---

# Demo Video

Add walkthrough/demo video link here.

Example:

```
https://drive.google.com/file/d/12f77y9rvRJ-pTi9kKScCfdycLWwJ1sxp/view?usp=drivesdk
```

---

# Testing

Run tests:

```bash
pytest
```

Run coverage:

```bash
pytest --cov=app
```

---

# Future Improvements

* Real-time streaming responses
* Multi-user authentication
* Redis caching
* Cloud deployment
* Multi-document querying
* Advanced analytics dashboard

---

# Author

Roshan Patil

---
