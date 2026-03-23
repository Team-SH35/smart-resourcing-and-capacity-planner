"""Tests for get_resource_tools factory function."""
from app_backend.tools.resource_tools import get_resource_tools


def test_get_resource_tools_returns_list():
    tools = get_resource_tools("http://localhost:4000")
    assert isinstance(tools, list)


def test_get_resource_tools_returns_nineteen_tools():
    tools = get_resource_tools("http://localhost:4000")
    assert len(tools) == 19


def test_get_resource_tools_includes_get_employees():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "get_employees" in names


def test_get_resource_tools_includes_get_jobs():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "get_jobs" in names


def test_get_resource_tools_includes_get_employee_availability():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "get_employee_availability" in names


def test_get_resource_tools_includes_get_project_staffing():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "get_project_staffing" in names


def test_get_resource_tools_includes_get_understaffed_projects():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "get_understaffed_projects" in names


def test_get_resource_tools_includes_get_capacity_forecast():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "get_capacity_forecast" in names


def test_get_resource_tools_includes_get_schedule():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "get_schedule" in names


def test_get_resource_tools_includes_write_tools():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "create_forecast_entry" in names
    assert "update_forecast_entry" in names
    assert "delete_forecast_entry" in names


def test_get_resource_tools_includes_update_job_cost():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "update_job_cost" in names


def test_get_resource_tools_includes_update_job_monetary_budget():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "update_job_monetary_budget" in names


def test_get_resource_tools_includes_update_job_time_budget():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "update_job_time_budget" in names


def test_get_resource_tools_includes_update_job_start_date():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "update_job_start_date" in names


def test_get_resource_tools_includes_update_job_end_date():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "update_job_end_date" in names


def test_get_resource_tools_includes_get_business_units():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "get_business_units" in names


def test_get_resource_tools_includes_create_job():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "create_job" in names


def test_get_resource_tools_includes_delete_job():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "delete_job" in names


def test_get_resource_tools_includes_add_employee_specialisms():
    tools = get_resource_tools("http://localhost:4000")
    names = [t.name for t in tools]
    assert "add_employee_specialisms" in names


def test_get_resource_tools_sets_backend_url():
    from app_backend.tools import resource_tools
    get_resource_tools("http://custom-server:9999")
    assert resource_tools._backend_url == "http://custom-server:9999"
