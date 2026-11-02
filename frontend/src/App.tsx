import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthApp from './modules/auth/App';
import PatientApp from './modules/patient/App';
import CaregiverApp from './modules/caregiver/App';
import MusicApp from './modules/music/App';
import GamesApp from './modules/games/App';
import HealthWorkerApp from './modules/healthworker/App';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthApp />} />
        <Route path="/auth" element={<AuthApp />} />
        <Route path="/patient/*" element={<PatientApp />} />
        <Route path="/home/*" element={<Navigate to="/patient" replace />} />
        <Route path="/caregiver/*" element={<CaregiverApp />} />
        <Route path="/music/*" element={<MusicApp />} />
        <Route path="/games/*" element={<GamesApp />} />
        <Route path="/vault/*" element={<GamesApp />} />
        <Route path="/healthworker/*" element={<HealthWorkerApp />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
