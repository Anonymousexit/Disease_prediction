import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Referral, type Stats } from '../api';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const doctor = JSON.parse(sessionStorage.getItem('doctor') || '{}');
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, completed: 0 });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getStats(), api.getReferrals()])
      .then(([s, r]) => { setStats(s); setReferrals(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex flex-col">
      {/* ── Top Header Bar ── */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark/50 flex items-center justify-between px-6 md:px-8 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg">
            <span className="material-symbols-outlined text-white text-xl">medical_services</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">MediDiag</h2>
          <span className="hidden sm:inline-block text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Doctor Portal</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 mr-2">
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {(doctor.name || 'D')[0]}
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{doctor.name || 'Doctor'}</p>
              <p className="text-[10px] text-slate-500 font-medium">{doctor.specialization || 'General Practice'}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary/5 transition-colors">
            <span className="material-symbols-outlined text-lg">person</span>
            <span className="hidden md:inline">Patient Portal</span>
          </button>
          <button onClick={() => { sessionStorage.removeItem('doctor'); navigate('/doctor'); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
            <span className="material-symbols-outlined text-lg">logout</span>
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1">
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome, {doctor.name?.split(' ')[0] || 'Doctor'}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-5 shadow-sm">
              <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">assignment</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Referrals</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{stats.total}</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-5 shadow-sm">
              <div className="size-14 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <span className="material-symbols-outlined text-3xl">pending_actions</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{stats.pending}</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-5 shadow-sm">
              <div className="size-14 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{stats.completed}</span>
                </div>
              </div>
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Referrals</h2>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Disease / Condition</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Confidence</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading referrals...</td></tr>
                  ) : referrals.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No referrals yet.</td></tr>
                  ) : (
                    referrals.map(ref => (
                    <tr key={ref.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full flex items-center justify-center font-bold text-xs bg-primary/20 text-primary">{ref.patient_name?.[0] || '?'}</div>
                          <span className="font-semibold text-sm">{ref.patient_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{ref.predicted_disease}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${ref.confidence}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-primary">{ref.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${ref.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{ref.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => navigate(`/doctor/referral/${ref.id}`)} className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">Review →</button>
                      </td>
                    </tr>
                  )))
                  }
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
