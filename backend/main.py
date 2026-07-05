import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.core.database import engine, Base, SessionLocal
from backend.models import models
from backend.api import auth, cases, analytics
from backend.services.vector_store import CLINICAL_GUIDELINES

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Educational Clinical Reasoning & Cognitive Bias Training Platform for Healthcare Students",
    version="1.0.0"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local testing, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(analytics.router)

@app.on_event("startup")
def seed_database():
    """Seed default clinical cases if empty."""
    db = SessionLocal()
    try:
        if db.query(models.ClinicalCase).count() == 0:
            for g in CLINICAL_GUIDELINES:
                # Map guidelines to base templates
                presentation = {
                    "specialty": g["specialty"],
                    "guideline_title": g["title"]
                }
                
                # Deduce correct diagnosis from content
                diag = ""
                if "ACS" in g["title"]:
                    diag = "Acute Coronary Syndrome"
                elif "DKA" in g["title"]:
                    diag = "Diabetic Ketoacidosis"
                elif "Stroke" in g["title"]:
                    diag = "Acute Ischemic Stroke"
                elif "PE" in g["title"]:
                    diag = "Acute Pulmonary Embolism"
                elif "Appendicitis" in g["title"]:
                    diag = "Acute Appendicitis"
                    
                new_case = models.ClinicalCase(
                    title=f"Standard Clinical Simulation: {g['title']}",
                    specialty=g["specialty"],
                    difficulty="Medium",
                    guideline_summary=g["content"],
                    initial_presentation=str(presentation),
                    underlying_diagnosis=diag,
                    diagnostic_criteria=f"Guideline markers: {g['content'][:150]}..."
                )
                db.add(new_case)
            db.commit()
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
