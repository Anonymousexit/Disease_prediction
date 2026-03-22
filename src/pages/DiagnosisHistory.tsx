import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type DiagnosisRecord } from '../api';

export default function DiagnosisHistory() {
  const navigate = useNavigate();
  const patient = JSON.parse(sessionStorage.getItem('patient') || '{}');
  const [history, setHistory] = useState<DiagnosisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (patient.id) {
      api.getHistory(patient.id)
        .then(setHistory)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const formatSymptomLabel = (s: string) =>
    s.replace(/_/g, ' ').replace(/\(.*?\)/g, '').trim().replace(/\b\w/g, c => c.toUpperCase());

  const filtered = searchTerm
    ? history.filter(h =>
        h.predicted_disease.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.symptoms.some(s => formatSymptomLabel(s).toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : history;

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="flex items-center justify-center p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-primary/10 hover:bg-primary/5 transition-colors group">
              <span className="material-symbols-outlined text-primary group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
              <span className="ml-1 font-semibold text-primary">Back</span>
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

        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Search diagnoses or symptoms..." type="text" />
          </div>
          <button className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-primary/10 flex items-center gap-2 hover:bg-primary/5 transition-colors">
            <span className="material-symbols-outlined text-primary">filter_list</span>
            <span className="font-medium">Filter</span>
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-slate-300 text-5xl mb-4">history</span>
              <p className="text-slate-500">{history.length === 0 ? 'No diagnosis history yet.' : 'No matching results.'}</p>
            </div>
          ) : (
            filtered.map((item) => (
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
          )))
          }
        </div>

        <div className="mt-8 flex justify-center">
          <button className="px-6 py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors">
            Load More History
          </button>
        </div>
      </div>

      <div className="fixed top-0 right-0 -z-10 w-1/3 h-1/2 bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-1/4 h-1/3 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none"></div>
    </div>
  );
}
