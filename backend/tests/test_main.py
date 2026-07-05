import pytest
from backend.core.security import get_password_hash, verify_password
from backend.services.vector_store import VectorStore
from backend.services.agents import AgentService

def test_password_security():
    """Verify correct password hashing and extraction."""
    pwd = "secretpassword123"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_semantic_retriever():
    """Verify guideline vector lookup and content matchers."""
    # Search for chest pain guidelines
    acs_results = VectorStore.search("chest pain", limit=1)
    assert len(acs_results) > 0
    assert "ACS" in acs_results[0]["title"] or "Coronary" in acs_results[0]["content"]

    # Search for insulin metabolic guidelines
    dka_results = VectorStore.search("metabolic ketoacidosis ketones", limit=1)
    assert len(dka_results) > 0
    assert "DKA" in dka_results[0]["title"] or "Diabetic" in dka_results[0]["content"]

def test_case_generator_fallback():
    """Verify the case generator offline/mock engine."""
    case = AgentService.generate_case("Cardiology", custom_key=None)
    assert "title" in case
    assert "underlying_diagnosis" in case
    assert "demographics" in case
    assert "vital_signs" in case
    assert "investigations_pool" in case
    assert "ECG" in case["investigations_pool"]

def test_feedback_agent_biases():
    """Verify logic for highlighting anchoring and confirmation cognitive biases."""
    case_data = {
        "underlying_diagnosis": "Acute Coronary Syndrome",
        "critical_tests": ["ECG", "Troponin I"],
        "devil_challenges": ["Q1", "Q2"]
    }
    
    # 1. Simulate poor performance (no investigations ordered)
    feedback = AgentService.generate_feedback(
        history=[],
        investigations=[],
        user_diagnosis="GERD",
        user_reasoning="I did not request any labs since I thought it was simple heartburn.",
        case_data=case_data,
        custom_key=None
    )
    
    assert feedback["score"] < 60
    assert any("Premature" in b for b in feedback["cognitive_biases"])
