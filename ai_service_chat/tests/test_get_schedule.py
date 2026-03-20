"""Tests for get_schedule tool."""
import json
from unittest.mock import patch

import pytest

from tests.conftest import (
    MOCK_FORECAST_ENTRIES,
    MOCK_FORECAST_ENTRIES_MULTI_MONTH,
    make_mock_client,
    make_mock_response,
)
from app_backend.tools.resource_tools import get_schedule


@pytest.mark.asyncio
async def test_returns_all_entries_without_month_filter():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_schedule.ainvoke({}))

    assert len(result) == 3


@pytest.mark.asyncio
async def test_filters_by_month():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES_MULTI_MONTH)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_schedule.ainvoke({"month": "March"}))

    assert len(result) == 3
    assert all(r["month"] == "March" for r in result)


@pytest.mark.asyncio
async def test_month_filter_uses_prefix_match():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES_MULTI_MONTH)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_schedule.ainvoke({"month": "Apr"}))

    assert len(result) == 2
    assert all(r["month"] == "April" for r in result)


@pytest.mark.asyncio
async def test_month_filter_is_case_insensitive():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES_MULTI_MONTH)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_schedule.ainvoke({"month": "MARCH"}))

    assert len(result) == 3


@pytest.mark.asyncio
async def test_empty_schedule():
    resp = make_mock_response([])
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_schedule.ainvoke({}))

    assert result == []


@pytest.mark.asyncio
async def test_no_entries_for_unknown_month():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_schedule.ainvoke({"month": "December"}))

    assert result == []


@pytest.mark.asyncio
async def test_returns_error_on_backend_failure():
    resp = make_mock_response({}, status_code=500)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_schedule.ainvoke({}))

    assert "error" in result


@pytest.mark.asyncio
async def test_entries_contain_employee_name_field():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_schedule.ainvoke({}))

    for entry in result:
        assert "employeeName" in entry


@pytest.mark.asyncio
async def test_entries_contain_job_code_field():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_schedule.ainvoke({}))

    for entry in result:
        assert "jobCode" in entry


@pytest.mark.asyncio
async def test_entries_contain_days_field():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_schedule.ainvoke({}))

    for entry in result:
        assert "days" in entry
