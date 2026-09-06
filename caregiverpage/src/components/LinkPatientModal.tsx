import React, { useState } from 'react';
import { X, HeartHandshake, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface LinkPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  caregiverId: string;
  onLinkSuccess: (patientId: string) => void;
}

const RELATIONSHIPS = [
  'Daughter',
  'Son',
  'Spouse / Partner',
  'Grandchild',
  'Professional Caregiver',
  'Family Member / Friend',
];

export const LinkPatientModal: React.FC<LinkPatientModalProps> = ({
  isOpen,
  onClose,
  caregiverId,
  onLinkSuccess,
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [relationship, setRelationship] = useState(RELATIONSHIPS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Please enter your loved one’s connection code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5001/api/caregiver/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caregiverId,
          inviteCode: cleanCode,
          relationship,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not connect to patient. Please check the code.');
      }

      setSuccessMsg(data.message || 'Connected successfully!');
      setTimeout(() => {
        onLinkSuccess(data.patient?.patientId);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while linking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-sky-200/80 shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Scenic Meadow Header Strip */}
        <div className="relative h-28 w-full bg-cover bg-center overflow-hidden" style={{ backgroundImage: "url('/meadow-bg.png')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-white/50 to-black/30" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-2 left-6 flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 text-meadow-800 border border-meadow-200 shadow-2xs inline-flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Sanctuary Connection</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 pt-2">
          <div className="flex items-center space-x-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-meadow-600 to-sky-600 text-white flex items-center justify-center shadow-xs">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#1A202C] font-brand-heading leading-tight">
                Connect Loved One
              </h3>
              <p className="text-xs sm:text-sm text-[#1A202C]/70 font-brand-body">
                Enter your elder’s unique connection code
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-meadow-800 mb-1.5 font-brand-body">
                Elder's Connection Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. NEURO-7X4K"
                className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-sky-100 font-mono text-lg tracking-wider text-slate-900 placeholder:text-slate-300 focus:border-meadow-600 focus:outline-none transition-colors uppercase font-bold shadow-2xs"
                required
              />
              <p className="mt-1.5 text-xs text-[#1A202C]/65 font-brand-body">
                Found on the patient's home screen under <span className="font-semibold text-meadow-700">Display & Comfort Settings</span>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-meadow-800 mb-1.5 font-brand-body">
                Your Relationship to the Patient
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-sky-100 text-sm font-semibold text-[#1A202C] focus:border-meadow-600 focus:outline-none transition-colors shadow-2xs"
              >
                {RELATIONSHIPS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>

            {/* Error / Success feedback */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-meadow-50 border border-meadow-200 text-meadow-800 text-xs flex items-start space-x-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-meadow-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="pt-3 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#1A202C]/70 hover:bg-red-500 hover:text-white hover:border-red-500 active:bg-red-600 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-xs hover:shadow-md hover:shadow-red-500/25"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-black/75 hover:bg-black/85 active:bg-black/90 backdrop-blur-md border border-white/20 hover:border-white/40 text-white text-xs font-bold shadow-lg transition-all duration-200 flex items-center space-x-2 cursor-pointer disabled:opacity-50 transform hover:-translate-y-0.5 active:scale-95"
                style={{
                  boxShadow: '0 8px 20px -6px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                }}
              >
                <span className="text-white font-bold">{isSubmitting ? 'Verifying...' : 'Link & Access Dashboard'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#EEDAC2]" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
