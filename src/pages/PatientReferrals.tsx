import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Referral } from '../api';
import PatientNav from '../components/PatientNav';
import ChatPanel from '../components/ChatPanel';
import { AnimatePresence } from 'motion/react';

export default function PatientReferrals() {
  const navigate = useNavigate();
  const patient = JSON.parse(sessionStorage.getItem('patient') || '{}');

  // ── State ──────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(true);
  const [referralsError, setReferralsError] = useState<string | null>(null);

  const [chatOpen, setChatOpen] = useState<number | null>(null);
  const [chatPartner, setChatPartner] = useState({ name: '', disease: '' });
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // ── Redirect if not logged in ─────────────────────────────────────
  useEffect(() => {
    if (!patient.id) {
      navigate('/patient/login');
    }
  }, []);

  // ── Fetch referrals on mount ──────────────────────────────────────
  useEffect(() => {
    if (patient.id) {
      api.getPatientReferrals(patient.id)
        .then((data) => { setReferrals(data); setReferralsError(null); })
        .catch((err) => setReferralsError(err.message || 'Failed to load referrals'))
        .finally(() => setReferralsLoading(false));
    } else {
      setReferralsLoading(false);
    }
  }, []);

  // ── Fetch unread message counts ───────────────────────────────────
  useEffect(() => {
    if (referrals.length > 0 && patient.id) {
      const ids = referrals.map(r => r.id);
      api.getUnreadCounts(ids, 'patient')
        .then(setUnreadCounts)
        .catch(() => {});
    }
  }, [referrals]);

  // ── Filtering ─────────────────────────────────────────────────────
  const filteredReferrals = searchTerm
    ? referrals.filter(r =>
        r.predicted_disease.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.doctor_name && r.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : referrals;

  // ── Status badge helper ───────────────────────────────────────────
  function statusBadge(status: string) {
    const s = status?.toLowerCase() || 'pending';
    if (s === 'pending')
      return <span className="px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{status}</span>;
    if (s === 'completed')
      return <span className="px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">{status}</span>;
    return <span className="px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{status}</span>;
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <PatientNav patientId={patient.id} patientName={patient.full_name} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ── Page heading ───────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Referrals
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Track your doctor referrals and communicate with assigned specialists.
          </p>
        </div>

        {/* ── Search bar ──────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="Search referrals by disease or doctor name..."
              type="text"
            />
          </div>
        </div>

        {/* ── Referral cards ──────────────────────────────────────── */}
        <div className="space-y-4">
          {referralsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : referralsError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              <span className="material-symbols-outlined text-sm align-middle mr-1">error</span>
              {referralsError}
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl">send</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-base font-medium">
                {referrals.length === 0
                  ? 'No referrals yet.'
                  : 'No matching referrals.'}
              </p>
              {referrals.length === 0 && (
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                  Referrals will appear here when a diagnosis requires specialist review.
                </p>
              )}
            </div>
          ) : (
            filteredReferrals.map((ref) => (
              <div key={ref.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-primary/5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-bold text-primary">{ref.predicted_disease}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setChatOpen(ref.id); setChatPartner({ name: ref.doctor_name || 'Doctor', disease: ref.predicted_disease }); }}
                      className="relative size-9 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
                      title="Chat with doctor"
                    >
                      <span className="material-symbols-outlined text-lg">chat</span>
                      {unreadCounts[String(ref.id)] > 0 && (
                        <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                          {unreadCounts[String(ref.id)]}
                        </span>
                      )}
                    </button>
                    {statusBadge(ref.status)}
                  </div>
                </div>

                {/* Doctor info */}
                <div className="flex items-center gap-2 mb-3 text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span className="text-sm font-semibold">{ref.doctor_name || 'Unassigned'}</span>
                  {ref.doctor_specialization && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">• {ref.doctor_specialization}</span>
                  )}
                </div>

                {/* Confidence */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Confidence:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${ref.confidence}%` }}></div>
                    </div>
                    <span className="text-sm font-bold text-primary">{ref.confidence}%</span>
                  </div>
                </div>

                {/* Doctor notes */}
                {ref.doctor_notes && (
                  <div className="mt-3 mb-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1 text-slate-600 dark:text-slate-300">
                      <span className="material-symbols-outlined text-base">stethoscope</span>
                      <span className="text-sm font-bold">Doctor's Notes</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">{ref.doctor_notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-slate-50 dark:border-slate-700 flex items-center gap-2 text-slate-400 dark:text-slate-500">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  <span className="text-sm font-medium">{new Date(ref.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Panel ───────────────────────────────────────────── */}
      <AnimatePresence>
        {chatOpen && (
          <ChatPanel
            referralId={chatOpen}
            currentUserType="patient"
            currentUserId={patient.id}
            partnerName={chatPartner.name}
            disease={chatPartner.disease}
            onClose={() => {
              setChatOpen(null);
              if (referrals.length > 0) {
                api.getUnreadCounts(referrals.map(r => r.id), 'patient')
                  .then(setUnreadCounts)
                  .catch(() => {});
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Decorative gradients ──────────────────────────────────── */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-1/2 bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-1/4 h-1/3 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none"></div>
    </div>
  );
}
