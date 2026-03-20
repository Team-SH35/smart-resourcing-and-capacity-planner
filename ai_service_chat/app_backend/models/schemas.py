from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class ChangeType(str, Enum):
    ALLOCATION = "allocation"
    REASSIGNMENT = "reassignment"
    CAPACITY_UPDATE = "capacity_update"


class ChangeStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ChatMessage(BaseModel):
    message: str
    user_id: str = Field(..., alias="userId")
    session_id: Optional[str] = Field(None, alias="sessionId")

    class Config:
        populate_by_name = True


class ChatResponse(BaseModel):
    id: str
    message: str
    response: str
    timestamp: datetime
    intent: Optional[str] = None
    entities: Optional[Dict[str, Any]] = None
    proposed_changes: Optional[List["ProposedChange"]] = None
    session_id: Optional[str] = Field(None, alias="sessionId")

    class Config:
        populate_by_name = True


class ProposedChange(BaseModel):
    id: str
    type: ChangeType
    description: str
    data: Dict[str, Any]
    status: ChangeStatus
    created_at: datetime = Field(..., alias="createdAt")
    impact_summary: Optional[str] = Field(None, alias="impactSummary")

    class Config:
        populate_by_name = True
