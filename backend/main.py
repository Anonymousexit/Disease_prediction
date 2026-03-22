"""
MediDiag — FastAPI backend
Serves ML predictions, patient/doctor management, and referral workflows.
Uses PostgreSQL (via psycopg2) for persistent storage on Render.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2
import psycopg2.extras
import json
import os

from database import init_db, get_db
from ml_service import MLService

# ── App setup ─────────────────────────────────────────────────────────
app = FastAPI(title="MediDiag API", version="1.0.0")


def _parse_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS")
    if raw_origins:
        return [o.strip() for o in raw_origins.split(",") if o.strip()]
    return ["*"]


cors_origins = _parse_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials="*" not in cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

ml_service = MLService()
init_db()

# ── Pydantic schemas ──────────────────────────────────────────────────

class PatientCreate(BaseModel):
    full_name: str
    age: int
    gender: str
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str


class DiagnoseRequest(BaseModel):
    patient_id: int
    symptoms: list[str]


class PatientLoginRequest(BaseModel):
    email: str
    password: str


class DoctorLoginRequest(BaseModel):
    email: str
    password: str


class DoctorRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    specialization: Optional[str] = "General Practice"


class ReferralCreate(BaseModel):
    diagnosis_id: int
    patient_id: int
    doctor_id: int


class ReferralUpdate(BaseModel):
    status: Optional[str] = None
    doctor_notes: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────

def _fetchall(query: str, params: tuple = ()) -> list[dict]:
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(query, params)
    rows = [dict(r) for r in cur.fetchall()]
    cur.close()
    conn.close()
    return rows


def _fetchone(query: str, params: tuple = ()):
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(query, params)
    row = cur.fetchone()
    cur.close()
    conn.close()
    return dict(row) if row else None


# ── Symptom endpoints ─────────────────────────────────────────────────

@app.get("/api/symptoms")
def get_symptoms():
    """Return the full list of symptoms with raw key and display label."""
    symptoms = ml_service.get_symptoms()
    return [
        {"key": s, "label": ml_service.format_symptom_name(s)}
        for s in symptoms
    ]


# ── Patient endpoints ─────────────────────────────────────────────────

@app.post("/api/patients")
def create_patient(patient: PatientCreate):
    # Check if email already exists
    if patient.email:
        existing = _fetchone("SELECT id FROM patients WHERE email = %s", (patient.email,))
        if existing:
            raise HTTPException(409, "A patient with this email already exists")

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO patients (full_name, age, gender, email, phone, password)
           VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
        (patient.full_name, patient.age, patient.gender, patient.email, patient.phone, patient.password),
    )
    pid = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    data = patient.model_dump()
    del data["password"]
    return {"id": pid, **data}


@app.post("/api/patients/login")
def patient_login(req: PatientLoginRequest):
    row = _fetchone(
        "SELECT * FROM patients WHERE email = %s AND password = %s",
        (req.email, req.password),
    )
    if not row:
        raise HTTPException(401, "Invalid email or password")
    row.pop("password", None)
    return row


@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: int):
    row = _fetchone("SELECT * FROM patients WHERE id = %s", (patient_id,))
    if not row:
        raise HTTPException(404, "Patient not found")
    return row


# ── Diagnosis endpoint (calls ML model) ───────────────────────────────

@app.post("/api/diagnose")
def diagnose(req: DiagnoseRequest):
    """Accept selected symptom keys, run prediction, persist result."""
    result = ml_service.predict(req.symptoms)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO diagnoses
           (patient_id, symptoms, predicted_disease, confidence,
            probabilities, medicine, requires_referral)
           VALUES (%s, %s::jsonb, %s, %s, %s::jsonb, %s, %s) RETURNING id""",
        (
            req.patient_id,
            json.dumps(req.symptoms),
            result["disease"],
            result["confidence"],
            json.dumps(result["probabilities"]),
            result["medicine"],
            1 if result["requires_referral"] else 0,
        ),
    )
    diagnosis_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return {"diagnosis_id": diagnosis_id, "patient_id": req.patient_id, **result}


@app.get("/api/patients/{patient_id}/history")
def get_patient_history(patient_id: int):
    rows = _fetchall(
        "SELECT * FROM diagnoses WHERE patient_id = %s ORDER BY created_at DESC",
        (patient_id,),
    )
    # psycopg2 deserialises JSONB automatically; guard against string fallback
    for d in rows:
        if isinstance(d["symptoms"], str):
            d["symptoms"] = json.loads(d["symptoms"])
        if isinstance(d["probabilities"], str):
            d["probabilities"] = json.loads(d["probabilities"])
    return rows


