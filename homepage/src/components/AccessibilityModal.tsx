import React, { useState, useEffect } from 'react';
import { X, Type, Check, SunMedium, UserCheck, HeartHandshake, Copy, CheckCheck } from 'lucide-react';
import { UserPreferences, FontSizePreference } from '../types';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userName: string;
  preferences: UserPreferences;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  preferences,
  onUpdatePreferences,
}) => {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !userId) return;
    let active = true;

    const url = userName 
      ? `http://localhost:5001/api/patient/${encodeURIComponent(userId)}/invite-code?name=${encodeURIComponent(userName)}`
      : `http://localhost:5001/api/patient/${encodeURIComponent(userId)}/invite-code`;

    fetch(url)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (active && data?.inviteCode) {
          setInviteCode(data.inviteCode);
        }
      })
      .catch(err => {
        console.warn('Could not fetch patient invite code:', err);
      });

    return () => { active = false; };
  }, [isOpen, userId]);

  const handleCopyCode = () => {
    if (!inviteCode) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  const fontOptions: { id: FontSizePreference; label: string; preview: string }[] = [
    { id: 'normal', label: 'Standard', preview: 'Comfortable reading' },
    { id: 'large', label: 'Large (Recommended)', preview: 'Clear, spacious letters' },
    { id: 'xlarge', label: 'Extra Large', preview: 'Maximum visibility' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#FAF7F2] rounded-3xl border-2 border-forest-300 p-6 sm:p-8 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-forest-100 border border-forest-300 flex items-center justify-center text-forest-700">
              <Type className="w-6 h-6" />
            </div>
            <div>
              <h3 id="accessibility-title" className="text-2xl font-extrabold text-[#1A202C] font-brand-heading">
                Comfort & Display Settings
              </h3>
              <p className="text-sm text-[#1A202C]/70 font-brand-body">
                Make your screen feel just right for your eyes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-cream-200 hover:bg-cream-300 text-[#1A202C] flex items-center justify-center transition-colors"
            aria-label="Close settings"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Signed In Account Info Card */}
        <div className="mb-4 p-4 rounded-2xl bg-white border border-forest-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-forest-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-forest-700 uppercase tracking-wider block font-brand-body">
                Signed In Account
              </span>
              <p className="text-lg font-bold text-[#1A202C] font-brand-heading">
                {userName}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-forest-800 bg-forest-50 px-3 py-1 rounded-full border border-forest-200">
            Active
          </span>
        </div>

        {/* Caregiver Connection Code Card */}
        {inviteCode && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-muga-50 to-cream-100 border-2 border-muga-300 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="flex items-center space-x-2">
                <HeartHandshake className="w-5 h-5 text-muga-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-muga-800 font-brand-body">
                  Family Caregiver Connection Code
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-muga-300 text-xs font-bold text-muga-800 hover:bg-muga-100 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                {copied ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-forest-600" />
                    <span className="text-forest-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-muga-700" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between bg-white/90 px-4 py-2.5 rounded-xl border border-muga-200/90 mb-2">
              <span className="font-mono text-xl sm:text-2xl font-extrabold tracking-widest text-forest-800">
                {inviteCode}
              </span>
              <span className="text-[11px] font-semibold text-[#1A202C]/60">
                Share with family
              </span>
            </div>
            <p className="text-xs text-[#1A202C]/70 leading-relaxed font-brand-body">
              Share this code with your loved one or caregiver so they can connect their Caregiver Dashboard to your daily routine and wellbeing updates.
            </p>
          </div>
        )}

        {/* 1. Text Size Choice */}
        <div className="mb-6">
          <label className="text-base font-extrabold text-[#1A202C] font-brand-heading block mb-3">
            Text Size
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {fontOptions.map((opt) => {
              const isSelected = preferences.fontSize === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onUpdatePreferences({ fontSize: opt.id })}
                  className={`min-h-[56px] p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-forest-50 border-forest-600 shadow-warm-sm'
                      : 'bg-white border-cream-300 hover:border-forest-300'
                  }`}
                >
                  <div>
                    <span className="text-lg font-bold text-[#1A202C] block">
                      {opt.label}
                    </span>
                    <span className="text-xs sm:text-sm text-[#1A202C]/65">
                      {opt.preview}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-7 h-7 rounded-full bg-forest-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. High Contrast Mode Toggle */}
        <div className="mb-6 pt-4 border-t border-[#E8DFD1]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SunMedium className="w-6 h-6 text-forest-600" />
              <div>
                <p className="text-base font-bold text-[#1A202C]">
                  High Contrast Text
                </p>
                <p className="text-xs sm:text-sm text-[#1A202C]/65">
                  Enhances borders and deepens dark ink for maximum readability.
                </p>
              </div>
            </div>

            <button
              onClick={() => onUpdatePreferences({ highContrast: !preferences.highContrast })}
              className={`w-14 h-8 rounded-full transition-colors relative focus-visible:ring-4 focus-visible:ring-forest-400 ${
                preferences.highContrast ? 'bg-forest-600' : 'bg-cream-300'
              }`}
              aria-label="Toggle high contrast"
            >
              <span
                className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${
                  preferences.highContrast ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save & Close Button */}
        <div className="pt-4 border-t border-[#E8DFD1]">
          <button
            onClick={onClose}
            className="w-full min-h-[56px] py-3.5 rounded-2xl bg-forest-600 hover:bg-forest-700 text-white font-extrabold text-lg shadow-warm-md transition-colors"
          >
            Apply & Return Home
          </button>
        </div>

      </div>
    </div>
  );
};
