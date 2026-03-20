"""Tests that write tools send the correct request payloads."""
from unittest.mock import patch

import pytest

from tests.conftest import make_mock_response, make_mock_write_client
from app_backend.tools.resource_tools import (
    create_forecast_entry,
    update_forecast_entry,
    delete_forecast_entry,
)


@pytest.mark.asyncio
async def test_create_forecast_entry_sends_employee_name():
    resp = make_mock_response({"id": 1}, status_code=201)
    mock_ctx = make_mock_write_client("post", resp)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
        await create_forecast_entry.ainvoke({
            "employee_name": "Alice Smith",
            "job_code": "P001",
            "days": 5.0,
            "month": "March",
        })

    payload = mock_ctx.__aenter__.return_value.post.call_args[1]["json"]
    assert payload["employeeName"] == "Alice Smith"


@pytest.mark.asyncio
async def test_create_forecast_entry_sends_job_code():
    resp = make_mock_response({"id": 1}, status_code=201)
    mock_ctx = make_mock_write_client("post", resp)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
        await create_forecast_entry.ainvoke({
            "employee_name": "Alice Smith",
            "job_code": "P001",
            "days": 5.0,
            "month": "March",
        })

    payload = mock_ctx.__aenter__.return_value.post.call_args[1]["json"]
    assert payload["jobCode"] == "P001"


@pytest.mark.asyncio
async def test_create_forecast_entry_sends_days_and_month():
    resp = make_mock_response({"id": 1}, status_code=201)
    mock_ctx = make_mock_write_client("post", resp)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
        await create_forecast_entry.ainvoke({
            "employee_name": "Alice Smith",
            "job_code": "P001",
            "days": 5.0,
            "month": "March",
        })

    payload = mock_ctx.__aenter__.return_value.post.call_args[1]["json"]
    assert payload["days"] == 5.0
    assert payload["month"] == "March"


@pytest.mark.asyncio
async def test_update_forecast_entry_sends_correct_payload():
    resp = make_mock_response({"ok": True}, status_code=200)
    mock_ctx = make_mock_write_client("patch", resp)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
        await update_forecast_entry.ainvoke({
            "employee_name": "Bob Jones",
            "job_code": "P002",
            "month": "April",
            "days": 7.0,
        })

    payload = mock_ctx.__aenter__.return_value.patch.call_args[1]["json"]
    assert payload["employeeName"] == "Bob Jones"
    assert payload["jobCode"] == "P002"
    assert payload["month"] == "April"
    assert payload["days"] == 7.0


@pytest.mark.asyncio
async def test_delete_forecast_entry_sends_correct_payload():
    resp = make_mock_response({"message": "Deleted"}, status_code=200)
    mock_ctx = make_mock_write_client("delete", resp)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
        await delete_forecast_entry.ainvoke({
            "employee_name": "Alice Smith",
            "job_code": "P001",
            "month": "March",
        })

    payload = mock_ctx.__aenter__.return_value.request.call_args[1]["json"]
    assert payload["employeeName"] == "Alice Smith"
    assert payload["jobCode"] == "P001"
    assert payload["month"] == "March"


@pytest.mark.asyncio
async def test_create_forecast_entry_sends_workspace_id():
    resp = make_mock_response({"id": 1}, status_code=201)
    mock_ctx = make_mock_write_client("post", resp)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
        await create_forecast_entry.ainvoke({
            "employee_name": "Alice Smith",
            "job_code": "P001",
            "days": 5.0,
            "month": "March",
        })

    payload = mock_ctx.__aenter__.return_value.post.call_args[1]["json"]
    assert "workspaceID" in payload
