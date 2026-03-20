"""Tests for get_capacity_forecast tool."""
import json
from unittest.mock import patch

import pytest

from tests.conftest import (
    MOCK_FORECAST_ENTRIES,
    MOCK_FORECAST_ENTRIES_MULTI_MONTH,
    make_mock_client,
    make_mock_response,
)
from app_backend.tools.resource_tools import get_capacity_forecast


@pytest.mark.asyncio
async def test_returns_all_entries_without_filters():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_capacity_forecast.ainvoke({}))

    assert len(result) == 3


@pytest.mark.asyncio
async def test_filters_by_month():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES_MULTI_MONTH)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_capacity_forecast.ainvoke({"month": "April"}))

    assert all(r["month"] == "April" for r in result)
    assert len(result) == 2


@pytest.mark.asyncio
async def test_filters_by_employee_name():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_capacity_forecast.ainvoke({"employee_name": "Alice Smith"}))

    assert all(r["employeeName"] == "Alice Smith" for r in result)
    assert len(result) == 2


@pytest.mark.asyncio
async def test_filters_by_job_code():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_capacity_forecast.ainvoke({"job_code": "P002"}))

    assert all(r["jobCode"] == "P002" for r in result)
    assert len(result) == 1


@pytest.mark.asyncio
async def test_filters_by_month_and_employee():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES_MULTI_MONTH)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_capacity_forecast.ainvoke({"month": "April", "employee_name": "Alice Smith"}))

    assert len(result) == 1
    assert result[0]["days"] == 4


@pytest.mark.asyncio
async def test_employee_name_filter_is_case_insensitive():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_capacity_forecast.ainvoke({"employee_name": "alice smith"}))

    assert len(result) == 2


@pytest.mark.asyncio
async def test_returns_error_on_backend_failure():
    resp = make_mock_response({}, status_code=500)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_capacity_forecast.ainvoke({}))

    assert "error" in result


@pytest.mark.asyncio
async def test_unknown_job_code_returns_empty():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_capacity_forecast.ainvoke({"job_code": "P999"}))

    assert result == []
