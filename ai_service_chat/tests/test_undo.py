"""Unit tests for the undo_change functionality on ResourceManagementAgent."""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app_backend.agents.graph import ResourceManagementAgent


def make_agent():
    """Create an agent with a mocked LLM so no API key is needed."""
    with patch("app_backend.agents.graph.ChatOpenAI"):
        return ResourceManagementAgent(tools=[], backend_url="http://localhost:4000")


# ---------------------------------------------------------------------------
# _capture_undo_snapshot
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_capture_snapshot_create_stores_none_before_value():
    """create_forecast_entry snapshot should have before_value=None (nothing existed)."""
    agent = make_agent()
    tool_calls = [{"name": "create_forecast_entry", "args": {
        "employee_name": "SLOAN, Elaine",
        "job_code": "JOB-001",
        "month": "March",
        "days": 5,
    }}]

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = []
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        snapshot = await agent._capture_undo_snapshot(tool_calls)

    assert len(snapshot) == 1
    assert snapshot[0]["tool_name"] == "create_forecast_entry"
    assert snapshot[0]["before_value"] is None


@pytest.mark.asyncio
async def test_capture_snapshot_update_records_current_days():
    """update_forecast_entry snapshot captures the current days value from the backend."""
    agent = make_agent()
    tool_calls = [{"name": "update_forecast_entry", "args": {
        "employee_name": "SLOAN, Elaine",
        "job_code": "JOB-001",
        "month": "March",
        "days": 10,
    }}]
    existing_entries = [
        {"employeeName": "SLOAN, Elaine", "jobCode": "JOB-001", "month": "March", "days": 12}
    ]

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = existing_entries
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        snapshot = await agent._capture_undo_snapshot(tool_calls)

    assert snapshot[0]["before_value"] == {"days": 12}


@pytest.mark.asyncio
async def test_capture_snapshot_delete_records_current_days():
    """delete_forecast_entry snapshot captures the current days so it can be restored."""
    agent = make_agent()
    tool_calls = [{"name": "delete_forecast_entry", "args": {
        "employee_name": "FOSTER, Amelia",
        "job_code": "JOB-002",
        "month": "April",
    }}]
    existing_entries = [
        {"employeeName": "FOSTER, Amelia", "jobCode": "JOB-002", "month": "April", "days": 8}
    ]

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = existing_entries
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        snapshot = await agent._capture_undo_snapshot(tool_calls)

    assert snapshot[0]["before_value"] == {"days": 8}


@pytest.mark.asyncio
async def test_capture_snapshot_returns_empty_list_on_backend_error():
    """If the backend is unreachable, snapshot gracefully returns entries with no before_value lookup."""
    agent = make_agent()
    tool_calls = [{"name": "update_forecast_entry", "args": {
        "employee_name": "BARKER, Reece",
        "job_code": "JOB-003",
        "month": "May",
        "days": 3,
    }}]

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(side_effect=Exception("connection refused"))
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        snapshot = await agent._capture_undo_snapshot(tool_calls)

    # Should still return an entry, just with no before_value found
    assert len(snapshot) == 1
    assert snapshot[0]["before_value"] == {"days": None}


# ---------------------------------------------------------------------------
# undo_change
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_undo_change_returns_nothing_to_undo_when_no_snapshot():
    """Calling undo with no prior approve returns the 'nothing to undo' message."""
    agent = make_agent()
    result = await agent.undo_change("session-xyz")
    assert result == {"response": "There is nothing to undo for this session."}


@pytest.mark.asyncio
async def test_undo_change_clears_snapshot_after_use():
    """Snapshot is consumed after undo — a second undo returns 'nothing to undo'."""
    agent = make_agent()
    agent.undo_snapshots["sess-1"] = [
        {"tool_name": "create_forecast_entry",
         "args": {"employee_name": "SLOAN, Elaine", "job_code": "JOB-001", "month": "March"},
         "before_value": None}
    ]

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_client = AsyncMock()
        mock_client.request = AsyncMock(return_value=mock_resp)
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        await agent.undo_change("sess-1")
        result = await agent.undo_change("sess-1")

    assert result == {"response": "There is nothing to undo for this session."}


@pytest.mark.asyncio
async def test_undo_create_sends_delete_request():
    """Undoing a create_forecast_entry should issue a DELETE to the backend."""
    agent = make_agent()
    agent.undo_snapshots["sess-1"] = [
        {"tool_name": "create_forecast_entry",
         "args": {"employee_name": "SLOAN, Elaine", "job_code": "JOB-001", "month": "March"},
         "before_value": None}
    ]

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_client = AsyncMock()
        mock_client.request = AsyncMock(return_value=mock_resp)
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        await agent.undo_change("sess-1")

    mock_client.request.assert_called_once()
    call_args = mock_client.request.call_args
    assert call_args[0][0] == "DELETE"


@pytest.mark.asyncio
async def test_undo_update_sends_patch_request():
    """Undoing an update_forecast_entry should issue a PATCH to restore the old value."""
    agent = make_agent()
    agent.undo_snapshots["sess-1"] = [
        {"tool_name": "update_forecast_entry",
         "args": {"employee_name": "SLOAN, Elaine", "job_code": "JOB-001", "month": "April", "days": 15},
         "before_value": {"days": 12}}
    ]

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_client = AsyncMock()
        mock_client.patch = AsyncMock(return_value=mock_resp)
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await agent.undo_change("sess-1")

    mock_client.patch.assert_called_once()
    patch_body = mock_client.patch.call_args[1]["json"]
    assert patch_body["days"] == 12
    assert "Restored" in result["response"]


@pytest.mark.asyncio
async def test_undo_delete_sends_post_request():
    """Undoing a delete_forecast_entry should POST to recreate the entry."""
    agent = make_agent()
    agent.undo_snapshots["sess-1"] = [
        {"tool_name": "delete_forecast_entry",
         "args": {"employee_name": "FOSTER, Amelia", "job_code": "JOB-002", "month": "May"},
         "before_value": {"days": 8}}
    ]

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_resp)
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await agent.undo_change("sess-1")

    mock_client.post.assert_called_once()
    post_body = mock_client.post.call_args[1]["json"]
    assert post_body["days"] == 8
    assert "Restored" in result["response"]


@pytest.mark.asyncio
async def test_undo_update_warns_when_before_value_missing():
    """If before_value was not captured, undo should warn rather than crash."""
    agent = make_agent()
    agent.undo_snapshots["sess-1"] = [
        {"tool_name": "update_forecast_entry",
         "args": {"employee_name": "SLOAN, Elaine", "job_code": "JOB-001", "month": "April", "days": 15},
         "before_value": {"days": None}}
    ]

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await agent.undo_change("sess-1")

    assert "⚠️" in result["response"]
    assert "not captured" in result["response"]


@pytest.mark.asyncio
async def test_undo_response_contains_employee_name():
    """Undo success message should mention the employee name."""
    agent = make_agent()
    agent.undo_snapshots["sess-1"] = [
        {"tool_name": "update_forecast_entry",
         "args": {"employee_name": "SLOAN, Elaine", "job_code": "JOB-001", "month": "April", "days": 15},
         "before_value": {"days": 12}}
    ]

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_client = AsyncMock()
        mock_client.patch = AsyncMock(return_value=mock_resp)
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        result = await agent.undo_change("sess-1")

    assert "SLOAN, Elaine" in result["response"]
