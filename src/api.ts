/**
 * MediDiag — API client
 * Centralised fetch calls to the FastAPI backend.
 */

const configuredBaseUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.trim();
const API_BASE_URL = configuredBaseUrl ? configuredBaseUrl.replace(/\/$/, '') : '';
const API = API_BASE_URL
  ? (API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`)
  : '/api';

// ── Helpers ──────────────────────────────────────────────────────────

async function get<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function post<T = any>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function put<T = any>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────

export interface Symptom {
  key: string;
  label: string;
}

export interface Patient {
  id: number;
  full_name: string;
  age: number;
  gender: string;
  email?: string;
  phone?: string;
}

export interface DiagnosisResult {
  diagnosis_id: number;
  patient_id: number;
  disease: string;
  confidence: number;
  probabilities: Record<string, number>;
  medicine: string;
  requires_referral: boolean;
}

export interface DiagnosisRecord {
  id: number;
  patient_id: number;
  symptoms: string[];
  predicted_disease: string;
  confidence: number;
  probabilities: Record<string, number>;
  medicine: string;
  requires_referral: number;
  created_at: string;
}

export interface Doctor {
  id: number;
  name: string;
  email: string;
  specialization: string;
}

export interface Referral {
  id: number;
  diagnosis_id: number;
  patient_id: number;
  doctor_id: number;
  status: string;
  doctor_notes: string | null;
  created_at: string;
  updated_at: string;
  predicted_disease: string;
  confidence: number;
  symptoms: string[];
  probabilities: Record<string, number>;
  medicine: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_email?: string;
  patient_phone?: string;
  doctor_name: string;
  doctor_specialization?: string;
}

export interface Stats {
  total: number;
  pending: number;
  completed: number;
}

// ── API methods ──────────────────────────────────────────────────────

export const api = {
  // Symptoms
  getSymptoms: ()                       => get<Symptom[]>('/symptoms'),

  // Patients
  createPatient: (data: Omit<Patient, 'id'> & { password: string }) => post<Patient>('/patients', data),
  getPatient:    (id: number)           => get<Patient>(`/patients/${id}`),
  loginPatient:  (email: string, password: string) =>
    post<Patient>('/patients/login', { email, password }),

  // Diagnosis
  diagnose: (patientId: number, symptoms: string[]) =>
    post<DiagnosisResult>('/diagnose', { patient_id: patientId, symptoms }),

  getHistory: (patientId: number)       => get<DiagnosisRecord[]>(`/patients/${patientId}/history`),

  // Doctors
  registerDoctor: (data: { name: string; email: string; password: string; specialization?: string }) =>
    post<Doctor>('/doctors/register', data),

  loginDoctor: (email: string, password: string) =>
    post<Doctor>('/doctors/login', { email, password }),

  getDoctors: ()                        => get<Doctor[]>('/doctors'),

  // Referrals
  createReferral: (data: { diagnosis_id: number; patient_id: number; doctor_id: number }) =>
    post('/referrals', data),

  getReferrals:   ()                    => get<Referral[]>('/referrals'),
  getReferral:    (id: number)          => get<Referral>(`/referrals/${id}`),
  updateReferral: (id: number, data: { status?: string; doctor_notes?: string }) =>
    put(`/referrals/${id}`, data),

  // Stats
  getStats: ()                          => get<Stats>('/stats'),
};
