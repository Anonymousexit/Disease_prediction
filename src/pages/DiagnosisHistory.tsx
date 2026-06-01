import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type DiagnosisRecord, type Referral } from '../api';
import NotificationBell from '../components/NotificationBell';

type Tab = 'history' | 'referrals';
type FilterOption = 'All' | 'Referral Issued' | 'No Referral';

export default function DiagnosisHistory() {
  const navigate = useNavigate();
  const patient = JSON.parse(sessionStorage.getItem('patient') || '{}');

  // ── Shared state ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('history');
  const [searchTerm, setSearchTerm] = useState('');

  // ── History tab state ──────────────────────────────────────────────
  const [history, setHistory] = useState<DiagnosisRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [expanded, setExpanded] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // ── Referrals tab state ────────────────────────────────────────────
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(true);
  const [referralsError, setReferralsError] = useState<string | null>(null);

  // ── Fetch history on mount ─────────────────────────────────────────
  useEffect(() => {
    if (patient.id) {
      api.getHistory(patient.id)
        .then(setHistory)
        .catch(() => {})
        .finally(() => setHistoryLoading(false));
    } else {
      setHistoryLoading(false);
    }
  }, []);

  // ── Fetch referrals on mount ───────────────────────────────────────
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

  // ── Close filter dropdown on outside click ─────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────
  const formatSymptomLabel = (s: string) =>
    s.replace(/_/g, ' ').replace(/\(.*?\)/g, '').trim().replace(/\b\w/g, c => c.toUpperCase());

  // ── History filtering & pagination ─────────────────────────────────
  const filteredHistory = history
    .filter((h) => {
      if (activeFilter === 'Referral Issued') return h.requires_referral;
      if (activeFilter === 'No Referral') return !h.requires_referral;
      return true;
    })
    .filter((h) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        h.predicted_disease.toLowerCase().includes(q) ||
        h.symptoms.some(s => formatSymptomLabel(s).toLowerCase().includes(q))
      );
    });

  const INITIAL_COUNT = 5;
  const visibleHistory = expanded ? filteredHistory : filteredHistory.slice(0, INITIAL_COUNT);
  const remaining = filteredHistory.length - INITIAL_COUNT;

  // ── Referrals filtering ────────────────────────────────────────────
  const filteredReferrals = searchTerm
    ? referrals.filter(r =>
        r.predicted_disease.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.doctor_name && r.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : referrals;

  // ── Status badge helper ────────────────────────────────────────────
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ── Header ──────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="flex items-center justify-center p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-primary/10 hover:bg-primary/5 transition-colors group">
              <span className="material-symbols-outlined text-primary group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
              <span className="ml-1 font-semibold text-primary">Back</span>
            </button>
            <NotificationBell patientId={patient.id} />
            <button onClick={() => { sessionStorage.removeItem('patient'); navigate('/patient/login'); }} className="flex items-center justify-center p-2 px-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors gap-1">
              <span className="material-symbols-outlined text-sm">logout</span>
              Logout
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Diagnosis History — <span className="text-primary">{patient.full_name || 'Patient'}</span>
            </h1>
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD5JxE6FNRckFGAWlITGZh9BdnPYWuWZHFETQW0Zc4raV1PieXOQTd0jewrBHV7SZa1F_o5fdiOvwg-vlm3ObjuvRe9xAIHTK1sYfHgk6mbMr8WvxEDZ4NrCAAFMECA4Yu8NcStfM8zObzGabbuYMUUhEMQukqwuNDd1XefoAMIvZsa-UNqJp-6PckV9DpWruJUwMfDeY_vGTLhYtNUHxpHBepEVfKQPWHqu9WrZ74JHyqHlkS2w8htOjyz74LZRVJ0_sjL6biNjHir')" }}></div>
            </div>
          </div>
        </header>

        {/* ── Tab bar ─────────────────────────────────────────────── */}
        <div className="flex border-b border-primary/10 mb-6">
          <button
            onClick={() => { setActiveTab('history'); setSearchTerm(''); }}
            className={`px-5 py-3 text-sm font-semibold transition-colors ${activeTab === 'history' ? 'border-b-2 border-primary text-primary font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <span className="material-symbols-outlined text-base align-middle mr-1">history</span>
            Diagnosis History
          </button>
          <button
            onClick={() => { setActiveTab('referrals'); setSearchTerm(''); }}
            className={`px-5 py-3 text-sm font-semibold transition-colors ${activeTab === 'referrals' ? 'border-b-2 border-primary text-primary font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <span className="material-symbols-outlined text-base align-middle mr-1">send</span>
            My Referrals
          </button>
        </div>

        {/* ── Search + Filter bar ─────────────────────────────────── */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder={activeTab === 'history' ? 'Search diagnoses or symptoms...' : 'Search referrals...'} type="text" />
          </div>
          {activeTab === 'history' && (
            <div className="relative" ref={filterRef}>
              <button onClick={() => setFilterOpen(!filterOpen)} className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-primary/10 flex items-center gap-2 hover:bg-primary/5 transition-colors">
                <span className="material-symbols-outlined text-primary">filter_list</span>
                <span className="font-medium">{activeFilter === 'All' ? 'Filter' : activeFilter}</span>
              </button>
              {filterOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-primary/10 rounded-xl shadow-lg z-20 overflow-hidden">
                  {(['All', 'Referral Issued', 'No Referral'] as FilterOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setActiveFilter(opt); setFilterOpen(false); setExpanded(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${activeFilter === opt ? 'bg-primary/10 text-primary font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-primary/5'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── TAB: Diagnosis History ──────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-slate-300 text-5xl mb-4">history</span>
                <p className="text-slate-500">{history.length === 0 ? 'No diagnosis history yet.' : 'No matching results.'}</p>
              </div>
            ) : (
              <>
                {visibleHistory.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-primary/5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-xl font-bold text-primary">{item.predicted_disease}</h2>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${item.requires_referral ? 'bg-primary/10 text-primary' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                        {item.requires_referral ? 'Referral Issued' : 'No Referral'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Confidence:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${item.confidence}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-primary">{item.confidence}%</span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1 uppercase tracking-tighter">Symptoms Reported</p>
                      <p className="text-slate-700 dark:text-slate-300">{item.symptoms.map(formatSymptomLabel).join(', ')}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        <span className="text-sm font-medium">{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                      {item.medicine && (
                        <span className="text-sm text-blue-600 font-medium">💊 {item.medicine}</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Show More / Show Less */}
                {filteredHistory.length > INITIAL_COUNT && (
                  <div className="mt-4 flex justify-center">
                    {expanded ? (
                      <button onClick={() => setExpanded(false)} className="px-6 py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors">
                        Show Less
                      </button>
                    ) : (
                      <button onClick={() => setExpanded(true)} className="px-6 py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors">
                        Show More ({remaining} remaining)
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB: My Referrals ───────────────────────────────────── */}
        {activeTab === 'referrals' && (
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
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-slate-300 text-5xl mb-4">send</span>
                <p className="text-slate-500">{referrals.length === 0 ? 'No referrals yet. Referrals will appear here when a doctor reviews your diagnosis.' : 'No matching referrals.'}</p>
              </div>
            ) : (
              filteredReferrals.map((ref) => (
                <div key={ref.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-primary/5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-primary">{ref.predicted_disease}</h2>
                    {statusBadge(ref.status)}
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
        )}
      </div>

      {/* ── Decorative gradients ──────────────────────────────────── */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-1/2 bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-1/4 h-1/3 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none"></div>
    </div>
  );
}
