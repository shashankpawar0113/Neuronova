import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, Clock, Calendar, Sparkles, LogOut, Globe, Copy, Check, Shield } from 'lucide-react';
import { AUTHPAGE_URL, BACKEND_URL, performLogout } from '../config/urls';
import { CelestialGreetingBox } from './CelestialGreetingBox';
import { useLanguage } from '../context/LanguageContext';

interface GreetingHeaderProps {
  userName: string;
  userId?: string;
  onOpenSettings: () => void;
  onOpenLanguage?: () => void;
  revealDelay?: number; // ms offset for stagger — set by App.tsx
}

interface DailyMotivation {
  message: string;
  theme?: string;
  modelUsed?: string;
}

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({
  userName,
  userId,
  onOpenSettings,
  onOpenLanguage,
  revealDelay: _revealDelay = 0,
}) => {
  const { language, t } = useLanguage();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Secret Triple-Tap Controls Menu (Dementia-safe: hides Settings & Sign Out from patients)
  const [isSecretMenuOpen, setIsSecretMenuOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!isSecretMenuOpen || !userId) return;
    let active = true;
    const url = userName 
      ? `${BACKEND_URL}/api/patient/${encodeURIComponent(userId)}/invite-code?name=${encodeURIComponent(userName)}`
      : `${BACKEND_URL}/api/patient/${encodeURIComponent(userId)}/invite-code`;

    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (active && d?.inviteCode) {
          setInviteCode(d.inviteCode);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [isSecretMenuOpen, userId, userName]);
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);
  const secretMenuRef = useRef<HTMLDivElement>(null);

  // Daily AI Motivation state
  const [motivation, setMotivation] = useState<DailyMotivation | null>(null);

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch daily AI motivational message from backend
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let isMounted = true;

    fetch(`${BACKEND_URL}/api/daily-motivation?userName=${encodeURIComponent(userName)}&date=${todayStr}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!isMounted || !data?.message) return;
        const result: DailyMotivation = {
          message: data.message,
          theme: data.theme,
          modelUsed: data.modelUsed,
        };
        setMotivation(result);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [userName]);

  const handleTimeBoxTap = () => {
    setIsSecretMenuOpen((prev) => !prev);
  };

  // Close secret menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (secretMenuRef.current && !secretMenuRef.current.contains(e.target as Node)) {
        setIsSecretMenuOpen(false);
      }
    };
    if (isSecretMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSecretMenuOpen]);

  const hours = currentDateTime.getHours();

  // Time-of-day greeting from translations
  let timeGreeting = t.greetings.morning;
  if (hours >= 12 && hours < 17) {
    timeGreeting = t.greetings.afternoon;
  } else if (hours >= 17 && hours < 21) {
    timeGreeting = t.greetings.evening;
  } else if (hours >= 21 || hours < 5) {
    timeGreeting = t.greetings.night;
  }

  // Formatted date and time strings for the right-hand clock badge
  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const formattedShortDate = currentDateTime.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="w-full pt-4 sm:pt-6 px-4 sm:px-8 md:px-12 relative z-30">
      <header className="max-w-6xl mx-auto w-full bg-[#FAF7F2]/90 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-[#E8DFD1]/80 p-4 sm:p-5 md:px-7 md:py-5 shadow-warm-md relative z-30">
        <div className="flex items-start justify-between gap-4">
          
          {/* Left: Warm Greeting & Daily AI Motivational Message */}
          <div className="flex items-start gap-3.5 sm:gap-4.5 flex-1 min-w-0 pr-2">
            {/* Celestial Sun / Moon Box */}
            <CelestialGreetingBox hours={hours} className="mt-0.5 sm:mt-1" />

            <div className="flex flex-col flex-1 min-w-0">
              {/* Main Greeting Headline */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#1A202C] tracking-tight font-brand-heading leading-tight">
                {timeGreeting}, <span className="text-forest-600">{userName}</span>
              </h1>

              {/* Underneath: Daily Motivational Thought generated by AI */}
              <div className="mt-2.5 flex items-start gap-2.5 max-w-2xl">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-amber-500/15 border border-amber-400/35 flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="text-base sm:text-lg text-[#1A202C]/85 font-brand-body font-medium leading-relaxed italic">
                    "{motivation?.message || (language === 'hi' ? 'आपका दिन सुखद, शांत और मंगलमय हो।' : 'Wishing you a peaceful, bright, and comfortable day.')}"
                  </p>
                  {motivation?.theme && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-forest-50 border border-forest-200/80 text-[11px] font-bold uppercase tracking-wider text-forest-700">
                        {t.header.dailyThought} • {motivation.theme}
                      </span>
                      <span className="text-[11px] text-[#1A202C]/50 font-medium">
                        {t.header.aiWellness}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Date & Time Badge with Secret Triple-Tap Caregiver Menu */}
          <div
            ref={secretMenuRef}
            className="shrink-0 pt-1 relative z-50"
          >
            {/* Live Clock & Date Badge (Triple tap opens secret settings & logout) */}
            <button
              type="button"
              onClick={handleTimeBoxTap}
              title={t.header.timeDateTitle}
              className={`flex flex-col items-end px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-white/90 border-2 shadow-warm-sm select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 ${
                isSecretMenuOpen 
                  ? 'border-forest-500 ring-2 ring-forest-400/30 bg-forest-50/70' 
                  : 'border-forest-200/80 hover:border-forest-400/80 hover:shadow-warm-md'
              }`}
            >
              <div className="flex items-center space-x-1.5 text-forest-900 font-extrabold text-base sm:text-xl font-brand-heading leading-tight">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-forest-600 shrink-0" aria-hidden="true" />
                <span>{formattedTime}</span>
              </div>
              <div className="flex items-center space-x-1 text-xs sm:text-sm font-semibold text-[#1A202C]/75 font-brand-body mt-0.5">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muga-500 shrink-0" aria-hidden="true" />
                <span>{formattedShortDate}</span>
              </div>
            </button>

            {/* Secret Menu for Caregiver / Admin Settings & Sign Out */}
            {isSecretMenuOpen && (
              <div 
                className="absolute right-0 top-full mt-2.5 w-80 bg-white rounded-2xl border-2 border-slate-200/90 shadow-2xl p-3 z-50 flex flex-col gap-2 ring-1 ring-black/5 overflow-hidden animate-fade-in"
                style={{ backgroundColor: '#ffffff', opacity: 1 }}
              >
                <div className="px-2 py-1 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-forest-600" />
                    {t.systemControls.title}
                  </span>
                  <span className="text-[10px] bg-forest-100 text-forest-800 font-bold px-2 py-0.5 rounded-full">
                    {t.systemControls.caregiverBadge}
                  </span>
                </div>

                {/* Elder NeuroID / Caregiver Connection Code */}
                <div className="p-3 bg-gradient-to-br from-forest-50/90 to-emerald-50/70 border border-forest-200/90 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-forest-800 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Elder NeuroID
                    </span>
                    <span className="text-[10px] text-forest-600 font-medium">Caregiver Code</span>
                  </div>

                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-forest-200/80 shadow-2xs">
                    <span className="font-mono font-extrabold text-base tracking-widest text-forest-900 select-all">
                      {inviteCode || (userId ? `NEURO-${userId.slice(-4).toUpperCase()}` : 'Connecting...')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const codeToCopy = inviteCode || (userId ? `NEURO-${userId.slice(-4).toUpperCase()}` : '');
                        if (codeToCopy && navigator.clipboard) {
                          navigator.clipboard.writeText(codeToCopy);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-700 hover:text-forest-900 bg-forest-100/80 hover:bg-forest-200/90 px-2 py-1 rounded-md transition-all cursor-pointer"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10.5px] text-forest-800/80 leading-snug">
                    Enter this code in your Caregiver Dashboard to link and monitor care in real time.
                  </p>
                </div>

                {/* Comfort & Display Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSecretMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-forest-50/70 text-slate-700 hover:text-forest-800 flex items-center gap-3 text-left text-sm font-semibold group cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-forest-100 flex items-center justify-center text-forest-700 shrink-0">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-800">Comfort & Display</span>
                    <span className="text-[10.5px] text-slate-500 font-normal truncate">Text size, contrast & sound</span>
                  </div>
                </button>

                {/* Sign Out Option */}
                <button
                  type="button"
                  onClick={() => { performLogout(); }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-red-50 text-slate-700 hover:text-red-700 flex items-center gap-3 text-left text-sm font-semibold group cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100/70 flex items-center justify-center text-red-600 shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-800">{t.systemControls.signOut}</span>
                    <span className="text-[10.5px] text-slate-500 font-normal truncate">{t.systemControls.signOutSub}</span>
                  </div>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>
    </div>
  );
};
