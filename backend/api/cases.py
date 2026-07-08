import json
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.models import models
from backend.schemas import schemas
from backend.services.agents import AgentService
from backend.services.vector_store import VectorStore

router = APIRouter(prefix="/api/cases", tags=["Clinical Cases"])

def check_and_award_achievements(user: models.User, db: Session) -> List[models.Achievement]:
    """Verify milestones and award badges if conditions are met."""
    new_achievements = []
    
    # 1. First Case Completed
    completed_sessions = db.query(models.CaseSession).filter(
        models.CaseSession.user_id == user.id,
        models.CaseSession.status == "completed"
    ).all()
    
    existing_titles = [a.title for a in user.achievements]
    
    if len(completed_sessions) >= 1 and "First Case Completed" not in existing_titles:
        ach = models.Achievement(
            user_id=user.id,
            title="First Case Completed",
            description="Diagnosed your very first simulated patient successfully.",
            badge_icon="award"
        )
        db.add(ach)
        new_achievements.append(ach)
        user.points += 100
        
    # 2. Perfect Score / Top Diagnostician (score >= 90)
    high_scores = [s.score for s in completed_sessions if s.score and s.score >= 90]
    if high_scores and "Top Diagnostician" not in existing_titles:
        ach = models.Achievement(
            user_id=user.id,
            title="Top Diagnostician",
            description="Achieved a clinical reasoning score of 90% or higher.",
            badge_icon="shield"
        )
        db.add(ach)
        new_achievements.append(ach)
        user.points += 200
        
    # 3. Learning Streak Master
    if user.streak >= 3 and "Streak Master" not in existing_titles:
        ach = models.Achievement(
            user_id=user.id,
            title="Streak Master",
            description="Maintained a 3-day active clinical learning streak.",
            badge_icon="zap"
        )
        db.add(ach)
        new_achievements.append(ach)
        user.points += 150
        
    # 4. Polymath (diagnosed 3 different medical specialties)
    specialties = set()
    for s in completed_sessions:
        if s.case:
            specialties.add(s.case.specialty)
            
    if len(specialties) >= 3 and "Clinical Polymath" not in existing_titles:
        ach = models.Achievement(
            user_id=user.id,
            title="Clinical Polymath",
            description="Completed clinical simulations across 3 different specialties.",
            badge_icon="book-open"
        )
        db.add(ach)
        new_achievements.append(ach)
        user.points += 250
        
    if new_achievements:
        db.commit()
        for a in new_achievements:
            db.refresh(a)
            
    return new_achievements

def serialize_session(session: models.CaseSession) -> schemas.CaseSessionDetail:
    """Format SQLAlchemy Session instance into Pydantic schema detail."""
    history_list = []
    if session.history:
        try:
            history_list = json.loads(session.history)
        except Exception:
            history_list = []
            
    case_data = None
    if session.generated_case_data:
        try:
            case_data = json.loads(session.generated_case_data)
        except Exception:
            case_data = None
            
    biases_list = []
    if session.cognitive_biases:
        try:
            biases_list = json.loads(session.cognitive_biases)
        except Exception:
            biases_list = []

    # Map investigations
    investigations_out = []
    for inv in session.investigations:
        investigations_out.append(schemas.InvestigationOut(
            id=inv.id,
            session_id=inv.session_id,
            test_type=inv.test_type,
            request_reason=inv.request_reason,
            result_content=inv.result_content,
            created_at=inv.created_at
        ))

    return schemas.CaseSessionDetail(
        id=session.id,
        case_id=session.case_id,
        case_title=session.case.title,
        case_specialty=session.case.specialty,
        case_difficulty=session.case.difficulty,
        status=session.status,
        current_stage=session.current_stage,
        generated_case_data=case_data,
        history=history_list,
        user_diagnosis=session.user_diagnosis,
        user_reasoning=session.user_reasoning,
        score=session.score,
        feedback_text=session.feedback_text,
        cognitive_biases=biases_list,
        investigations=investigations_out,
        created_at=session.created_at
    )


# --- API Routes ---

@router.get("/templates", response_model=List[schemas.ClinicalCaseOut])
def list_case_templates(db: Session = Depends(get_db)):
    """List clinical case templates."""
    return db.query(models.ClinicalCase).all()

