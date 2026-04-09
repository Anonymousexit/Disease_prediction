import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Symptom } from '../api';
import NotificationBell from '../components/NotificationBell';

export default function SymptomSelection() {
  const navigate = useNavigate();
  const [allSymptoms, setAllSymptoms] = useState<Symptom[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [diagnosing, setDiagnosing] = useState(false);
  const [error, setError] = useState('');

  const patient = JSON.parse(sessionStorage.getItem('patient') || '{}');

  useEffect(() => {
    api.getSymptoms()
      .then(setAllSymptoms)
      .catch(() => setError('Failed to load symptoms. Is the backend running?'))
      .finally(() => setLoadingSymptoms(false));
  }, []);

  const filtered = search
    ? allSymptoms.filter(s => s.label.toLowerCase().includes(search.toLowerCase()))
    : allSymptoms;

  const INITIAL_LIMIT = 20;
  const displayedSymptoms = search || showAll ? filtered : filtered.slice(0, INITIAL_LIMIT);
  const hasMore = !search && !showAll && filtered.length > INITIAL_LIMIT;

  const toggleSymptom = (key: string) => {
    setSelectedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const selectedSymptomObjects = allSymptoms.filter(s => selectedKeys.includes(s.key));

  const handleDiagnose = async () => {
    if (selectedKeys.length === 0) return;
    setDiagnosing(true);
    setError('');
    try {
      const result = await api.diagnose(patient.id, selectedKeys);
      navigate('/diagnosis', { state: { result } });
    } catch (err: any) {
      setError(err.message || 'Diagnosis failed. Please try again.');
    } finally {
      setDiagnosing(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/10 bg-white dark:bg-background-dark px-6 md:px-20 py-4">
        <div className="flex items-center gap-3">
          <div className="size-8 text-primary">
            <span className="material-symbols-outlined text-3xl">medical_services</span>
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">MediDiag</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase font-semibold">Patient</p>
              <p className="text-sm font-bold">{patient.full_name || 'Patient'}</p>
            </div>
            <div className="bg-primary/10 rounded-full p-1">
              <div className="bg-primary rounded-full size-10 flex items-center justify-center text-white font-bold text-lg">
                {(patient.full_name || 'P')[0]}
              </div>
            </div>
          </div>
          <NotificationBell patientId={patient.id} />
          <button onClick={() => navigate('/history')} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 border border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors">
            <span className="truncate">View History</span>
          </button>
          <button onClick={() => { sessionStorage.removeItem('patient'); navigate('/patient/login'); }} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-red-50 border border-red-200 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors gap-1">
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="truncate">Logout</span>
          </button>
        </div>
      </header>

      <main className="flex flex-1 justify-center py-8 px-4 md:px-20">
        <div className="layout-content-container flex flex-col max-w-[1024px] flex-1 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-10">
            <div className="mb-8">
              <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold leading-tight tracking-tight mb-2">Select Your Symptoms</h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg">Search and click all symptoms you are currently experiencing.</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
            )}

            <div className="mb-8">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  placeholder="Type to search symptoms (e.g. Headache, Nausea, Fever)..."
                  type="text"
                />
              </div>
            </div>

            {selectedSymptomObjects.length > 0 && (
              <div className="mb-10 p-5 bg-primary/5 rounded-xl border border-primary/10">
                <h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Selected Symptoms ({selectedSymptomObjects.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSymptomObjects.map(symptom => (
                    <div key={symptom.key} className="flex h-9 items-center justify-center gap-x-2 rounded-full bg-primary text-white pl-4 pr-3 shadow-md">
                      <span className="text-sm font-semibold tracking-wide">{symptom.label}</span>
                      <button onClick={() => toggleSymptom(symptom.key)} className="hover:bg-white/20 rounded-full p-0.5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold">
                  {search ? 'Search Results' : showAll ? 'All Symptoms' : 'Common Symptoms'}
                </h3>
                <span className="text-sm text-slate-500">
                  {loadingSymptoms ? 'Loading...' : `Showing ${displayedSymptoms.length} of ${allSymptoms.length} symptoms`}
                </span>
              </div>
              {loadingSymptoms ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {displayedSymptoms.map(symptom => {
                    const isSelected = selectedKeys.includes(symptom.key);
                    return (
                      <button
                        key={symptom.key}
                        onClick={() => toggleSymptom(symptom.key)}
                        className={`flex items-center justify-center px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                          isSelected 
                            ? 'bg-primary text-white shadow-sm' 
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary'
                        }`}
                      >
                        {symptom.label}
                      </button>
                    );
                  })}
                </div>
                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setShowAll(true)}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-dashed border-primary/30 text-primary font-bold text-sm hover:bg-primary/5 hover:border-primary/50 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">expand_more</span>
                      Show All {allSymptoms.length} Symptoms
                    </button>
                  </div>
                )}
                {showAll && !search && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setShowAll(false)}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">expand_less</span>
                      Show Less
                    </button>
                  </div>
                )}
                </>
              )}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
              <button
                onClick={handleDiagnose}
                disabled={diagnosing || selectedKeys.length === 0}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-xl text-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{diagnosing ? 'Analyzing symptoms...' : `Get Diagnosis (${selectedKeys.length} symptoms selected)`}</span>
                <span className="material-symbols-outlined">analytics</span>
              </button>
              <p className="text-center text-xs text-slate-400 mt-4">
                Note: This is an AI-driven tool for information purposes and not a substitute for professional medical advice.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 px-4 text-center border-t border-primary/5 bg-white dark:bg-background-dark">
        <p className="text-slate-500 text-sm">MediDiag Health Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
