import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthApp from './modules/auth/App';
import PatientApp from './modules/patient/App';
import CaregiverApp from './modules/caregiver/App';
import MusicApp from './modules/music/App';
import GamesApp from './modules/games/App';
import HealthWorkerApp from './modules/healthworker/App';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[NeuroNova ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white p-8 rounded-3xl border-2 border-forest-300 shadow-xl flex flex-col items-center">
            <span className="text-4xl mb-3">🌿</span>
            <h2 className="text-2xl font-extrabold text-[#1A202C] mb-2 font-[Outfit]">Something went softly wrong</h2>
            <p className="text-sm text-[#1A202C]/70 mb-6 font-[Plus_Jakarta_Sans]">
              {this.state.error?.message || 'A gentle pause occurred. Let us return you to your home screen.'}
            </p>
            <button
              onClick={() => { window.location.href = '/patient'; }}
              className="px-6 py-3 rounded-2xl bg-forest-600 hover:bg-forest-700 text-white font-bold transition-all shadow-md cursor-pointer"
            >
              Return to Patient Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthApp />} />
          <Route path="/auth" element={<AuthApp />} />
          <Route path="/auth/*" element={<AuthApp />} />
          <Route path="/patient" element={<PatientApp />} />
          <Route path="/patient/*" element={<PatientApp />} />
          <Route path="/home" element={<Navigate to="/patient" replace />} />
          <Route path="/home/*" element={<Navigate to="/patient" replace />} />
          <Route path="/caregiver" element={<CaregiverApp />} />
          <Route path="/caregiver/*" element={<CaregiverApp />} />
          <Route path="/music" element={<MusicApp />} />
          <Route path="/music/*" element={<MusicApp />} />
          <Route path="/games" element={<GamesApp />} />
          <Route path="/games/*" element={<GamesApp />} />
          <Route path="/vault" element={<GamesApp />} />
          <Route path="/vault/*" element={<GamesApp />} />
          <Route path="/healthworker" element={<HealthWorkerApp />} />
          <Route path="/healthworker/*" element={<HealthWorkerApp />} />
          {/* Fallback to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
