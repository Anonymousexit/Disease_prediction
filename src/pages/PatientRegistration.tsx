import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function PatientRegistration() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const patient = await api.createPatient({
        full_name: fullName,
        age: parseInt(age),
        gender,
        email: email || undefined,
        phone: phone || undefined,
      } as any);
      sessionStorage.setItem('patient', JSON.stringify(patient));
      navigate('/symptoms');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F3E5F5] dark:bg-background-dark min-h-screen font-display flex flex-col">
      <header className="bg-white dark:bg-slate-900 border-b border-primary/10 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-primary size-8">
              <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z" fillRule="evenodd"></path>
              </svg>
            </div>
            <h1 className="text-primary text-2xl font-bold tracking-tight">MediDiag</h1>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">psychology</span>
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">AI-Powered Disease Diagnosis</p>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
            <button 
              onClick={() => navigate('/doctor')}
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">medical_services</span>
              Doctor Portal
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-4 py-12 md:py-20 flex-1">
        <div className="w-full max-w-[520px] bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-slate-900 dark:text-slate-100 text-3xl font-bold leading-tight mb-2">Patient Registration</h2>
              <p className="text-slate-500 dark:text-slate-400 text-base">Please fill in your details to start the diagnostic process</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">person</span>
                  <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="John Doe" type="text" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold">Age</label>
                  <input required value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Years" type="number" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold">Gender</label>
                  <select required value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                    <option disabled value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold flex justify-between">
                  Email
                  <span className="text-slate-400 text-xs font-normal italic">Optional</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="email@example.com" type="email" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold flex justify-between">
                  Phone Number
                  <span className="text-slate-400 text-xs font-normal italic">Optional</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">call</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="+1 (555) 000-0000" type="tel" />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
              )}

              <button disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all transform hover:translate-y-[-1px] active:translate-y-[0px] mt-6 disabled:opacity-60" type="submit">
                <span>{loading ? 'Registering...' : 'Continue to Diagnosis'}</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>

            <p className="mt-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              Your data is processed securely and encrypted. <br />
              By continuing, you agree to our <a className="underline hover:text-primary" href="#">Terms of Service</a>.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-8 opacity-60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-600">verified_user</span>
            <span className="text-slate-600 font-semibold text-sm">HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-600">lock</span>
            <span className="text-slate-600 font-semibold text-sm">SSL Secured</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-600">clinical_notes</span>
            <span className="text-slate-600 font-semibold text-sm">Clinical Accuracy</span>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-8 text-center">
        <p className="text-slate-500 text-sm"> MediDiag Health Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
