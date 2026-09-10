import React, { useState } from 'react';
import {
  X,
  Bell,
  Phone,
  Languages,
  Download,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';

interface CaregiverSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caregiverName: string;
}

export const CaregiverSettingsModal: React.FC<CaregiverSettingsModalProps> = ({
  isOpen,
  onClose,
  caregiverName,
}) => {
  const [medAlerts, setMedAlerts] = useState(true);
  const [nightAlerts, setNightAlerts] = useState(true);
  const [declineAlerts, setDeclineAlerts] = useState(true);
  const [voiceLang, setVoiceLang] = useState<'auto' | 'en' | 'hi'>('auto');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 98765 43210');
  const [doctorPhone, setDoctorPhone] = useState('+91 91234 56789');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handleExportData = () => {
    const data = {
      caregiver: caregiverName,
      exportedAt: new Date().toISOString(),
      platform: 'NeuroNova Clinical Caregiver Command Hub',
      settings: {
        medAlerts,
        nightAlerts,
        declineAlerts,
        voiceLang,
        emergencyPhone,
        doctorPhone,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuronova-caregiver-preferences-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-[#FAF9F6] rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0E1322] text-white flex items-center justify-center shadow-sm">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#111625] font-brand-heading">
                Caregiver Preferences & Alerts
              </h3>
              <p className="text-xs text-stone-500">
                Safety triggers & monitoring controls for {caregiverName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1 text-[#111625]">
          
          {/* Section 1: Clinical Alerts */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-stone-400">
              <Bell className="w-3.5 h-3.5 text-[#E86D7C]" />
              <span>Real-Time Clinical Triggers</span>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 transition-colors cursor-pointer">
                <div>
                  <span className="text-xs sm:text-sm font-bold block text-[#111625]">
                    Missed Medication Alerts
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Notify if scheduled doses are overdue by more than 30 minutes
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={medAlerts}
                  onChange={(e) => setMedAlerts(e.target.checked)}
                  className="w-5 h-5 accent-[#E86D7C] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 transition-colors cursor-pointer">
                <div>
                  <span className="text-xs sm:text-sm font-bold block text-[#111625]">
                    Night-Time Wander / Agitation Alert
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Trigger alert if voice interactions or routine activity occur between 1 AM – 5 AM
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={nightAlerts}
                  onChange={(e) => setNightAlerts(e.target.checked)}
                  className="w-5 h-5 accent-[#E86D7C] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 transition-colors cursor-pointer">
                <div>
                  <span className="text-xs sm:text-sm font-bold block text-[#111625]">
                    Cognitive Decline Threshold Alert
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Flag if 7-day average game accuracy drops below 75% baseline
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={declineAlerts}
                  onChange={(e) => setDeclineAlerts(e.target.checked)}
                  className="w-5 h-5 accent-[#E86D7C] rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Emergency & Clinical Contacts */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-stone-400">
              <Phone className="w-3.5 h-3.5 text-blue-500" />
              <span>Emergency & Doctor Contacts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-1">
                <span className="text-[11px] font-bold text-stone-500 block">Primary Emergency Phone</span>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full text-xs font-bold text-[#111625] bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#E86D7C]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-1">
                <span className="text-[11px] font-bold text-stone-500 block">Consulting Neurologist</span>
                <input
                  type="text"
                  value={doctorPhone}
                  onChange={(e) => setDoctorPhone(e.target.value)}
                  className="w-full text-xs font-bold text-[#111625] bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#E86D7C]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Voice Assistant Language */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-stone-400">
              <Languages className="w-3.5 h-3.5 text-emerald-500" />
              <span>Elder Voice Companion Language</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'auto', label: 'Auto (Dual)', desc: 'Hindi & English' },
                { id: 'hi', label: 'Hindi', desc: 'हिंदी प्राथमिक' },
                { id: 'en', label: 'English', desc: 'English Primary' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setVoiceLang(lang.id as any)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    voiceLang === lang.id
                      ? 'bg-[#111625] text-white border-[#111625] shadow-sm'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="text-xs font-extrabold block">{lang.label}</span>
                  <span className="text-[10px] opacity-75">{lang.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Export Clinical Data */}
          <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#111625] block">Export Clinical Audit Data</span>
              <span className="text-[11px] text-stone-500">Download formatted JSON report for physician consultation</span>
            </div>
            <button
              onClick={handleExportData}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-200 border border-stone-300 text-xs font-bold text-[#111625] flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-white flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaved}
            className="px-6 py-2.5 rounded-full bg-[#E86D7C] hover:bg-[#d85867] text-white text-xs font-extrabold shadow-sm flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-80"
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
