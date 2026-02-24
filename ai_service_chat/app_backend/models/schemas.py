#TBC i'm gonna check in with Aidan about this later but putting this as a temp model

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"


class ChangeType(str, Enum):
    ALLOCATION = "allocation"
    REASSIGNMENT = "reassignment"
    CAPACITY_UPDATE = "capacity_update"


class ChangeStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# Employee Models
class Employee(BaseModel):
    id: str
    name: str
    role: str
    department: str
    skills: List[str]
    email: str


# Project Models
class Project(BaseModel):
    id: str
    name: str
    project_code: str = Field(..., alias="projectCode")
    start_date: datetime = Field(..., alias="startDate")
    end_date: datetime = Field(..., alias="endDate")
    required_skills: List[str] = Field(..., alias="requiredSkills")
    status: ProjectStatus

    class Config:
        populate_by_name = True


# Resource Allocation Models
class ResourceAllocation(BaseModel):
    id: str
    employee_id: str = Field(..., alias="employeeId")
    project_id: str = Field(..., alias="projectId")
    start_date: datetime = Field(..., alias="startDate")
    end_date: datetime = Field(..., alias="endDate")
    hours_per_week: float = Field(..., alias="hoursPerWeek")
    allocation_percentage: float = Field(..., alias="allocationPercentage")

    class Config:
        populate_by_name = True


# Capacity Models
class CapacityData(BaseModel):
    employee_id: str = Field(..., alias="employeeId")
    date: datetime
    allocated_hours: float = Field(..., alias="allocatedHours")
    available_hours: float = Field(..., alias="availableHours")
    utilization: float

    class Config:
        populate_by_name = True


# Chat Models
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


# Proposed Change Models
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


# Query Models for Natural Language
class AvailabilityQuery(BaseModel):
    role: Optional[str] = None
    skills: Optional[List[str]] = None
    start_date: Optional[datetime] = Field(None, alias="startDate")
    end_date: Optional[datetime] = Field(None, alias="endDate")
    min_hours: Optional[float] = Field(None, alias="minHours")

    class Config:
        populate_by_name = True


class ProjectQuery(BaseModel):
    project_id: Optional[str] = Field(None, alias="projectId")
    status: Optional[ProjectStatus] = None
    start_date: Optional[datetime] = Field(None, alias="startDate")
    end_date: Optional[datetime] = Field(None, alias="endDate")
    understaffed: Optional[bool] = None

    class Config:
        populate_by_name = True
