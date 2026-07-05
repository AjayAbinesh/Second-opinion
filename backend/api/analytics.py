import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.core.database import get_db
from backend.core.security import get_current_user, get_current_admin
from backend.models import models
from backend.schemas import schemas

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Reporting"])

@router.get("/dashboard", response_model=schemas.DashboardStatsOut)
def get_dashboard_summary(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch personal learner dashboard summary statistics."""
    completed = db.query(models.CaseSession).filter(
        models.CaseSession.user_id == current_user.id,
        models.CaseSession.status == "completed"
    ).all()
    
    completed_count = len(completed)
    avg_score = sum(s.score for s in completed if s.score) / completed_count if completed_count > 0 else 0.0
    
    # Recent activity log
    recent_activities = []
    for s in completed[:5]:
        recent_activities.append({
            "id": s.id,
            "title": f"Completed Case: {s.case.title}",
            "specialty": s.case.specialty,
            "score": s.score,
            "date": s.updated_at.strftime("%Y-%m-%d %H:%M")
        })
        
    # Find active sessions
    active_sessions = db.query(models.CaseSession).filter(
        models.CaseSession.user_id == current_user.id,
        models.CaseSession.status != "completed"
    ).all()
    
    for s in active_sessions:
        recent_activities.append({
            "id": s.id,
            "title": f"Ongoing Case: {s.case.title}",
            "specialty": s.case.specialty,
            "score": None,
            "date": s.updated_at.strftime("%Y-%m-%d %H:%M")
        })

    # Recommended specialties to practice
    # List of all available specialties
    all_specialties = ["Cardiology", "Endocrinology", "Neurology", "Respirology", "Gastroenterology"]
    attempted_specialties = set(s.case.specialty for s in completed if s.case)
    
    # Recommend specialties not yet attempted, or those with low average score
    recommended = [spec for spec in all_specialties if spec not in attempted_specialties]
    
    if not recommended:
        # If all attempted, check for those with average score below 80
        for spec in all_specialties:
            spec_scores = [s.score for s in completed if s.case.specialty == spec and s.score]
            if spec_scores and (sum(spec_scores) / len(spec_scores)) < 80:
                recommended.append(spec)
                
    if not recommended:
        recommended = [all_specialties[0]]  # default to Cardiology if user is a master of all

    # Map achievements
    achievements_out = [
        schemas.AchievementOut(
            id=a.id,
            title=a.title,
            description=a.description,
            badge_icon=a.badge_icon,
            unlocked_at=a.unlocked_at
        ) for a in current_user.achievements
    ]

    return schemas.DashboardStatsOut(
        completed_cases_count=completed_count,
        average_score=avg_score,
        streak=current_user.streak,
        points=current_user.points,
        recent_activities=recent_activities,
        recommended_specialties=recommended[:3],
        achievements=achievements_out
    )

@router.get("/metrics", response_model=schemas.AnalyticsOut)
def get_detailed_analytics(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Assemble detailed diagnostic scores, biases, and specialty metrics."""
    completed = db.query(models.CaseSession).filter(
        models.CaseSession.user_id == current_user.id,
        models.CaseSession.status == "completed"
    ).order_by(models.CaseSession.updated_at.asc()).all()
    
    # 1. Scores over time
    scores_over_time = []
    for index, s in enumerate(completed):
        scores_over_time.append({
            "session_number": index + 1,
            "case_title": s.case.title,
            "specialty": s.case.specialty,
            "score": s.score,
            "date": s.updated_at.strftime("%b %d")
        })
        
    # 2. Biases count
    biases_frequency = {}
    for s in completed:
        if s.cognitive_biases:
            try:
                biases = json.loads(s.cognitive_biases)
                for b in biases:
                    if b == "None Detected" or b == "None":
                        continue
                    # Strip any parenthetical info for clean charts
                    clean_b = b.split("(")[0].strip()
                    biases_frequency[clean_b] = biases_frequency.get(clean_b, 0) + 1
            except Exception:
                pass
                
    # 3. Specialty competency and counts
    specialty_totals = {}
    specialty_counts = {}
    for s in completed:
        spec = s.case.specialty
        specialty_counts[spec] = specialty_counts.get(spec, 0) + 1
        if s.score:
            specialty_totals[spec] = specialty_totals.get(spec, 0) + s.score
            
    specialty_competency = {}
    for spec in specialty_counts:
        specialty_competency[spec] = round(specialty_totals[spec] / specialty_counts[spec], 1)

    # 4. Actionable recommendations
    recommendations = []
    if biases_frequency:
        most_common_bias = max(biases_frequency, key=biases_frequency.get)
        recommendations.append(
            f"You frequently manifest **{most_common_bias}**. Consider taking a step back and listing differential options before committing."
        )
    else:
        recommendations.append("No significant cognitive biases detected! Keep using structured analysis.")
        
    for spec, score in specialty_competency.items():
        if score < 75:
            recommendations.append(
                f"Your average score in **{spec}** is {score}%. Read the corresponding medical guidelines in the Knowledge Base."
            )
            
    if not recommendations or len(recommendations) < 2:
        recommendations.append("Continue to maintain your daily streak to build long-term retention.")
        
    return schemas.AnalyticsOut(
        scores_over_time=scores_over_time,
        biases_frequency=biases_frequency,
        specialty_competency=specialty_competency,
        completed_cases_by_specialty=specialty_counts,
        learning_streak=current_user.streak,
        recommendations=recommendations
    )

@router.get("/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch global gamified student ranking board based on points."""
    top_users = db.query(models.User).order_by(models.User.points.desc()).limit(10).all()
    return [
        schemas.LeaderboardEntry(
            username=u.username,
            points=u.points,
            streak=u.streak
        ) for u in top_users
    ]


# --- Admin Endpoints ---

@router.get("/admin/dashboard", response_model=schemas.AdminStatsOut)
def get_admin_dashboard(current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Fetch global platform usage indicators (Admin only)."""
    total_users = db.query(models.User).count()
    completed_sessions = db.query(models.CaseSession).filter(models.CaseSession.status == "completed").all()
    
    total_completed = len(completed_sessions)
    avg_score = sum(s.score for s in completed_sessions if s.score) / total_completed if total_completed > 0 else 0.0
    
    # Global bias distribution
    global_biases = {}
    for s in completed_sessions:
        if s.cognitive_biases:
            try:
                biases = json.loads(s.cognitive_biases)
                for b in biases:
                    if b == "None" or b == "None Detected":
                        continue
                    clean_b = b.split("(")[0].strip()
                    global_biases[clean_b] = global_biases.get(clean_b, 0) + 1
            except Exception:
                pass
                
    # Global recent activities
    all_sessions = db.query(models.CaseSession).order_by(models.CaseSession.updated_at.desc()).limit(10).all()
    system_activities = []
    for s in all_sessions:
        system_activities.append({
            "username": s.user.username,
            "case_title": s.case.title,
            "specialty": s.case.specialty,
            "status": s.status,
            "score": s.score,
            "date": s.updated_at.strftime("%Y-%m-%d %H:%M")
        })
        
    return schemas.AdminStatsOut(
        total_users=total_users,
        total_completed_cases=total_completed,
        average_score=avg_score,
        global_biases_frequency=global_biases,
        system_activities=system_activities
    )
