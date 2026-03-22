import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, type Doctor, type DiagnosisResult as DiagResult } from '../api';

export default function DiagnosisResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const result: DiagResult | null = location.state?.result || null;
  const patient = JSON.parse(sessionStorage.getItem('patient') || '{}');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [sendingReferral, setSendingReferral] = useState(false);
  const [referralSent, setReferralSent] = useState(false);
  const [error, setError] = useState('');

  const isHighConfidence = result ? !result.requires_referral : true;

  useEffect(() => {
    if (result?.requires_referral) {
      api.getDoctors().then(docs => {
        setDoctors(docs);
        if (docs.length > 0) setSelectedDoctor(String(docs[0].id));
      });
    }
  }, [result]);

  const handleSendReferral = async () => {
    if (!result || !selectedDoctor) return;
    setSendingReferral(true);
    setError('');
    try {
      await api.createReferral({
        diagnosis_id: result.diagnosis_id,
        patient_id: result.patient_id,
        doctor_id: parseInt(selectedDoctor),
      });
      setReferralSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send referral.');
    } finally {
      setSendingReferral(false);
    }
  };

  if (!result) {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Diagnosis Data</h2>
          <p className="text-slate-500 mb-6">Please start a diagnosis from the symptom selection page.</p>
          <button onClick={() => navigate('/symptoms')} className="px-6 py-3 bg-primary text-white rounded-lg font-bold">
            Go to Symptoms
          </button>
        </div>
      </div>
    );
  }

  const probEntries = Object.entries(result.probabilities);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 md:px-10 py-3 sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <div className="size-8 flex items-center justify-center bg-primary rounded-lg text-white">
                <span className="material-symbols-outlined">medical_services</span>
              </div>
              <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">MediDiag</h2>
            </div>
            <div className="flex flex-1 justify-end gap-4 items-center">
              <div className="hidden md:flex flex-col items-end mr-2">
                <p className="text-slate-900 dark:text-white text-sm font-bold">{patient.full_name || 'Patient'}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Patient ID: #{patient.id || '—'}</p>
              </div>
              <div className="bg-primary/10 rounded-full size-10 flex items-center justify-center border border-primary/20 text-primary font-bold text-lg">
                {(patient.full_name || 'P')[0]}
              </div>
              <button onClick={() => { sessionStorage.removeItem('patient'); navigate('/patient/login'); }} className="flex items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-red-50 border border-red-200 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors gap-1">
                <span className="material-symbols-outlined text-sm">logout</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

          <main className="flex flex-1 justify-center py-8 px-4 md:px-10">
            <div className={`layout-content-container flex flex-col flex-1 gap-6 ${isHighConfidence ? 'max-w-[800px]' : 'max-w-[960px]'}`}>
              
              {isHighConfidence ? (
                <>
                  <div className="flex flex-col gap-2">
                    <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Diagnosis Result</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Analysis Complete • Powered by ML Model</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border-2 border-success rounded-xl p-8 flex flex-col items-center text-center shadow-sm">
                    <span className="text-success font-semibold tracking-wider text-sm uppercase mb-2">Predicted Condition</span>
                    <h2 className="text-success text-5xl md:text-6xl font-black mb-6">{result.disease}</h2>
                    <div className="w-full max-w-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Confidence Score</span>
                        <span className="text-success font-bold">{result.confidence}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                        <div className="bg-success h-full rounded-full" style={{ width: `${result.confidence}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-success">check_circle</span>
                    <p className="text-emerald-800 dark:text-emerald-200 text-sm font-medium">
                      High confidence result. No referral needed — but always confirm with a doctor.
                    </p>
                  </div>

                  {result.medicine && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-600">medication</span>
                      <div>
                        <p className="text-blue-800 dark:text-blue-200 text-sm font-bold mb-1">Recommended Medicine</p>
                        <p className="text-blue-700 dark:text-blue-300 text-sm">{result.medicine}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-6">All Disease Probabilities</h3>
                    <div className="space-y-5">
                      {probEntries.map(([name, prob]) => (
                        <div key={name} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{name}</span>
                            <span className="text-slate-500 dark:text-slate-400">{prob}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-accent h-full rounded-full" style={{ width: `${prob}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-orange-400 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-1/3 aspect-video rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-orange-400 text-7xl">warning</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-orange-500 text-sm">warning</span>
                          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Preliminary Diagnosis</p>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{result.disease}</h2>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-orange-500">{result.confidence}%</span>
                            <span className="text-sm text-slate-500">AI Confidence Score</span>
                          </div>
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs font-bold rounded-full uppercase">
                            Low Confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {result.medicine && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-600">medication</span>
                      <div>
                        <p className="text-blue-800 dark:text-blue-200 text-sm font-bold mb-1">Recommended Medicine</p>
                        <p className="text-blue-700 dark:text-blue-300 text-sm">{result.medicine}</p>
                      </div>
                    </div>
                  )}

                  <section>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">analytics</span>
                      All Disease Probabilities
                    </h3>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50">
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Condition</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Probability</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                          {probEntries.map(([name, prob]) => (
                            <tr key={name} className="hover:bg-primary/5 transition-colors">
                              <td className="px-6 py-4 text-sm font-medium">{name}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-grow bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className={`${name === result.disease ? 'bg-orange-400' : 'bg-primary/40'} h-full`} style={{ width: `${prob}%` }}></div>
                                  </div>
                                  <span className="text-sm font-bold w-10">{prob}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-6">
                    {referralSent ? (
                      <div className="flex items-center gap-3 text-green-700">
                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                        <div>
                          <h3 className="text-lg font-bold">Referral Sent Successfully!</h3>
                          <p className="text-sm mt-1">Your case has been forwarded to the doctor for review.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-lg font-bold text-orange-900 dark:text-orange-200">Doctor Referral Recommended</h3>
                            <p className="text-orange-800 dark:text-orange-300 text-sm mt-1">
                              Since the confidence score is below 85%, we highly recommend consulting a certified specialist to verify these results and begin appropriate treatment.
                            </p>
                          </div>
                          {error && <p className="text-red-600 text-sm">{error}</p>}
                          <div className="max-w-md">
                            <label className="block text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wide mb-1">Select a Doctor</label>
                            <div className="relative">
                              <select
                                value={selectedDoctor}
                                onChange={(e) => setSelectedDoctor(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-800 rounded-lg appearance-none text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                              >
                                {doctors.map(doc => (
                                  <option key={doc.id} value={doc.id}>
                                    {doc.name} - {doc.specialization}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-orange-500">
                                <span className="material-symbols-outlined">expand_more</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={handleSendReferral}
                            disabled={sendingReferral}
                            className="w-full md:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined">send</span>
                            {sendingReferral ? 'Sending...' : 'Send Referral'}
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                </>
              )}

              <div className="flex justify-center pt-8 pb-12">
                <button onClick={() => navigate('/symptoms')} className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined">arrow_back</span>
                  Start New Diagnosis
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
