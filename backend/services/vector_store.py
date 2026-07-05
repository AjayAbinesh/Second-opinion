import re
import math
from typing import List, Dict, Any

# Predefined educational clinical guidelines used for RAG
CLINICAL_GUIDELINES = [
    {
        "id": 1,
        "title": "Acute Coronary Syndrome (ACS) Guideline",
        "specialty": "Cardiology",
        "content": (
            "Clinical presentation of Acute Coronary Syndrome (ACS) includes substernal chest pain or pressure "
            "radiating to the left arm or jaw, dyspnea, diaphoresis, and nausea. Diagnosis is established by "
            "12-lead ECG showing ST-elevation (STEMI) or ST-depression/T-wave inversion (NSTEMI) and positive "
            "cardiac biomarkers (Troponin I or T). Initial management: Oxygen if hypoxic, Aspirin 324mg chewing, "
            "Nitroglycerin sublingual for pain (avoid if right ventricular infarct or sildenafil use), and "
            "anticoagulation (Heparin). Alternate differential diagnoses include Gastroesophageal Reflux Disease (GERD), "
            "Panic Attack, Pericarditis, and Aortic Dissection. Aortic Dissection is distinguished by ripping/tearing pain "
            "radiating to the back and asymmetric blood pressures between arms."
        )
    },
    {
        "id": 2,
        "title": "Diabetic Ketoacidosis (DKA) Guideline",
        "specialty": "Endocrinology",
        "content": (
            "Diabetic Ketoacidosis (DKA) is a life-threatening complication of diabetes mellitus. Key diagnostic criteria "
            "include blood glucose > 250 mg/dL, arterial pH < 7.30, serum bicarbonate < 18 mEq/L, and moderate to large "
            "ketonuria or ketonemia. Presentation includes polyuria, polydipsia, abdominal pain, nausea/vomiting, Kussmaul "
            "respirations (deep, rapid breathing), and a fruity breath odor. Treatment protocol: 1. Fluid resuscitation with "
            "Normal Saline. 2. Insulin infusion (0.1 units/kg/h) once potassium is verified > 3.3 mEq/L. 3. Potassium repletion "
            "as potassium will shift intracellularly with insulin. Alternate diagnoses include Hyperosmolar Hyperglycemic State "
            "(HHS) which has higher glucose (>600) and no acidosis, Gastroenteritis, and Sepsis."
        )
    },
    {
        "id": 3,
        "title": "Acute Ischemic Stroke Guideline",
        "specialty": "Neurology",
        "content": (
            "Acute Ischemic Stroke presents with sudden focal neurological deficits: unilateral face drooping, arm weakness, "
            "and speech slurring (aphasia/dysarthria). Wells or NIHSS scales are used for severity. The critical step is "
            "obtaining an immediate non-contrast head CT scan to rule out intracranial hemorrhage. If ischemic and "
            "onset of symptoms is < 4.5 hours (and no contraindications like active bleeding, recent surgery, or high blood "
            "pressure > 185/110), IV thrombolysis (Alteplase or Tenecteplase) is indicated. Mechanical thrombectomy can be performed "
            "up to 24 hours for large vessel occlusions. Alternate differential diagnoses: Hypoglycemia (must check fingerstick glucose "
            "immediately), Todd's Paralysis post-seizure, and Hemiplegic Migraine."
        )
    },
    {
        "id": 4,
        "title": "Acute Pulmonary Embolism (PE) Guideline",
        "specialty": "Respirology",
        "content": (
            "Acute Pulmonary Embolism (PE) presents with sudden onset dyspnea, pleuritic chest pain, cough, tachycardia, "
            "and occasionally hemoptysis. Risk factors include recent surgery, immobilization, malignancy, or hypercoagulability. "
            "The Wells Criteria determine pre-test probability. If low probability, a D-Dimer test can rule out PE (if < 500 ng/mL). "
            "If high probability or positive D-Dimer, a Computed Tomography Pulmonary Angiography (CTPA) is the gold standard diagnostic "
            "imaging. Ventilation-Perfusion (V/Q) scan is an alternative for renal failure or contrast allergy. Treatment "
            "consists of immediate anticoagulation (LMWH, Fondaparinux, or DOACs like Apixaban). Alternate diagnoses: Pneumonia "
            "(associated with fever and productive cough), Pneumothorax (sudden pleuritic pain with absent breath sounds), and Anxiety."
        )
    },
    {
        "id": 5,
        "title": "Acute Appendicitis Guideline",
        "specialty": "Gastroenterology",
        "content": (
            "Acute Appendicitis is characterized by abdominal pain starting periumbilically and migrating to the Right Lower Quadrant "
            "(RLQ) at McBurney's point. Associated findings: anorexia, nausea, low-grade fever, and rebound tenderness. "
            "Diagnosis is supported by leukocytosis (high WBC count) and confirmed via ultrasound (especially in children/pregnant women) "
            "or abdominal CT scan showing an enlarged appendix (>6mm) with wall thickening. Initial management: Nil Per Os (NPO), IV fluids, "
            "broad-spectrum IV antibiotics, and surgical consultation for appendectomy. Alternate diagnoses: Mesenteric Adenitis (common after "
            "viral URI in kids), Ectopic Pregnancy (always check Beta-hCG in females of childbearing age), Ovarian Torsion, and Nephrolithiasis."
        )
    }
]

def tokenize(text: str) -> List[str]:
    """Tokenize and normalize text."""
    return re.findall(r'\w+', text.lower())

def calculate_cosine_similarity(query_tokens: List[str], doc_tokens: List[str]) -> float:
    """Calculate basic cosine similarity based on term frequencies."""
    if not query_tokens or not doc_tokens:
        return 0.0
        
    query_freq = {}
    for token in query_tokens:
        query_freq[token] = query_freq.get(token, 0) + 1
        
    doc_freq = {}
    for token in doc_tokens:
        doc_freq[token] = doc_freq.get(token, 0) + 1
        
    # Dot product
    dot_product = 0.0
    for token, val in query_freq.items():
        if token in doc_freq:
            dot_product += val * doc_freq[token]
            
    # Magnitudes
    query_mag = math.sqrt(sum(val ** 2 for val in query_freq.values()))
    doc_mag = math.sqrt(sum(val ** 2 for val in doc_freq.values()))
    
    if not query_mag or not doc_mag:
        return 0.0
        
    return dot_product / (query_mag * doc_mag)

class VectorStore:
    """A lightweight RAG semantic lookup system."""
    
    @staticmethod
    def search(query: str, limit: int = 2) -> List[Dict[str, Any]]:
        """Return the most relevant clinical guidelines matching the search term."""
        query_tokens = tokenize(query)
        scored_docs = []
        
        for doc in CLINICAL_GUIDELINES:
            # We match against title, specialty and content
            searchable_text = f"{doc['title']} {doc['specialty']} {doc['content']}"
            doc_tokens = tokenize(searchable_text)
            similarity = calculate_cosine_similarity(query_tokens, doc_tokens)
            scored_docs.append((similarity, doc))
            
        # Sort by similarity score descending
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        
        # Return top N documents
        return [doc for score, doc in scored_docs[:limit] if score > 0.05] or [CLINICAL_GUIDELINES[0]]

    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        """Return all available guidelines."""
        return CLINICAL_GUIDELINES
