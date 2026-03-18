"""
LangGraph workflow for HR Resource Management Chatbot.
This implements an agent that can query and update resource allocations.
"""

from typing import Annotated, TypedDict, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
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
            model="gpt-5",
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

        # Add nodes
        workflow.add_node("agent", self._call_model)
        workflow.add_node("tools", ToolNode(self.tools))

        # Set entry point
        workflow.set_entry_point("agent")

        # Add conditional edges
        workflow.add_conditional_edges(
            "agent",
            self._should_continue,
            {
                "continue": "tools",
                "end": END,
            },
        )

        # Add edge from tools back to agent
        workflow.add_edge("tools", "agent")

        # Compile with checkpointer for conversation memory
        return workflow.compile(checkpointer=self.checkpointer)

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
            "continue" if there are tool calls, "end" otherwise
        """
        messages = state["messages"]
        last_message = messages[-1]

        # If there are tool calls, continue
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "continue"

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
        # Create initial state
        initial_state = {
            "messages": [HumanMessage(content=message)],
            "proposed_changes": [],
            "user_id": user_id,
            "session_id": session_id,
        }

        # Configure with session ID for memory
        config = {"configurable": {"thread_id": session_id}}

        # Run the graph
        final_state = await self.graph.ainvoke(initial_state, config)

        # Extract response
        last_message = final_state["messages"][-1]
        response_text = last_message.content

        return {
            "response": response_text,
            "proposed_changes": final_state.get("proposed_changes", []),
            "messages": final_state["messages"],
        }

    def get_system_prompt(self) -> str:
        """Get the system prompt for the agent."""
        return """You are the HR Resource Management & Capacity Planning Lead AI. Your goal is to ensure project staffing is optimized and burnout is minimized.

### AVAILABLE TOOLS:
- get_employees: Retrieve all employees, optionally filtered by specialism (e.g. "Developer", "Designer").
- get_jobs: Retrieve all jobs/projects, optionally filtered by business unit.
- get_employee_availability: Get employees with their total allocated days for a given month. Use this to find who is available or how busy staff are.
- get_project_staffing: Get staffing details showing which employees are assigned to which projects for a given month.
- get_understaffed_projects: Identify projects where allocated days fall below the time budget. Returns the gap for each project.
- get_capacity_forecast: Get detailed forecast data (days and cost) per employee per job per month, with optional filters by employee or job code.
- get_schedule: Get the full monthly schedule showing all employees, their assigned jobs, days, and cost.
- propose_allocation_change: Propose a new resource allocation (employee, job, days, month).

### OPERATIONAL RULES:
1. DATA INTEGRITY: Use ONLY the data returned from tools. Do not invent employee names, job codes, or availability figures.
2. DATE SYNTAX: Always use YYYY-MM-DD for months (e.g., "2026-03-01"). If a user says "next month," calculate the date relative to the current date: March 2026.
3. MULTI-STEP REASONING: If a user asks "Who can help on Project X?", first call `get_understaffed_projects`, then `get_employees` by specialism, then `get_employee_availability` before making a recommendation.

### TOOL USAGE GUIDELINES:
- get_employee_availability: Use this as your primary check before proposing any new allocation.
- propose_allocation_change: Explain the "Why" before calling this. Example: "John has 5 days of capacity in March, so I am proposing he covers the gap in Project X."

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
