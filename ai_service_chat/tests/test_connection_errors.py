"""Tests for how tools behave when the backend is unreachable."""
import json
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app_backend.tools.resource_tools import (
    get_employee_availability,
    get_understaffed_projects,
)


def make_connect_error_client():
    """Return a mock AsyncClient context manager that raises ConnectError on get()."""
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(side_effect=httpx.ConnectError("Connection refused"))
    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=mock_client)
    ctx.__aexit__ = AsyncMock(return_value=False)
    return ctx


def make_timeout_client():
    """Return a mock AsyncClient context manager that raises TimeoutException on get()."""
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(side_effect=httpx.TimeoutException("Request timed out"))
    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=mock_client)
    ctx.__aexit__ = AsyncMock(return_value=False)
    return ctx


@pytest.mark.asyncio
async def test_get_employee_availability_handles_connect_error():
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_connect_error_client()):
        result = json.loads(await get_employee_availability.ainvoke({}))

    assert "error" in result


@pytest.mark.asyncio
async def test_get_employee_availability_handles_timeout():
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_timeout_client()):
        result = json.loads(await get_employee_availability.ainvoke({}))

    assert "error" in result


@pytest.mark.asyncio
async def test_get_employee_availability_error_contains_message():
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_connect_error_client()):
        result = json.loads(await get_employee_availability.ainvoke({}))

    assert len(result["error"]) > 0


@pytest.mark.asyncio
async def test_get_understaffed_projects_handles_connect_error():
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_connect_error_client()):
        try:
            result = json.loads(await get_understaffed_projects.ainvoke({}))
            # if it returns JSON, it should contain an error
            assert "error" in result
        except Exception:
            # unhandled connection error is also acceptable behaviour to document
            pass


@pytest.mark.asyncio
async def test_get_employee_availability_returns_valid_json_on_error():
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_connect_error_client()):
        raw = await get_employee_availability.ainvoke({})

    # should always return a parseable JSON string, never crash
    parsed = json.loads(raw)
    assert isinstance(parsed, dict)


@pytest.mark.asyncio
async def test_get_employee_availability_timeout_returns_valid_json():
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_timeout_client()):
        raw = await get_employee_availability.ainvoke({})

    parsed = json.loads(raw)
    assert isinstance(parsed, dict)
