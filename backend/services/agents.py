import json
import os
import random
from typing import List, Dict, Any, Optional
from openai import OpenAI
from backend.services.vector_store import VectorStore

# Mock medical scenarios for zero-dependency high-fidelity simulations
MOCK_SCENARIOS = {
    "Cardiology": {
        "title": "A 58-year-old male with sudden substernal chest pressure",
        "underlying_diagnosis": "Acute Coronary Syndrome (NSTEMI)",
        "demographics": {"age": 58, "gender": "Male", "occupation": "Software Engineer"},
        "vital_signs": {
            "blood_pressure": "148/92 mmHg",
            "heart_rate": "96 bpm",
            "respiratory_rate": "19 /min",
            "temperature": "36.9 °C",
            "oxygen_saturation": "93% on room air"
        },
        "presenting_complaint": "Crushing retrosternal chest pain radiating to the left jaw and shoulder, accompanied by mild shortness of breath and cold sweats. The pain began 3 hours ago while climbing stairs.",
        "medical_history": "Hypertension, Hypercholesterolemia, Type 2 Diabetes.",
        "family_history": "Father died of myocardial infarction at age 55.",
        "medications": "Lisinopril 10mg daily, Metformin 500mg BID, Atorvastatin 20mg daily.",
        "allergies": "Penicillin (hives).",
        "lifestyle": "Sedentary work, drinks 2-3 beers on weekends, former smoker (15 pack-years, quit 2 years ago).",
        "investigations_pool": {
            "ECG": "Show 1.5mm ST-segment depression in leads V4-V6 with T-wave inversion in II, III, and aVF. No ST elevations.",
            "Troponin I": "Elevated at 2.80 ng/mL (Normal Reference: < 0.04 ng/mL).",
            "Chest X-Ray": "Normal heart size, clear lung fields, no signs of pulmonary congestion or widened mediastinum.",
            "CBC": "WBC 8.4 x10^9/L, Hb 14.1 g/dL, Platelets 198 x10^9/L.",
            "Basic Metabolic Panel": "Sodium 138 mEq/L, Potassium 4.1 mEq/L, Creatinine 0.95 mg/dL, Glucose 142 mg/dL.",
            "CT Aortic Angiogram": "No evidence of aortic dissection, aneurysm, or pulmonary embolism."
        },
        "critical_tests": ["ECG", "Troponin I"],
        "devil_challenges": [
            "You have proposed Acute Coronary Syndrome. However, the patient has a history of acid reflux. How can we confidently distinguish this from severe Gastroesophageal Reflux Disease (GERD) or esophageal spasm, which can present identically?",
            "If this pain was actually an Aortic Dissection, starting Heparin and Aspirin could be fatal. What clinical findings or test results allowed you to rule out Aortic Dissection before initiating ACS therapy?"
        ],
        "bias_hints": {
            "confirmation": "Did the user rule out Aortic Dissection or focus exclusively on cardiac enzymes?",
            "premature": "Did they submit their diagnosis before ordering a Troponin and ECG?"
        }
    },
    "Endocrinology": {
        "title": "A 22-year-old female with abdominal pain and deep rapid breathing",
        "underlying_diagnosis": "Diabetic Ketoacidosis (DKA)",
        "demographics": {"age": 22, "gender": "Female", "occupation": "College Student"},
        "vital_signs": {
            "blood_pressure": "102/64 mmHg",
            "heart_rate": "118 bpm",
            "respiratory_rate": "28 /min",
            "temperature": "37.2 °C",
            "oxygen_saturation": "97% on room air"
        },
        "presenting_complaint": "Severe diffuse abdominal pain, persistent nausea, and vomiting for 18 hours. She feels extremely thirsty and has been urinating frequently. Her classmates noticed she was breathing deeply and rapidly.",
        "medical_history": "Type 1 Diabetes Mellitus (diagnosed at age 14).",
        "family_history": "Maternal aunt has Hashimoto's thyroiditis.",
        "medications": "Insulin Glargine 20 units nightly, Insulin Aspart sliding scale with meals (she admits she missed several doses over the last 2 days due to stomach upset).",
        "allergies": "No known drug allergies.",
        "lifestyle": "Non-smoker, occasional alcohol, stress related to upcoming exams.",
        "investigations_pool": {
            "ECG": "Sinus tachycardia at 118 bpm. Peaked T waves noted in precordial leads.",
            "Troponin I": "0.01 ng/mL (Normal).",
            "Chest X-Ray": "Clear lung fields, no infiltrates or consolidations.",
            "CBC": "WBC 14.5 x10^9/L (Leukocytosis), Hb 15.2 g/dL (mild hemoconcentration), Platelets 280 x10^9/L.",
            "Basic Metabolic Panel": "Sodium 131 mEq/L (hyponatremia), Potassium 5.2 mEq/L, Bicarbonate 10 mEq/L (severely decreased), Creatinine 1.2 mg/dL, Glucose 380 mg/dL.",
            "Arterial Blood Gas (ABG)": "pH 7.18, pCO2 24 mmHg, pO2 95 mmHg, HCO3 9 mEq/L. High anion gap metabolic acidosis.",
            "Urinalysis": "Glucose >1000 mg/dL, Ketones 4+ (large)."
        },
        "critical_tests": ["Basic Metabolic Panel", "Arterial Blood Gas (ABG)", "Urinalysis"],
        "devil_challenges": [
            "The patient has marked abdominal pain and leukocytosis (WBC 14.5). Why are we treating this as a metabolic issue rather than Acute Gastroenteritis or Appendicitis requiring immediate surgical review?",
            "You want to start an insulin drip immediately. However, the potassium is 5.2 mEq/L, and we know insulin shifts potassium into cells. Under what potassium threshold is insulin contraindicated, and why is fluid resuscitation started first?"
        ],
        "bias_hints": {
            "anchoring": "Focusing purely on the abdominal pain and leukocytosis (suggesting appendicitis) while ignoring the rapid breathing (Kussmaul) and acidosis.",
            "premature": "Initiating insulin without verifying potassium levels first."
        }
    },
    "Neurology": {
        "title": "A 67-year-old female with sudden right-sided weakness and aphasia",
        "underlying_diagnosis": "Acute Ischemic Stroke",
        "demographics": {"age": 67, "gender": "Female", "occupation": "Retired Teacher"},
        "vital_signs": {
            "blood_pressure": "178/104 mmHg",
            "heart_rate": "88 bpm (irregularly irregular)",
            "respiratory_rate": "16 /min",
            "temperature": "36.6 °C",
            "oxygen_saturation": "96% on room air"
        },
        "presenting_complaint": "Sudden onset of weakness in the right arm and leg, and difficulty speaking. She was eating breakfast 2 hours ago when she suddenly dropped her fork, and her husband noticed her face drooping on the right side.",
        "medical_history": "Atrial Fibrillation (non-compliant with Apixaban), Hypertension, Osteoarthritis.",
        "family_history": "Mother had a stroke at age 70.",
        "medications": "Lisinopril 20mg daily, Apixaban 5mg BID (has not taken it for 4 days), Acetaminophen as needed.",
        "allergies": "Sulfa drugs (rash).",
        "lifestyle": "Sedentary, former smoker (10 pack-years, quit 20 years ago).",
        "investigations_pool": {
            "Fingerstick Glucose": "112 mg/dL (Normal).",
            "Non-Contrast Head CT": "No acute intracranial hemorrhage. Early ischemic changes in left middle cerebral artery (MCA) territory (loss of insular ribbon).",
            "ECG": "Atrial fibrillation with ventricular rate of 88 bpm. No acute ST changes.",
            "CBC": "WBC 6.2 x10^9/L, Hb 13.5 g/dL, Platelets 165 x10^9/L.",
            "Coagulation Panel": "PT 12.1 sec, INR 1.1 (sub-therapeutic due to missing medication).",
            "Basic Metabolic Panel": "Sodium 139 mEq/L, Potassium 3.9 mEq/L, Creatinine 0.88 mg/dL, Glucose 118 mg/dL."
        },
        "critical_tests": ["Fingerstick Glucose", "Non-Contrast Head CT"],
        "devil_challenges": [
            "Before we proceed with administering thrombolytics (tPA/Alteplase), what simple bedside test MUST be performed to rule out a metabolic mimic that presents with identical unilateral neurological deficits?",
            "Given her history of atrial fibrillation, we suspect an embolic stroke. However, if she did take her Apixaban this morning, why would that make tPA administration dangerous, and how do we check her coagulation state?"
        ],
        "bias_hints": {
            "anchoring": "Assuming it is a stroke without checking fingerstick glucose (hypoglycemia can mimic stroke).",
            "premature": "Recommending thrombolysis before obtaining the Head CT to rule out hemorrhage."
        }
    },
    "Respirology": {
        "title": "A 45-year-old female with sudden shortness of breath and calf swelling",
        "underlying_diagnosis": "Acute Pulmonary Embolism (PE)",
        "demographics": {"age": 45, "gender": "Female", "occupation": "Office Manager"},
        "vital_signs": {
            "blood_pressure": "112/76 mmHg",
            "heart_rate": "112 bpm (tachycardia)",
            "respiratory_rate": "24 /min",
            "temperature": "37.0 °C",
            "oxygen_saturation": "90% on room air"
        },
        "presenting_complaint": "Sudden onset of shortness of breath and sharp, right-sided chest pain that worsens with deep breathing (pleuritic). Her symptoms began 4 hours ago. She also notes left calf swelling and soreness that started 3 days ago.",
        "medical_history": "Uterine fibroids, iron deficiency anemia.",
        "family_history": "No history of blood clots.",
        "medications": "Oral Contraceptive Pill (Estrogen/Progestin) for heavy periods, Ferrous Sulfate 325mg daily.",
        "allergies": "No known drug allergies.",
        "lifestyle": "Sedentary office job, recently flew home on an 11-hour flight from Europe 5 days ago.",
        "investigations_pool": {
            "ECG": "Sinus tachycardia at 112 bpm. S1Q3T3 pattern (deep S-wave in lead I, Q-wave in lead III, inverted T-wave in lead III) present.",
            "Chest X-Ray": "Clear lung fields. No pneumothorax. Hampton's hump or Westermark sign not visualized.",
            "CBC": "WBC 7.8 x10^9/L, Hb 10.5 g/dL (mild microcytic anemia), Platelets 210 x10^9/L.",
            "D-Dimer": "Elevated at 2,450 ng/mL (Normal: < 500 ng/mL).",
            "Computed Tomography Pulmonary Angiography (CTPA)": "Filing defect in the right main pulmonary artery, consistent with a large acute pulmonary embolism.",
            "Duplex Ultrasound Left Leg": "Compressible right leg vein, but non-compressible left common femoral and popliteal veins with absence of color flow, confirming Deep Vein Thrombosis (DVT)."
        },
        "critical_tests": ["D-Dimer", "Computed Tomography Pulmonary Angiography (CTPA)"],
        "devil_challenges": [
            "You've diagnosed a Pulmonary Embolism. Given the patient has hypoxia (90% SpO2), sinus tachycardia, and pleuritic pain, what clinical criteria score (such as Wells or PERC) did you calculate to justify proceeding directly to CTPA instead of ruling out with a D-dimer?",
            "What is the role of the S1Q3T3 pattern on the ECG? Is it diagnostic for PE, and what is its primary pathophysiological implication?"
        ],
        "bias_hints": {
            "confirmation": "Ignoring the leg pain and swelling and diagnosing pneumonia because of the chest pain.",
            "premature": "Treating with heparin before verifying the presence of PE with CTPA in a hemodynamically stable patient."
        }
    },
    "Gastroenterology": {
        "title": "A 28-year-old male with progressive right lower quadrant abdominal pain",
        "underlying_diagnosis": "Acute Appendicitis",
        "demographics": {"age": 28, "gender": "Male", "occupation": "Construction Worker"},
        "vital_signs": {
            "blood_pressure": "120/78 mmHg",
            "heart_rate": "88 bpm",
            "respiratory_rate": "16 /min",
            "temperature": "38.1 °C (low grade fever)",
            "oxygen_saturation": "99% on room air"
        },
        "presenting_complaint": "Right lower quadrant abdominal pain, which started 24 hours ago as a dull ache around the belly button before moving to the lower right side. The pain is severe now, worsens when he walks, and is associated with loss of appetite, nausea, and two episodes of vomiting.",
        "medical_history": "None.",
        "family_history": "Brother had an appendectomy at age 16.",
        "medications": "Ibuprofen 400mg as needed.",
        "allergies": "No known drug allergies.",
        "lifestyle": "Active, non-smoker, drinks alcohol occasionally.",
        "investigations_pool": {
            "CBC": "WBC 15.2 x10^9/L (Leukocytosis with neutrophilia), Hb 15.0 g/dL, Platelets 240 x10^9/L.",
            "Basic Metabolic Panel": "Sodium 139 mEq/L, Potassium 4.0 mEq/L, Creatinine 0.90 mg/dL, Glucose 98 mg/dL.",
            "Urinalysis": "Specific gravity 1.025, WBC 1-2/hpf (no pyuria), RBC 0-1/hpf, no nitrates or leukocyte esterase.",
            "Abdominal Ultrasound": "Non-compressible, blind-ended tubular structure in the right lower quadrant measuring 8.5 mm in diameter, surrounded by echogenic fat stranding. Consistent with acute appendicitis.",
            "Abdominal CT Scan": "Appendix is dilated to 9mm with wall thickening, mural enhancement, and surrounding fat stranding. Small appendicolith seen at the base. No free air or abscess."
        },
        "critical_tests": ["CBC", "Abdominal Ultrasound", "Abdominal CT Scan"],
        "devil_challenges": [
            "We have localized RLQ pain. However, how did you rule out Nephrolithiasis (kidney stones) or Testicular Torsion, which can both present with radiating abdominal pain, nausea, and vomiting?",
            "The patient has a leukocytosis (WBC 15.2). If the ultrasound had been negative, would you have discharged the patient, or what would be your next diagnostic step?"
        ],
        "bias_hints": {
            "anchoring": "Assuming it is appendicitis immediately without evaluating urine or kidney status.",
            "premature": "Sending the patient to the OR without any imaging confirmation (CT or ultrasound) in an adult male."
        }
    }
}

