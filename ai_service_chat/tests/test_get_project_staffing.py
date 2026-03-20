"""Tests for get_project_staffing tool."""
import json
from unittest.mock import patch

import pytest

from tests.conftest import (
    MOCK_FORECAST_ENTRIES,
    MOCK_FORECAST_ENTRIES_MULTI_MONTH,
    make_mock_client,
    make_mock_response,
)
from app_backend.tools.resource_tools import get_project_staffing


@pytest.mark.asyncio
async def test_returns_all_rows_without_filters():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_project_staffing.ainvoke({}))

    assert len(result) == 3


@pytest.mark.asyncio
async def test_filters_by_job_code():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_project_staffing.ainvoke({"job_code": "P001"}))

    assert all(r["jobCode"] == "P001" for r in result)
    assert len(result) == 2


@pytest.mark.asyncio
async def test_filters_by_month():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES_MULTI_MONTH)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_project_staffing.ainvoke({"month": "April"}))

    assert all(r["month"] == "April" for r in result)
    assert len(result) == 2


@pytest.mark.asyncio
async def test_filters_by_month_and_job_code():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES_MULTI_MONTH)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_project_staffing.ainvoke({"month": "April", "job_code": "P001"}))

    assert len(result) == 1
    assert result[0]["employeeName"] == "Alice Smith"


@pytest.mark.asyncio
async def test_month_filter_uses_prefix_match():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES_MULTI_MONTH)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_project_staffing.ainvoke({"month": "Mar"}))

    assert all(r["month"] == "March" for r in result)
    assert len(result) == 3


@pytest.mark.asyncio
async def test_unknown_job_code_returns_empty():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_project_staffing.ainvoke({"job_code": "P999"}))

    assert result == []


@pytest.mark.asyncio
async def test_returns_error_on_backend_failure():
    resp = make_mock_response({}, status_code=500)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_project_staffing.ainvoke({}))

    assert "error" in result
