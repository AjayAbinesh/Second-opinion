from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Auth Schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    streak: int
    points: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class TokenData(BaseModel):
    username: Optional[str] = None


# Settings Schemas
class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = None
    groq_api_key: Optional[str] = None

class UserSettingsOut(BaseModel):
    theme: str
    groq_api_key: Optional[str] = None

    class Config:
        from_attributes = True


# Clinical Case Schemas
class ClinicalCaseOut(BaseModel):
    id: int
    title: str
    specialty: str
    difficulty: str

    class Config:
        from_attributes = True


# Investigation Schemas
class InvestigationRequest(BaseModel):
    test_type: str
    request_reason: str

class InvestigationOut(BaseModel):
    id: int
    session_id: int
    test_type: str
    request_reason: Optional[str] = None
    result_content: str
    created_at: datetime

    class Config:
        from_attributes = True


# Case Session Schemas
class CaseSessionCreate(BaseModel):
    case_id: int

class CaseSessionOut(BaseModel):
    id: int
    case_id: int
    status: str
    current_stage: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CaseSessionDetail(BaseModel):
    id: int
    case_id: int
    case_title: str
    case_specialty: str
    case_difficulty: str
    status: str
    current_stage: str
    generated_case_data: Optional[Dict[str, Any]] = None
    history: List[Dict[str, Any]] = []
    user_diagnosis: Optional[str] = None
    user_reasoning: Optional[str] = None
    score: Optional[int] = None
    feedback_text: Optional[str] = None
    cognitive_biases: List[str] = []
    investigations: List[InvestigationOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


# Diagnosis Submissions
class DiagnosisSubmit(BaseModel):
    user_diagnosis: str
    user_reasoning: str


# Debate Schemas
class DebateMessageSubmit(BaseModel):
    message: str


# Achievement Schemas
class AchievementOut(BaseModel):
    id: int
    title: str
    description: str
    badge_icon: str
    unlocked_at: datetime

    class Config:
        from_attributes = True


# Dashboard & Analytics Schemas
class LeaderboardEntry(BaseModel):
    username: str
    points: int
    streak: int

class DashboardStatsOut(BaseModel):
    completed_cases_count: int
    average_score: float
    streak: int
    points: int
    recent_activities: List[Dict[str, Any]]
    recommended_specialties: List[str]
    achievements: List[AchievementOut]

class AnalyticsOut(BaseModel):
    scores_over_time: List[Dict[str, Any]]
    biases_frequency: Dict[str, int]
    specialty_competency: Dict[str, float]
    completed_cases_by_specialty: Dict[str, int]
    learning_streak: int
    recommendations: List[str]


# Admin Schemas
class AdminStatsOut(BaseModel):
    total_users: int
    total_completed_cases: int
    average_score: float
    global_biases_frequency: Dict[str, int]
    system_activities: List[Dict[str, Any]]
