import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type DiagnosisRecord } from '../api';
import PatientNav from '../components/PatientNav';

type FilterOption = 'All' | 'Referral Issued' | 'No Referral';

export default function DiagnosisHistory() {
  const navigate = useNavigate();
  const patient = JSON.parse(sessionStorage.getItem('patient') || '{}');

  // ── State ──────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<DiagnosisRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [expanded, setExpanded] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // ── Redirect if not logged in ─────────────────────────────────────
  useEffect(() => {
    if (!patient.id) {
      navigate('/patient/login');
    }
  }, []);

  // ── Fetch history on mount ────────────────────────────────────────
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

  // ── Close filter dropdown on outside click ────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────
  const formatSymptomLabel = (s: string) =>
    s.replace(/_/g, ' ').replace(/\(.*?\)/g, '').trim().replace(/\b\w/g, c => c.toUpperCase());

  // ── Filtering & pagination ────────────────────────────────────────
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

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <PatientNav patientId={patient.id} patientName={patient.full_name} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ── Page heading ───────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Diagnosis History
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Review your past diagnoses and results.
          </p>
        </div>

        {/* ── Search + Filter bar ─────────────────────────────────── */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Search diagnoses or symptoms..." type="text" />
          </div>
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
        </div>

        {/* ── Diagnosis History cards ─────────────────────────────── */}
        <div className="space-y-4">
          {historyLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl">history</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-base font-medium">
                {history.length === 0 ? 'No diagnosis history yet.' : 'No matching results.'}
              </p>
              {history.length === 0 && (
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                  Start a new diagnosis to see your history here.
                </p>
              )}
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
      </div>

      {/* ── Decorative gradients ──────────────────────────────────── */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-1/2 bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-1/4 h-1/3 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none"></div>
    </div>
  );
}
