# 📄 Document & Multimedia Q&A API

A production-ready FastAPI backend for an AI-powered Document & Multimedia Q&A application.
Upload PDFs, audio, and video files — then chat with their contents using Retrieval-Augmented Generation (RAG).

## ✨ Features

- **Multi-format ingestion** — PDF, MP3, WAV, MP4, MOV
- **PDF text extraction** via `pdfplumber`
- **Audio/video transcription** with timestamps via `faster-whisper` + `ffmpeg`
- **Semantic vector search** via `FAISS` + `sentence-transformers`
- **RAG-powered chat** using Groq LLM (LLaMA 3)
- **Document summarization** with response caching
- **PostgreSQL** for metadata & transcript storage
- **Alembic** database migrations
- **Docker & Docker Compose** support
- **GitHub Actions** CI/CD pipeline
- **pytest** test suite with coverage

---

## 🗂 Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app entrypoint
│   ├── api/
│   │   ├── upload.py            # POST /api/upload
│   │   ├── chat.py              # POST /api/chat
│   │   ├── summary.py           # GET  /api/summary/{file_id}
│   │   └── health.py            # GET  /api/health
│   ├── core/
│   │   ├── config.py            # Settings via pydantic-settings
│   │   └── database.py          # Async SQLAlchemy engine & session
│   ├── models/
│   │   ├── file_model.py        # UploadedFile ORM model
│   │   └── transcript_model.py  # TranscriptChunk ORM model
│   ├── schemas/
│   │   ├── upload_schema.py     # Pydantic upload schemas
│   │   └── chat_schema.py       # Pydantic chat schemas
│   ├── services/
│   │   ├── pdf_service.py       # PDF text extraction
│   │   ├── whisper_service.py   # Faster-Whisper transcription
│   │   ├── embedding_service.py # Sentence-transformer embeddings
│   │   ├── vector_service.py    # FAISS index management
│   │   ├── llm_service.py       # Groq API client
│   │   ├── rag_service.py       # RAG pipeline
│   │   └── summary_service.py   # Summary generation & caching
│   └── utils/
│       ├── chunking.py          # Text & transcript chunking
│       └── ffmpeg_utils.py      # Audio extraction from video
├── alembic/                     # Database migrations
├── tests/                       # pytest test suite
├── uploads/                     # Uploaded files (gitignored)
├── vector_store/                # FAISS indices (gitignored)
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── alembic.ini
└── pytest.ini
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable             | Description                              | Default                    |
|----------------------|------------------------------------------|----------------------------|
| `DATABASE_URL`       | PostgreSQL connection string             | `postgresql+asyncpg://...` |
| `GROQ_API_KEY`       | Your Groq API key (required)             | —                          |
| `SECRET_KEY`         | App secret key                           | `change-me-in-production`  |
| `UPLOAD_DIR`         | Directory for uploaded files             | `uploads`                  |
| `VECTOR_STORE_DIR`   | Directory for FAISS indices              | `vector_store`             |
| `EMBEDDING_MODEL`    | Sentence-transformer model               | `all-MiniLM-L6-v2`         |
| `WHISPER_MODEL_SIZE` | Faster-Whisper model size                | `base`                     |
| `GROQ_MODEL`         | Groq LLM model identifier                | `llama3-8b-8192`           |
| `CHUNK_SIZE`         | Characters per text chunk                | `500`                      |
| `CHUNK_OVERLAP`      | Overlap characters between chunks        | `50`                       |

---

## 🚀 Running Locally

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- ffmpeg installed (`apt install ffmpeg` / `brew install ffmpeg`)

### 1. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set GROQ_API_KEY and DATABASE_URL
```

### 3. Run database migrations

```bash
alembic upgrade head
```

### 4. Start the server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API available at: **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

---

## 🐳 Docker Usage

### Start all services

```bash
# Set your GROQ_API_KEY in the environment or .env file
export GROQ_API_KEY=your_key_here

docker-compose up --build
```

### Stop services

```bash
docker-compose down
```

### View logs

```bash
docker-compose logs -f backend
```

Services:
- **Backend**: http://localhost:8000
- **PostgreSQL**: localhost:5432

---

## 📡 API Documentation

### `GET /api/health`

Returns service health status.

```json
{
  "status": "healthy",
  "database": "healthy",
  "version": "1.0.0"
}
```

---

### `POST /api/upload`

Upload a PDF, audio, or video file for processing.

**Supported formats:** `pdf`, `mp3`, `wav`, `mp4`, `mov`  
**Max size:** 500 MB

```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "document.pdf",
  "status": "completed",
  "message": "File uploaded and processing started."
}
```

---

### `POST /api/chat`

Ask a question about an uploaded file using RAG.

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is discussed about authentication?",
    "file_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Response:**
```json
{
  "answer": "OAuth authentication is explained in detail...",
  "timestamp": 125.5,
  "source_text": "Authentication using OAuth is covered in section 3...",
  "file_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

> `timestamp` is returned for audio/video files, `null` for PDFs.

---

### `GET /api/summary/{file_id}`

Generate (or retrieve cached) document summary.

```bash
curl http://localhost:8000/api/summary/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "summary": "This document covers authentication mechanisms, API design patterns..."
}
```

---

### `GET /api/files/{file_id}`

Get metadata for an uploaded file.

```bash
curl http://localhost:8000/api/files/550e8400-e29b-41d4-a716-446655440000
```

---

## 🧪 Testing

### Run all tests

```bash
pytest
```

### With coverage report

```bash
pytest --cov=app --cov-report=html
```

### Run specific test file

```bash
pytest tests/test_upload.py -v
pytest tests/test_chat.py -v
pytest tests/test_summary.py -v
pytest tests/test_services.py -v
```

### Coverage target: 80%+ (configured in `pytest.ini`)

---

## 🔄 Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1

# Show migration history
alembic history
```

---

## 🏗 Architecture

```
Client Request
      │
      ▼
FastAPI Router
      │
      ├── Upload API ──► PDF Service ──► pdfplumber
      │                 Whisper Service ──► faster-whisper
      │                 ffmpeg Utils ──► ffmpeg
      │                 Embedding Service ──► sentence-transformers
      │                 Vector Service ──► FAISS
      │                 PostgreSQL (metadata + chunks)
      │
      ├── Chat API ──► Vector Service (FAISS search)
      │               RAG Service ──► LLM Service ──► Groq API
      │
      └── Summary API ──► Summary Service ──► LLM Service ──► Groq API
                          PostgreSQL (cache summary)
```

---

## 🔑 Getting a Groq API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Create a free account
3. Generate an API key
4. Set it in your `.env`: `GROQ_API_KEY=gsk_...`

---

## 📦 Key Dependencies

| Package                  | Purpose                          |
|--------------------------|----------------------------------|
| `fastapi`                | Web framework                    |
| `sqlalchemy` + `asyncpg` | Async PostgreSQL ORM             |
| `alembic`                | Database migrations              |
| `groq`                   | Groq LLM API client              |
| `sentence-transformers`  | Text embeddings                  |
| `faiss-cpu`              | Vector similarity search         |
| `faster-whisper`         | Audio/video transcription        |
| `pdfplumber`             | PDF text extraction              |
| `pydantic-settings`      | Environment configuration        |

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
