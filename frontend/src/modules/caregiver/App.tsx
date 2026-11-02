import React, { useState, useEffect } from 'react';
import { ModernSidebar } from './components/ModernSidebar';
import { ModernTopHeader } from './components/ModernTopHeader';
import { ModernPatientDashboard } from './components/ModernPatientDashboard';
import { UnlinkedEmptyState } from './components/UnlinkedEmptyState';
import { LinkPatientModal } from './components/LinkPatientModal';
import { CaregiverSettingsModal } from './components/CaregiverSettingsModal';
import { IncomingCallModal } from './components/IncomingCallModal';
import { TaskManagerModal } from './components/TaskManagerModal';
import { VoiceMessagesModal } from './components/VoiceMessagesModal';
import { caregiverSocketService } from './services/socketService';
import { CaregiverSession, LinkedPatient, PatientOverview } from './types';
import { ShieldAlert, RefreshCw, AlertTriangle, CheckCircle2, Mic, X } from 'lucide-react';
import { BACKEND_URL, AUTHPAGE_URL } from './config/urls';

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
  const [isTaskManagerOpen, setIsTaskManagerOpen] = useState(false);
  const [isVoiceMessagesOpen, setIsVoiceMessagesOpen] = useState(false);
  const [unreadVoiceNotesCount, setUnreadVoiceNotesCount] = useState(0);
  const [missedTasksCount, setMissedTasksCount] = useState(0);
  const [activeAlert, setActiveAlert] = useState<{ id: string; title: string; message: string; type: 'success' | 'warning' | 'alert' } | null>(null);

  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [isRefreshingAI, setIsRefreshingAI] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Fetch linked patients for this caregiver
  const loadPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/caregiver/${encodeURIComponent(session.userId)}/patients`);
      if (res.ok) {
        const data = await res.json();
        const list: LinkedPatient[] = data.patients || [];
        setPatients(list);

        // Auto-select first patient (preferring active profile with records)
        if (list.length > 0) {
          if (!selectedPatientId || !list.some(p => p.patientId === selectedPatientId)) {
            const preferred = list.find(p => p.patientId.includes('kamla')) || list[0];
            setSelectedPatientId(preferred.patientId);
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

  // Load overview function
  const loadOverview = async (patientId: string) => {
    setIsLoadingOverview(true);
    setAuthError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/caregiver/${encodeURIComponent(session.userId)}/patient/${encodeURIComponent(patientId)}/overview`);
      if (res.status === 403) {
        const errData = await res.json();
        throw new Error(errData.error || 'Access Denied: You do not have an active link to this patient.');
      }
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setOverview(data.overview);
    } catch (err: any) {
      console.error('Failed to load patient overview:', err);
      setAuthError(err.message);
      setOverview(null);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  // 2. Fetch selected patient's overview (with link access control)
  useEffect(() => {
    if (!selectedPatientId) {
      setOverview(null);
      return;
    }
    loadOverview(selectedPatientId);
  }, [session.userId, selectedPatientId]);

  // 3. Real-time WebSocket connection for caregiver events
  useEffect(() => {
    const socket = caregiverSocketService.connect(session.userId, 'caregiver');

    socket.on('patient:message:new', (data: any) => {
      setUnreadVoiceNotesCount(prev => prev + 1);
      setActiveAlert({
        id: `msg_${Date.now()}`,
        title: `New Voice Message from ${data.patientName || 'Patient'}`,
        message: `"${data.transcript || 'Voice note recorded'}"`,
        type: 'alert',
      });
    });

    socket.on('patient:task:completed', (data: any) => {
      setActiveAlert({
        id: `task_comp_${Date.now()}`,
        title: 'Task Completed by Patient',
        message: `${data.title || 'Scheduled routine'} was marked as completed.`,
        type: 'success',
      });
      if (selectedPatientId) {
        loadOverview(selectedPatientId);
      }
    });

    socket.on('patient:task:missed', (data: any) => {
      setMissedTasksCount(prev => prev + 1);
      const taskName = data.taskTitle || data.title || 'Scheduled task';
      const scheduledTime = data.scheduledTime || 'the scheduled time';
      setActiveAlert({
        id: `task_miss_${Date.now()}`,
        title: '⚠️ Missed Scheduled Task',
        message: `"${taskName}" was scheduled for ${scheduledTime} and has passed the grace period.`,
        type: 'warning',
      });
    });

    socket.on('healthworker:concern:new', (data: any) => {
      setActiveAlert({
        id: `hw_${Date.now()}`,
        title: '⚠️ Health Worker Clinical Alert',
        message: `${data.concernType}: ${data.description}`,
        type: 'warning',
      });
    });

    return () => {
      socket.off('patient:message:new');
      socket.off('patient:task:completed');
      socket.off('patient:task:missed');
      socket.off('healthworker:concern:new');
    };
  }, [session.userId, selectedPatientId]);

  // Auto-dismiss floating notifications after 5 seconds
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [activeAlert]);

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
      const res = await fetch(`${BACKEND_URL}/api/caregiver/link/status`, {
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

  // Handle on-demand AI Cognitive Analysis Regeneration
  const handleRefreshAI = async () => {
    if (!selectedPatientId || !session?.userId || isRefreshingAI) return;
    setIsRefreshingAI(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/caregiver/${encodeURIComponent(session.userId)}/patient/${encodeURIComponent(selectedPatientId)}/ai-analysis`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data && data.aiAnalysis) {
        setOverview(prev => prev ? { ...prev, aiCognitiveAnalysis: data.aiAnalysis } : prev);
      }
    } catch (err) {
      console.error('Failed to regenerate AI cognitive analysis:', err);
    } finally {
      setIsRefreshingAI(false);
    }
  };

  const handleRefreshAll = async () => {
    if (!selectedPatientId) return;
    try {
      await loadOverview(selectedPatientId);
      setActiveAlert({
        id: `refreshed_${Date.now()}`,
        title: 'Analytics Refreshed',
        message: 'All patient telemetry, cognition data, and routine vitals have been updated.',
        type: 'success',
      });
      setTimeout(() => {
        setActiveAlert(null);
      }, 3500);
    } catch (err) {
      console.warn('Failed to refresh analytics:', err);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('neuronova_auth_session');
    } catch (_) {}
    window.location.href = `${AUTHPAGE_URL}/`;
  };

  const [activeTab, setActiveTab] = useState('analytics');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const currentPatientInfo = patients.find(p => p.patientId === selectedPatientId) || null;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'dashboard') {
      const el = document.getElementById('vitals-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (['analytics', 'games', 'music', 'routine', 'voice', 'reports'].includes(tab)) {
      const el = document.getElementById('activity-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F4F2EC] text-[#111625] flex font-brand-body relative selection:bg-[#E86D7C]/25 selection:text-[#111625]">
      
      {/* Left Slim Modern Dark Sidebar Rail - FIXED POSITION, DOES NOT SCROLL */}
      <ModernSidebar
        caregiverName={session.name}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenLinkModal={() => setIsLinkModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area - ONLY THIS SCROLLS */}
      <div id="main-content-scroll" className="flex-1 h-screen overflow-y-auto overflow-x-hidden min-w-0 bg-[#F4F2EC] custom-scrollbar">
        {/* Top Header Bar with Patient Dropdown Pill & Controls */}
        <ModernTopHeader
          caregiverName={session.name}
          caregiverId={session.userId}
          patients={patients}
          selectedPatientId={selectedPatientId}
          onSelectPatient={(id) => setSelectedPatientId(id)}
          onOpenLinkModal={() => setIsLinkModalOpen(true)}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          overview={overview}
          onNavigateTab={(tab, query) => {
            handleTabChange(tab);
            if (query !== undefined) setSearchQuery(query);
          }}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenTaskManager={() => setIsTaskManagerOpen(true)}
          onOpenVoiceNotes={() => setIsVoiceMessagesOpen(true)}
          unreadVoiceNotesCount={unreadVoiceNotesCount}
          missedTasksCount={missedTasksCount}
        />

        {/* Real-time Event Floating Alert Toast */}
        {activeAlert && (
          <div className="fixed top-20 right-6 z-50 max-w-md w-full pointer-events-none animate-fadeIn">
            <div
              className={`pointer-events-auto relative p-4 rounded-2xl border shadow-xl backdrop-blur-md overflow-hidden flex items-start justify-between gap-3 ${
                activeAlert.type === 'success'
                  ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-900/10'
                  : activeAlert.type === 'warning'
                  ? 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-900/10'
                  : 'bg-pink-50/95 border-pink-300 text-[#111625] shadow-pink-900/10'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 pr-2">
                {activeAlert.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                {activeAlert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
                {activeAlert.type === 'alert' && <Mic className="w-5 h-5 text-[#E86D7C] shrink-0 mt-0.5" />}
                <div className="min-w-0">
                  <h5 className="font-extrabold text-xs sm:text-sm leading-tight">{activeAlert.title}</h5>
                  <p className="text-xs opacity-90 mt-1 leading-snug">{activeAlert.message}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveAlert(null)}
                className="p-1 rounded-lg hover:bg-black/10 text-stone-500 hover:text-stone-800 transition-all cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Smooth auto-dismiss countdown bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 overflow-hidden">
                <div
                  className={`h-full toast-countdown ${
                    activeAlert.type === 'success'
                      ? 'bg-emerald-500'
                      : activeAlert.type === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-[#E86D7C]'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Canvas Body */}
        <main className="flex-1 flex flex-col relative z-10 pb-16">
          {isLoadingPatients ? (
            <div className="flex-1 flex items-center justify-center p-16">
              <div className="flex items-center space-x-3 text-stone-600 font-bold">
                <RefreshCw className="w-6 h-6 animate-spin text-[#E86D7C]" />
                <span>Loading connected loved ones...</span>
              </div>
            </div>
          ) : patients.length === 0 ? (
            /* Empty state when no patients linked */
            <div className="p-8">
              <UnlinkedEmptyState
                caregiverName={session.name}
                onOpenLinkModal={() => setIsLinkModalOpen(true)}
              />
            </div>
          ) : authError ? (
            /* Access control error display */
            <div className="max-w-xl mx-auto w-full p-8 mt-12 clay-card text-center border-2 border-pink-200">
              <ShieldAlert className="w-12 h-12 text-[#E86D7C] mx-auto mb-3" />
              <h3 className="text-xl font-bold text-[#111625] mb-2">
                Access Restricted
              </h3>
              <p className="text-sm text-stone-500 mb-5">
                {authError}
              </p>
              <button
                onClick={() => loadPatients()}
                className="px-5 py-2.5 rounded-full bg-[#111625] text-white font-bold text-xs cursor-pointer hover:bg-[#1A2234]"
              >
                Refresh Linked Patients
              </button>
            </div>
          ) : overview && currentPatientInfo ? (
            /* Primary Modern Patient Dashboard View */
            <ModernPatientDashboard
              overview={overview}
              patientInfo={currentPatientInfo}
              caregiverId={session.userId}
              patientId={selectedPatientId || ''}
              onRefreshAI={handleRefreshAI}
              isRefreshingAI={isRefreshingAI}
              onRefreshAll={handleRefreshAll}
              isRefreshingAll={isLoadingOverview}
              onRevokeLink={handleRevokeLink}
              activeSidebarTab={activeTab}
              searchFilter={searchQuery}
              onClearSearch={() => setSearchQuery('')}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-16">
              <div className="flex items-center space-x-3 text-stone-600 font-bold">
                <RefreshCw className="w-6 h-6 animate-spin text-[#E86D7C]" />
                <span>{isLoadingOverview ? 'Loading patient analytics...' : 'Fetching patient health vitals...'}</span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Link Patient Modal */}
      <LinkPatientModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        caregiverId={session.userId}
        onLinkSuccess={handleLinkSuccess}
      />

      {/* Caregiver Preferences & Clinical Settings Modal */}
      <CaregiverSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        caregiverName={session.name}
        caregiverId={session.userId}
        patientInfo={currentPatientInfo}
        overview={overview}
      />

      {/* WebRTC Real-Time Patient Incoming Call Modal */}
      <IncomingCallModal
        currentCaregiverId={session.userId}
        currentCaregiverName={session.name}
      />

      {/* Routine & Medication Task Manager Modal */}
      {selectedPatientId && (
        <TaskManagerModal
          isOpen={isTaskManagerOpen}
          onClose={() => setIsTaskManagerOpen(false)}
          patientId={selectedPatientId}
          patientName={currentPatientInfo?.patientName || 'Patient'}
          currentUserId={session.userId}
        />
      )}

      {/* Patient Voice Messages Modal */}
      <VoiceMessagesModal
        isOpen={isVoiceMessagesOpen}
        onClose={() => {
          setIsVoiceMessagesOpen(false);
          setUnreadVoiceNotesCount(0);
        }}
        caregiverId={session.userId}
        activePatientId={selectedPatientId || undefined}
      />
    </div>
  );
};

export default App;
