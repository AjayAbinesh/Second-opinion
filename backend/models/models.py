import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from backend.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="student")  # student, admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    streak = Column(Integer, default=0)
    points = Column(Integer, default=0)
    last_active = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    sessions = relationship("CaseSession", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSetting", uselist=False, back_populates="user", cascade="all, delete-orphan")


class ClinicalCase(Base):
    __tablename__ = "clinical_cases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    specialty = Column(String, nullable=False)
    difficulty = Column(String, default="Medium")
    guideline_summary = Column(Text, nullable=False)  # Guideline reference text used by RAG
    initial_presentation = Column(Text, nullable=False)  # JSON structure containing raw medical values
    underlying_diagnosis = Column(String, nullable=False)
    diagnostic_criteria = Column(Text, nullable=False)

    # Relationships
    sessions = relationship("CaseSession", back_populates="case")


class CaseSession(Base):
    __tablename__ = "case_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    case_id = Column(Integer, ForeignKey("clinical_cases.id"), nullable=False)
    
    # Session state
    status = Column(String, default="active")  # active, debate, feedback_ready, completed
    current_stage = Column(String, default="investigation")  # investigation, debate, feedback
    
    # Interactive Content
    generated_case_data = Column(Text, nullable=True)  # JSON of custom fictional patient details
    history = Column(Text, default="[]")  # JSON log of agent-student dialogue/actions
    user_diagnosis = Column(Text, nullable=True)
    user_reasoning = Column(Text, nullable=True)
    
    # Score & Review
    score = Column(Integer, nullable=True)
    feedback_text = Column(Text, nullable=True)
    cognitive_biases = Column(String, default="[]")  # JSON list of detected biases
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="sessions")
    case = relationship("ClinicalCase", back_populates="sessions")
    investigations = relationship("Investigation", back_populates="session", cascade="all, delete-orphan")


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("case_sessions.id"), nullable=False)
    test_type = Column(String, nullable=False)  # CBC, BMP, ECG, X-Ray, etc.
    request_reason = Column(Text, nullable=True)
    result_content = Column(Text, nullable=False)  # Generated report content
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    session = relationship("CaseSession", back_populates="investigations")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    badge_icon = Column(String, nullable=False)  # Icon code
    unlocked_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="achievements")


class UserSetting(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    theme = Column(String, default="dark")  # dark, light
    groq_api_key = Column(String, nullable=True)  # custom student Groq key

    # Relationships
    user = relationship("User", back_populates="settings")
