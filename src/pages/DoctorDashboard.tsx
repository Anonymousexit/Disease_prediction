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
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display flex min-h-screen">
      <aside className="w-72 bg-primary text-white flex flex-col fixed h-full shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-primary/20">
          <div className="bg-white p-1.5 rounded-lg">
            <span className="material-symbols-outlined text-primary text-2xl">medical_services</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">MediDiag</h2>
        </div>
        <div className="p-6 flex flex-col gap-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-12 rounded-full border-2 border-white/20 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDfNxui4YKxZe-uylfei2Mj50_I6xdgVT_eeEZgMnphmmZ1WXgBG8OTzUk1ZSAxuG8ZgiDSTdSb5TBcWSNa6jGBp26AIx0QphOIID9HWxRvmM-eLPMg0cxXk9Jm6z-NySZAzAOFsdLbAxOeY93qWKt5elMRD9e97NYebtNmOHsXcqlKp_Y9j06e2M0n0GPI8JQL66yD7Mk4Z6IqDTmgMytjS89G4pCO4FUa3A44ex7oHof0euqf2iPR_ysSHIo4SW97iA9v1ux4eHeL')" }}></div>
            <div>
              <p className="font-bold text-sm leading-tight">{doctor.name || 'Doctor'}</p>
              <p className="text-primary/70 text-xs font-medium text-white/80">{doctor.specialization || 'MediDiag'}</p>
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            <a className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-white font-medium" href="#">
              <span className="material-symbols-outlined">dashboard</span>
              <span>Dashboard</span>
            </a>
            <a className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-white/80 font-medium" href="#">
              <span className="material-symbols-outlined">group</span>
              <span>My Referrals</span>
            </a>
            <a className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-white/80 font-medium" href="#">
              <span className="material-symbols-outlined">folder_shared</span>
              <span>Patient Records</span>
            </a>
          </nav>
        </div>
        <div className="mt-auto p-6">
          <button onClick={() => navigate('/doctor')} className="flex w-full items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-white/80 font-medium">
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark/50 flex items-center justify-between px-8 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 w-96">
            <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 outline-none" placeholder="Search patients or diagnosis..." type="text" />
          </div>
          <div className="flex items-center gap-4">
            <button className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
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
              <button className="text-primary font-semibold text-sm hover:underline">View all</button>
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
