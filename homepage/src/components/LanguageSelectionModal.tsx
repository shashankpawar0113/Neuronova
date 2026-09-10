import React from 'react';
import { Volume2, Check, Globe } from 'lucide-react';
import { BACKEND_URL } from '../config/urls';

export type LanguageCode = 'en' | 'hi' | 'hinglish';

interface LanguageSelectionModalProps {
  isOpen: boolean;
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onClose?: () => void;
  userId?: string;
  isFirstTime?: boolean;
}

const LANGUAGES = [
  {
    code: 'hi' as LanguageCode,
    label: 'हिन्दी',
    sublabel: 'Hindi',
    description: 'मुझसे शुद्ध और सरल हिन्दी में बात कीजिए',
    previewAudio: 'नमस्ते! मैं न्यूरोनोवा हूँ। आपकी क्या सहायता करूँ?',
    voiceLocale: 'hi-IN',
    badgeColor: 'from-amber-500 to-orange-500',
  },
  {
    code: 'en' as LanguageCode,
    label: 'English',
    sublabel: 'Indian English',
    description: 'Speak with me in warm and gentle English',
    previewAudio: 'Hello! I am NeuroNova. How can I assist you today?',
    voiceLocale: 'en-IN',
    badgeColor: 'from-sky-500 to-blue-600',
  },
  {
    code: 'hinglish' as LanguageCode,
    label: 'Hinglish',
    sublabel: 'Everyday Hindi + English',
    description: 'Aapki natural everyday language — "Dawa kab leni hai?"',
    previewAudio: 'Namaste! Main NeuroNova hoon. Aaj aapki kya help kar sakta hoon?',
    voiceLocale: 'en-IN',
    badgeColor: 'from-emerald-500 to-teal-600',
  },
];

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  isOpen,
  currentLanguage,
  onSelectLanguage,
  onClose,
  userId,
  isFirstTime: _isFirstTime = false,
}) => {
  const [selectedLang, setSelectedLang] = React.useState<LanguageCode>(currentLanguage || 'hinglish');

  React.useEffect(() => {
    if (currentLanguage) {
      setSelectedLang(currentLanguage);
    }
  }, [currentLanguage]);

  if (!isOpen) return null;

  const playSampleVoice = (text: string, locale: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = locale;
        utterance.rate = 0.88; // Gentle elderly cadence
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (_) {}
  };

  const persistLanguage = (lang: LanguageCode) => {
    // 1. Save permanently to local storage
    try {
      localStorage.setItem('neuronova_voice_lang', lang);
      localStorage.setItem('neuronova_language_onboarded', 'true');
    } catch (_) {}

    // 2. Sync to backend database
    if (userId) {
      fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/user/${userId}/language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang }),
      }).catch((err) => console.warn('[LanguageModal] Failed to sync language to backend:', err));
    }
  };

  const handleSelectCard = (lang: LanguageCode, previewText: string, locale: string) => {
    setSelectedLang(lang);
    playSampleVoice(previewText, locale);
    onSelectLanguage(lang);
    persistLanguage(lang);
  };

  const handleConfirmAndClose = () => {
    onSelectLanguage(selectedLang);
    persistLanguage(selectedLang);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-xl bg-gradient-to-b from-white to-amber-50/40 rounded-3xl p-6 md:p-8 shadow-2xl border border-amber-200/80 text-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lang-modal-title"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 text-white shadow-lg shadow-amber-500/20 mb-3">
            <Globe className="w-8 h-8" />
          </div>
          <h2
            id="lang-modal-title"
            className="text-2xl md:text-3xl font-bold font-brand tracking-tight text-slate-900"
          >
            Select App & Voice Language / भाषा चुनें
          </h2>
          <p className="text-base md:text-lg text-slate-600 mt-2 font-medium">
            वॉइस असिस्टेंट, खेल, संगीत और होम पेज की भाषा चुनें
          </p>
        </div>

        {/* 3 Clear, Large Accessible Language Cards */}
        <div className="space-y-3.5">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectCard(lang.code, lang.previewAudio, lang.voiceLocale)}
                className={`w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/80 shadow-md ring-4 ring-amber-400/20'
                    : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg bg-gradient-to-r ${lang.badgeColor} shadow-md`}
                  >
                    {lang.label.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-slate-900">{lang.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                        {lang.sublabel}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5 font-medium">{lang.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      playSampleVoice(lang.previewAudio, lang.voiceLocale);
                    }}
                    title="Listen to sample voice"
                    className="p-2 rounded-full text-slate-400 hover:text-amber-600 hover:bg-amber-100/60 transition-colors"
                  >
                    <Volume2 className="w-5 h-5" />
                  </span>
                  {isSelected && (
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleConfirmAndClose}
            className="px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg shadow-lg shadow-amber-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Continue / आगे बढ़ें
          </button>
        </div>
      </div>
    </div>
  );
};
