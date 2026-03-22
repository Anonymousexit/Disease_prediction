import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function DoctorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const doctor = await api.loginDoctor(email, password);
      sessionStorage.setItem('doctor', JSON.stringify(doctor));
      navigate('/doctor/dashboard');
    } catch (err: any) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F3E5F5] dark:bg-background-dark font-display min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden">
        <div className="p-8 md:p-12">
          <header className="flex flex-col items-center gap-6 mb-10">
            <div className="flex items-center gap-3">
              <div className="size-10 text-primary">
                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd"></path>
                </svg>
              </div>
              <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight">MediDiag</h1>
            </div>
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 border border-primary/20">
              <span className="text-primary text-sm font-semibold tracking-wide uppercase">Doctor Portal</span>
            </div>
          </header>

          <div className="text-center mb-8">
            <h2 className="text-slate-900 dark:text-slate-100 text-3xl font-bold leading-tight">Welcome, Doctor.</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Please enter your credentials to access the clinical dashboard.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold px-1">
                Email Address
              </label>
              <div className="relative">
                <input required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4 transition-all" placeholder="name@hospital.com" type="email" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  Password
                </label>
                <a className="text-primary text-xs font-semibold hover:underline" href="#">Forgot Password?</a>
              </div>
              <div className="relative flex items-center">
                <input required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 pl-4 pr-12 transition-all" placeholder="••••••••" type="password" />
                <button className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center" type="button">
                  <span className="material-symbols-outlined">visibility</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" id="remember" type="checkbox" />
              <label className="text-slate-600 dark:text-slate-400 text-sm" htmlFor="remember">Keep me logged in for 24 hours</label>
            </div>

            <button disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60" type="submit">
              {loading ? 'Signing in...' : 'Sign In'}
              <span className="material-symbols-outlined text-lg">login</span>
            </button>
          </form>

          <footer className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
              Don't have an account? <a className="text-primary font-bold hover:underline" href="/doctor/register">Register here</a>
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
              Are you a patient? <a className="text-primary font-bold hover:underline" href="/">Go to Patient Portal</a>
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Protected by enterprise-grade 256-bit encryption. <br />
              Need technical support? <a className="text-primary font-medium hover:underline" href="#">Contact IT Helpdesk</a>
            </p>
          </footer>
        </div>
      </div>

      <div className="mt-8 flex gap-6 text-slate-400 dark:text-slate-600">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">verified_user</span>
          <span className="text-[10px] uppercase tracking-widest font-bold">HIPAA Compliant</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">lock</span>
          <span className="text-[10px] uppercase tracking-widest font-bold">SSL Secured</span>
        </div>
      </div>
    </div>
  );
}
