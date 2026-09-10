import React, { useState } from 'react';
import { X, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { BACKEND_URL } from '../config/urls';

interface RaiseConcernModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
  patientId: string;
  patientName: string;
}

const CONCERN_TYPES = [
  'Cognitive decline concern',
  'Medication adherence concern',
  'Repeated missed tasks',
  'Behavioral / Emotional change',
  'Nutrition & Hydration concern',
  'Other clinical observation',
];

export const RaiseConcernModal: React.FC<RaiseConcernModalProps> = ({
  isOpen,
  onClose,
  workerId,
  patientId,
  patientName,
}) => {
  const [concernType, setConcernType] = useState(CONCERN_TYPES[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/health-workers/concerns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId,
          patientId,
          concernType,
          description: description.trim(),
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setDescription('');
          onClose();
        }, 1800);
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Failed to submit concern alert.');
      }
    } catch (err) {
      setErrorMsg('Failed to communicate with telemetry server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-[Plus_Jakarta_Sans]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-[Outfit]">
                Raise Clinical Concern
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Direct alert to authorized family caregiver
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">
              Alert Delivered to Caregiver
            </h4>
            <p className="text-xs text-slate-500">
              The linked caregiver dashboard received a real-time notification with your clinical observations.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Patient
              </label>
              <div className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-800 capitalize">
                {patientName} ({patientId})
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category of Clinical Concern
              </label>
              <select
                value={concernType}
                onChange={(e) => setConcernType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden bg-white"
              >
                {CONCERN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Detailed Clinical Observation *
              </label>
              <textarea
                required
                rows={4}
                placeholder="e.g. Patient has missed evening blood pressure doses 3 times this week. Cognitive sequence recall latency increased from 420ms to 780ms. Recommend in-person review."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden bg-white"
              />
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {errorMsg}
              </p>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Sending Alert...' : 'Submit & Alert Caregiver'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
