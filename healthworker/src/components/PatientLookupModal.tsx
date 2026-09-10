import React, { useState } from 'react';
import { X, Search, AlertCircle, CheckCircle2, Lock, Clock, Send } from 'lucide-react';
import { BACKEND_URL } from '../config/urls';

interface PatientLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
  workerName?: string;
  organization?: string;
  onSelectPatient: (patientId: string) => void;
  onPatientAuthorized: () => void;
}

export const PatientLookupModal: React.FC<PatientLookupModalProps> = ({
  isOpen,
  onClose,
  workerId,
  workerName = 'Dr. Ananya Roy',
  organization = 'Apex Neurological Care Network',
  onSelectPatient,
  onPatientAuthorized,
}) => {
  const [patientInput, setPatientInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    patientId: string;
    patientName: string;
    uniqueId: string;
    accessStatus: 'active' | 'pending' | 'rejected' | 'none';
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSentNotice, setRequestSentNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = patientInput.trim();
    if (!query) return;

    setIsSearching(true);
    setErrorMsg(null);
    setRequestSentNotice(null);
    setSearchResult(null);

    try {
      // 1. Verify patient identity via unique ID endpoint
      const res = await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/patients/${encodeURIComponent(query)}/unique-id`);
      if (!res.ok) {
        throw new Error('No patient record found matching this Unique ID or username.');
      }
      const data = await res.json();
      const patientId = data.patientId;
      const uniquePatientId = data.uniquePatientId;

      // 2. Check current access status for this health worker
      const statusRes = await fetch(
        `${BACKEND_URL || 'http://localhost:5001'}/api/health-workers/access/status?workerId=${encodeURIComponent(workerId)}&patientId=${encodeURIComponent(patientId)}`
      );
      let accessStatus: 'active' | 'pending' | 'rejected' | 'none' = 'none';
      if (statusRes.ok) {
        const sData = await statusRes.json();
        accessStatus = sData.status || 'none';
      }

      setSearchResult({
        found: true,
        patientId,
        patientName: patientId.replace(/_/g, ' ').replace('user ', ''),
        uniqueId: uniquePatientId,
        accessStatus,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Patient lookup failed. Please verify the Unique Patient ID.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!searchResult) return;
    setIsRequesting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/health-workers/access/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId,
          workerName,
          organization,
          patientId: searchResult.patientId,
        }),
      });

      if (res.ok) {
        setSearchResult(prev => prev ? { ...prev, accessStatus: 'pending' } : prev);
        setRequestSentNotice('Authorization request delivered to the patient’s caregiver! A notification with Accept / Reject buttons has appeared on the Caregiver Command Hub.');
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Failed to send authorization request.');
      }
    } catch (err) {
      setErrorMsg('Failed to process authorization request. Please check backend connection.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-[Plus_Jakarta_Sans]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-black text-slate-900 font-[Outfit]">
              Patient ID Clinical Lookup
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Secure patient search via Unique Patient ID (e.g. NN-P-XXXXXX)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Enter Patient Unique ID or Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. NN-P-8F42K7 or kamla.sharma"
                  value={patientInput}
                  onChange={(e) => setPatientInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-hidden bg-white"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSearching ? 'Searching Clinical Registry...' : 'Search Patient'}
            </button>
          </form>

          {/* Success Banner */}
          {requestSentNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{requestSentNotice}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search Result Card */}
          {searchResult && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm capitalize">
                    {searchResult.patientName}
                  </h4>
                  <span className="font-mono text-[11px] text-sky-700 font-bold">
                    {searchResult.uniqueId}
                  </span>
                </div>

                {searchResult.accessStatus === 'active' ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Authorized
                  </span>
                ) : searchResult.accessStatus === 'pending' ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Pending Caregiver Approval
                  </span>
                ) : searchResult.accessStatus === 'rejected' ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                    <X className="w-3.5 h-3.5 text-rose-600" />
                    Access Declined
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    Caregiver Approval Required
                  </span>
                )}
              </div>

              {searchResult.accessStatus === 'active' ? (
                <button
                  onClick={() => {
                    onPatientAuthorized();
                    onSelectPatient(searchResult.patientId);
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Open Clinical Dashboard
                </button>
              ) : searchResult.accessStatus === 'pending' ? (
                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    An authorization request has been sent to the patient's caregiver. Please wait for the caregiver to click <strong>[Accept]</strong> in their notifications bell icon.
                  </p>
                  <button
                    onClick={async () => {
                      const res = await fetch(
                        `${BACKEND_URL || 'http://localhost:5001'}/api/health-workers/access/status?workerId=${encodeURIComponent(workerId)}&patientId=${encodeURIComponent(searchResult.patientId)}`
                      );
                      if (res.ok) {
                        const d = await res.json();
                        if (d.status === 'active') {
                          setSearchResult(prev => prev ? { ...prev, accessStatus: 'active' } : prev);
                          onPatientAuthorized();
                          onSelectPatient(searchResult.patientId);
                          onClose();
                        }
                      }
                    }}
                    className="w-full py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    Check Approval Status
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Under least-privilege medical compliance, clinical practitioners must request authorization from the patient's primary caregiver before accessing diagnostic telemetry.
                  </p>
                  <button
                    onClick={handleRequestAccess}
                    disabled={isRequesting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isRequesting ? 'Sending Request to Caregiver...' : 'Request Caregiver Authorization'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
