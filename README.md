# 🩺 Second Opinion – AI Clinical Reasoning & Bias Check Trainer

> **An Agentic AI-powered clinical reasoning training platform that helps medical and nursing students improve diagnostic thinking through AI-generated patient cases, interactive clinical debates, cognitive bias detection, and personalized feedback.**

> **Disclaimer:** This application is designed **only for educational and training purposes**. It is **not intended to diagnose, treat, or provide medical advice for real patients.**

---

# 📖 Table of Contents

- Project Overview
- Problem Statement
- Solution
- Key Features
- Complete Workflow
- System Architecture
- AI Agent Workflow
- RAG Workflow
- User Journey
- Tech Stack
- Folder Structure
- Database Overview
- Future Enhancements
- License

---

# 📌 Project Overview

Clinical education often focuses on identifying the correct diagnosis. However, many students struggle with **clinical reasoning**—the process of evaluating symptoms, considering alternatives, ruling out possibilities, and justifying decisions.

Traditional quiz platforms simply tell students whether their answer is correct or incorrect.

**Second Opinion** goes beyond that.

Instead of merely evaluating answers, the platform challenges the student's reasoning through an AI-powered clinical debate. Students learn how to think like clinicians by defending their diagnoses, considering alternative possibilities, and recognizing cognitive biases that can lead to diagnostic errors.

---

# ❗ Problem Statement

Medical students frequently develop cognitive biases while diagnosing clinical cases.

Common examples include:

- Anchoring Bias
- Confirmation Bias
- Premature Closure
- Availability Bias

Most existing educational tools:

- Give multiple-choice questions
- Show the correct answer
- Provide little explanation
- Do not evaluate reasoning

As a result, students memorize facts instead of developing structured clinical thinking.

---

# ✅ Solution

Second Opinion provides an AI-powered clinical reasoning simulator where students practice solving realistic patient cases.

The system:

- Generates patient cases
- Allows students to investigate symptoms
- Accepts diagnostic reasoning
- Challenges the student's diagnosis
- Evaluates reasoning quality
- Detects cognitive biases
- Tracks long-term learning progress

The goal is to improve **how students think**, not simply whether they know the correct diagnosis.

---

# ✨ Key Features

- User Authentication
- AI-generated Clinical Cases
- Investigation Panel
- Diagnostic Reasoning Submission
- AI Devil's Advocate
- Personalized Feedback
- Cognitive Bias Detection
- Case History
- Knowledge Base
- Learning Analytics
- Achievements
- Leaderboard
- User Profile
- Admin Dashboard
- RAG-powered Clinical References

---

# 🔄 Complete End-to-End Workflow

## Step 1 — User Registration

The student creates an account.

The application stores:

- Name
- Email
- Password (hashed)
- Profile information

↓

The student logs into the platform.

---

## Step 2 — Dashboard

After login, the dashboard displays:

- Welcome message
- Completed cases
- Average score
- Learning streak
- Recent activity
- Recommended practice areas

The student clicks:

**Start New Case**

---

## Step 3 — Case Generation

The request reaches the FastAPI backend.

↓

LangGraph starts the AI workflow.

↓

The Case Generator retrieves relevant clinical knowledge from ChromaDB.

↓

The retrieved context is sent to the Grok API.

↓

The AI creates a realistic fictional patient case.

Example:

Patient

- Age
- Gender
- Symptoms
- Medical History
- Family History
- Current Medication
- Vital Signs

The case is displayed to the student.

---

## Step 4 — Investigation

The student studies the case.

Before diagnosing, they may request investigations such as:

- ECG
- Blood Tests
- CT Scan
- MRI
- X-Ray
- Urine Test

The backend generates appropriate fictional investigation results.

Students may request multiple investigations before deciding.

---

## Step 5 — Diagnosis Submission

The student submits:

- Diagnosis
- Clinical Reasoning
- Supporting Evidence
- Alternative Diagnoses Considered

This encourages structured thinking instead of guessing.

---

## Step 6 — Devil's Advocate

Instead of immediately grading the answer,

