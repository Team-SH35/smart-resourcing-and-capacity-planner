"""Shared fixtures and mock helpers for ai_service_chat tests."""
import json
from unittest.mock import AsyncMock, MagicMock


MOCK_EMPLOYEES = [
    {
        "id": 1,
        "name": "Alice Smith",
        "specialisms": ["Developer", "Python"],
        "excludedFromAI": False,
    },
    {
        "id": 2,
        "name": "Bob Jones",
        "specialisms": ["Designer", "UX"],
        "excludedFromAI": False,
    },
    {
        "id": 3,
        "name": "Carol White",
        "specialisms": ["Developer", "React"],
        "excludedFromAI": True,   # should always be filtered out by the tools
    },
]

MOCK_JOBS = [
    {
        "jobCode": "P001",
        "description": "Website Redesign",
        "businessUnit": "Digital",
        "budgetTime": 20,
        "startDate": "2026-01-01",
        "endDate": "2026-06-30",
    },
    {
        "jobCode": "P002",
        "description": "Mobile App",
        "businessUnit": "Technology",
        "budgetTime": 30,
        "startDate": "2026-02-01",
        "endDate": "2026-12-31",
    },
]

# All entries in March, used by tests that do not need month filtering
MOCK_FORECAST_ENTRIES = [
    {"employeeName": "Alice Smith", "jobCode": "P001", "days": 5, "month": "March", "cost": 1000.0},
    {"employeeName": "Alice Smith", "jobCode": "P002", "days": 3, "month": "March", "cost": 600.0},
    {"employeeName": "Bob Jones",   "jobCode": "P001", "days": 8, "month": "March", "cost": 1600.0},
]

# Entries spread across two months, used by month filter tests
MOCK_FORECAST_ENTRIES_MULTI_MONTH = [
    {"employeeName": "Alice Smith", "jobCode": "P001", "days": 5, "month": "March", "cost": 1000.0},
    {"employeeName": "Alice Smith", "jobCode": "P002", "days": 3, "month": "March", "cost": 600.0},
    {"employeeName": "Bob Jones",   "jobCode": "P001", "days": 8, "month": "March", "cost": 1600.0},
    {"employeeName": "Alice Smith", "jobCode": "P001", "days": 4, "month": "April", "cost": 800.0},
    {"employeeName": "Bob Jones",   "jobCode": "P002", "days": 6, "month": "April", "cost": 1200.0},
]


def make_mock_response(data, status_code: int = 200) -> MagicMock:
    resp = MagicMock()
    resp.status_code = status_code
    resp.is_success = status_code < 400
    resp.json.return_value = data
    resp.text = json.dumps(data)
    return resp


def make_mock_client(*responses) -> MagicMock:
    """Create a mock httpx.AsyncClient for GET requests."""
    mock_client = AsyncMock()

    if len(responses) == 1:
        mock_client.get = AsyncMock(return_value=responses[0])
    else:
        mock_client.get = AsyncMock(side_effect=list(responses))

    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=mock_client)
    ctx.__aexit__ = AsyncMock(return_value=False)
    return ctx


def make_mock_write_client(method: str, response: MagicMock) -> MagicMock:
    """Create a mock httpx.AsyncClient for POST, PATCH, or DELETE requests."""
    mock_client = AsyncMock()

    if method == "post":
        mock_client.post = AsyncMock(return_value=response)
    elif method == "patch":
        mock_client.patch = AsyncMock(return_value=response)
    elif method == "delete":
        mock_client.request = AsyncMock(return_value=response)

    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=mock_client)
    ctx.__aexit__ = AsyncMock(return_value=False)
    return ctx
