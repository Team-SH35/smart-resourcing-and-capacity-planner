"""Tests for update_job_end_date tool."""
import json
from unittest.mock import patch

import pytest

from tests.conftest import make_mock_response, make_mock_write_client
from app_backend.tools.resource_tools import update_job_end_date


VALID_PAYLOAD = {
    "job_code": "P001",
    "end_date": "2026-06-30",
}


@pytest.mark.asyncio
async def test_successful_update_returns_response():
    updated = {"jobCode": "P001", "endDate": "2026-06-30", "message": "End date updated successfully"}
    resp = make_mock_response(updated, status_code=200)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_end_date.ainvoke(VALID_PAYLOAD))

    assert result["jobCode"] == "P001"
    assert result["endDate"] == "2026-06-30"


@pytest.mark.asyncio
async def test_update_includes_correct_end_date_value():
    updated = {"jobCode": "P002", "endDate": "2026-12-31", "message": "End date updated successfully"}
    resp = make_mock_response(updated, status_code=200)
    payload = {"job_code": "P002", "end_date": "2026-12-31"}
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_end_date.ainvoke(payload))

    assert result["endDate"] == "2026-12-31"


@pytest.mark.asyncio
async def test_update_returns_error_on_400():
    resp = make_mock_response({"error": "Invalid date format"}, status_code=400)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_end_date.ainvoke(VALID_PAYLOAD))

    assert "error" in result


@pytest.mark.asyncio
async def test_update_returns_error_on_500():
    resp = make_mock_response({"error": "Server error"}, status_code=500)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_end_date.ainvoke(VALID_PAYLOAD))

    assert "error" in result


@pytest.mark.asyncio
async def test_update_with_valid_iso_date():
    updated = {"jobCode": "P001", "endDate": "2024-09-30", "message": "End date updated successfully"}
    resp = make_mock_response(updated, status_code=200)
    payload = {**VALID_PAYLOAD, "end_date": "2024-09-30"}
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_write_client("post", resp)):
        result = json.loads(await update_job_end_date.ainvoke(payload))

    assert result["endDate"] == "2024-09-30"
