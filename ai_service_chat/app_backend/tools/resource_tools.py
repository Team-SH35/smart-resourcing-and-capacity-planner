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
        response = await client.get(f"{_backend_url}/api/employees", params=params)
        if not response.is_success:
            return json.dumps({"error": f"Backend error: {response.status_code}"})

        employees = response.json()

    if specialism:
        employees = [
            e for e in employees
            if any(specialism.lower() in s.lower() for s in e.get("specialisms", []))
        ]

    employees = [e for e in employees if not e.get("excludedFromAI")]

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
        response = await client.get(f"{_backend_url}/api/job-codes", params=params)
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
            client.get(f"{_backend_url}/api/employees", params={"workspaceID": workspace_id}),
            client.get(f"{_backend_url}/api/forecast-entries", params=forecast_params),
        )

        if not emp_resp.is_success:
            return json.dumps({"error": "Failed to fetch employees"})
        if not forecast_resp.is_success:
            return json.dumps({"error": "Failed to fetch forecast"})

        employees = emp_resp.json()
        forecast = forecast_resp.json()

    # Sum allocated days per employee (keyed by name since backend has no employeeID)
    allocation_map = {}
    for entry in forecast:
        name = entry.get("employeeName", "")
        allocation_map[name] = allocation_map.get(name, 0) + entry.get("days", 0)

    if specialism:
        employees = [
            e for e in employees
            if any(specialism.lower() in s.lower() for s in e.get("specialisms", []))
        ]

    employees = [e for e in employees if not e.get("excludedFromAI")]

    result = []
    for emp in employees:
        name = emp.get("name", "")
        allocated = allocation_map.get(name, 0)
        result.append({
            "name": name,
            "specialisms": emp.get("specialisms", []),
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
        response = await client.get(f"{_backend_url}/api/forecast-entries", params=params)
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
            client.get(f"{_backend_url}/api/job-codes", params={"workspaceID": workspace_id}),
            client.get(f"{_backend_url}/api/forecast-entries", params=forecast_params),
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
        time_budget = job.get("budgetTime")
        if time_budget is None:
            continue
        allocated = allocated_map.get(job["jobCode"], 0)
        if allocated < time_budget:
            understaffed.append({
                "jobCode": job["jobCode"],
                "description": job["description"],
                "businessUnit": job["businessUnit"],
                "budgetTime": time_budget,
                "allocatedDays": allocated,
                "gap": time_budget - allocated,
            })

    return json.dumps(understaffed)



@tool
async def propose_allocation_change(
    employee_id: str,
    job_code: str,
    days: float,
    month: str,
    cost: Optional[float] = None,
) -> str:
    """
    Propose a new resource allocation change.
    This creates a pending change that requires user approval before it is applied.

    Args:
        employee_id: Employee ID to allocate
        job_code: Job code to assign the employee to
        days: Number of days to allocate
        month: Month in format YYYY-MM-DD (e.g. "2026-03-01")
        cost: Optional cost for the allocation

    Returns:
        JSON string with proposed change details
    """
    # TODO: Wire up once backend delivers POST /changes endpoint
    return json.dumps({
        "status": "pending_backend",
        "message": "Change proposal endpoint not yet available. Inform the user that changes cannot be applied yet and that the backend team is working on it.",
        "proposed": {
            "employeeId": employee_id,
            "jobCode": job_code,
            "days": days,
            "month": month,
            "cost": cost,
        },
    })


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
        response = await client.get(f"{_backend_url}/api/forecast-entries", params=params)
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
        response = await client.get(f"{_backend_url}/api/forecast-entries", params=params)
        if not response.is_success:
            return json.dumps({"error": f"Backend error: {response.status_code}"})
        return response.text

def get_resource_tools(backend_url: str) -> List:
    """Get list of resource management tools for LangGraph."""
    set_backend_url(backend_url)

    return [
        get_employees,
        get_jobs,
        get_employee_availability,
        get_project_staffing,
        get_understaffed_projects,
        get_capacity_forecast,
        get_schedule,
        propose_allocation_change,
    ]
