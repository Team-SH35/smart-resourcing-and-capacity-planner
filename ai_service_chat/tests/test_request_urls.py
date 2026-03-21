"""Tests that tools call the correct backend URLs."""
from unittest.mock import patch

import pytest

from tests.conftest import (
    MOCK_EMPLOYEES,
    MOCK_JOBS,
    MOCK_FORECAST_ENTRIES,
    make_mock_client,
    make_mock_response,
)
from app_backend.tools.resource_tools import (
    get_employees,
    get_jobs,
    get_project_staffing,
    get_capacity_forecast,
    get_schedule,
    set_backend_url,
)


@pytest.fixture(autouse=True)
def reset_backend_url():
    set_backend_url("http://localhost:4000")
    yield
    set_backend_url("http://localhost:4000")


@pytest.mark.asyncio
async def test_get_employees_calls_api_employees():
    resp = make_mock_response(MOCK_EMPLOYEES)
    mock_ctx = make_mock_client(resp)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
        await get_employees.ainvoke({})

    url = mock_ctx.__aenter__.return_value.get.call_args[0][0]
    assert url.endswith("/api/employees")


@pytest.mark.asyncio
async def test_get_jobs_calls_api_job_codes():
    resp = make_mock_response(MOCK_JOBS)
    mock_ctx = make_mock_client(resp)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
        await get_jobs.ainvoke({})

    url = mock_ctx.__aenter__.return_value.get.call_args[0][0]
    assert url.endswith("/api/job-codes")


@pytest.mark.asyncio
async def test_get_project_staffing_calls_forecast_entries():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    mock_ctx = make_mock_client(resp)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
        await get_project_staffing.ainvoke({})

    url = mock_ctx.__aenter__.return_value.get.call_args[0][0]
    assert url.endswith("/api/forecast-entries")


@pytest.mark.asyncio
async def test_get_capacity_forecast_calls_forecast_entries():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    mock_ctx = make_mock_client(resp)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
        await get_capacity_forecast.ainvoke({})

    url = mock_ctx.__aenter__.return_value.get.call_args[0][0]
    assert url.endswith("/api/forecast-entries")


@pytest.mark.asyncio
async def test_get_schedule_calls_forecast_entries():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    mock_ctx = make_mock_client(resp)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
        await get_schedule.ainvoke({})

    url = mock_ctx.__aenter__.return_value.get.call_args[0][0]
    assert url.endswith("/api/forecast-entries")


@pytest.mark.asyncio
async def test_tools_use_custom_backend_url():
    set_backend_url("http://custom:8888")
    resp = make_mock_response(MOCK_EMPLOYEES)
    mock_ctx = make_mock_client(resp)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
        await get_employees.ainvoke({})

    url = mock_ctx.__aenter__.return_value.get.call_args[0][0]
    assert url.startswith("http://custom:8888")
