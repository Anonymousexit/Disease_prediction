import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function DoctorRegistration() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialization, setSpecialization] = useState('General Practice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const doctor = await api.registerDoctor({ name, email, password, specialization });
      sessionStorage.setItem('doctor', JSON.stringify(doctor));
      navigate('/doctor/dashboard');
    } catch (err: any) {
      if (err.message.includes('409')) {
        setError('A doctor with this email already exists.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F3E5F5] dark:bg-background-dark font-display min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[520px] bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden">
        <div className="p-8 md:p-12">
          <header className="flex flex-col items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="size-10 text-primary">
                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd"></path>
                </svg>
              </div>
              <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight">MediDiag</h1>
            </div>
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 border border-primary/20">
              <span className="text-primary text-sm font-semibold tracking-wide uppercase">Doctor Registration</span>
            </div>
          </header>

          <div className="text-center mb-6">
            <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-bold leading-tight">Create Your Account</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Register as a doctor to access the clinical dashboard and manage referrals.</p>
          </div>

          <form className="space-y-5" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold px-1">Full Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4 transition-all"
                placeholder="Dr. Full Name"
                type="text"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold px-1">Email Address</label>
              <input
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4 transition-all"
                placeholder="name@hospital.com"
                type="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold px-1">Specialization</label>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                title="Select specialization"
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4 transition-all"
              >
                <option value="General Practice">General Practice</option>
                <option value="Internal Medicine">Internal Medicine</option>
                <option value="Infectious Disease">Infectious Disease</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Family Medicine">Family Medicine</option>
                <option value="Emergency Medicine">Emergency Medicine</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Pulmonology">Pulmonology</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold px-1">Password</label>
                <input
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4 transition-all"
                  placeholder="••••••••"
                  type="password"
                  minLength={6}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold px-1">Confirm Password</label>
                <input
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4 transition-all"
                  placeholder="••••••••"
                  type="password"
                  minLength={6}
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              type="submit"
            >
              {loading ? 'Creating Account...' : 'Register'}
              <span className="material-symbols-outlined text-lg">person_add</span>
            </button>
          </form>

          <footer className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
              Already have an account? <a className="text-primary font-bold hover:underline" href="/doctor">Sign in here</a>
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Are you a patient? <a className="text-primary font-bold hover:underline" href="/">Go to Patient Portal</a>
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
