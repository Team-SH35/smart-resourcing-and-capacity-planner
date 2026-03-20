# Team SH35 — HR Resource Management Platform

A full-stack web application for managing employee resource allocation and project capacity planning. It combines a data-driven dashboard with an AI-powered chatbot that can query and update forecast data through natural language.

## Architecture Overview

```
Browser
  │
  ▼
Frontend (React + Vite)          :5173
  │   Dashboard, project schedule, business unit views,
  │   employee profiles, settings, AI chatbot overlay
  │
  ├──── REST ──────────────────► Backend API (Express + TypeScript)  :4000
  │                                  SQLite database
  │                                  Employee, Job, ForecastEntry data
  │                                  Excel import
  │
  └──── REST ──────────────────► AI Service (FastAPI + LangGraph)    :8000
                                     GPT-4o agent
                                     Read + write tools
                                     Approve / reject / undo workflow
```

## Services

| Service | Tech | Port | Directory |
|---------|------|------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS | 5173 | `frontend/` |
| Backend API | Node.js, Express 5, TypeScript, SQLite | 4000 | `backend/` |
| AI Service | Python 3.11, FastAPI, LangGraph, GPT-4o | 8000 | `ai_service_chat/` |
| Database init | Python 3.10 | — | `database/` |

---

## Getting Started

### Prerequisites

Install [Docker Desktop](https://docs.docker.com/desktop/) — required for all services.
- [Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Mac](https://docs.docker.com/desktop/setup/install/mac-install/)

Make sure Docker Desktop is running before using any `docker` commands.

### Running the full stack

From the project root:

```bash
docker compose up --build
```

This starts all four services. On first run `--build` is required; subsequent runs can omit it unless you've changed code.

| URL | Service |
|-----|---------|
| http://localhost:5173 | Frontend |
| http://localhost:4000 | Backend API |
| http://localhost:8000 | AI Service |
| http://localhost:8000/docs | AI Service interactive API docs |

### Stopping

```bash
docker compose down
```

To also wipe the database volume (full reset):

```bash
docker compose down -v
```

---

## Frontend

**React 19 + TypeScript + Vite + Tailwind CSS**

A single-page application with the following views:

| Route | Page |
|-------|------|
| `/` | Dashboard — overview of all projects and allocations |
| `/ProjectSchedule` | Full project schedule across all employees |
| `/BusinessUnit/:unit` | Filtered view by business unit |
| `/Project/:jobCode` | Individual project detail |
| `/Employee/:employeeName` | Employee project assignments |
| `/Settings` | Application settings |

An AI chatbot overlay is accessible from all pages, powered by the AI service.

**Environment variables** (create `frontend/.env`):

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_AI_API_URL=http://localhost:8000
```

**Local development** (without Docker):

```bash
cd frontend
npm install
npm run dev
```

**Scripts:**

```bash
npm run dev      # start dev server
npm run build    # TypeScript check + production build
npm run lint     # ESLint
npm run test     # Vitest
```

See [frontend/README.md](frontend/README.md) for full details.

---

## Backend API

**Node.js + Express 5 + TypeScript + SQLite (better-sqlite3)**

Provides all data access and mutation endpoints. The database is a SQLite file stored in a Docker named volume (`sqlite-db`) shared with the database initialisation container.

**Key endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/employees` | List employees |
| `GET` | `/api/job-codes` | List all jobs |
| `GET` | `/api/forecast-entries` | Get forecast allocations |
| `POST` | `/api/forecast-entries` | Create a forecast entry |
| `PATCH` | `/api/forecast-entries` | Update a forecast entry |
| `DELETE` | `/api/forecast-entries` | Delete a forecast entry |
| `GET` | `/api/calendar` | Get calendar/schedule data |
| `POST` | `/api/import-excel` | Import Excel file into the database |
| `POST` | `/api/update-cost` | Update job cost |
| `POST` | `/api/update-monetary-budget` | Update job monetary budget |
| `POST` | `/api/update-time-budget` | Update job time budget |
| `POST` | `/api/update-start-date` | Update job start date |
| `POST` | `/api/update-end-date` | Update job end date |
| `POST` | `/api/add-specialisms` | Add employee specialisms |

**Local development** (without Docker):

```bash
cd backend
npm install
npm run dev
```

**Scripts:**

```bash
npm run dev      # nodemon dev server with ts-node
npm run build    # compile TypeScript
npm run lint     # ESLint
npm test         # Jest
```

See [backend/README.md](backend/README.md) for full details.

---

## AI Service

**Python 3.11 + FastAPI + LangGraph + GPT-4o**

An AI microservice that powers the chatbot. A LangGraph agent uses GPT-4o to answer questions and propose changes to forecast data. Write operations require explicit user approval and can be undone after approval.

**Environment variables** — create `ai_service_chat/.env`:

```env
OPENAI_API_KEY=sk-...
```

The `BACKEND_URL` is automatically set to `http://backend:4000` in Docker. For local development it defaults to `http://localhost:4000`.

**Key endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/chat` | Send a message to the agent |
| `POST` | `/api/v1/approve-change/{session_id}` | Approve a pending change |
| `POST` | `/api/v1/reject-change/{session_id}` | Reject a pending change |
| `POST` | `/api/v1/undo-change/{session_id}` | Undo the last approved change |
| `GET` | `/api/v1/health` | Health check |

**Running tests locally:**

```bash
cd ai_service_chat
pip install -r requirements.txt -r requirements-dev.txt
python -m pytest -v
```

See [ai_service_chat/README.md](ai_service_chat/README.md) for full details including all available tools and environment variables.

---

## Database

The database is initialised by the `database` service on first `docker compose up`. It runs a Python script that creates the SQLite schema and seeds initial data. The database is stored in a Docker named volume (`sqlite-db`) so data persists across container restarts.

To reinitialise the database from scratch:

```bash
docker compose down -v
docker compose up --build
```

---

## Project Structure

```
sh35-main/
├── frontend/          React + Vite frontend
├── backend/           Express + TypeScript API
├── ai_service_chat/   FastAPI AI service
├── database/          SQLite schema init + seed
├── compose.yml        Docker Compose configuration
└── README.md
```

---

## CI/CD

GitLab CI runs lint, build, and test jobs for all three services on every push. See [.gitlab-ci.yml](.gitlab-ci.yml) for the pipeline configuration.
