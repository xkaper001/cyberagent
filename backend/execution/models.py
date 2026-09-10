from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from enum import Enum
import datetime

class ExecutionStatus(str, Enum):
    QUEUED = "queued"
    STARTING = "starting"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"
    BLOCKED = "blocked"

class ExecutionJob(BaseModel):
    execution_id: str
    task_id: Optional[str] = None
    agent: str
    tool: str
    profile: str
    target: str
    status: ExecutionStatus = ExecutionStatus.QUEUED
    requested_at: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat() + "Z")
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    exit_code: Optional[int] = None
    duration_seconds: Optional[float] = None
    stdout: str = ""
    stderr: str = ""
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None

class ToolProfileMetadata(BaseModel):
    name: str
    description: str
    agent: str
    requires_scope: bool = True
    allowed_profiles: List[str]
    timeout_seconds: int = 300
