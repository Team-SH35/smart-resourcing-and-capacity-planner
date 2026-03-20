"""Tests for update_job_time_budget tool."""
import json
from unittest.mock import patch

import pytest

from tests.conftest import make_mock_response, make_mock_write_client
from app_backend.tools.resource_tools import update_job_time_budget


VALID_PAYLOAD = {
    "job_code": "P001",
    "time_budget": 20.0,
}


@pytest.mark.asyncio
async def test_successful_update_returns_response():
    updated = {"jobCode": "P001", "timeBudget": 20.0, "message": "Time budget updated successfully"}
    resp = make_mock_response(updated, status_code=200)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_time_budget.ainvoke(VALID_PAYLOAD))

    assert result["jobCode"] == "P001"
    assert result["timeBudget"] == 20.0


@pytest.mark.asyncio
async def test_update_includes_correct_time_budget_value():
    updated = {"jobCode": "P002", "timeBudget": 45.0, "message": "Time budget updated successfully"}
    resp = make_mock_response(updated, status_code=200)
    payload = {"job_code": "P002", "time_budget": 45.0}
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_time_budget.ainvoke(payload))

    assert result["timeBudget"] == 45.0


@pytest.mark.asyncio
async def test_update_returns_error_on_400():
    resp = make_mock_response({"error": "Invalid job code"}, status_code=400)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_time_budget.ainvoke(VALID_PAYLOAD))

    assert "error" in result


@pytest.mark.asyncio
async def test_update_returns_error_on_500():
    resp = make_mock_response({"error": "Server error"}, status_code=500)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_time_budget.ainvoke(VALID_PAYLOAD))

    assert "error" in result


@pytest.mark.asyncio
async def test_update_with_fractional_days():
    updated = {"jobCode": "P001", "timeBudget": 7.5, "message": "Time budget updated successfully"}
    resp = make_mock_response(updated, status_code=200)
    payload = {**VALID_PAYLOAD, "time_budget": 7.5}
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_time_budget.ainvoke(payload))

    assert result["timeBudget"] == 7.5