The AI intentionally disagrees.

Example:

> You diagnosed Myocardial Infarction.

The AI asks:

- Why not Pulmonary Embolism?
- What evidence rules out Aortic Dissection?
- Could this be Unstable Angina?

The student must defend every decision.

This simulates a real clinical viva.

---

## Step 7 — Feedback

After the discussion,

The Feedback Agent evaluates:

- Diagnostic Accuracy
- Clinical Reasoning
- Logical Consistency
- Evidence Usage
- Communication
- Differential Diagnosis Quality
- Cognitive Biases

The student receives:

- Overall Score
- Strengths
- Weaknesses
- Suggestions
- Bias Analysis

---

## Step 8 — Save Progress

The application stores:

- User
- Case
- Diagnosis
- Debate
- Feedback
- Score
- Biases

using SQLite through SQLAlchemy.

---

## Step 9 — Analytics

Every completed case updates the dashboard.

Students can view:

- Accuracy Trend
- Weekly Progress
- Most Common Bias
- Strongest Specialty
- Weakest Specialty
- Learning Streak
- Completed Cases

---

## Step 10 — Continue Learning

Students can:

- Review previous cases
- Read AI feedback
- Search clinical topics
- Practice again
- Earn achievements
- Improve over time

---

# 🤖 AI Agent Workflow

```
Student
    │
    ▼
Start New Case
    │
    ▼
Case Generator
    │
    ▼
Generate Patient Case
    │
    ▼
Student Diagnosis
    │
    ▼
Devil's Advocate
    │
    ▼
Clinical Debate
    │
    ▼
Feedback Agent
    │
    ▼
Performance Analysis
    │
    ▼
SQLite Database
    │
    ▼
Analytics Dashboard
```

---

# 📚 RAG Workflow

```
Clinical Guideline PDFs
        │
        ▼
PDF Processing
        │
        ▼
Text Chunking
        │
        ▼
Embeddings
        │
        ▼
ChromaDB
        │
        ▼
Retrieve Relevant Context
        │
        ▼
Grok API
        │
        ▼
Grounded AI Response
```

---

# 🧑‍⚕️ User Journey

```
Register

↓

Login

↓

Dashboard

↓

Start New Case

↓

Investigate Patient

↓

Submit Diagnosis

↓

AI Challenges Diagnosis

↓

Student Defends Answer

↓

Receive Feedback

↓

View Analytics

↓

Practice Again
```

---

# 🏗️ System Architecture

```
React Frontend
        │
        ▼
FastAPI Backend
        │
        ▼
LangGraph
        │
 ┌──────┼───────────┐
 ▼      ▼           ▼
Case   Devil's   Feedback
Agent  Advocate    Agent
        │
        ▼
Grok API
        │
        ▼
ChromaDB (RAG)
        │
        ▼
SQLite Database
```

---

# 💻 Tech Stack

## Frontend

- React
- TypeScript
- Tailwind CSS
- ShadCN UI

## Backend

- FastAPI
- Python

## AI

- Grok API
- LangGraph

## RAG

- ChromaDB
- Sentence Transformers

## Database

- SQLite
- SQLAlchemy

## Authentication

- JWT
- Passlib

---

# 📂 Project Structure

```
SecondOpinion/

├── frontend/
│
├── backend/
│
├── docs/
│
├── screenshots/
│
└── README.md
```

---

# 🗄️ Database Overview

The application stores:

- Users
- Clinical Cases
- Diagnoses
- AI Feedback
- Cognitive Bias Reports
- Achievements
- Analytics
- Learning History
- Settings

---

# 🚀 Future Enhancements

- Multi-agent collaboration
- Voice-based patient simulation
- Adaptive difficulty
- Multiplayer case discussions
- Faculty evaluation portal
- Institution analytics
- AI-generated study plans
- Real-time streaming AI responses

---

# 📜 License

This project is developed for educational purposes and portfolio demonstration.

It is **not intended for clinical diagnosis or patient care**.
project deployment link:https://second-opinion-6.onrender.com/
