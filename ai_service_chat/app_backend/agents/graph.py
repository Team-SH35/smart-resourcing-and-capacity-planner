"""
LangGraph workflow for HR Resource Management Chatbot.
This implements an agent that can query and update resource allocations.
"""

from typing import Annotated, TypedDict, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
import os


class AgentState(TypedDict):
    """State of the agent workflow."""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    proposed_changes: list
    user_id: str
    session_id: str


class ResourceManagementAgent:
    """
    LangGraph-based agent for resource management queries and updates.
    """

    def __init__(self, tools: list):
        """
        Initialize the agent with tools and LLM.

        Args:
            tools: List of LangChain tools for resource management
        """
        self.tools = tools
        self.checkpointer = MemorySaver()

        self.llm = ChatOpenAI(
            model="gpt-4o",
            api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0,
        )

        # Bind tools to LLM
        self.llm_with_tools = self.llm.bind_tools(tools)

        # Build the graph
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow."""

        # Create the graph
        workflow = StateGraph(AgentState)

        write_tool_names = {"create_forecast_entry", "update_forecast_entry", "delete_forecast_entry", "update_job_cost", "update_job_monetary_budget", "update_job_time_budget", "update_job_start_date", "update_job_end_date", "add_employee_specialisms"}
        read_tools = [t for t in self.tools if t.name not in write_tool_names]
        write_tools = [t for t in self.tools if t.name in write_tool_names]

        # Add nodes
        workflow.add_node("agent", self._call_model)
        workflow.add_node("tools", ToolNode(read_tools))
        workflow.add_node("write_tools", ToolNode(write_tools))

        # Set entry point
        workflow.set_entry_point("agent")

        # Add conditional edges
        workflow.add_conditional_edges(
            "agent",
            self._should_continue,
            {
                "tools": "tools",
                "write_tools": "write_tools",
                "end": END,
            },
        )

        # Add edge from tools back to agent
        workflow.add_edge("tools", "agent")
        workflow.add_edge("write_tools", "agent")

        # Compile with checkpointer for conversation memory
        return workflow.compile(checkpointer=self.checkpointer, interrupt_before=["write_tools"])

    def _call_model(self, state: AgentState) -> dict:
        """
        Call the LLM with current state.

        Args:
            state: Current agent state

        Returns:
            Updated state with LLM response
        """
        messages = [SystemMessage(content=self.get_system_prompt())] + list(state["messages"])
        response = self.llm_with_tools.invoke(messages)
        return {"messages": [response]}

    def _should_continue(self, state: AgentState) -> str:
        """
        Determine if the agent should continue or end.

        Args:
            state: Current agent state

        Returns:
            Destination node name
        """
        messages = state["messages"]
        last_message = messages[-1]

        # If there are tool calls, route them properly
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            write_tool_names = {"create_forecast_entry", "update_forecast_entry", "delete_forecast_entry", "update_job_cost", "update_job_monetary_budget", "update_job_time_budget", "update_job_start_date", "update_job_end_date", "add_employee_specialisms"}
            if any(tc["name"] in write_tool_names for tc in last_message.tool_calls):
                return "write_tools"
            return "tools"

        # Otherwise end
        return "end"

    async def process_message(
        self,
        message: str,
        user_id: str,
        session_id: str,
    ) -> dict:
        """
        Process a user message through the agent workflow.

        Args:
            message: User's natural language query
            user_id: User identifier
            session_id: Session identifier for conversation continuity

        Returns:
            Response dictionary with message and any proposed changes
        """
        initial_state = {
            "messages": [HumanMessage(content=message)],
            "proposed_changes": [],
            "user_id": user_id,
            "session_id": session_id,
        }

        # Configure with session ID for memory
        config = {"configurable": {"thread_id": session_id}}

        # Run the graph
        await self.graph.ainvoke(initial_state, config)
        return await self._format_state_response(session_id)

    async def _format_state_response(self, session_id: str) -> dict:
        """Extract and format the current agent state to return to the caller."""
        config = {"configurable": {"thread_id": session_id}}
        state_snapshot = await self.graph.aget_state(config)
        final_state = state_snapshot.values

        last_message = final_state["messages"][-1]
        response_text = last_message.content
        proposed_changes = []

        if getattr(state_snapshot, "next", None) and state_snapshot.next[0] == "write_tools":
            if not response_text:
                response_text = "I have prepared the following changes. Please review and confirm:"
            
            from datetime import datetime
            for tc in getattr(last_message, "tool_calls", []):
                proposed_changes.append({
                    "id": tc["id"],
                    "type": "allocation",
                    "description": tc["name"],
                    "data": tc["args"],
                    "status": "pending",
                    "created_at": datetime.utcnow()
                })

        return {
            "response": response_text,
            "proposed_changes": proposed_changes,
            "messages": final_state["messages"],
        }
    
    async def approve_change(self, session_id: str) -> dict:
        """Resume execution applying the pending tools."""
        config = {"configurable": {"thread_id": session_id}}
        await self.graph.ainvoke(None, config)
        return await self._format_state_response(session_id)

    async def reject_change(self, session_id: str) -> dict:
        """Reject the change by forcibly failing the tool call execution and resuming."""
        config = {"configurable": {"thread_id": session_id}}
        state_snapshot = await self.graph.aget_state(config)
        
        if getattr(state_snapshot, "next", None) and state_snapshot.next[0] == "write_tools":
            last_message = state_snapshot.values["messages"][-1]
            tool_msgs = []
            for tc in getattr(last_message, "tool_calls", []):
                tool_msgs.append(ToolMessage(tool_call_id=tc["id"], name=tc["name"], content="User rejected the change. Inform the user respectfully that you aborted the operation."))
            
            await self.graph.aupdate_state(config, {"messages": tool_msgs}, as_node="write_tools")
            await self.graph.ainvoke(None, config)
            
        return await self._format_state_response(session_id)

    def get_system_prompt(self) -> str:
        """Get the system prompt for the agent."""
        return """You are the HR Resource Management & Capacity Planning Lead AI. Your goal is to ensure project staffing is optimized and burnout is minimized.

### SCOPE:
You ONLY answer questions related to HR resource management, employee capacity, project staffing, and forecast planning.
If the user asks anything outside this scope (e.g. general knowledge, entertainment, travel, personal advice, or anything unrelated to workforce planning), you must politely refuse and redirect them. Example refusal: "I can only help with HR resource management and capacity planning. Is there something related to staffing or project allocation I can help you with?"

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


def create_agent(tools: list) -> ResourceManagementAgent:
    """
    Factory function to create a resource management agent.

    Args:
        tools: List of tools for the agent

    Returns:
        Configured ResourceManagementAgent
    """
    return ResourceManagementAgent(tools=tools)
