"""LangGraph workflow for the HR Resource Management agent."""

import os
from datetime import datetime, timezone
from typing import Annotated, Sequence, TypedDict

import httpx
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

# Write tools require user approval before execution — used for routing and interrupt logic
WRITE_TOOL_NAMES = {
    "create_forecast_entry",
    "update_forecast_entry",
    "delete_forecast_entry",
    "update_job_cost",
    "update_job_monetary_budget",
    "update_job_time_budget",
    "update_job_start_date",
    "update_job_end_date",
    "create_job",
    "delete_job",
    "add_employee_specialisms",
}


class AgentState(TypedDict):
    """Shared state threaded through every node in the LangGraph workflow."""
    messages: Annotated[Sequence[BaseMessage], add_messages]


class ResourceManagementAgent:
    """LangGraph-based agent for resource management queries and updates."""

    def __init__(self, tools: list, backend_url: str = "http://localhost:4000"):
        self.tools = tools
        self.backend_url = backend_url
        self.undo_snapshots: dict = {}
        self.checkpointer = MemorySaver()

        self.llm = ChatOpenAI(
            model="gpt-5-nano-2025-08-07",
            api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0,
        )

        self.llm_with_tools = self.llm.bind_tools(tools)
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow with separate read and write tool nodes."""
        workflow = StateGraph(AgentState)

        read_tools = [t for t in self.tools if t.name not in WRITE_TOOL_NAMES]
        write_tools = [t for t in self.tools if t.name in WRITE_TOOL_NAMES]

        workflow.add_node("agent", self._call_model)
        workflow.add_node("tools", ToolNode(read_tools))
        workflow.add_node("write_tools", ToolNode(write_tools))

        workflow.set_entry_point("agent")

        workflow.add_conditional_edges(
            "agent",
            self._should_continue,
            {
                "tools": "tools",
                "write_tools": "write_tools",
                "end": END,
            },
        )

        workflow.add_edge("tools", "agent")
        workflow.add_edge("write_tools", "agent")

        # Pause before write_tools so the frontend can show proposed changes for user approval
        return workflow.compile(checkpointer=self.checkpointer, interrupt_before=["write_tools"])

    def _call_model(self, state: AgentState) -> dict:
        """Prepend the system prompt and invoke the LLM."""
        messages = [SystemMessage(content=self.get_system_prompt())] + list(state["messages"])
        response = self.llm_with_tools.invoke(messages)
        return {"messages": [response]}

    def _should_continue(self, state: AgentState) -> str:
        """Route to the appropriate next node based on which tools the LLM called."""
        last_message = state["messages"][-1]

        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            if any(tc["name"] in WRITE_TOOL_NAMES for tc in last_message.tool_calls):
                return "write_tools"
            return "tools"

        return "end"

    async def process_message(self, message: str, session_id: str) -> dict:
        """Process a user message through the agent workflow."""
        config = {"configurable": {"thread_id": session_id}}

        await self.graph.ainvoke({"messages": [HumanMessage(content=message)]}, config)
        return await self._format_state_response(session_id)

    async def _format_state_response(self, session_id: str) -> dict:
        """Extract the latest agent state and surface any pending write tool calls."""
        config = {"configurable": {"thread_id": session_id}}
        state_snapshot = await self.graph.aget_state(config)
        final_state = state_snapshot.values

        last_message = final_state["messages"][-1]
        response_text = last_message.content
        proposed_changes = []

        # If the graph is paused before write_tools, surface the pending tool calls
        # so the frontend can present them to the user for approval or rejection
        if getattr(state_snapshot, "next", None) and state_snapshot.next[0] == "write_tools":
            if not response_text:
                response_text = "I have prepared the following changes. Please review and confirm:"

            for tc in getattr(last_message, "tool_calls", []):
                proposed_changes.append({
                    "id": tc["id"],
                    "type": "allocation",
                    "description": tc["name"],
                    "data": tc["args"],
                    "status": "pending",
                    "created_at": datetime.now(timezone.utc),
                })

        return {
            "response": response_text,
            "proposed_changes": proposed_changes,
            "messages": final_state["messages"],
        }

    async def _capture_undo_snapshot(self, tool_calls: list) -> list:
        """Fetch the before-state for write operations so they can be reversed."""
        snapshot = []
        try:
            async with httpx.AsyncClient() as client:
                entries_resp = await client.get(f"{self.backend_url}/api/forecast-entries")
                all_entries = entries_resp.json() if entries_resp.status_code == 200 else []
                jobs_resp = await client.get(f"{self.backend_url}/api/job-codes")
                all_jobs = jobs_resp.json() if jobs_resp.status_code == 200 else []
        except Exception:
            all_entries = []
            all_jobs = []

        for tc in tool_calls:
            tool_name = tc["name"]
            args = tc["args"]

            if tool_name == "create_forecast_entry":
                snapshot.append({"tool_name": tool_name, "args": args, "before_value": None})

            elif tool_name in ("update_forecast_entry", "delete_forecast_entry"):
                emp = args.get("employee_name")
                job = args.get("job_code")
                month_prefix = args.get("month", "")[:3].lower()
                current_days = None
                for entry in all_entries:
                    if (entry.get("employeeName") == emp
                            and entry.get("jobCode") == job
                            and entry.get("month", "")[:3].lower() == month_prefix):
                        current_days = entry.get("days")
                        break
                snapshot.append({"tool_name": tool_name, "args": args, "before_value": {"days": current_days}})

            elif tool_name == "create_job":
                # No before state needed — undo just deletes the job
                snapshot.append({"tool_name": tool_name, "args": args, "before_value": None})

            elif tool_name == "delete_job":
                # Capture the full job data so we can recreate it on undo
                job_code = args.get("job_code")
                job_data = next((j for j in all_jobs if j.get("jobCode") == job_code), None)
                snapshot.append({"tool_name": tool_name, "args": args, "before_value": job_data})

        return snapshot

    async def approve_change(self, session_id: str) -> dict:
        """Resume execution applying the pending write tool calls, capturing undo state first."""
        config = {"configurable": {"thread_id": session_id}}

        state_snapshot = await self.graph.aget_state(config)
        last_message = state_snapshot.values["messages"][-1]
        tool_calls = getattr(last_message, "tool_calls", [])
        if tool_calls:
            self.undo_snapshots[session_id] = await self._capture_undo_snapshot(tool_calls)

        await self.graph.ainvoke(None, config)
        return await self._format_state_response(session_id)

    async def undo_change(self, session_id: str) -> dict:
        """Reverse the last approved change for this session."""
        snapshot = self.undo_snapshots.pop(session_id, None)
        if not snapshot:
            return {"response": "There is nothing to undo for this session."}

        results = []
        async with httpx.AsyncClient() as client:
            for change in reversed(snapshot):
                tool_name = change["tool_name"]
                args = change["args"]
                before = change.get("before_value")
                try:
                    if tool_name == "create_forecast_entry":
                        resp = await client.request(
                            "DELETE", f"{self.backend_url}/api/forecast-entries",
                            json={"employeeName": args.get("employee_name"),
                                  "jobCode": args.get("job_code"),
                                  "month": args.get("month")}
                        )
                        if resp.status_code < 300:
                            results.append(f"Removed allocation for **{args.get('employee_name')}** on {args.get('job_code')}")

                    elif tool_name == "update_forecast_entry":
                        if before and before.get("days") is not None:
                            resp = await client.patch(
                                f"{self.backend_url}/api/forecast-entries",
                                json={"employeeName": args.get("employee_name"),
                                      "jobCode": args.get("job_code"),
                                      "month": args.get("month"),
                                      "days": before["days"]}
                            )
                            if resp.status_code < 300:
                                results.append(f"Restored **{args.get('employee_name')}**'s {args.get('month')} allocation on {args.get('job_code')} to {before['days']} days")
                        else:
                            results.append(f"⚠️ Could not undo update for **{args.get('employee_name')}** — original value was not captured")

                    elif tool_name == "delete_forecast_entry":
                        if before and before.get("days") is not None:
                            resp = await client.post(
                                f"{self.backend_url}/api/forecast-entries",
                                json={"employeeName": args.get("employee_name"),
                                      "jobCode": args.get("job_code"),
                                      "month": args.get("month"),
                                      "days": before["days"]}
                            )
                            if resp.status_code < 300:
                                results.append(f"Restored **{args.get('employee_name')}**'s allocation on {args.get('job_code')} for {args.get('month')}")
                        else:
                            results.append(f"⚠️ Could not restore deletion for **{args.get('employee_name')}** — original data not captured")
                    elif tool_name == "create_job":
                        resp = await client.request(
                            "DELETE", f"{self.backend_url}/api/jobs/{args.get('job_code')}",
                            json={"workspaceID": args.get("workspace_id")}
                        )
                        if resp.status_code < 300:
                            results.append(f"Deleted job **{args.get('job_code')}** (undid creation)")

                    elif tool_name == "delete_job":
                        if before:
                            resp = await client.post(
                                f"{self.backend_url}/api/jobs",
                                json={
                                    "jobCode": before.get("jobCode"),
                                    "workspaceID": args.get("workspace_id"),
                                    "description": before.get("description"),
                                    "businessUnit": before.get("businessUnit"),
                                    "customer": before.get("customerName"),
                                    "startDate": before.get("startDate"),
                                    "finishDate": before.get("finishDate"),
                                    "timeBudget": before.get("budgetTime"),
                                    "monetaryBudget": before.get("budgetCost"),
                                    "currencySymbol": before.get("budgetCostCurrency"),
                                }
                            )
                            if resp.status_code < 300:
                                results.append(f"Recreated job **{args.get('job_code')}** (undid deletion)")
                        else:
                            results.append(f"⚠️ Could not restore job **{args.get('job_code')}** — original data was not captured")

                except Exception as e:
                    results.append(f"Error undoing {tool_name}: {str(e)}")

        response = "✅ Undo complete:\n" + "\n".join(f"- {r}" for r in results) if results else "Nothing was undone."
        return {"response": response}

    async def reject_change(self, session_id: str) -> dict:
        """Inject rejection tool messages and resume so the agent can inform the user."""
        config = {"configurable": {"thread_id": session_id}}
        state_snapshot = await self.graph.aget_state(config)

        if getattr(state_snapshot, "next", None) and state_snapshot.next[0] == "write_tools":
            last_message = state_snapshot.values["messages"][-1]
            tool_msgs = []
            for tc in getattr(last_message, "tool_calls", []):
                tool_msgs.append(ToolMessage(
                    tool_call_id=tc["id"],
                    name=tc["name"],
                    content="User rejected the change. Inform the user respectfully that you aborted the operation.",
                ))

            await self.graph.aupdate_state(config, {"messages": tool_msgs}, as_node="write_tools")
            await self.graph.ainvoke(None, config)

        return await self._format_state_response(session_id)

    def get_system_prompt(self) -> str:
        """Return the system prompt that scopes and guides the agent's behaviour."""
        return """You are the HR Resource Management & Capacity Planning Lead AI. Your goal is to ensure project staffing is optimized and burnout is minimized.

### SCOPE:
You help with anything related to employees, jobs, projects, staffing, capacity, forecasts, allocations, schedules, budgets, specialisms, and business units.
Only refuse requests that are clearly unrelated to the workplace — e.g. general knowledge, entertainment, travel, or personal advice. When in doubt, assume the user is asking about something work-related and try to help. Example refusal (only for clearly off-topic): "I can only help with HR resource management and capacity planning. Is there something related to staffing or project allocation I can help you with?"

### AVAILABLE TOOLS:
- get_employees: Retrieve all employees, optionally filtered by specialism (e.g. "Developer", "Designer").
- get_jobs: Retrieve all jobs/projects, optionally filtered by business unit.
- get_employee_availability: Get employees with their total allocated days for a given month. Use this to find who is available or how busy staff are.
- get_project_staffing: Get staffing details showing which employees are assigned to which projects for a given month.
- get_understaffed_projects: Identify projects where allocated days fall below the time budget. Returns the gap for each project.
- get_capacity_forecast: Get detailed forecast data (days and cost) per employee per job per month, with optional filters by employee name or job code.
- get_schedule: Get the full monthly schedule showing all employees, their assigned jobs, days, and cost.
- create_forecast_entry: Create a new resource allocation (employee_name, job_code, days, month).
- update_forecast_entry: Update an existing resource allocation's days.
- delete_forecast_entry: Delete an existing resource allocation.
- update_job_cost: Update the daily cost/rate for a job (job_code, cost).
- update_job_monetary_budget: Update the monetary budget for a job (job_code, new_budget).
- update_job_time_budget: Update the time budget in days for a job (job_code, time_budget).
- update_job_start_date: Update the start date for a job (job_code, start_date in ISO format e.g. "2024-03-01").
- update_job_end_date: Update the end date for a job (job_code, end_date in ISO format e.g. "2024-06-30").
- get_business_units: Retrieve all distinct business units available in the system.
- create_job: Create a new job/project (job_code, workspace_id, and optional description, business_unit, customer, dates, budgets).
- delete_job: Delete a job and all its forecast entries (job_code, workspace_id). Use with caution — this removes all allocations for the job.
- add_employee_specialisms: Add one or more specialisms to an employee's profile (employee_name, specialisms as a list).

### OPERATIONAL RULES:
1. DATA INTEGRITY: Use ONLY the data returned from tools. Do not invent employee names, job codes, or availability figures.
2. DATE SYNTAX: Always use month names (e.g., "March", "Jan") for the month argument, NEVER use YYYY-MM-DD format as the backend only understands month names.
3. MULTI-STEP REASONING: If a user asks "Who can help on Project X?", first call `get_understaffed_projects`, then `get_employees` by specialism, then `get_employee_availability` before making a recommendation.

### TOOL USAGE GUIDELINES:
- get_employee_availability: Use this as your primary check before proposing any new allocation.
- create_forecast_entry: Explain the "Why" before calling this. Example: "John has 5 days of capacity in March, so I am allocating him to cover the gap in Project X."

### GUARDRAILS:
- Over-allocation: If a proposal puts an employee over 20 working days/month, flag this as a "High Workload Warning."
- Privacy: Do not speculate about personal details not present in tool responses.

### OUTPUT STYLE:
- Use Markdown tables for capacity forecasts or schedules.
- Be concise but proactive (e.g., "Project Alpha is understaffed by 10 days; would you like me to see who is available?")."""


def create_agent(tools: list, backend_url: str = "http://localhost:4000") -> ResourceManagementAgent:
    """Factory function to create a ResourceManagementAgent."""
    return ResourceManagementAgent(tools=tools, backend_url=backend_url)
