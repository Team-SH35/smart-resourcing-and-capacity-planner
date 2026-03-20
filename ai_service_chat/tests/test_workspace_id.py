"""Tests for workspace ID env var behaviour across tools."""
import json
import os
from unittest.mock import patch, call

import pytest

from tests.conftest import MOCK_EMPLOYEES, MOCK_JOBS, MOCK_FORECAST_ENTRIES, make_mock_client, make_mock_response
from app_backend.tools.resource_tools import (
    get_employees,
    get_jobs,
    get_capacity_forecast,
    _workspace_id,
    set_backend_url,
)


def test_workspace_id_defaults_to_1():
    with patch.dict(os.environ, {}, clear=False):
        os.environ.pop("WORKSPACE_ID", None)
        assert _workspace_id() == 1


def test_workspace_id_reads_from_env():
    with patch.dict(os.environ, {"WORKSPACE_ID": "42"}):
        assert _workspace_id() == 42


def test_workspace_id_is_cast_to_int():
    with patch.dict(os.environ, {"WORKSPACE_ID": "7"}):
        result = _workspace_id()
        assert isinstance(result, int)
        assert result == 7


@pytest.mark.asyncio
async def test_get_employees_sends_workspace_id_param():
    resp = make_mock_response(MOCK_EMPLOYEES)
    mock_ctx = make_mock_client(resp)
    with patch.dict(os.environ, {"WORKSPACE_ID": "5"}):
        with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
            await get_employees.ainvoke({})

    mock_client = mock_ctx.__aenter__.return_value
    _, kwargs = mock_client.get.call_args
    assert kwargs["params"]["workspaceID"] == 5


@pytest.mark.asyncio
async def test_get_jobs_sends_workspace_id_param():
    resp = make_mock_response(MOCK_JOBS)
    mock_ctx = make_mock_client(resp)
    with patch.dict(os.environ, {"WORKSPACE_ID": "3"}):
        with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
            await get_jobs.ainvoke({})

    mock_client = mock_ctx.__aenter__.return_value
    _, kwargs = mock_client.get.call_args
    assert kwargs["params"]["workspaceID"] == 3


@pytest.mark.asyncio
async def test_get_capacity_forecast_sends_workspace_id_param():
    resp = make_mock_response(MOCK_FORECAST_ENTRIES)
    mock_ctx = make_mock_client(resp)
    with patch.dict(os.environ, {"WORKSPACE_ID": "9"}):
        with patch("app_backend.tools.resource_tools.httpx.AsyncClient", return_value=mock_ctx):
            await get_capacity_forecast.ainvoke({})

    mock_client = mock_ctx.__aenter__.return_value
    _, kwargs = mock_client.get.call_args
    assert kwargs["params"]["workspaceID"] == 9


def test_set_backend_url_changes_url():
    from app_backend.tools import resource_tools
    original = resource_tools._backend_url
    set_backend_url("http://test-server:9999")
    assert resource_tools._backend_url == "http://test-server:9999"
    set_backend_url(original)  # restore
