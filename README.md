# AI-Driven Research Intelligence Platform

An end-to-end AI-powered academic research intelligence platform focused exclusively on academic research papers. The platform ingests literature directly from the OpenAlex API, computes dense vector embeddings, performs cosine similarity ranking using PostgreSQL with `pgvector`, and generates evidence-backed RAG structured literature reports with innovation metrics and research gap analyses.

---

## 🌟 Key Features

- **Live Academic Paper Ingestion**: Real-time integration with OpenAlex API (`https://api.openalex.org/works`), featuring inverted-index abstract reconstruction.
- **Vector Search Engine**: High-dimensional vector search powered by `pgvector` and `sentence-transformers` (`all-MiniLM-L6-v2` 384-d vectors).
- **Evidence-Backed RAG Intelligence**: OpenAI `gpt-4o-mini` RAG synthesis generating:
  - Concise Research Overview & Summary
  - Method & Dataset Differentiation Metrics
  - Method vs Limitation Comparison Matrix
  - Evidence-linked Potential Research Gaps
  - Prioritized Future Directions & Formatted Academic Citations
- **Strict Academic Guardrails**: System prompts enforce evidence-only citations, explicitly preventing hallucinated DOIs or guarantee of novelty.
- **Modern Executive Dashboard**: React 18 frontend with Tailwind CSS slate academic theme, step-by-step loading state animations, similarity badges, and interactive matrices.

---

## 🏗 System Architecture

```
[ User Input / Idea ]
        │
        ▼
[ OpenAlex API ] ──► Fetches Real Academic Works & Reconstructs Abstracts
        │
        ▼
[ Sentence-Transformers ] ──► Generates 384-d Vector Embeddings
        │
        ▼
[ PostgreSQL + pgvector ] ──► Cosine Similarity Search & Top-K Ranking
        │
        ▼
[ RAG LLM (OpenAI) ] ──► Synthesizes Literature Intelligence & Gaps
        │
        ▼
[ React Slate Dashboard ] ──► Displays Innovation Indicators & Matrices
```

---

## 🚀 Quick Start (Docker Compose)

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- (Optional) An OpenAI API Key set in `backend/.env`.

### 2. Launch Platform
Run the following single command from the project root:

```bash
docker-compose up --build
```

### 3. Access the Applications
- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend API**: [http://localhost:8000/api](http://localhost:8000/api)
- **Interactive Swagger OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠 Local Development (Without Docker)

### Backend Setup (FastAPI + PostgreSQL pgvector)

1. Ensure PostgreSQL is running locally with `pgvector` enabled on port 5432.
2. Navigate to backend directory:
   ```bash
   cd backend
   ```
3. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate

   pip install -r requirements.txt
   ```
4. Set up environment variables in `backend/.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:postgrespassword@localhost:5432/research_intel
   OPENAI_API_KEY=your_openai_api_key_here
   OPENALEX_API_URL=https://api.openalex.org/works
   EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2
   ```
5. Start the FastAPI backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup (Vite + React)

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📋 API Endpoints

- `GET /api/health` - System & Database Health Check
- `POST /api/research/analyze` - Perform paper retrieval, vector indexing, RAG analysis, and persist analysis results
- `GET /api/research/{analysis_id}` - Retrieve analysis by UUID

---

## 🛡 Disclaimer Notice
This platform provides AI-driven assistance based on retrieved literature from OpenAlex. It serves as a literature discovery tool and should not be considered an official legal patent clearance or absolute guarantee of novelty.
