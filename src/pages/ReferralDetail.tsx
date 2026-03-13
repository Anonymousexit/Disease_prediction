import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type Referral } from '../api';

export default function ReferralDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getReferral(parseInt(id))
      .then(r => {
        setReferral(r);
        setNotes(r.doctor_notes || '');
        setStatus(r.status);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.updateReferral(parseInt(id), { status, doctor_notes: notes });
      navigate('/doctor/dashboard');
    } catch (err) {
      alert('Failed to save assessment.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-display text-slate-500 bg-background-light dark:bg-background-dark">Loading referral...</div>;
  if (!referral) return <div className="min-h-screen flex items-center justify-center font-display text-red-500 bg-background-light dark:bg-background-dark">Referral not found.</div>;

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/10 px-6 py-3 bg-white dark:bg-background-dark/50">
            <div className="flex items-center gap-4">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined">health_metrics</span>
              </div>
              <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-[-0.015em]">MediDiag</h2>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined">account_circle</span>
              </button>
            </div>
          </header>

          <main className="max-w-7xl mx-auto w-full px-6 py-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-primary/60 text-sm mb-4">
                <span className="cursor-pointer hover:underline" onClick={() => navigate('/doctor/dashboard')}>Referrals</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-primary font-semibold">Referral Detail</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <button onClick={() => navigate('/doctor/dashboard')} className="flex items-center gap-2 text-primary font-bold text-sm mb-2 hover:underline w-fit">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back to Referrals
                  </button>
                  <h1 className="text-3xl font-bold tracking-tight">Referral Detail / Case Review</h1>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold self-start ${referral.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>{referral.status === 'Pending' ? 'PENDING REVIEW' : 'COMPLETED'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary/10 overflow-hidden">
                  <div className="p-4 flex gap-4 items-start border-b border-primary/5">
                    <div className="w-20 h-20 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-primary">{referral.patient_name?.[0] || '?'}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{referral.patient_name}</h3>
                      <p className="text-slate-500 text-sm mb-2">Patient ID: #{referral.patient_id}</p>
                      <p className="text-slate-400 text-xs">Referred on {new Date(referral.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary/10 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary">psychology</span>
                    <h3 className="font-bold text-lg">AI Diagnosis Summary</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium">{referral.predicted_disease}</span>
                        <span className="text-primary font-bold">{referral.confidence}%</span>
                      </div>
                      <div className="w-full bg-primary/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${referral.confidence}%` }}></div>
                      </div>
                    </div>
                    {referral.probabilities && Object.entries(referral.probabilities)
                      .filter(([disease]) => disease !== referral.predicted_disease)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .map(([disease, prob]) => (
                        <div key={disease}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-medium">{disease}</span>
                            <span className="text-slate-400">{(prob as number).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-slate-300 dark:bg-slate-600 h-full rounded-full" style={{ width: `${prob}%` }}></div>
                          </div>
                        </div>
                      ))
                    }
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
                        <span className="text-xs font-bold text-primary">CONFIDENCE SCORE</span>
                      </div>
                      <p className="text-sm font-semibold">{referral.confidence >= 85 ? 'High' : 'Low'} Confidence ({referral.confidence}%)</p>
                      <p className="text-xs text-slate-500">{referral.confidence < 85 ? 'Below 85% threshold — specialist review required.' : 'Model prediction is above the confidence threshold.'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary/10 p-5">
                  <h3 className="font-bold text-lg mb-4">Reported Symptoms</h3>
                  <div className="flex flex-wrap gap-2">
                    {referral.symptoms && referral.symptoms.length > 0 ? referral.symptoms.map((symptom: string) => (
                      <span key={symptom} className="px-3 py-1.5 bg-[#673AB7] text-white text-xs font-medium rounded-full">{symptom}</span>
                    )) : <span className="text-slate-400 text-sm">No symptoms recorded.</span>}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary/20 p-6">
                  <h3 className="font-bold text-xl mb-6">Your Assessment</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Doctor's Notes</label>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-xl border-primary/20 bg-primary/5 focus:ring-primary focus:border-primary p-4 text-sm placeholder:text-slate-400 outline-none" placeholder="Enter clinical observations, secondary diagnosis thoughts, and recommended treatment plan..." rows={10}></textarea>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-primary/10 pt-6">
                      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full sm:w-auto">
                        <button onClick={() => setStatus('Pending')} className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-md transition-colors ${status === 'Pending' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                          Mark as Pending
                        </button>
                        <button onClick={() => setStatus('Completed')} className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-md transition-colors ${status === 'Completed' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                          Mark as Completed
                        </button>
                      </div>
                      <button disabled={saving} onClick={handleSave} className="w-full sm:w-auto px-8 py-3 bg-[#673AB7] text-white font-bold rounded-lg shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        <span className="material-symbols-outlined">save</span>
                        {saving ? 'Saving...' : 'Save Assessment'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-5 mt-auto self-end w-full lg:max-w-md">
                  <div className="flex items-center gap-2 mb-2 text-rose-700 dark:text-rose-400">
                    <span className="material-symbols-outlined text-lg">info</span>
                    <h4 className="font-bold text-sm">Referral Reason (from system)</h4>
                  </div>
                  <p className="text-sm text-rose-800 dark:text-rose-300 leading-relaxed italic">
                    "AI model prediction confidence ({referral.confidence}%) was below the 85% specialist-review threshold for {referral.predicted_disease}. Doctor consultation required for clinical validation and treatment authorization."
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-rose-600/60 dark:text-rose-400/60 uppercase font-bold">
                    <span>System Generated</span>
                    <span>Ref: #REF-{referral.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