# ── Doctor endpoints ──────────────────────────────────────────────────

@app.post("/api/doctors/register")
def doctor_register(req: DoctorRegisterRequest):
    """Register a new doctor account."""
    existing = _fetchone("SELECT id FROM doctors WHERE email = %s", (req.email,))
    if existing:
        raise HTTPException(409, "A doctor with this email already exists")

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO doctors (name, email, password, specialization)
           VALUES (%s, %s, %s, %s) RETURNING id""",
        (req.name, req.email, req.password, req.specialization),
    )
    did = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return {"id": did, "name": req.name, "email": req.email, "specialization": req.specialization}


@app.post("/api/doctors/login")
def doctor_login(req: DoctorLoginRequest):
    row = _fetchone(
        "SELECT * FROM doctors WHERE email = %s AND password = %s",
        (req.email, req.password),
    )
    if not row:
        raise HTTPException(401, "Invalid email or password")
    del row["password"]
    return row


@app.get("/api/doctors")
def get_doctors():
    return _fetchall("SELECT id, name, email, specialization FROM doctors")


# ── Referral endpoints ────────────────────────────────────────────────

@app.post("/api/referrals")
def create_referral(ref: ReferralCreate):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO referrals (diagnosis_id, patient_id, doctor_id)
           VALUES (%s, %s, %s) RETURNING id""",
        (ref.diagnosis_id, ref.patient_id, ref.doctor_id),
    )
    rid = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return {"id": rid, "status": "Pending"}


@app.get("/api/referrals")
def get_referrals():
    rows = _fetchall("""
        SELECT r.*, d.predicted_disease, d.confidence, d.symptoms,
               d.probabilities, d.medicine,
               p.full_name AS patient_name, p.age AS patient_age,
               p.gender AS patient_gender,
               doc.name AS doctor_name
        FROM referrals r
        JOIN diagnoses d  ON r.diagnosis_id = d.id
        JOIN patients  p  ON r.patient_id   = p.id
        LEFT JOIN doctors doc ON r.doctor_id = doc.id
        ORDER BY r.created_at DESC
    """)
    for d in rows:
        if isinstance(d["symptoms"], str):
            d["symptoms"] = json.loads(d["symptoms"])
        if isinstance(d["probabilities"], str):
            d["probabilities"] = json.loads(d["probabilities"])
    return rows


@app.get("/api/referrals/{referral_id}")
def get_referral(referral_id: int):
    row = _fetchone("""
        SELECT r.*, d.predicted_disease, d.confidence, d.symptoms,
               d.probabilities, d.medicine,
               p.full_name AS patient_name, p.age AS patient_age,
               p.gender AS patient_gender, p.email AS patient_email,
               p.phone AS patient_phone,
               doc.name AS doctor_name, doc.specialization AS doctor_specialization
        FROM referrals r
        JOIN diagnoses d  ON r.diagnosis_id = d.id
        JOIN patients  p  ON r.patient_id   = p.id
        LEFT JOIN doctors doc ON r.doctor_id = doc.id
        WHERE r.id = %s
    """, (referral_id,))

    if not row:
        raise HTTPException(404, "Referral not found")
    if isinstance(row["symptoms"], str):
        row["symptoms"] = json.loads(row["symptoms"])
    if isinstance(row["probabilities"], str):
        row["probabilities"] = json.loads(row["probabilities"])
    return row


@app.put("/api/referrals/{referral_id}")
def update_referral(referral_id: int, body: ReferralUpdate):
    conn = get_db()
    cur = conn.cursor()
    updates, values = ["updated_at = CURRENT_TIMESTAMP"], []
    if body.status is not None:
        updates.append("status = %s")
        values.append(body.status)
    if body.doctor_notes is not None:
        updates.append("doctor_notes = %s")
        values.append(body.doctor_notes)
    values.append(referral_id)
    cur.execute(f"UPDATE referrals SET {', '.join(updates)} WHERE id = %s", values)
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Referral updated"}


# ── Dashboard stats ───────────────────────────────────────────────────

@app.get("/api/stats")
def get_stats():
    total     = _fetchone("SELECT COUNT(*) AS c FROM referrals")["c"]
    pending   = _fetchone("SELECT COUNT(*) AS c FROM referrals WHERE status = 'Pending'")["c"]
    completed = _fetchone("SELECT COUNT(*) AS c FROM referrals WHERE status = 'Completed'")["c"]
    return {"total": total, "pending": pending, "completed": completed}
