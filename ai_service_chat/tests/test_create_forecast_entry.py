"""Tests for create_forecast_entry tool."""
import json
from unittest.mock import patch

import pytest

from tests.conftest import make_mock_response, make_mock_write_client
from app_backend.tools.resource_tools import create_forecast_entry


VALID_PAYLOAD = {
    "employee_name": "Alice Smith",
    "job_code": "P001",
    "days": 5.0,
    "month": "March",
}


@pytest.mark.asyncio
async def test_successful_creation_returns_response():
    created = {"id": 42, "employeeName": "Alice Smith", "jobCode": "P001", "days": 5.0, "month": "March"}
    resp = make_mock_response(created, status_code=201)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await create_forecast_entry.ainvoke(VALID_PAYLOAD))

    assert result["id"] == 42
    assert result["employeeName"] == "Alice Smith"


@pytest.mark.asyncio
async def test_creation_includes_correct_days():
    created = {"id": 1, "employeeName": "Bob Jones", "jobCode": "P002", "days": 3.5, "month": "April"}
    resp = make_mock_response(created, status_code=201)
    payload = {"employee_name": "Bob Jones", "job_code": "P002", "days": 3.5, "month": "April"}
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await create_forecast_entry.ainvoke(payload))

    assert result["days"] == 3.5


@pytest.mark.asyncio
async def test_creation_returns_error_on_400():
    resp = make_mock_response({"error": "Duplicate entry"}, status_code=400)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await create_forecast_entry.ainvoke(VALID_PAYLOAD))

    assert "error" in result


@pytest.mark.asyncio
async def test_creation_returns_error_on_500():
    resp = make_mock_response({"error": "Server error"}, status_code=500)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await create_forecast_entry.ainvoke(VALID_PAYLOAD))

    assert "error" in result


@pytest.mark.asyncio
async def test_creation_with_fractional_days():
    created = {"id": 5, "employeeName": "Alice Smith", "jobCode": "P001", "days": 0.5, "month": "March"}
    resp = make_mock_response(created, status_code=201)
    payload = {**VALID_PAYLOAD, "days": 0.5}
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await create_forecast_entry.ainvoke(payload))

    assert result["days"] == 0.5
