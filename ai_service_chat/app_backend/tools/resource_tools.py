"""
Resource management tools for LangGraph agent.
"""
import asyncio
import json
import os
from typing import List, Optional
from langchain_core.tools import tool
import httpx


_backend_url: str = "http://localhost:4000"


def set_backend_url(url: str):
    """Set the backend URL for API calls."""
    global _backend_url
    _backend_url = url

def _workspace_id() -> int:
    # Returns the workspace ID from the WORKSPACE_ID environment variable,
    # defaulting to 1 if not set. Used to scope API calls to a specific workspace.
    return int(os.getenv("WORKSPACE_ID", "1"))

@tool
async def get_employees(
    specialism: Optional[str] = None,
) -> str:
    """
    Get all employees, optionally filtered by specialism.

    Args:
        specialism: Filter by specialism name (e.g. "Developer", "Designer")

    Returns:
        JSON string with list of employees
    """
    params = {"workspaceID": _workspace_id()}

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{_backend_url}/employees", params=params)
        if not response.is_success:
            return json.dumps({"error": f"Backend error: {response.status_code}"})

        employees = response.json()

    if specialism:
        employees = [
            e for e in employees
            if e.get("specialism") and specialism.lower() in e["specialism"].lower()
        ]

    employees = [e for e in employees if not e.get("excludeFromAI")]

    return json.dumps(employees)


@tool
async def get_project_staffing(
    project_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> str:
    """
    Get current staffing information for projects.

    Args:
        project_id: Specific project ID to query
        start_date: Start date in ISO format
        end_date: End date in ISO format

    Returns:
        JSON string with project staffing details
    """
    params = {}
    if project_id:
        params["projectId"] = project_id
    if start_date:
        params["startDate"] = start_date
    if end_date:
        params["endDate"] = end_date

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{_backend_url}/api/projects/staffing", params=params)
        return response.text


@tool
async def get_understaffed_projects(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> str:
    """
    Identify projects that are understaffed in a given time period.

    Args:
        start_date: Start date in ISO format
        end_date: End date in ISO format

    Returns:
        JSON string with understaffed projects and capacity gaps
    """
    params = {}
    if start_date:
        params["startDate"] = start_date
    if end_date:
        params["endDate"] = end_date

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{_backend_url}/api/projects/understaffed", params=params)
        return response.text


@tool
async def propose_allocation_change(
    employee_id: str,
    project_id: str,
    start_date: str,
    end_date: str,
    hours_per_week: float,
) -> str:
    """
    Propose a new resource allocation change.
    This creates a pending change that requires user approval.

    Args:
        employee_id: Employee ID to allocate
        project_id: Project ID to assign to
        start_date: Allocation start date (ISO format)
        end_date: Allocation end date (ISO format)
        hours_per_week: Hours per week to allocate

    Returns:
        JSON string with proposed change details
    """
    payload = {
        "employeeId": employee_id,
        "projectId": project_id,
        "startDate": start_date,
        "endDate": end_date,
        "hoursPerWeek": hours_per_week,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{_backend_url}/api/allocations/propose", json=payload)
        return response.text


@tool
async def get_capacity_forecast(
    department: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> str:
    """
    Get capacity forecast for a department or company-wide.

    Args:
        department: Department to filter by
        start_date: Forecast start date (ISO format)
        end_date: Forecast end date (ISO format)

    Returns:
        JSON string with capacity forecast data
    """
    params = {}
    if department:
        params["department"] = department
    if start_date:
        params["startDate"] = start_date
    if end_date:
        params["endDate"] = end_date

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{_backend_url}/api/capacity/forecast", params=params)
        return response.text


def get_resource_tools(backend_url: str) -> List:
    """Get list of resource management tools for LangGraph."""
    set_backend_url(backend_url)

    return [
        get_employee_availability,
        get_project_staffing,
        get_understaffed_projects,
        propose_allocation_change,
        get_capacity_forecast,
    ]
