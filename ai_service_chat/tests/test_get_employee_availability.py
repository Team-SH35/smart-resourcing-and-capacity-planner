"""Tests for get_employee_availability tool."""
import json
from unittest.mock import patch

import pytest

from tests.conftest import (
    MOCK_EMPLOYEES,
    MOCK_FORECAST_ENTRIES,
    MOCK_FORECAST_ENTRIES_MULTI_MONTH,
    make_mock_client,
    make_mock_response,
)
from app_backend.tools.resource_tools import get_employee_availability


@pytest.mark.asyncio
async def test_returns_allocated_days_per_employee():
    emp_resp = make_mock_response(MOCK_EMPLOYEES)
    fc_resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(emp_resp, fc_resp)):
        result = json.loads(await get_employee_availability.ainvoke({}))

    alice = next(e for e in result if e["name"] == "Alice Smith")
    assert alice["allocatedDays"] == 8  # 5 + 3


@pytest.mark.asyncio
async def test_excludes_excluded_from_ai_employees():
    emp_resp = make_mock_response(MOCK_EMPLOYEES)
    fc_resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(emp_resp, fc_resp)):
        result = json.loads(await get_employee_availability.ainvoke({}))

    names = [e["name"] for e in result]
    assert "Carol White" not in names


@pytest.mark.asyncio
async def test_filters_by_month():
    emp_resp = make_mock_response(MOCK_EMPLOYEES)
    fc_resp = make_mock_response(MOCK_FORECAST_ENTRIES_MULTI_MONTH)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(emp_resp, fc_resp)):
        result = json.loads(await get_employee_availability.ainvoke({"month": "April"}))

    alice = next(e for e in result if e["name"] == "Alice Smith")
    bob = next(e for e in result if e["name"] == "Bob Jones")
    assert alice["allocatedDays"] == 4
    assert bob["allocatedDays"] == 6


@pytest.mark.asyncio
async def test_month_filter_uses_prefix_match():
    emp_resp = make_mock_response(MOCK_EMPLOYEES)
    fc_resp = make_mock_response(MOCK_FORECAST_ENTRIES_MULTI_MONTH)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(emp_resp, fc_resp)):
        result = json.loads(await get_employee_availability.ainvoke({"month": "Mar"}))

    alice = next(e for e in result if e["name"] == "Alice Smith")
    assert alice["allocatedDays"] == 8


@pytest.mark.asyncio
async def test_filters_by_specialism():
    emp_resp = make_mock_response(MOCK_EMPLOYEES)
    fc_resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(emp_resp, fc_resp)):
        result = json.loads(await get_employee_availability.ainvoke({"specialism": "Designer"}))

    assert len(result) == 1
    assert result[0]["name"] == "Bob Jones"


@pytest.mark.asyncio
async def test_employee_with_no_forecast_has_zero_days():
    emp_resp = make_mock_response(MOCK_EMPLOYEES)
    fc_resp = make_mock_response([])
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(emp_resp, fc_resp)):
        result = json.loads(await get_employee_availability.ainvoke({}))

    for emp in result:
        assert emp["allocatedDays"] == 0


@pytest.mark.asyncio
async def test_returns_error_when_employees_fetch_fails():
    emp_resp = make_mock_response({}, status_code=500)
    fc_resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(emp_resp, fc_resp)):
        result = json.loads(await get_employee_availability.ainvoke({}))

    assert "error" in result


@pytest.mark.asyncio
async def test_returns_error_when_forecast_fetch_fails():
    emp_resp = make_mock_response(MOCK_EMPLOYEES)
    fc_resp = make_mock_response({}, status_code=500)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(emp_resp, fc_resp)):
        result = json.loads(await get_employee_availability.ainvoke({}))

    assert "error" in result
