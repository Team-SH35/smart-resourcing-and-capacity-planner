"""Tests for update_job_monetary_budget tool."""
import json
from unittest.mock import patch

import pytest

from tests.conftest import make_mock_response, make_mock_write_client
from app_backend.tools.resource_tools import update_job_monetary_budget


VALID_PAYLOAD = {
    "job_code": "P001",
    "new_budget": 50000.0,
}


@pytest.mark.asyncio
async def test_successful_update_returns_response():
    updated = {"jobCode": "P001", "newBudget": 50000.0, "message": "Budget updated successfully"}
    resp = make_mock_response(updated, status_code=200)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_monetary_budget.ainvoke(VALID_PAYLOAD))

    assert result["jobCode"] == "P001"
    assert result["newBudget"] == 50000.0


@pytest.mark.asyncio
async def test_update_includes_correct_budget_value():
    updated = {"jobCode": "P002", "newBudget": 120000.0, "message": "Budget updated successfully"}
    resp = make_mock_response(updated, status_code=200)
    payload = {"job_code": "P002", "new_budget": 120000.0}
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_monetary_budget.ainvoke(payload))

    assert result["newBudget"] == 120000.0


@pytest.mark.asyncio
async def test_update_returns_error_on_400():
    resp = make_mock_response({"error": "Invalid job code"}, status_code=400)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_monetary_budget.ainvoke(VALID_PAYLOAD))

    assert "error" in result


@pytest.mark.asyncio
async def test_update_returns_error_on_500():
    resp = make_mock_response({"error": "Server error"}, status_code=500)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_monetary_budget.ainvoke(VALID_PAYLOAD))

    assert "error" in result


@pytest.mark.asyncio
async def test_update_with_large_budget():
    updated = {"jobCode": "P001", "newBudget": 1000000.0, "message": "Budget updated successfully"}
    resp = make_mock_response(updated, status_code=200)
    payload = {**VALID_PAYLOAD, "new_budget": 1000000.0}
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_monetary_budget.ainvoke(payload))

    assert result["newBudget"] == 1000000.0
