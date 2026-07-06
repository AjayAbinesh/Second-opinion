import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.core.database import engine, Base, SessionLocal
from backend.models import models
from backend.api import auth, cases, analytics
from backend.services.vector_store import CLINICAL_GUIDELINES


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables and seed data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.ClinicalCase).count() == 0:
            for g in CLINICAL_GUIDELINES:
                presentation = {
                    "specialty": g["specialty"],
                    "guideline_title": g["title"]
                }
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
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Educational Clinical Reasoning & Cognitive Bias Training Platform for Healthcare Students",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Policy configuration
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "https://second-opinion-frontend.onrender.com",
    os.getenv("FRONTEND_URL", ""),
]
ALLOWED_ORIGINS = [origin for origin in ALLOWED_ORIGINS if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(analytics.router)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
