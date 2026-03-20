"""Tests for get_employees tool."""
import json
from unittest.mock import patch

import pytest

from tests.conftest import MOCK_EMPLOYEES, make_mock_client, make_mock_response
from app_backend.tools.resource_tools import get_employees


@pytest.mark.asyncio
async def test_returns_all_non_excluded_employees():
    resp = make_mock_response(MOCK_EMPLOYEES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_employees.ainvoke({}))

    assert len(result) == 2
    names = [e["name"] for e in result]
    assert "Alice Smith" in names
    assert "Bob Jones" in names


@pytest.mark.asyncio
async def test_excludes_excluded_from_ai_employees():
    resp = make_mock_response(MOCK_EMPLOYEES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_employees.ainvoke({}))

    names = [e["name"] for e in result]
    assert "Carol White" not in names


@pytest.mark.asyncio
async def test_filters_by_specialism():
    resp = make_mock_response(MOCK_EMPLOYEES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_employees.ainvoke({"specialism": "Designer"}))

    assert len(result) == 1
    assert result[0]["name"] == "Bob Jones"


@pytest.mark.asyncio
async def test_specialism_filter_is_case_insensitive():
    resp = make_mock_response(MOCK_EMPLOYEES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_employees.ainvoke({"specialism": "developer"}))

    names = [e["name"] for e in result]
    assert "Alice Smith" in names


@pytest.mark.asyncio
async def test_specialism_filter_excludes_non_matching():
    resp = make_mock_response(MOCK_EMPLOYEES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_employees.ainvoke({"specialism": "Designer"}))

    names = [e["name"] for e in result]
    assert "Alice Smith" not in names


@pytest.mark.asyncio
async def test_no_specialism_returns_all_visible():
    resp = make_mock_response(MOCK_EMPLOYEES)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_employees.ainvoke({}))

    assert isinstance(result, list)
    assert len(result) == 2


@pytest.mark.asyncio
async def test_returns_error_on_backend_failure():
    resp = make_mock_response({}, status_code=500)
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_employees.ainvoke({}))

    assert "error" in result


@pytest.mark.asyncio
async def test_empty_employee_list():
    resp = make_mock_response([])
    with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=make_mock_client(resp)):
        result = json.loads(await get_employees.ainvoke({}))

    assert result == []
