# AI Chat Service

A FastAPI-based AI microservice that powers the resource management chatbot. It uses a LangGraph agent backed by GPT-4o to answer questions about employee allocations and project staffing, and to propose, approve, reject, and undo changes to forecast data.

## Architecture

```
Frontend (React)
    │
    │  HTTP (port 8000)
    ▼
AI Service (FastAPI)          ←── this service
    │   app_backend/
    │   ├── main.py           FastAPI app setup, CORS, startup/shutdown
    │   ├── api/routes.py     REST endpoints (/chat, /approve-change, etc.)
    │   ├── agents/graph.py   LangGraph agent + undo snapshot logic
    │   ├── tools/            LangChain tools that call the backend API
    │   └── models/schemas.py Pydantic request/response models
    │
    │  HTTP (port 4000)
    ▼
Backend API (Express/Node)
    │
    ▼
SQLite Database
```

### How the agent works

1. A user message hits `POST /api/v1/chat`
2. The `ResourceManagementAgent` (LangGraph) decides which tools to call
3. **Read tools** execute immediately and the result is returned
4. **Write tools** (`create_forecast_entry`, `update_forecast_entry`, etc.) are intercepted — the agent pauses and returns `proposed_changes` to the frontend for user approval
5. The frontend shows Approve / Reject buttons
6. `POST /api/v1/approve-change/{session_id}` — captures a before-state snapshot, then resumes the graph to apply the change
7. `POST /api/v1/undo-change/{session_id}` — uses the snapshot to reverse the last approved change
8. `POST /api/v1/reject-change/{session_id}` — resumes the graph with a rejection message, no changes applied

Session continuity is maintained via LangGraph's `MemorySaver` checkpointer, keyed on `session_id`.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Web framework | [FastAPI](https://fastapi.tiangolo.com/) |
| ASGI server | [Uvicorn](https://www.uvicorn.org/) |
| AI agent framework | [LangGraph](https://langchain-ai.github.io/langgraph/) |
| LLM | GPT-4o via [LangChain OpenAI](https://python.langchain.com/docs/integrations/chat/openai/) |
| HTTP client | [httpx](https://www.python-httpx.org/) |
| Data validation | [Pydantic v2](https://docs.pydantic.dev/) |
| Container | Python 3.11-slim (Docker) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `POST` | `/api/v1/chat` | Send a message to the agent |
| `POST` | `/api/v1/approve-change/{session_id}` | Approve a pending write operation |
| `POST` | `/api/v1/reject-change/{session_id}` | Reject a pending write operation |
| `POST` | `/api/v1/undo-change/{session_id}` | Undo the last approved change |

## Available Tools

### Read tools (execute immediately)
| Tool | Description |
|------|-------------|
| `get_employees` | List employees, optionally filtered by specialism |
| `get_jobs` | List all jobs/projects |
| `get_employee_availability` | Check free capacity for an employee by month |
| `get_project_staffing` | Get staffing levels for a specific project |
| `get_understaffed_projects` | Find projects below required staffing |
| `get_capacity_forecast` | Get monthly capacity forecast |
| `get_schedule` | Get full allocation schedule |

### Write tools (require user approval)
| Tool | Description |
|------|-------------|
| `create_forecast_entry` | Allocate an employee to a project for a month |
| `update_forecast_entry` | Change an existing allocation |
| `delete_forecast_entry` | Remove an allocation |
| `update_job_cost` | Update a job's cost value |
| `update_job_monetary_budget` | Update a job's monetary budget |
| `update_job_time_budget` | Update a job's time budget |
| `update_job_start_date` | Update a job's start date |
| `update_job_end_date` | Update a job's end date |

## Environment Variables

Create a `.env` file in `ai_service_chat/` (copy from `.env.example`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | — | OpenAI API key for GPT-4o |
| `BACKEND_URL` | No | `http://localhost:4000` | URL of the Express backend API |
| `WORKSPACE_ID` | No | `1` | Workspace ID used to scope all data queries |
| `ENVIRONMENT` | No | `development` | Set to `production` to disable auto-reload |
| `API_HOST` | No | `0.0.0.0` | Host to bind Uvicorn to |
| `API_PORT` | No | `8000` | Port to bind Uvicorn to |
| `LOG_LEVEL` | No | `INFO` | Python logging level (`DEBUG`, `INFO`, `WARNING`) |

In Docker Compose, `BACKEND_URL` is automatically set to `http://backend:4000` so the service can reach the backend container by name.

## Getting Started

### Running via Docker (recommended)

The service starts automatically as part of the full stack. From the project root:

```bash
docker compose up --build
```

The AI service will be available at `http://localhost:8000`.

### Running locally (for development)

1. Navigate to the `ai_service_chat` directory:
   ```bash
   cd ai_service_chat
   ```

2. Create a `.env` file with your OpenAI key:
   ```bash
   echo "OPENAI_API_KEY=sk-..." > .env
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the server:
   ```bash
   python -m app_backend.main
   ```

The service will be available at `http://localhost:8000`. Interactive API docs are at `http://localhost:8000/docs`.

## Running the Tests

1. Install dev dependencies (first time only):
   ```bash
   pip install -r requirements.txt -r requirements-dev.txt
   ```

2. Run all tests:
   ```bash
   python -m pytest -v
   ```

3. Run a specific test file:
   ```bash
   python -m pytest tests/test_undo.py -v
   ```

Tests use mocked HTTP clients and a mocked LLM — no OpenAI API key or running backend is needed.

## Project Structure

```
ai_service_chat/
├── app_backend/
│   ├── agents/
│   │   └── graph.py          LangGraph agent, undo snapshot logic
│   ├── api/
│   │   └── routes.py         FastAPI route handlers
│   ├── models/
│   │   └── schemas.py        Pydantic models (ChatMessage, ChatResponse, etc.)
│   ├── tools/
│   │   └── resource_tools.py LangChain tools wrapping backend API calls
│   └── main.py               FastAPI app factory
├── tests/                    pytest test suite (199 tests)
├── Dockerfile
├── requirements.txt
├── requirements-dev.txt
└── pytest.ini
```
