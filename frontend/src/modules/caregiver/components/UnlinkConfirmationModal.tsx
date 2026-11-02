import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Trash2,
} from 'lucide-react';

interface UnlinkConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  relationship?: string;
  patientId: string;
  onConfirmUnlink: (patientId: string) => void;
}

export const UnlinkConfirmationModal: React.FC<UnlinkConfirmationModalProps> = ({
  isOpen,
  onClose,
  patientName,
  relationship = 'Loved One',
  patientId,
  onConfirmUnlink,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setAcknowledged(false);
    setConfirmationInput('');
    setIsProcessing(false);
    onClose();
  };

  const handleProceedToStep2 = () => {
    if (!acknowledged) return;
    setStep(2);
  };

  const handleFinalUnlink = async () => {
    setIsProcessing(true);
    try {
      await onConfirmUnlink(patientId);
      handleClose();
    } catch (err) {
      console.error('Error during unlinking:', err);
      setIsProcessing(false);
    }
  };

  const isNameMatched =
    confirmationInput.trim().toLowerCase() === patientName.trim().toLowerCase() ||
    confirmationInput.trim().toLowerCase() === 'unlink';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn font-brand-body">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 text-[#111625] animate-scaleUp relative">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider mb-4">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>Step {step} of 2: {step === 1 ? 'Review Consequences' : 'Final Authorization'}</span>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: CONSEQUENCES & ACKNOWLEDGMENT */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-black font-brand-heading text-[#111625] leading-tight">
                Unlink {patientName}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Connected as <strong className="text-stone-700">{relationship}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-950 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 font-black text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Please review what happens after unlinking:</span>
              </div>
              <ul className="space-y-2 text-amber-900/90 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span><strong>Telemetry will stop syncing:</strong> Cognitive scores, game history, and vitals will disconnect from your portal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span><strong>Care schedule detachment:</strong> You will no longer receive routine tasks or companion check-in alerts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span><strong>Reconnection code required:</strong> Reconnecting will require a newly generated 6-digit patient code.</span>
                </li>
              </ul>
            </div>

            {/* Step 1 Checkbox Acknowledgment */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50/60 cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-stone-700 leading-snug">
                I understand that live clinical monitoring for <strong>{patientName}</strong> will be disconnected.
              </span>
            </label>

            {/* Step 1 Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToStep2}
                disabled={!acknowledged}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-stone-900 to-stone-800 hover:from-black hover:to-stone-900 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Continue to Step 2</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: FINAL CONFIRMATION & SAFETY AUTHORIZATION */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-black font-brand-heading text-rose-700 leading-tight flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Confirm Disconnection</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Step 2: Type the patient name or click confirm to authorize link revocation.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
              <p className="font-semibold leading-relaxed">
                This will immediately remove <strong>{patientName}</strong> from your active caregiver dashboard.
              </p>
            </div>

            {/* Verification Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 block">
                Type <span className="text-[#111625] font-black underline">"{patientName}"</span> or <span className="font-black">"UNLINK"</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={patientName}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-rose-500 text-sm font-bold text-[#111625] placeholder:text-stone-300 transition-colors"
                autoFocus
              />
            </div>

            {/* Step 2 Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isProcessing}
                className="px-3.5 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="px-3.5 py-2.5 rounded-xl text-stone-500 hover:text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalUnlink}
                  disabled={!isNameMatched || isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Unlinking...' : 'Confirm & Disconnect'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
