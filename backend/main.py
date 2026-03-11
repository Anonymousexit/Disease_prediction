"""
MediDiag — FastAPI backend
Serves ML predictions, patient/doctor management, and referral workflows.
Uses MySQL for persistent storage.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json

from database import init_db, get_db
from ml_service import MLService

# ── App setup ─────────────────────────────────────────────────────────
app = FastAPI(title="MediDiag API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ml_service = MLService()
init_db()

# ── Pydantic schemas ─────────────────────────────────────────────────

class PatientCreate(BaseModel):
    full_name: str
    age: int
    gender: str
    email: Optional[str] = None
    phone: Optional[str] = None


class DiagnoseRequest(BaseModel):
    patient_id: int
    symptoms: list[str]


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


# ── Helper: run a query and return list[dict] ────────────────────────

def _fetchall(query: str, params: tuple = ()) -> list[dict]:
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def _fetchone(query: str, params: tuple = ()):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute(query, params)
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row


# ── Symptom endpoints ────────────────────────────────────────────────

@app.get("/api/symptoms")
def get_symptoms():
    """Return the full list of 134 symptoms with raw key and display label."""
    symptoms = ml_service.get_symptoms()
    return [
        {"key": s, "label": ml_service.format_symptom_name(s)}
        for s in symptoms
    ]


# ── Patient endpoints ────────────────────────────────────────────────

@app.post("/api/patients")
def create_patient(patient: PatientCreate):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO patients (full_name, age, gender, email, phone) VALUES (%s, %s, %s, %s, %s)",
        (patient.full_name, patient.age, patient.gender, patient.email, patient.phone),
    )
    conn.commit()
    pid = cur.lastrowid
    cur.close()
    conn.close()
    return {"id": pid, **patient.model_dump()}


@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: int):
    row = _fetchone("SELECT * FROM patients WHERE id = %s", (patient_id,))
    if not row:
        raise HTTPException(404, "Patient not found")
    return row


# ── Diagnosis endpoint (calls ML model) ──────────────────────────────

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
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
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
    conn.commit()
    diagnosis_id = cur.lastrowid
    cur.close()
    conn.close()

    return {"diagnosis_id": diagnosis_id, "patient_id": req.patient_id, **result}


@app.get("/api/patients/{patient_id}/history")
def get_patient_history(patient_id: int):
    rows = _fetchall(
        "SELECT * FROM diagnoses WHERE patient_id = %s ORDER BY created_at DESC",
        (patient_id,),
    )
    for d in rows:
        d["symptoms"] = json.loads(d["symptoms"]) if isinstance(d["symptoms"], str) else d["symptoms"]
        d["probabilities"] = json.loads(d["probabilities"]) if isinstance(d["probabilities"], str) else d["probabilities"]
    return rows


# ── Doctor endpoints ─────────────────────────────────────────────────

@app.post("/api/doctors/register")
def doctor_register(req: DoctorRegisterRequest):
    """Register a new doctor account."""
    # Check if email already exists
    existing = _fetchone("SELECT id FROM doctors WHERE email = %s", (req.email,))
    if existing:
        raise HTTPException(409, "A doctor with this email already exists")

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO doctors (name, email, password, specialization) VALUES (%s, %s, %s, %s)",
        (req.name, req.email, req.password, req.specialization),
    )
    conn.commit()
    did = cur.lastrowid
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


# ── Referral endpoints ───────────────────────────────────────────────

@app.post("/api/referrals")
def create_referral(ref: ReferralCreate):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO referrals (diagnosis_id, patient_id, doctor_id) VALUES (%s, %s, %s)",
        (ref.diagnosis_id, ref.patient_id, ref.doctor_id),
    )
    conn.commit()
    rid = cur.lastrowid
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
        JOIN diagnoses d ON r.diagnosis_id = d.id
        JOIN patients  p ON r.patient_id   = p.id
        LEFT JOIN doctors doc ON r.doctor_id = doc.id
        ORDER BY r.created_at DESC
    """)
    for d in rows:
        d["symptoms"] = json.loads(d["symptoms"]) if isinstance(d["symptoms"], str) else d["symptoms"]
        d["probabilities"] = json.loads(d["probabilities"]) if isinstance(d["probabilities"], str) else d["probabilities"]
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
        JOIN diagnoses d ON r.diagnosis_id = d.id
        JOIN patients  p ON r.patient_id   = p.id
        LEFT JOIN doctors doc ON r.doctor_id = doc.id
        WHERE r.id = %s
    """, (referral_id,))

    if not row:
        raise HTTPException(404, "Referral not found")
    row["symptoms"] = json.loads(row["symptoms"]) if isinstance(row["symptoms"], str) else row["symptoms"]
    row["probabilities"] = json.loads(row["probabilities"]) if isinstance(row["probabilities"], str) else row["probabilities"]
    return row


@app.put("/api/referrals/{referral_id}")
def update_referral(referral_id: int, body: ReferralUpdate):
    conn = get_db()
    cur = conn.cursor()
    updates, values = [], []
    if body.status is not None:
        updates.append("status = %s")
        values.append(body.status)
    if body.doctor_notes is not None:
        updates.append("doctor_notes = %s")
        values.append(body.doctor_notes)
    if updates:
        values.append(referral_id)
        cur.execute(f"UPDATE referrals SET {', '.join(updates)} WHERE id = %s", values)
        conn.commit()
    cur.close()
    conn.close()
    return {"message": "Referral updated"}


# ── Dashboard stats ──────────────────────────────────────────────────

@app.get("/api/stats")
def get_stats():
    total     = _fetchone("SELECT COUNT(*) AS c FROM referrals")["c"]
    pending   = _fetchone("SELECT COUNT(*) AS c FROM referrals WHERE status = 'Pending'")["c"]
    completed = _fetchone("SELECT COUNT(*) AS c FROM referrals WHERE status = 'Completed'")["c"]
    return {"total": total, "pending": pending, "completed": completed}
