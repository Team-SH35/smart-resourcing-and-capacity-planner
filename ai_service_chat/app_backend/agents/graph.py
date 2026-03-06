"""
LangGraph workflow for HR Resource Management Chatbot.
This implements an agent that can query and update resource allocations.
"""

from typing import Annotated, TypedDict, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, SyestemMessage
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
        messages = state["messages"]
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
        return """You are an AI assistant for HR resource management and capacity planning.

Your role is to help managers:
1. Query employee availability and capacity
2. View project staffing levels
3. Identify understaffed or overstaffed projects
4. Propose resource allocation changes
5. Generate capacity forecasts

When proposing changes:
- Always explain the impact of the change
- Provide a clear summary before proposing
- Ask for confirmation before making actual changes
- Consider current allocations and avoid over-allocation

When answering queries:
- Be specific with dates, names, and numbers
- Highlight potential issues (understaffing, over-allocation)
- Suggest actionable next steps

Use the available tools to query the resource management system and provide accurate, data-driven responses."""


def create_agent(tools: list) -> ResourceManagementAgent:
    """
    Factory function to create a resource management agent.

    Args:
        tools: List of tools for the agent

    Returns:
        Configured ResourceManagementAgent
    """
    return ResourceManagementAgent(tools=tools)
