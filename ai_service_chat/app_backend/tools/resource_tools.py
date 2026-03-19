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
        month: Month name (e.g. "March", "Jan")

    Returns:
        JSON string with employees and their allocated days
    """
    workspace_id = _workspace_id()

    async with httpx.AsyncClient() as client:
        url_emp = f"{_backend_url}/api/employees"
        url_fc = f"{_backend_url}/api/forecast-entries"
        print(f"[get_employee_availability] Fetching {url_emp} and {url_fc} with workspace_id {workspace_id}", flush=True)
        try:
            emp_resp, forecast_resp = await asyncio.gather(
                client.get(url_emp, params={"workspaceID": workspace_id}),
                client.get(url_fc, params={"workspaceID": workspace_id}),
            )
            print(f"[get_employee_availability] emp status: {emp_resp.status_code}, forecast status: {forecast_resp.status_code}", flush=True)
        except Exception as e:
            print(f"[get_employee_availability] HTTPX EXCEPTION: {str(e)}", flush=True)
            return json.dumps({"error": f"Exception: {str(e)}"})

        if not emp_resp.is_success:
            print(f"[get_employee_availability] emp failed: {emp_resp.text}", flush=True)
            return json.dumps({"error": "Failed to fetch employees"})
        if not forecast_resp.is_success:
            print(f"[get_employee_availability] forecast failed: {forecast_resp.text}", flush=True)
            return json.dumps({"error": "Failed to fetch forecast"})

        employees = emp_resp.json()
        forecast = forecast_resp.json()
        print(f"[get_employee_availability] Fetched {len(employees)} employees and {len(forecast)} forecast entries", flush=True)

    if month:
        m_prefix = month.lower()[:3]
        forecast = [f for f in forecast if f.get("month", "").lower().startswith(m_prefix)]

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
        month: Month name (e.g. "March", "Jan")

    Returns:
        JSON string with project staffing details
    """
    params = {"workspaceID": _workspace_id()}

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{_backend_url}/api/forecast-entries", params=params)
        if not response.is_success:
            return json.dumps({"error": f"Backend error: {response.status_code}"})

        rows = response.json()

    if month:
        m_prefix = month.lower()[:3]
        rows = [r for r in rows if r.get("month", "").lower().startswith(m_prefix)]

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
        month: Month name (e.g. "March", "Jan")

    Returns:
        JSON string with understaffed projects and their gaps
    """
    workspace_id = _workspace_id()

    async with httpx.AsyncClient() as client:
        jobs_resp, forecast_resp = await asyncio.gather(
            client.get(f"{_backend_url}/api/job-codes", params={"workspaceID": workspace_id}),
            client.get(f"{_backend_url}/api/forecast-entries", params={"workspaceID": workspace_id}),
        )

        if not jobs_resp.is_success:
            return json.dumps({"error": "Failed to fetch jobs"})
        if not forecast_resp.is_success:
            return json.dumps({"error": "Failed to fetch forecast"})

        jobs = jobs_resp.json()
        forecast = forecast_resp.json()

    if month:
        m_prefix = month.lower()[:3]
        forecast = [f for f in forecast if f.get("month", "").lower().startswith(m_prefix)]

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
async def get_capacity_forecast(
    month: Optional[str] = None,
    employee_name: Optional[str] = None,
    job_code: Optional[str] = None,
) -> str:
    """
    Get forecast data showing days and cost allocated per employee per job per month.

    Args:
        month: Month name (e.g. "March", "Jan")
        employee_name: Filter by specific employee name
        job_code: Filter by specific job code

    Returns:
        JSON string with forecast entries
    """
    params = {"workspaceID": _workspace_id()}

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{_backend_url}/api/forecast-entries", params=params)
        if not response.is_success:
            return json.dumps({"error": f"Backend error: {response.status_code}"})
        
        rows = response.json()

    if month:
        m_prefix = month.lower()[:3]
        rows = [r for r in rows if r.get("month", "").lower().startswith(m_prefix)]
        
    if employee_name:
        rows = [r for r in rows if r.get("employeeName", "").lower() == employee_name.lower()]

    if job_code:
        rows = [r for r in rows if r.get("jobCode") == job_code]
        
    return json.dumps(rows)

@tool
async def get_schedule(
    month: Optional[str] = None,
) -> str:
    """
    Get the full schedule showing employees, their assigned jobs, days and cost for a month.

    Args:
        month: Month name (e.g. "March", "Jan")

    Returns:
        JSON string with full schedule
    """
    params = {"workspaceID": _workspace_id()}

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{_backend_url}/api/forecast-entries", params=params)
        if not response.is_success:
            return json.dumps({"error": f"Backend error: {response.status_code}"})
        
        rows = response.json()

    if month:
        m_prefix = month.lower()[:3]
        rows = [r for r in rows if r.get("month", "").lower().startswith(m_prefix)]
        
    return json.dumps(rows)

@tool
async def create_forecast_entry(
    employee_name: str,
    job_code: str,
    days: float,
    month: str,
) -> str:
    """
    Create a new forecast entry for an employee on a job for a specific month.
    
    Args:
        employee_name: Employee name to allocate (e.g. "John Doe")
        job_code: Job code to assign the employee to
        days: Number of days to allocate
        month: Month name (e.g. "March", "Jan")

    Returns:
        JSON string with creation result or error
    """
    payload = {
        "employeeName": employee_name,
        "jobCode": job_code,
        "days": days,
        "month": month,
        "workspaceID": _workspace_id(),
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{_backend_url}/api/forecast-entries", json=payload)
        try:
            return json.dumps(response.json())
        except Exception:
            return json.dumps({"error": f"Failed with status {response.status_code}", "text": response.text})

@tool
async def update_forecast_entry(
    employee_name: str,
    job_code: str,
    month: str,
    days: float,
) -> str:
    """
    Update the days for an existing forecast entry.
    
    Args:
        employee_name: Employee name to update
        job_code: Job code for the update
        month: Month name (e.g. "March", "Jan")
        days: New number of days to allocate

    Returns:
        JSON string with update result or error
    """
    payload = {
        "employeeName": employee_name,
        "jobCode": job_code,
        "month": month,
        "days": days,
        "workspaceID": _workspace_id(),
    }

    async with httpx.AsyncClient() as client:
        response = await client.patch(f"{_backend_url}/api/forecast-entries", json=payload)
        try:
            return json.dumps(response.json())
        except Exception:
            return json.dumps({"error": f"Failed with status {response.status_code}", "text": response.text})

@tool
async def delete_forecast_entry(
    employee_name: str,
    job_code: str,
    month: str,
) -> str:
    """
    Delete a forecast entry for an employee on a job in a specific month.
    
    Args:
        employee_name: Employee name to delete allocation for
        job_code: Job code
        month: Month name (e.g. "March", "Jan")

    Returns:
        JSON string with deletion result or error
    """
    payload = {
        "employeeName": employee_name,
        "jobCode": job_code,
        "month": month,
        "workspaceID": _workspace_id(),
    }

    async with httpx.AsyncClient() as client:
        response = await client.request("DELETE", f"{_backend_url}/api/forecast-entries", json=payload)
        try:
            return json.dumps(response.json())
        except Exception:
            return json.dumps({"error": f"Failed with status {response.status_code}", "text": response.text})


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
        create_forecast_entry,
        update_forecast_entry,
        delete_forecast_entry,
    ]
