import React, { useState, useEffect } from 'react';
import { CaregiverNavbar } from './components/CaregiverNavbar';
import { UnlinkedEmptyState } from './components/UnlinkedEmptyState';
import { LinkPatientModal } from './components/LinkPatientModal';
import { PatientDashboardView } from './components/PatientDashboardView';
import { CaregiverSession, LinkedPatient, PatientOverview } from './types';
import { ShieldAlert, RefreshCw } from 'lucide-react';

const fetchCaregiverSession = (): CaregiverSession => {
  try {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get('userId') || params.get('uid');
      const queryName = params.get('name') || params.get('user');
      if (queryId || queryName) {
        const userId = queryId || `user_${(queryName || 'caregiver').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const name = (queryName ? queryName.trim() : 'Rahul Sharma');
        const session: CaregiverSession = { userId, name, role: 'caregiver' };
        try {
          localStorage.setItem('neuronova_auth_session', JSON.stringify({
            ...session,
            signedInAt: new Date().toISOString(),
          }));
        } catch (_) {}
        return session;
      }
    }

    const raw = localStorage.getItem('neuronova_auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      const name = (parsed?.name || parsed?.displayName || 'Rahul Sharma').trim();
      const userId = parsed?.userId || parsed?.uid || `user_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      return { userId, name, role: 'caregiver' };
    }
  } catch (err) {
    console.warn('Could not read caregiver session:', err);
  }

  return {
    userId: 'user_rahul_caregiver',
    name: 'Rahul Sharma',
    role: 'caregiver',
  };
};

export const App: React.FC = () => {
  const [session] = useState<CaregiverSession>(() => fetchCaregiverSession());
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [overview, setOverview] = useState<PatientOverview | null>(null);
  
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Fetch linked patients for this caregiver
  const loadPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const res = await fetch(`http://localhost:5001/api/caregiver/${encodeURIComponent(session.userId)}/patients`);
      if (res.ok) {
        const data = await res.json();
        const list: LinkedPatient[] = data.patients || [];
        setPatients(list);

        // Auto-select first patient if none selected or selected patient no longer linked
        if (list.length > 0) {
          if (!selectedPatientId || !list.some(p => p.patientId === selectedPatientId)) {
            setSelectedPatientId(list[0].patientId);
          }
        } else {
          setSelectedPatientId(null);
          setOverview(null);
        }
      }
    } catch (err) {
      console.warn('Failed to load linked patients:', err);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [session.userId]);

  // 2. Fetch selected patient's overview (with link access control)
  useEffect(() => {
    if (!selectedPatientId) {
      setOverview(null);
      return;
    }

    let isSubscribed = true;
    setIsLoadingOverview(true);
    setAuthError(null);

    fetch(`http://localhost:5001/api/caregiver/${encodeURIComponent(session.userId)}/patient/${encodeURIComponent(selectedPatientId)}/overview`)
      .then(async res => {
        if (!isSubscribed) return null;
        if (res.status === 403) {
          const errData = await res.json();
          throw new Error(errData.error || 'Access Denied: You do not have an active link to this patient.');
        }
        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (!isSubscribed || !data) return;
        setOverview(data.overview);
      })
      .catch(err => {
        if (isSubscribed) {
          console.error('Failed to load patient overview:', err);
          setAuthError(err.message);
          setOverview(null);
        }
      })
      .finally(() => {
        if (isSubscribed) setIsLoadingOverview(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [session.userId, selectedPatientId]);

  // Handle successful linking
  const handleLinkSuccess = async (newPatientId: string) => {
    await loadPatients();
    if (newPatientId) {
      setSelectedPatientId(newPatientId);
    }
  };

  // Handle revoking link
  const handleRevokeLink = async (patientId: string) => {
    try {
      const res = await fetch('http://localhost:5001/api/caregiver/link/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          caregiverId: session.userId,
          status: 'revoked',
        }),
      });

      if (res.ok) {
        await loadPatients();
      }
    } catch (err) {
      console.error('Failed to revoke link:', err);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('neuronova_auth_session');
    } catch (_) {}
    window.location.href = 'http://localhost:5174/';
  };

  const currentPatientInfo = patients.find(p => p.patientId === selectedPatientId) || null;

  return (
    <div className="min-h-screen bg-sky-50/50 text-[#1A202C] flex flex-col font-brand-body relative selection:bg-cosmos-200 selection:text-cosmos-900">
      
      {/* Anime meadow photo background — clearly visible with high clarity & reduced white fog */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40 bg-cover bg-center bg-fixed z-0"
        style={{ backgroundImage: "url('/meadow-bg.png')" }}
      />
      {/* Soft translucent sky-and-meadow ambient tint */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-white/30 via-transparent to-white/40 z-0" />

      {/* Top Navigation */}
      <CaregiverNavbar
        caregiverName={session.name}
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={(id) => setSelectedPatientId(id)}
        onOpenLinkModal={() => setIsLinkModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Body */}
      <main className="flex-1 flex flex-col relative z-10">
        {isLoadingPatients ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="flex items-center space-x-3 text-forest-700 font-bold">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Loading connected loved ones...</span>
            </div>
          </div>
        ) : patients.length === 0 ? (
          /* Empty state when no patients linked */
          <UnlinkedEmptyState
            caregiverName={session.name}
            onOpenLinkModal={() => setIsLinkModalOpen(true)}
          />
        ) : authError ? (
          /* Access control error display */
          <div className="max-w-xl mx-auto w-full p-8 mt-12 bg-white rounded-3xl border-2 border-terracotta-200 text-center shadow-warm-sm">
            <ShieldAlert className="w-12 h-12 text-terracotta-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-terracotta-900 mb-2">
              Access Restricted
            </h3>
            <p className="text-sm text-[#1A202C]/70 mb-5">
              {authError}
            </p>
            <button
              onClick={() => loadPatients()}
              className="px-5 py-2.5 rounded-xl bg-forest-600 text-white font-bold text-xs"
            >
              Refresh Linked Patients
            </button>
          </div>
        ) : overview && currentPatientInfo ? (
          /* Primary Patient Dashboard View */
          <PatientDashboardView
            overview={overview}
            patientInfo={currentPatientInfo}
            onRevokeLink={handleRevokeLink}
            isLoading={isLoadingOverview}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="flex items-center space-x-3 text-forest-700 font-bold">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Fetching patient health vitals...</span>
            </div>
          </div>
        )}
      </main>

      {/* Link Patient Modal */}
      <LinkPatientModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        caregiverId={session.userId}
        onLinkSuccess={handleLinkSuccess}
      />

      {/* Footer */}
      <footer className="w-full border-t border-[#E8DFD1] py-5 px-4 text-center text-xs text-[#1A202C]/60 bg-cream-50/50">
        <p>NeuroNova Caregiver Command Hub • Supporting our devoted family caregivers and elders with dignity & love.</p>
      </footer>

    </div>
  );
};

export default App;
