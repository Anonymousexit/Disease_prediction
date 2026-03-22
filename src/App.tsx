/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PatientLogin from './pages/PatientLogin';
import PatientRegistration from './pages/PatientRegistration';
import SymptomSelection from './pages/SymptomSelection';
import DiagnosisResult from './pages/DiagnosisResult';
import DiagnosisHistory from './pages/DiagnosisHistory';
import DoctorLogin from './pages/DoctorLogin';
import DoctorRegistration from './pages/DoctorRegistration';
import DoctorDashboard from './pages/DoctorDashboard';
import ReferralDetail from './pages/ReferralDetail';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PatientLogin />} />
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/patient/register" element={<PatientRegistration />} />
        <Route path="/symptoms" element={<SymptomSelection />} />
        <Route path="/diagnosis" element={<DiagnosisResult />} />
        <Route path="/history" element={<DiagnosisHistory />} />
        <Route path="/doctor" element={<DoctorLogin />} />
        <Route path="/doctor/register" element={<DoctorRegistration />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/referral/:id" element={<ReferralDetail />} />
      </Routes>
    </Router>
  );
}
