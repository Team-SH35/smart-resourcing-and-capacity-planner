"""Tests for get_jobs tool."""
import json
from unittest.mock import patch

import pytest

from tests.conftest import MOCK_JOBS, make_mock_client, make_mock_response
from app_backend.tools.resource_tools import get_jobs


@pytest.mark.asyncio
async def test_returns_all_jobs():
    resp = make_mock_response(MOCK_JOBS)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_jobs.ainvoke({}))

    assert len(result) == 2
    codes = [j["jobCode"] for j in result]
    assert "P001" in codes
    assert "P002" in codes


@pytest.mark.asyncio
async def test_filters_by_business_unit():
    resp = make_mock_response(MOCK_JOBS)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_jobs.ainvoke({"business_unit": "Digital"}))

    assert len(result) == 1
    assert result[0]["jobCode"] == "P001"


@pytest.mark.asyncio
async def test_business_unit_filter_is_case_insensitive():
    resp = make_mock_response(MOCK_JOBS)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_jobs.ainvoke({"business_unit": "technology"}))

    assert len(result) == 1
    assert result[0]["jobCode"] == "P002"


@pytest.mark.asyncio
async def test_business_unit_filter_excludes_non_matching():
    resp = make_mock_response(MOCK_JOBS)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_jobs.ainvoke({"business_unit": "Digital"}))

    codes = [j["jobCode"] for j in result]
    assert "P002" not in codes


@pytest.mark.asyncio
async def test_no_filter_returns_all_jobs():
    resp = make_mock_response(MOCK_JOBS)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_jobs.ainvoke({}))

    assert len(result) == 2


@pytest.mark.asyncio
async def test_returns_error_on_backend_failure():
    resp = make_mock_response({}, status_code=503)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_jobs.ainvoke({}))

    assert "error" in result


@pytest.mark.asyncio
async def test_empty_jobs_list():
    resp = make_mock_response([])
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_jobs.ainvoke({}))

    assert result == []


@pytest.mark.asyncio
async def test_unknown_business_unit_returns_empty():
    resp = make_mock_response(MOCK_JOBS)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_jobs.ainvoke({"business_unit": "NonExistent"}))

    assert result == []
