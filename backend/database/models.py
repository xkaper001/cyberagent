import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class ConversationModel(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True)
    title = Column(String, default="New Security Analysis")
    target = Column(String, nullable=True)
    environment = Column(String, default="Lab")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    messages = relationship("MessageModel", back_populates="conversation", cascade="all, delete-orphan")
    assessments = relationship("AssessmentModel", back_populates="conversation")


class MessageModel(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    conversation_id = Column(String, ForeignKey("conversations.id"))
    role = Column(String, nullable=False) # user | assistant | system
    content = Column(Text, nullable=False)
    timestamp = Column(String, default=lambda: datetime.datetime.now().strftime("%H:%M"))
    agent_activity = Column(JSON, nullable=True)
    findings = Column(JSON, nullable=True)
    references = Column(JSON, nullable=True)

    conversation = relationship("ConversationModel", back_populates="messages")


class AssessmentModel(Base):
    __tablename__ = "assessments"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    target = Column(String, nullable=False)
    target_ip = Column(String, nullable=False)
    environment = Column(String, default="Lab")
    status = Column(String, default="in_progress") # in_progress | completed | paused | cancelled
    risk_score = Column(Float, default=0.0)
    progress_phases = Column(JSON, nullable=False)
    open_services = Column(JSON, default=list)
    tech_stack = Column(JSON, default=list)
    verified_findings_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=True)

    conversation = relationship("ConversationModel", back_populates="assessments")
    findings = relationship("FindingModel", back_populates="assessment", cascade="all, delete-orphan")
    reports = relationship("ReportModel", back_populates="assessment", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLogModel", back_populates="assessment", cascade="all, delete-orphan")


class FindingModel(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True)
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=True)
    title = Column(String, nullable=False)
    severity = Column(String, nullable=False) # critical | high | medium | low | info
    confidence = Column(Integer, default=90)
    asset = Column(String, nullable=False)
    target_ip = Column(String, nullable=False)
    status = Column(String, default="active") # active | investigating | remediated
    category = Column(String, nullable=False)
    evidence = Column(JSON, default=list)
    impact = Column(Text, nullable=False)
    remediation = Column(Text, nullable=False)
    cve_id = Column(String, nullable=True)
    cwe_id = Column(String, nullable=True)
    first_detected = Column(DateTime, default=datetime.datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)
    agent_activity_summary = Column(Text, nullable=True)
    references = Column(JSON, default=list)

    assessment = relationship("AssessmentModel", back_populates="findings")


class ReportModel(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True)
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=True)
    title = Column(String, nullable=False)
    date = Column(String, nullable=False)
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String, default="High")
    findings_count = Column(Integer, default=0)
    status = Column(String, default="Completed")
    target = Column(String, nullable=False)
    author = Column(String, default="CyberAgents AI Security Copilot")
    executive_summary = Column(Text, nullable=False)
    attack_surface = Column(Text, nullable=False)
    findings_summary = Column(JSON, nullable=False)
    remediation_roadmap = Column(JSON, nullable=False)

    assessment = relationship("AssessmentModel", back_populates="reports")


class ApprovalModel(Base):
    __tablename__ = "approvals"

    id = Column(String, primary_key=True)
    agent_name = Column(String, nullable=False)
    action = Column(String, nullable=False)
    target = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    expected_outcome = Column(Text, nullable=False)
    timestamp = Column(String, nullable=False)
    status = Column(String, default="pending") # pending | approved | rejected


class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    agent_name = Column(String, nullable=False)
    tool_name = Column(String, nullable=False)
    action = Column(String, nullable=False)
    target = Column(String, nullable=False)
    authorization_status = Column(String, default="AUTHORIZED")
    result_status = Column(String, default="SUCCESS")
    duration = Column(String, default="1.0s")

    assessment = relationship("AssessmentModel", back_populates="audit_logs")
