# Changelog

## AI Service — v1.0.0
- Location: `ai_service_chat/` (Python / FastAPI)
- Highlights:
  - FastAPI microservice powering the AI chatbot (Uvicorn server).
  - LangGraph agent using a gpt-5-family model to answer allocation/staffing queries.
  - Read tools: `get_employees`, `get_jobs`, `get_capacity_forecast`, `get_schedule`, `get_understaffed_projects`, etc.
  - Write tools require user approval and support: `create_forecast_entry`, `update_forecast_entry`, `delete_forecast_entry`, job budget/time updates, and create/delete job flows.
  - Approve / Reject / Undo workflow: endpoints `/api/v1/approve-change/{session_id}`, `/api/v1/reject-change/{session_id}`, `/api/v1/undo-change/{session_id}`.
  - Docker-ready; included in top-level `docker compose` stack.

---

## Backend API — v1.0.0
- Location: `backend/` (Node.js / Express / TypeScript)
- Highlights:
  - REST API for employees, jobs, forecast entries and Excel import/export.
  - Endpoints include CRUD for forecast entries, job creation/deletion, business-unit listing, calendar/work-days endpoints, and Excel export.
  - Local dev scripts and test harnesses (Jest) provided.

---

## Frontend — v1.0.0
- Location: `frontend/` (React + Vite + TypeScript)
- Highlights:
  - Dashboard, project schedule, business unit views, and AI chatbot overlay.
  - Development scripts using Vite and Vitest for tests.

---

## Database initialization service
- Location: `database/`
- Highlights:
  - Python script to initialise SQLite schema and seed data used by the backend.
  - Included as a service in `docker compose` and mounted to the `sqlite-db` named volume.

---

## Root / Infra
- Top-level compose and orchestration:
  - `compose.yml` brings up frontend, backend, AI service and database.
  - CI pipeline referenced in README runs lint/build/test for all services.

---

## Tests and QA
- `ai_service_chat/tests/` — pytest suite for the AI service (includes unit and integration-style tests; mocks LLM and backend HTTP calls).
- `backend/__tests__/` — Jest tests for backend services.

---

