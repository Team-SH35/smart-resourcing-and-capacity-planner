"""Tests for FastAPI routes."""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app_backend.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check_returns_200(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200


def test_health_check_returns_healthy_status(client):
    response = client.get("/api/v1/health")
    data = response.json()
    assert data["status"] == "healthy"


def test_health_check_returns_service_name(client):
    response = client.get("/api/v1/health")
    data = response.json()
    assert data["service"] == "ai-chatbot"


def test_health_check_returns_timestamp(client):
    response = client.get("/api/v1/health")
    data = response.json()
    assert "timestamp" in data


def test_session_history_returns_200(client):
    response = client.get("/api/v1/session/test-session-123/history")
    assert response.status_code == 200


def test_session_history_returns_session_id(client):
    response = client.get("/api/v1/session/test-session-123/history")
    data = response.json()
    assert data["session_id"] == "test-session-123"


def test_session_history_returns_empty_messages(client):
    response = client.get("/api/v1/session/test-session-123/history")
    data = response.json()
    assert data["messages"] == []


@pytest.mark.asyncio
async def test_chat_endpoint_returns_200():
    mock_agent = AsyncMock()
    mock_agent.process_message = AsyncMock(return_value={
        "response": "Here is the schedule.",
        "proposed_changes": None,
    })

    from app_backend.api.routes import get_agent
    from httpx import AsyncClient, ASGITransport

    async def override():
        return mock_agent

    app.dependency_overrides[get_agent] = override
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post(
                "/api/v1/chat",
                json={"message": "Show me the schedule", "userId": "user1"},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_chat_endpoint_returns_response_text():
    mock_agent = AsyncMock()
    mock_agent.process_message = AsyncMock(return_value={
        "response": "Here is the schedule.",
        "proposed_changes": None,
    })

    from app_backend.api.routes import get_agent
    from httpx import AsyncClient, ASGITransport

    async def override():
        return mock_agent

    app.dependency_overrides[get_agent] = override
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post(
                "/api/v1/chat",
                json={"message": "Show me the schedule", "userId": "user1"},
            )
    finally:
        app.dependency_overrides.clear()

    data = response.json()
    assert data["response"] == "Here is the schedule."


@pytest.mark.asyncio
async def test_chat_endpoint_generates_session_id_when_not_provided():
    mock_agent = AsyncMock()
    mock_agent.process_message = AsyncMock(return_value={
        "response": "Done.",
        "proposed_changes": None,
    })

    from app_backend.api.routes import get_agent
    from httpx import AsyncClient, ASGITransport

    async def override():
        return mock_agent

    app.dependency_overrides[get_agent] = override
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post(
                "/api/v1/chat",
                json={"message": "Hello", "userId": "user1"},
            )
    finally:
        app.dependency_overrides.clear()

    data = response.json()
    assert data["sessionId"] is not None


@pytest.mark.asyncio
async def test_approve_change_returns_200():
    mock_agent = AsyncMock()
    mock_agent.approve_change = AsyncMock(return_value={
        "response": "Change applied.",
        "proposed_changes": None,
    })

    from httpx import AsyncClient, ASGITransport

    with patch("app_backend.api.routes.get_agent", return_value=mock_agent) as mock_get:
        mock_get.return_value = mock_agent
        mock_get.side_effect = None

        async def async_get_agent():
            return mock_agent

        with patch("app_backend.api.routes.get_agent", new=async_get_agent):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                response = await ac.post("/api/v1/approve-change/sess-abc")

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_approve_change_returns_response_text():
    mock_agent = AsyncMock()
    mock_agent.approve_change = AsyncMock(return_value={
        "response": "Change applied.",
        "proposed_changes": None,
    })

    from httpx import AsyncClient, ASGITransport

    async def async_get_agent():
        return mock_agent

    with patch("app_backend.api.routes.get_agent", new=async_get_agent):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/v1/approve-change/sess-abc")

    assert response.json()["response"] == "Change applied."


@pytest.mark.asyncio
async def test_reject_change_returns_200():
    mock_agent = AsyncMock()
    mock_agent.reject_change = AsyncMock(return_value={
        "response": "Change rejected.",
        "proposed_changes": None,
    })

    from httpx import AsyncClient, ASGITransport

    async def async_get_agent():
        return mock_agent

    with patch("app_backend.api.routes.get_agent", new=async_get_agent):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/v1/reject-change/sess-abc")

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_reject_change_returns_response_text():
    mock_agent = AsyncMock()
    mock_agent.reject_change = AsyncMock(return_value={
        "response": "Change rejected.",
        "proposed_changes": None,
    })

    from httpx import AsyncClient, ASGITransport

    async def async_get_agent():
        return mock_agent

    with patch("app_backend.api.routes.get_agent", new=async_get_agent):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post("/api/v1/reject-change/sess-abc")

    assert response.json()["response"] == "Change rejected."
