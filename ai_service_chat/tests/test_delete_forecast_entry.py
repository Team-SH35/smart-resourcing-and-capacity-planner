"""Tests for delete_forecast_entry tool."""
import json
from unittest.mock import patch

import pytest

from tests.conftest import make_mock_response, make_mock_write_client
from app_backend.tools.resource_tools import delete_forecast_entry


VALID_PAYLOAD = {
    "employee_name": "Alice Smith",
    "job_code": "P001",
    "month": "March",
}


@pytest.mark.asyncio
async def test_successful_deletion_returns_response():
    resp = make_mock_response({"message": "Deleted"}, status_code=200)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("delete", resp)):
        result = json.loads(await delete_forecast_entry.ainvoke(VALID_PAYLOAD))

    assert "message" in result


@pytest.mark.asyncio
async def test_deletion_for_different_employee():
    resp = make_mock_response({"message": "Deleted"}, status_code=200)
    payload = {"employee_name": "Bob Jones", "job_code": "P002", "month": "April"}
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("delete", resp)):
        result = json.loads(await delete_forecast_entry.ainvoke(payload))

    assert "message" in result


@pytest.mark.asyncio
async def test_returns_error_on_404():
    resp = make_mock_response({"error": "Not found"}, status_code=404)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("delete", resp)):
        result = json.loads(await delete_forecast_entry.ainvoke(VALID_PAYLOAD))

    assert "error" in result


@pytest.mark.asyncio
async def test_returns_error_on_500():
    resp = make_mock_response({"error": "Server error"}, status_code=500)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("delete", resp)):
        result = json.loads(await delete_forecast_entry.ainvoke(VALID_PAYLOAD))

    assert "error" in result


@pytest.mark.asyncio
async def test_deletion_returns_204_no_content():
    resp = make_mock_response(None, status_code=204)
    resp.json.side_effect = Exception("No content")
    resp.text = ""
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("delete", resp)):
        result = json.loads(await delete_forecast_entry.ainvoke(VALID_PAYLOAD))

    assert "error" in result or "text" in result
