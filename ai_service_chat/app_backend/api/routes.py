"""
FastAPI routes for the AI chatbot service.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import uuid
from datetime import datetime

from app_backend.models import ChatMessage, ChatResponse
from app_backend.agents import create_agent
from app_backend.tools import get_resource_tools
from app_backend.mcp_integration import setup_mcp_servers
import os

router = APIRouter()

_agent = None
_mcp_integration = None


async def get_agent():
    """Get or create the agent instance."""
    global _agent, _mcp_integration

    if _agent is None:
        # Get backend URL from environment
        backend_url = os.getenv("BACKEND_URL", "http://localhost:3001")

        # Get resource management tools
        tools = get_resource_tools(backend_url)

        # Set up MCP integration (optional)
        _mcp_integration = await setup_mcp_servers()

        # Create agent with tools
        _agent = create_agent(tools=tools)

    return _agent


@router.post("/chat", response_model=ChatResponse, response_model_by_alias=True)
async def chat(
    message: ChatMessage,
    agent=Depends(get_agent),
):
    """
    Process a chat message and return AI response.

    Args:
        message: User's chat message
        agent: LangGraph agent instance

    Returns:
        Chat response with AI message and any proposed changes
    """
    try:
        # Generate session ID if not provided
        session_id = message.session_id or str(uuid.uuid4())

        # Process message through agent
        result = await agent.process_message(
            message=message.message,
            user_id=message.user_id,
            session_id=session_id,
        )

        # Create response
        response = ChatResponse(
            id=str(uuid.uuid4()),
            message=message.message,
            response=result["response"],
            timestamp=datetime.utcnow(),
            session_id=session_id,
            proposed_changes=result.get("proposed_changes"),
        )

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-chatbot",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/approve-change/{session_id}", response_model=ChatResponse, response_model_by_alias=True)
async def approve_change(session_id: str):
    """
    Approve a proposed change and automatically resume agent execution.

    Args:
        session_id: The session string identifier containing the paused state

    Returns:
        Chat response summarizing the execution outcome
    """
    try:
        agent = await get_agent()
        result = await agent.approve_change(session_id)
        
        return ChatResponse(
            id=str(uuid.uuid4()),
            message="Change Approved",
            response=result["response"],
            timestamp=datetime.utcnow(),
            session_id=session_id,
            proposed_changes=result.get("proposed_changes"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error approving change: {str(e)}")


@router.post("/reject-change/{session_id}", response_model=ChatResponse, response_model_by_alias=True)
async def reject_change(session_id: str):
    """
    Reject a proposed change and let the agent know.

    Args:
        session_id: The session string identifier

    Returns:
        Chat response summarizing the rejection
    """
    try:
        agent = await get_agent()
        result = await agent.reject_change(session_id)
        
        return ChatResponse(
            id=str(uuid.uuid4()),
            message="Change Rejected",
            response=result["response"],
            timestamp=datetime.utcnow(),
            session_id=session_id,
            proposed_changes=result.get("proposed_changes"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error rejecting change: {str(e)}")


@router.get("/session/{session_id}/history")
async def get_session_history(session_id: str):
    """
    Get conversation history for a session.

    Args:
        session_id: Session identifier

    Returns:
        List of messages in the session
    """
    # TODO: I need to Implement session history retrieval
    # This would fetch messages from the checkpointer
    return {
        "session_id": session_id,
        "messages": [],
    }
