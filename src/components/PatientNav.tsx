import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

interface PatientNavProps {
  patientId?: number;
  patientName?: string;
}

export default function PatientNav({ patientId, patientName }: PatientNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'New Diagnosis', icon: 'edit_note', path: '/describe' },
    { label: 'History', icon: 'history', path: '/history' },
    { label: 'My Referrals', icon: 'send', path: '/referrals' },
  ];

  const isActive = (path: string) => {
    if (path === '/describe') {
      return location.pathname === '/describe' || location.pathname === '/symptoms';
    }
    return location.pathname === path;
  };

  const handleLogout = () => {
    sessionStorage.removeItem('patient');
    localStorage.removeItem('patient');
    navigate('/patient/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Top row: Brand + User info */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="size-9 flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 rounded-xl text-white shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-xl">medical_services</span>
            </div>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">MediDiag</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 mr-1">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Patient</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{patientName || 'Patient'}</p>
              </div>
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-full p-0.5">
                <div className="bg-primary rounded-full size-9 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                  {(patientName || 'P')[0]}
                </div>
              </div>
            </div>
            <ThemeToggle />
            <NotificationBell patientId={patientId} />
            <button
              onClick={handleLogout}
              className="flex items-center justify-center overflow-hidden rounded-lg h-9 px-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors gap-1"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Bottom row: Navigation tabs */}
        <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide" id="patient-nav">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => navigate(item.path)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all whitespace-nowrap
                  ${active
                    ? 'text-primary bg-primary/5 dark:bg-primary/10 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-primary after:rounded-t-full'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }
                `}
              >
                <span className={`material-symbols-outlined text-base ${active ? 'text-primary' : ''}`} style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
