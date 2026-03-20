"""FastAPI routes for the AI chatbot service."""

import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app_backend.agents import create_agent
from app_backend.models import ChatMessage, ChatResponse
from app_backend.tools import get_resource_tools

router = APIRouter()

_agent = None


async def get_agent():
    """Get or initialise the agent instance (lazy singleton)."""
    global _agent

    if _agent is None:
        backend_url = os.getenv("BACKEND_URL", "http://localhost:3001")
        tools = get_resource_tools(backend_url)
        _agent = create_agent(tools=tools)

    return _agent


@router.post("/chat", response_model=ChatResponse, response_model_by_alias=True)
async def chat(
    message: ChatMessage,
    agent=Depends(get_agent),
):
    """Process a chat message and return an AI response."""
    try:
        session_id = message.session_id or str(uuid.uuid4())

        result = await agent.process_message(
            message=message.message,
            session_id=session_id,
        )

        return ChatResponse(
            id=str(uuid.uuid4()),
            message=message.message,
            response=result["response"],
            timestamp=datetime.utcnow(),
            session_id=session_id,
            proposed_changes=result.get("proposed_changes"),
        )

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
    """Resume the paused agent and apply the pending write tool calls."""
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
    """Inject a rejection tool message and resume the agent so it can inform the user."""
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
