import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Symptom } from '../api';
import NotificationBell from '../components/NotificationBell';

export default function DescribeSymptoms() {
  const navigate = useNavigate();
  const patient = JSON.parse(sessionStorage.getItem('patient') || '{}');

  const [description, setDescription] = useState('');
  const [extractedSymptoms, setExtractedSymptoms] = useState<Symptom[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'input' | 'confirm'>('input');

  // Phase 1: Send text to backend → Gemini extracts symptoms
  const handleExtract = async () => {
    if (!description.trim()) return;
    setExtracting(true);
    setError('');
    try {
      const matched = await api.extractSymptoms(description);
      if (matched.length === 0) {
        setError(
          'We couldn\'t identify specific symptoms from your description. Try being more specific, or use the symptom selector instead.'
        );
        return;
      }
      setExtractedSymptoms(matched);
      setSelectedKeys(matched.map((s) => s.key));
      setPhase('confirm');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze your description. Please try again.');
    } finally {
      setExtracting(false);
    }
  };

  // Phase 2: Confirm and diagnose
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

  const toggleSymptom = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="bg-[#F3E5F5] dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      {/* ── Header ── */}
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
          <button
            onClick={() => navigate('/history')}
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 border border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors"
          >
            <span className="truncate">View History</span>
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem('patient');
              navigate('/patient/login');
            }}
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-red-50 border border-red-200 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors gap-1"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="truncate">Logout</span>
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden border border-slate-100 dark:border-slate-800 p-8 sm:p-12">

          {/* ── Phase 1: Text Input ── */}
          {phase === 'input' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    stethoscope
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                  What is bothering you today?
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-lg mx-auto">
                  Describe how you are feeling in your own words. Our AI will analyze your description to help identify potential symptoms and prepare for your diagnosis.
                </p>
              </div>

              <div className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
                )}

                <div className="relative">
                  <label className="sr-only" htmlFor="symptom-description">
                    Symptom Description
                  </label>
                  <textarea
                    id="symptom-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-shadow text-base placeholder-slate-400 outline-none"
                    placeholder="e.g., I have been feeling very tired lately with a sharp pain in my chest and a persistent dry cough..."
                    rows={6}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm border border-slate-100 dark:border-slate-700">
                    Try to be as detailed as possible
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-2">
                  <button
                    onClick={handleExtract}
                    disabled={extracting || !description.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl h-14 px-6 bg-primary hover:bg-primary/90 text-white text-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {extracting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Analyzing your symptoms...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to Diagnosis</span>
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate('/symptoms')}
                    className="w-full flex items-center justify-center rounded-xl h-12 px-6 bg-transparent text-primary hover:bg-primary/5 text-sm font-semibold transition-colors"
                  >
                    Or select symptoms manually
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Phase 2: Confirm Extracted Symptoms ── */}
          {phase === 'confirm' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                  <span className="material-symbols-outlined text-3xl">checklist</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                  We identified these symptoms
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-lg mx-auto">
                  Review the symptoms extracted from your description. You can remove any that don't apply before proceeding.
                </p>
              </div>

              {/* Show original description */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">format_quote</span>
                  Your description
                </p>
                <p className="text-slate-700 dark:text-slate-300 text-sm italic">"{description}"</p>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
              )}

              {/* Extracted symptom chips */}
              <div className="mb-8 p-5 bg-primary/5 rounded-xl border border-primary/10">
                <h3 className="text-primary text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Matched Symptoms ({selectedKeys.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {extractedSymptoms.map((symptom) => {
                    const isSelected = selectedKeys.includes(symptom.key);
                    return (
                      <button
                        key={symptom.key}
                        onClick={() => toggleSymptom(symptom.key)}
                        className={`flex h-9 items-center justify-center gap-x-2 rounded-full pl-4 pr-3 transition-all ${
                          isSelected
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 line-through'
                        }`}
                      >
                        <span className="text-sm font-semibold tracking-wide">{symptom.label}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-base">close</span>
                        )}
                        {!isSelected && (
                          <span className="material-symbols-outlined text-base">add</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDiagnose}
                  disabled={diagnosing || selectedKeys.length === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-xl h-14 px-6 bg-primary hover:bg-primary/90 text-white text-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {diagnosing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Getting diagnosis...</span>
                    </>
                  ) : (
                    <>
                      <span>Get Diagnosis ({selectedKeys.length} symptoms)</span>
                      <span className="material-symbols-outlined text-xl">analytics</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setPhase('input');
                    setExtractedSymptoms([]);
                    setSelectedKeys([]);
                    setError('');
                  }}
                  className="w-full flex items-center justify-center gap-1 rounded-xl h-12 px-6 bg-transparent text-slate-500 hover:text-primary hover:bg-primary/5 text-sm font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Edit your description
                </button>

                <button
                  onClick={() => navigate('/symptoms')}
                  className="w-full flex items-center justify-center rounded-xl h-10 px-6 bg-transparent text-primary hover:bg-primary/5 text-sm font-semibold transition-colors"
                >
                  Or select symptoms manually
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="py-6 px-4 text-center">
        <p className="text-slate-400 text-sm">MediDiag Health Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