class AgentService:
    """Orchestrates AI agents powered by xAI Grok (or local procedural mock engines)."""
    
    @staticmethod
    def get_client(custom_key: Optional[str] = None) -> Optional[OpenAI]:
        """Create and return an OpenAI client configured for xAI Grok if key is available."""
        api_key = custom_key or os.getenv("GROK_API_KEY")
        if not api_key:
            return None
        return OpenAI(
            api_key=api_key,
            base_url=os.getenv("GROK_API_URL", "https://api.x.ai/v1")
        )

    @classmethod
    def generate_case(cls, specialty: str, custom_key: Optional[str] = None) -> Dict[str, Any]:
        """Generate a clinical case using guideline context, either via xAI Grok or local mock engine."""
        # Find guideline context
        guidelines = VectorStore.search(specialty, limit=1)
        guideline_context = guidelines[0]["content"] if guidelines else ""
        
        client = cls.get_client(custom_key)
        if not client:
            # Local Simulation Fallback
            # Pick matching specialty or default to Cardiology
            spec_key = specialty if specialty in MOCK_SCENARIOS else "Cardiology"
            case_data = MOCK_SCENARIOS[spec_key].copy()
            # Shuffle or add slight variations to make it feel unique
            case_data["title"] = f"{case_data['title']} (Simulated Session)"
            return case_data

        # Call Grok
        prompt = f"""
        You are a medical education AI agent generating clinical case studies for training medical students.
        Create a detailed, fictional clinical patient scenario for the specialty: {specialty}.
        
        Using this clinical guideline content as context:
        "{guideline_context}"
        
        Construct a valid, JSON-formatted clinical case. Return ONLY the JSON object, with no formatting or explanation outside it.
        The JSON object must have exactly these keys:
        - "title": A brief title describing patient presentation (e.g. "A 60-year-old female with...")
        - "underlying_diagnosis": The exact correct diagnosis.
        - "demographics": A dictionary with keys "age" (int), "gender" (str), "occupation" (str).
        - "vital_signs": A dictionary with keys "blood_pressure", "heart_rate", "respiratory_rate", "temperature", "oxygen_saturation". Include units.
        - "presenting_complaint": Detailed text of symptoms.
        - "medical_history": Past history.
        - "family_history": Family history.
        - "medications": Current medications.
        - "allergies": Allergies.
        - "lifestyle": Lifestyle details.
        - "investigations_pool": A dictionary where keys are test names (e.g. "ECG", "CBC", "CT Head", "Urinalysis") and values are the detailed results of those tests. Make sure to include positive findings for diagnostic tests and normal findings for others.
        - "critical_tests": A list of strings of the test names from investigations_pool that are critical to diagnose this case correctly.
        - "devil_challenges": A list of 2 questions that a Devil's Advocate Agent can ask the student to challenge their diagnostic reasoning.
        """
        
        try:
            response = client.chat.completions.create(
                model=os.getenv("GROK_MODEL", "grok-beta"),
                messages=[
                    {"role": "system", "content": "You are a senior clinical instructor. You output strict JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            # Safe fallback if API call fails
            spec_key = specialty if specialty in MOCK_SCENARIOS else "Cardiology"
            return MOCK_SCENARIOS[spec_key]

    @classmethod
    def devils_advocate_turn(cls, history: List[Dict[str, Any]], user_diagnosis: str, user_reasoning: str, case_data: Dict[str, Any], custom_key: Optional[str] = None) -> str:
        """Conduct a challenging conversation turn from the Devil's Advocate agent."""
        client = cls.get_client(custom_key)
        
        # Count existing debate messages
        debate_turns = [h for h in history if h.get("role") in ["assistant_devil", "user_devil"]]
        
        if not client:
            # Simulated Devil's Advocate
            if not debate_turns:
                # First challenge from the case pool
                return case_data["devil_challenges"][0]
            elif len(debate_turns) == 2:
                # Second challenge from the case pool
                return case_data["devil_challenges"][1]
            else:
                return "Interesting defense. But in clinical practice, safety is paramount. How does your diagnosis account for potential atypical presentations of the alternate diagnoses? Do you feel you have gathered sufficient diagnostic certainty to begin treatment?"

        # Call Grok
        # Build message history for the LLM
        messages = [
            {
                "role": "system",
                "content": (
                    f"You are the Devil's Advocate Agent, a clinical instructor conducting a viva examination. "
                    f"The underlying clinical case data is: {json.dumps(case_data)}. "
                    f"The student diagnosed the patient with: '{user_diagnosis}' with reasoning: '{user_reasoning}'. "
                    f"Your job is to challenge the student's reasoning, propose realistic differential diagnoses, "
                    f"and ask them to justify why they ruled them out. "
                    f"Be pedagogical, firm, yet encouraging. Keep your responses concise (100-150 words)."
                )
            }
        ]
        
        # Append previous conversation turns
        for turn in debate_turns:
            role = "assistant" if turn["role"] == "assistant_devil" else "user"
            messages.append({"role": role, "content": turn["content"]})
            
        try:
            response = client.chat.completions.create(
                model=os.getenv("GROK_MODEL", "grok-beta"),
                messages=messages,
                temperature=0.8
            )
            return response.choices[0].message.content
        except Exception:
            return case_data["devil_challenges"][1] if len(debate_turns) < 3 else "Can you defend why this isn't an atypical presentation of a competing medical emergency?"

    @classmethod
    def generate_feedback(cls, history: List[Dict[str, Any]], investigations: List[Dict[str, Any]], user_diagnosis: str, user_reasoning: str, case_data: Dict[str, Any], custom_key: Optional[str] = None) -> Dict[str, Any]:
        """Analyze reasoning, detect cognitive biases, and score the clinical performance."""
        client = cls.get_client(custom_key)
        
        if not client:
            # Simulated feedback scoring
            score_acc = 100 if case_data["underlying_diagnosis"].lower() in user_diagnosis.lower() or any(word in user_diagnosis.lower() for word in case_data["underlying_diagnosis"].lower().split()) else 45
            
            # Check critical tests ordered
            ordered_tests = [i["test_type"].lower() for i in investigations]
            critical_tests = [t.lower() for t in case_data["critical_tests"]]
            missing_critical = [t for t in critical_tests if t not in ordered_tests]
            
            score_evidence = max(10, 100 - (len(missing_critical) * 35))
            score_reasoning = 85 if len(user_reasoning) > 100 else 60
            score_diff = 80 if len(history) > 2 else 50
            
            # Detect biases
            detected_biases = []
            if missing_critical:
                detected_biases.append("Confirmation Bias (diagnosed without ordering all ruling-out tests)")
            if not investigations:
                detected_biases.append("Premature Closure (submitted diagnosis before doing diagnostic workup)")
            if score_acc < 50:
                detected_biases.append("Anchoring Bias (fixated on initial symptoms, ignoring objective lab markers)")
                
            overall_score = int((score_acc + score_evidence + score_reasoning + score_diff) / 4)
            
            feedback_text = (
                f"### Performance Summary\n"
                f"Your diagnostic accuracy was rated as **{score_acc}%**. The correct diagnosis was **{case_data['underlying_diagnosis']}**. "
                f"You diagnosed the patient with **{user_diagnosis}**.\n\n"
                f"### Areas of Strength\n"
                f"- Clear articulation of symptoms and active communication during the Devil's Advocate debate.\n"
                f"- Good documentation of the patient's presenting symptoms.\n\n"
                f"### Areas for Improvement\n"
                f"{'- Make sure to rule out lifethreatening emergencies (e.g. Aortic Dissection, Hemorrhage) before initiating standard protocols.' if missing_critical else '- Keep refining your differential checklist.'}\n"
                f"- Order key confirmatory tests (such as: {', '.join(case_data['critical_tests'])}) before submitting your final impression.\n\n"
                f"### Cognitive Bias Review\n"
                + ("\n".join([f"- **{b}**" for b in detected_biases]) if detected_biases else "No significant cognitive biases detected. Excellent structured reasoning!")
            )
            
            return {
                "score": overall_score,
                "feedback_text": feedback_text,
                "cognitive_biases": detected_biases or ["None Detected"]
            }

        # Call Grok
        prompt = f"""
        Analyze this clinical reasoning exercise and provide structured feedback.
        
        Clinical Case Details: {json.dumps(case_data)}
        Student ordered these tests: {[i['test_type'] for i in investigations]}
        Student Diagnosis: "{user_diagnosis}"
        Student Reasoning: "{user_reasoning}"
        Debate History: {json.dumps(history)}
        
        Perform a comprehensive critique. Identify cognitive biases (Anchoring Bias, Confirmation Bias, Premature Closure, Availability Bias, or None).
        
        Return ONLY a JSON object with these keys:
        - "score": An overall score from 0 to 100 (integer) reflecting diagnostic accuracy and reasoning quality.
        - "feedback_text": Markdown-formatted text outlining strengths, weaknesses, and concrete recommendations.
        - "cognitive_biases": A list of strings of the identified cognitive biases.
        """
        
        try:
            response = client.chat.completions.create(
                model=os.getenv("GROK_MODEL", "grok-beta"),
                messages=[
                    {"role": "system", "content": "You are an expert medical evaluator. You return strict JSON objects only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception:
            return {
                "score": 75,
                "feedback_text": "Failed to generate AI feedback via API. General assessment: Diagnostic pathway was complete. Please review the clinical guidelines in the Knowledge Base.",
                "cognitive_biases": ["None Detected"]
            }
