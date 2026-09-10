import React, { useState, useEffect } from 'react';
import { HealthWorkerNavbar } from './components/HealthWorkerNavbar';
import { PatientLookupModal } from './components/PatientLookupModal';
import { RaiseConcernModal } from './components/RaiseConcernModal';
import { PatientClinicalReportView } from './components/PatientClinicalReportView';
import { HealthWorkerSession, AuthorizedPatient, PatientClinicalReport } from './types';
import { BACKEND_URL, AUTHPAGE_URL } from './config/urls';
import { RefreshCw, Search, ShieldCheck, UserCheck, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { io } from 'socket.io-client';

const fetchHealthWorkerSession = (): HealthWorkerSession => {
  try {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get('userId') || params.get('uid');
      const queryName = params.get('name') || params.get('user');
      if (queryId || queryName) {
        const userId = queryId || `hw_${(queryName || 'worker').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const name = queryName ? queryName.trim() : 'Dr. Ananya Roy';
        const session: HealthWorkerSession = {
          userId,
          name,
          role: 'HEALTH_WORKER',
          organization: 'Apex Neurological Care Network',
          title: 'Consultant Geriatric Neurologist',
        };
        try {
          localStorage.setItem('neuronova_hw_session', JSON.stringify(session));
        } catch (_) {}
        return session;
      }
    }

    const raw = localStorage.getItem('neuronova_hw_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        userId: parsed?.userId || 'hw_dr_ananya_roy',
        name: parsed?.name || 'Dr. Ananya Roy',
        role: 'HEALTH_WORKER',
        organization: parsed?.organization || 'Apex Neurological Care Network',
        title: parsed?.title || 'Consultant Geriatric Neurologist',
      };
    }
  } catch (err) {
    console.warn('Could not read health worker session:', err);
  }

  return {
    userId: 'hw_dr_ananya_roy',
    name: 'Dr. Ananya Roy',
    role: 'HEALTH_WORKER',
    organization: 'Apex Neurological Care Network',
    title: 'Consultant Geriatric Neurologist',
  };
};

export const App: React.FC = () => {
  const [session] = useState<HealthWorkerSession>(() => fetchHealthWorkerSession());
  const [authorizedPatients, setAuthorizedPatients] = useState<AuthorizedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [report, setReport] = useState<PatientClinicalReport | null>(null);

  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [isRaiseConcernModalOpen, setIsRaiseConcernModalOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{
    id: string;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);

  // 1. Fetch authorized patients for this worker
  const loadAuthorizedPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/health-workers/${encodeURIComponent(session.userId)}/patients`);
      if (res.ok) {
        const data = await res.json();
        const list: AuthorizedPatient[] = data.patients || [];
        setAuthorizedPatients(list);

        // Auto-select first patient if none selected
        if (list.length > 0 && !selectedPatientId) {
          setSelectedPatientId(list[0].patient_id);
        }
      }
    } catch (err) {
      console.warn('Failed to load authorized patients:', err);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    loadAuthorizedPatients();

    const socket = io(BACKEND_URL || 'http://localhost:5001', {
      transports: ['websocket', 'polling'],
      auth: {
        userId: session.userId,
        role: 'health_worker',
      },
    });

    socket.on('healthworker:access:approved', (data: any) => {
      setActiveAlert({
        id: `acc_${Date.now()}`,
        title: '✓ Clinical Access Granted by Caregiver',
        message: `The caregiver approved clinical telemetry access for patient ${data.patientId}. Medical records and reports unlocked.`,
        type: 'success',
      });
      loadAuthorizedPatients();
      if (data.patientId) {
        setSelectedPatientId(data.patientId);
      }
    });

    socket.on('healthworker:access:rejected', (data: any) => {
      setActiveAlert({
        id: `rej_${Date.now()}`,
        title: '✗ Access Request Declined',
        message: `The caregiver declined access request for patient ${data.patientId}.`,
        type: 'warning',
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [session.userId]);

  // 2. Fetch clinical report for selected patient
  useEffect(() => {
    if (!selectedPatientId) {
      setReport(null);
      return;
    }

    let isSubscribed = true;
    setIsLoadingReport(true);
    setErrorMessage(null);

    fetch(`${BACKEND_URL}/api/patients/${encodeURIComponent(selectedPatientId)}/report?workerId=${encodeURIComponent(session.userId)}`)
      .then(async (res) => {
        if (!isSubscribed) return null;
        if (res.status === 403) {
          const errData = await res.json();
          throw new Error(errData.error || 'Access Denied: Least-privilege authorization required for this patient.');
        }
        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!isSubscribed || !data) return;
        setReport(data.report);
      })
      .catch((err) => {
        if (isSubscribed) {
          console.error('Failed to load clinical report:', err);
          setErrorMessage(err.message);
          setReport(null);
        }
      })
      .finally(() => {
        if (isSubscribed) setIsLoadingReport(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [session.userId, selectedPatientId]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('neuronova_hw_session');
    } catch (_) {}
    window.location.href = `${AUTHPAGE_URL}/`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-[Plus_Jakarta_Sans]">
      {/* Navbar */}
      <HealthWorkerNavbar
        session={session}
        onOpenLookup={() => setIsLookupModalOpen(true)}
        onLogout={handleLogout}
        authorizedCount={authorizedPatients.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col lg:flex-row gap-6">
        {/* Left Side: Authorized Patient Sidebar Directory */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4 print:hidden">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-sky-600" />
                <span>Authorized Registry</span>
              </h3>
              <button
                onClick={() => setIsLookupModalOpen(true)}
                className="p-1 rounded-lg hover:bg-sky-50 text-sky-600 transition-all cursor-pointer"
                title="Lookup Patient"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {isLoadingPatients ? (
              <div className="py-6 text-center text-xs text-slate-400 font-semibold">
                Loading clinical registry...
              </div>
            ) : authorizedPatients.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs font-bold text-slate-600">No authorized patients yet</p>
                <p className="text-[11px] text-slate-400">
                  Use "Patient ID Lookup" to verify and authorize medical observation.
                </p>
                <button
                  onClick={() => setIsLookupModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold shadow-xs hover:bg-sky-700 cursor-pointer"
                >
                  Lookup Patient
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {authorizedPatients.map((p) => {
                  const isSelected = p.patient_id === selectedPatientId;
                  const displayName = p.patient_name || p.patient_id.replace(/_/g, ' ').replace('user ', '');

                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.patient_id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/20 shadow-xs'
                          : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-xs text-slate-900 truncate capitalize">
                          {displayName}
                        </div>
                        <div className="font-mono text-[10px] text-sky-700 font-bold">
                          {p.unique_id || p.patient_id}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Compliance & Privacy Card */}
          <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 space-y-1.5 text-slate-600 text-xs">
            <div className="flex items-center gap-1.5 text-sky-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Medical Compliance Active</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Audit logging is enabled. Sensitive credentials, passwords, and private messages are automatically filtered under HIPAA/least-privilege guidelines.
            </p>
          </div>
        </aside>

        {/* Right Side: Clinical Report Canvas */}
        <main className="flex-1 min-w-0">
          {isLoadingReport ? (
            <div className="h-96 flex items-center justify-center bg-white rounded-3xl border border-slate-200">
              <div className="flex items-center space-x-3 text-slate-600 font-bold text-sm">
                <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
                <span>Compiling clinical telemetry report...</span>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="p-8 bg-white rounded-3xl border border-rose-200 text-center space-y-3 max-w-lg mx-auto mt-12">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">
                Authorization Restricted
              </h3>
              <p className="text-xs text-slate-500">
                {errorMessage}
              </p>
              <button
                onClick={() => setIsLookupModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 cursor-pointer"
              >
                Authorize Patient Access
              </button>
            </div>
          ) : report ? (
            <PatientClinicalReportView
              report={report}
              onOpenRaiseConcern={() => setIsRaiseConcernModalOpen(true)}
            />
          ) : (
            <div className="h-96 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center">
              <Search className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-base font-extrabold text-slate-800">
                Select or Lookup a Patient
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Choose an authorized patient from your registry or search by unique patient ID (e.g. NN-P-XXXXXX).
              </p>
              <button
                onClick={() => setIsLookupModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Lookup Patient ID
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Real-time Notification Floating Alert Toast */}
      {activeAlert && (
        <div className="fixed top-20 right-6 z-50 max-w-md w-full shadow-2xl animate-fade-in">
          <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
            activeAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}>
            <div className="flex items-start gap-3">
              {activeAlert.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h5 className="font-extrabold text-xs">{activeAlert.title}</h5>
                <p className="text-[11px] mt-0.5 leading-relaxed">{activeAlert.message}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveAlert(null)}
              className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lookup & Authorization Modal */}
      <PatientLookupModal
        isOpen={isLookupModalOpen}
        onClose={() => setIsLookupModalOpen(false)}
        workerId={session.userId}
        workerName={session.name}
        organization={session.organization}
        onSelectPatient={(pid) => setSelectedPatientId(pid)}
        onPatientAuthorized={loadAuthorizedPatients}
      />

      {/* Raise Clinical Concern Modal */}
      {selectedPatientId && (
        <RaiseConcernModal
          isOpen={isRaiseConcernModalOpen}
          onClose={() => setIsRaiseConcernModalOpen(false)}
          workerId={session.userId}
          patientId={selectedPatientId}
          patientName={report?.name || selectedPatientId}
        />
      )}
    </div>
  );
};

export default App;
