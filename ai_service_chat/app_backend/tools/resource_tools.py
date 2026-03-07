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
async def get_jobs(
    business_unit: Optional[str] = None,
) -> str:
    """
    Get all jobs, optionally filtered by business unit.

    Args:
        business_unit: Filter by business unit name

    Returns:
        JSON string with list of jobs including budgets and dates
    """
    params = {"workspaceID": _workspace_id()}

    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{_backend_url}/jobs", params=params)
        if not response.is_success:
            return json.dumps({"error": f"Backend error: {response.status_code}"})

        jobs = response.json()

    if business_unit:
        jobs = [
            j for j in jobs
            if j.get("businessUnit") and business_unit.lower() in j["businessUnit"].lower()
        ]

    return json.dumps(jobs)


@tool
async def get_employee_availability(
    specialism: Optional[str] = None,
    month: Optional[str] = None,
) -> str:
    """
    Get employees with their allocated days for a given month.
    Use this to find out who is available or how busy employees are.

    Args:
        specialism: Filter by specialism (e.g. "Developer")
        month: Month to check in format YYYY-MM-DD (e.g. "2026-03-01")

    Returns:
        JSON string with employees and their allocated days
    """
    workspace_id = _workspace_id()
    forecast_params = {"workspaceID": workspace_id}
    if month:
        forecast_params["month"] = month

    async with httpx.AsyncClient() as client:
        emp_resp, forecast_resp = await asyncio.gather(
            client.get(f"{_backend_url}/employees", params={"workspaceID": workspace_id}),
            client.get(f"{_backend_url}/forecast", params=forecast_params),
        )

        if not emp_resp.is_success:
            return json.dumps({"error": "Failed to fetch employees"})
        if not forecast_resp.is_success:
            return json.dumps({"error": "Failed to fetch forecast"})

        employees = emp_resp.json()
        forecast = forecast_resp.json()

    # Sum allocated days per employee
    allocation_map = {}
    for entry in forecast:
        eid = entry["employeeID"]
        allocation_map[eid] = allocation_map.get(eid, 0) + entry.get("days", 0)

    if specialism:
        employees = [
            e for e in employees
            if e.get("specialism") and specialism.lower() in e["specialism"].lower()
        ]

    employees = [e for e in employees if not e.get("excludeFromAI")]

    result = []
    for emp in employees:
        allocated = allocation_map.get(emp["employeeID"], 0)
        result.append({
            "employeeID": emp["employeeID"],
            "name": emp["name"],
            "specialism": emp.get("specialism"),
            "allocatedDays": allocated,
        })

    return json.dumps(result)

@tool
async def get_project_staffing(
    job_code: Optional[str] = None,
    month: Optional[str] = None,
) -> str:
    """
    Get staffing information showing which employees are assigned to which projects.

    Args:
        job_code: Specific job code to query (e.g. "P001")
        month: Month in format YYYY-MM-DD (e.g. "2026-03-01")

    Returns:
        JSON string with project staffing details
    """
    params = {"workspaceID": _workspace_id()}
    if month:
        params["month"] = month

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{_backend_url}/schedule", params=params)
        if not response.is_success:
            return json.dumps({"error": f"Backend error: {response.status_code}"})

        rows = response.json()

    if job_code:
        rows = [r for r in rows if r.get("jobCode") == job_code]

    return json.dumps(rows)

@tool
async def get_understaffed_projects(
    month: Optional[str] = None,
) -> str:
    """
    Identify projects where total allocated days are below their time budget.

    Args:
        month: Month to check in format YYYY-MM-DD (e.g. "2026-03-01")

    Returns:
        JSON string with understaffed projects and their gaps
    """
    workspace_id = _workspace_id()
    forecast_params = {"workspaceID": workspace_id}
    if month:
        forecast_params["month"] = month

    async with httpx.AsyncClient() as client:
        jobs_resp, forecast_resp = await asyncio.gather(
            client.get(f"{_backend_url}/jobs", params={"workspaceID": workspace_id}),
            client.get(f"{_backend_url}/forecast", params=forecast_params),
        )

        if not jobs_resp.is_success:
            return json.dumps({"error": "Failed to fetch jobs"})
        if not forecast_resp.is_success:
            return json.dumps({"error": "Failed to fetch forecast"})

        jobs = jobs_resp.json()
        forecast = forecast_resp.json()

    # Sum allocated days per job
    allocated_map = {}
    for entry in forecast:
        jc = entry["jobCode"]
        allocated_map[jc] = allocated_map.get(jc, 0) + entry.get("days", 0)

    understaffed = []
    for job in jobs:
        time_budget = job.get("timeBudget")
        if time_budget is None:
            continue
        allocated = allocated_map.get(job["jobCode"], 0)
        if allocated < time_budget:
            understaffed.append({
                "jobCode": job["jobCode"],
                "description": job["description"],
                "businessUnit": job["businessUnit"],
                "timeBudget": time_budget,
                "allocatedDays": allocated,
                "gap": time_budget - allocated,
            })

    return json.dumps(understaffed)



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
    month: Optional[str] = None,
    employee_id: Optional[int] = None,
    job_code: Optional[str] = None,
) -> str:
    """
    Get forecast data showing days and cost allocated per employee per job per month.

    Args:
        month: Month in format YYYY-MM-DD (e.g. "2026-03-01")
        employee_id: Filter by specific employee ID
        job_code: Filter by specific job code

    Returns:
        JSON string with forecast entries
    """
    params = {"workspaceID": _workspace_id()}
    if month:
        params["month"] = month
    if employee_id:
        params["employeeID"] = employee_id
    if job_code:
        params["jobCode"] = job_code

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{_backend_url}/forecast", params=params)
        if not response.is_success:
            return json.dumps({"error": f"Backend error: {response.status_code}"})
        return response.text
    
@tool
async def get_schedule(
    month: Optional[str] = None,
) -> str:
    """
    Get the full schedule showing employees, their assigned jobs, days and cost for a month.

    Args:
        month: Month in format YYYY-MM-DD (e.g. "2026-03-01")

    Returns:
        JSON string with full schedule
    """
    params = {"workspaceID": _workspace_id()}
    if month:
        params["month"] = month

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{_backend_url}/schedule", params=params)
        if not response.is_success:
            return json.dumps({"error": f"Backend error: {response.status_code}"})
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
