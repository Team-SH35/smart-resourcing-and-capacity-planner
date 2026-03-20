"""Tests for update_forecast_entry tool."""
import json
from unittest.mock import patch

import pytest

from tests.conftest import make_mock_response, make_mock_write_client
from app_backend.tools.resource_tools import update_forecast_entry


VALID_PAYLOAD = {
    "employee_name": "Alice Smith",
    "job_code": "P001",
    "month": "March",
    "days": 10.0,
}


@pytest.mark.asyncio
async def test_successful_update_returns_response():
    updated = {"employeeName": "Alice Smith", "jobCode": "P001", "month": "March", "days": 10.0}
    resp = make_mock_response(updated, status_code=200)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("patch", resp)):
        result = json.loads(await update_forecast_entry.ainvoke(VALID_PAYLOAD))

    assert result["days"] == 10.0


@pytest.mark.asyncio
async def test_update_reflects_new_days_value():
    updated = {"employeeName": "Bob Jones", "jobCode": "P002", "month": "April", "days": 7.0}
    resp = make_mock_response(updated, status_code=200)
    payload = {"employee_name": "Bob Jones", "job_code": "P002", "month": "April", "days": 7.0}
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("patch", resp)):
        result = json.loads(await update_forecast_entry.ainvoke(payload))

    assert result["days"] == 7.0
    assert result["employeeName"] == "Bob Jones"


@pytest.mark.asyncio
async def test_returns_error_on_404():
    resp = make_mock_response({"error": "Not found"}, status_code=404)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("patch", resp)):
        result = json.loads(await update_forecast_entry.ainvoke(VALID_PAYLOAD))

    assert "error" in result


@pytest.mark.asyncio
async def test_returns_error_on_500():
    resp = make_mock_response({"error": "Server error"}, status_code=500)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("patch", resp)):
        result = json.loads(await update_forecast_entry.ainvoke(VALID_PAYLOAD))

    assert "error" in result


@pytest.mark.asyncio
async def test_update_with_zero_days():
    updated = {"employeeName": "Alice Smith", "jobCode": "P001", "month": "March", "days": 0.0}
    resp = make_mock_response(updated, status_code=200)
    payload = {**VALID_PAYLOAD, "days": 0.0}
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("patch", resp)):
        result = json.loads(await update_forecast_entry.ainvoke(payload))

    assert result["days"] == 0.0
