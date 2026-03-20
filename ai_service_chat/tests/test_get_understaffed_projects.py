"""Tests for get_understaffed_projects tool."""
import json
from unittest.mock import patch

import pytest

from tests.conftest import (
    MOCK_JOBS,
    MOCK_FORECAST_ENTRIES,
    MOCK_FORECAST_ENTRIES_MULTI_MONTH,
    make_mock_client,
    make_mock_response,
)
from app_backend.tools.resource_tools import get_understaffed_projects


@pytest.mark.asyncio
async def test_identifies_understaffed_projects():
    # P001 budget=20, allocated=13 (5+8) → gap 7
    # P002 budget=30, allocated=3       → gap 27
    jobs_resp = make_mock_response(MOCK_JOBS)
    fc_resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(jobs_resp, fc_resp)):
        result = json.loads(await get_understaffed_projects.ainvoke({}))

    codes = [p["jobCode"] for p in result]
    assert "P001" in codes
    assert "P002" in codes


@pytest.mark.asyncio
async def test_gap_is_calculated_correctly():
    jobs_resp = make_mock_response(MOCK_JOBS)
    fc_resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(jobs_resp, fc_resp)):
        result = json.loads(await get_understaffed_projects.ainvoke({}))

    p001 = next(p for p in result if p["jobCode"] == "P001")
    assert p001["gap"] == 7        # budget 20 - allocated 13
    assert p001["allocatedDays"] == 13


@pytest.mark.asyncio
async def test_fully_staffed_project_not_included():
    fully_staffed_jobs = [
        {"jobCode": "P001", "description": "Website Redesign", "businessUnit": "Digital", "budgetTime": 13},
        {"jobCode": "P002", "description": "Mobile App", "businessUnit": "Technology", "budgetTime": 30},
    ]
    jobs_resp = make_mock_response(fully_staffed_jobs)
    fc_resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(jobs_resp, fc_resp)):
        result = json.loads(await get_understaffed_projects.ainvoke({}))

    codes = [p["jobCode"] for p in result]
    assert "P001" not in codes


@pytest.mark.asyncio
async def test_filters_by_month():
    jobs_resp = make_mock_response(MOCK_JOBS)
    fc_resp = make_mock_response(MOCK_FORECAST_ENTRIES_MULTI_MONTH)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(jobs_resp, fc_resp)):
        result = json.loads(await get_understaffed_projects.ainvoke({"month": "April"}))

    # April: P001→4 days (Alice), P002→6 days (Bob); both under budget
    codes = [p["jobCode"] for p in result]
    assert "P001" in codes
    assert "P002" in codes


@pytest.mark.asyncio
async def test_project_without_budget_is_skipped():
    jobs_no_budget = [{"jobCode": "P001", "description": "No Budget", "businessUnit": "Digital", "budgetTime": None}]
    jobs_resp = make_mock_response(jobs_no_budget)
    fc_resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(jobs_resp, fc_resp)):
        result = json.loads(await get_understaffed_projects.ainvoke({}))

    assert result == []


@pytest.mark.asyncio
async def test_returns_error_when_jobs_fetch_fails():
    jobs_resp = make_mock_response({}, status_code=500)
    fc_resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(jobs_resp, fc_resp)):
        result = json.loads(await get_understaffed_projects.ainvoke({}))

    assert "error" in result


@pytest.mark.asyncio
async def test_returns_error_when_forecast_fetch_fails():
    jobs_resp = make_mock_response(MOCK_JOBS)
    fc_resp = make_mock_response({}, status_code=500)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(jobs_resp, fc_resp)):
        result = json.loads(await get_understaffed_projects.ainvoke({}))

    assert "error" in result