@router.get("/sessions", response_model=List[schemas.CaseSessionOut])
def list_completed_sessions(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List completed case sessions for the student."""
    return db.query(models.CaseSession).filter(
        models.CaseSession.user_id == current_user.id,
        models.CaseSession.status == "completed"
    ).order_by(models.CaseSession.updated_at.desc()).all()

@router.get("/active-sessions", response_model=List[schemas.CaseSessionOut])
def list_active_sessions(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List ongoing case sessions."""
    return db.query(models.CaseSession).filter(
        models.CaseSession.user_id == current_user.id,
        models.CaseSession.status != "completed"
    ).all()

@router.post("/start", response_model=schemas.CaseSessionDetail)
def start_case(session_in: schemas.CaseSessionCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Initialize a new case session, querying ChromaDB/VectorStore and prompting the Generator Agent."""
    try:
        case = db.query(models.ClinicalCase).filter(models.ClinicalCase.id == session_in.case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case template not found")
            
        # Get student custom key if set
        user_settings = db.query(models.UserSetting).filter(models.UserSetting.user_id == current_user.id).first()
        custom_key = user_settings.groq_api_key if user_settings else None
        
        # Run Case Generator Agent
        case_details = AgentService.generate_case(case.specialty, custom_key=custom_key)
        
        # Save the session
        new_session = models.CaseSession(
            user_id=current_user.id,
            case_id=case.id,
            status="active",
            current_stage="investigation",
            generated_case_data=json.dumps(case_details),
            history=json.dumps([])
        )
        db.add(new_session)
        
        # Increment user streak if last active was yesterday (simple calculation)
        today = datetime.datetime.utcnow().date()
        yesterday = today - datetime.timedelta(days=1)
        if current_user.last_active and current_user.last_active.date() == yesterday:
            current_user.streak += 1
        elif current_user.last_active and current_user.last_active.date() != today:
            current_user.streak = 1
            
        current_user.last_active = datetime.datetime.utcnow()
        db.commit()
        db.refresh(new_session)
        
        return serialize_session(new_session)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error starting case: {str(e)}")

@router.get("/session/{session_id}", response_model=schemas.CaseSessionDetail)
def get_session_detail(session_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get detailed state of a case session."""
    session = db.query(models.CaseSession).filter(
        models.CaseSession.id == session_id,
        models.CaseSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return serialize_session(session)

@router.post("/session/{session_id}/investigate", response_model=schemas.InvestigationOut)
def request_investigation(
    session_id: int, 
    request: schemas.InvestigationRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve test report from the generated case pool."""
    session = db.query(models.CaseSession).filter(
        models.CaseSession.id == session_id,
        models.CaseSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.current_stage != "investigation":
        raise HTTPException(status_code=400, detail="Cannot request investigations outside of the investigation stage")
        
    case_data = json.loads(session.generated_case_data)
    investigations_pool = case_data.get("investigations_pool", {})
    
    # Try to match the test type closely
    result_content = "Test not available or standard normal. No significant pathological finding."
    matched_key = None
    for key in investigations_pool.keys():
        if key.lower() in request.test_type.lower() or request.test_type.lower() in key.lower():
            matched_key = key
            break
            
    if matched_key:
        result_content = investigations_pool[matched_key]
    else:
        # Fallback response generator if they request something not predefined
        result_content = f"The requested {request.test_type} is within normal reference limits. No acute abnormalities observed."
        
    investigation = models.Investigation(
        session_id=session.id,
        test_type=matched_key or request.test_type,
        request_reason=request.request_reason,
        result_content=result_content
    )
    db.add(investigation)
    
    # Save the request action into session history log
    history = json.loads(session.history)
    history.append({
        "role": "system_action",
        "action": "investigation",
        "test": matched_key or request.test_type,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    session.history = json.dumps(history)
    
    db.commit()
    db.refresh(investigation)
    return investigation

@router.post("/session/{session_id}/diagnose", response_model=schemas.CaseSessionDetail)
def submit_diagnosis(
    session_id: int,
    submission: schemas.DiagnosisSubmit,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit clinical diagnosis and initiate Devil's Advocate debate round."""
    session = db.query(models.CaseSession).filter(
        models.CaseSession.id == session_id,
        models.CaseSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.current_stage != "investigation":
        raise HTTPException(status_code=400, detail="Diagnosis already submitted")
        
    session.user_diagnosis = submission.user_diagnosis
    session.user_reasoning = submission.user_reasoning
    session.current_stage = "debate"
    session.status = "debate"
    
    # Load API keys if any
    user_settings = db.query(models.UserSetting).filter(models.UserSetting.user_id == current_user.id).first()
    custom_key = user_settings.groq_api_key if user_settings else None
    case_data = json.loads(session.generated_case_data)
    
    # Generate first challenge from Devil's Advocate Agent
    history = json.loads(session.history)
    challenge = AgentService.devils_advocate_turn(
        history=history,
        user_diagnosis=submission.user_diagnosis,
        user_reasoning=submission.user_reasoning,
        case_data=case_data,
        custom_key=custom_key
    )
    
    # Append the initial user submission and the AI challenge to history
    history.append({
        "role": "student_diagnosis",
        "diagnosis": submission.user_diagnosis,
        "reasoning": submission.user_reasoning,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    history.append({
        "role": "assistant_devil",
        "content": challenge,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    
    session.history = json.dumps(history)
    db.commit()
    db.refresh(session)
    
    return serialize_session(session)

@router.post("/session/{session_id}/debate", response_model=schemas.CaseSessionDetail)
def debate_message(
    session_id: int,
    message_in: schemas.DebateMessageSubmit,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Progress the debate with the student. Transition to feedback once finished."""
    session = db.query(models.CaseSession).filter(
        models.CaseSession.id == session_id,
        models.CaseSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.current_stage != "debate":
        raise HTTPException(status_code=400, detail="Session is not in the debate stage")
        
    history = json.loads(session.history)
    
    # Append user response
    history.append({
        "role": "user_devil",
        "content": message_in.message,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    
    # Count debate turns
    user_turns = [h for h in history if h.get("role") == "user_devil"]
    
    user_settings = db.query(models.UserSetting).filter(models.UserSetting.user_id == current_user.id).first()
    custom_key = user_settings.groq_api_key if user_settings else None
    case_data = json.loads(session.generated_case_data)
    
    if len(user_turns) < 2:
        # Generate another question/challenge
        challenge = AgentService.devils_advocate_turn(
            history=history,
            user_diagnosis=session.user_diagnosis,
            user_reasoning=session.user_reasoning,
            case_data=case_data,
            custom_key=custom_key
        )
        history.append({
            "role": "assistant_devil",
            "content": challenge,
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
        session.history = json.dumps(history)
    else:
        # Debate is complete! Trigger the Feedback Agent
        session.current_stage = "feedback"
        session.status = "feedback_ready"
        
        # Load investigations
        investigations_list = [
            {"test_type": i.test_type, "request_reason": i.request_reason, "result_content": i.result_content}
            for i in session.investigations
        ]
        
        feedback_result = AgentService.generate_feedback(
            history=history,
            investigations=investigations_list,
            user_diagnosis=session.user_diagnosis,
            user_reasoning=session.user_reasoning,
            case_data=case_data,
            custom_key=custom_key
        )
        
        session.score = feedback_result["score"]
        session.feedback_text = feedback_result["feedback_text"]
        session.cognitive_biases = json.dumps(feedback_result["cognitive_biases"])
        session.status = "completed"
        
        # Award points based on performance
        current_user.points += int(feedback_result["score"] * 1.5)
        
        # Award achievements if eligible
        check_and_award_achievements(current_user, db)
        session.history = json.dumps(history)
        
    db.commit()
    db.refresh(session)
    return serialize_session(session)


# --- RAG Knowledge Base ---

@router.get("/knowledge-base/guidelines")
def list_all_guidelines(current_user: models.User = Depends(get_current_user)):
    """Retrieve all seeded guidelines."""
    return VectorStore.get_all()

@router.get("/knowledge-base/search")
def search_knowledge_base(query: str, current_user: models.User = Depends(get_current_user)):
    """Search for relevant medical guidelines using VectorStore semantic matching."""
    return VectorStore.search(query, limit=3)
