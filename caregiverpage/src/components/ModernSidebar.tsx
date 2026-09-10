import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Users,
  PieChart,
  Calendar,
  Globe,
  MessageSquare,
  SlidersHorizontal,
  LogOut,
  User,
  ExternalLink,
  ChevronRight,
  Music
} from 'lucide-react';
import { AUTHPAGE_URL, HOMEPAGE_URL } from '../config/urls';

interface ModernSidebarProps {
  caregiverName: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenLinkModal?: () => void;
  onOpenSettingsModal?: () => void;
  onLogout?: () => void;
}

export const ModernSidebar: React.FC<ModernSidebarProps> = ({
  caregiverName,
  activeTab = 'analytics',
  onTabChange,
  onOpenLinkModal,
  onOpenSettingsModal,
  onLogout,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      try {
        localStorage.removeItem('neuronova_auth_session');
      } catch (_) {}
      window.location.href = `${AUTHPAGE_URL}/`;
    }
  };

  const navItems = [
    { id: 'dashboard', icon: Activity, label: 'Overview Metrics', desc: 'Vitals & clinical summary' },
    { id: 'analytics', icon: PieChart, label: 'Brain Games Telemetry', desc: 'Cognitive stability & game scores' },
    { id: 'music', icon: Music, label: 'Music Analytics', desc: 'Last played, liked & history' },
    { id: 'routine', icon: Calendar, label: 'Routine Stream', desc: 'Daily milestones & adherence' },
    { id: 'voice', icon: MessageSquare, label: 'Voice Transcripts', desc: 'Assistant conversation logs' },
    { id: 'patients', icon: Users, label: 'Linked Loved Ones', desc: 'Manage linked patients' },
    { id: 'network', icon: Globe, label: 'Elder Sanctuary Portal', desc: 'Open patient homepage' },
    { id: 'settings', icon: SlidersHorizontal, label: 'Caregiver Settings', desc: 'Alerts & preferences' },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'patients') {
      onOpenLinkModal?.();
    } else if (id === 'network') {
      window.open(HOMEPAGE_URL || 'http://localhost:5175/', '_blank');
    } else if (id === 'settings') {
      onOpenSettingsModal?.();
    } else {
      onTabChange?.(id);
    }
  };

  return (
    <aside className="w-[76px] sm:w-[84px] bg-[#0E1322] flex flex-col items-center justify-between py-6 px-2 sm:px-3 select-none shrink-0 z-40 h-full relative shadow-2xl overflow-y-auto overflow-x-hidden no-scrollbar">
      {/* Top Brand Logo */}
      <div className="flex flex-col items-center space-y-7 w-full">
        <div
          onClick={() => onTabChange?.('analytics')}
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E26E65] via-[#E86D7C] to-[#E96096] flex items-center justify-center shadow-lg shadow-pink-500/20 cursor-pointer transition-transform hover:scale-105 active:scale-95 group relative"
          title="NeuroNova Caregiver Hub"
        >
          {/* Stylized organic abstract brand emblem */}
          <svg viewBox="0 0 32 32" className="w-6 h-6 text-white" fill="currentColor">
            <path d="M10 6C7.79 6 6 7.79 6 10C6 12.21 7.79 14 10 14H16C19.31 14 22 16.69 22 20C22 23.31 19.31 26 16 26C12.69 26 10 23.31 10 20" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="21" cy="9" r="3.5" fill="#FFF" />
          </svg>

          {/* Tooltip on hover */}
          <div className="absolute left-[70px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#111625] text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-slate-700/60 z-50">
            NeuroNova Home
          </div>
        </div>

        {/* Vertical Icon Navigation Rail */}
        <nav className="flex flex-col items-center space-y-3 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="relative group w-full flex justify-center">
                <button
                  onClick={() => handleNavClick(item.id)}
                  aria-label={item.label}
                  className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#2A344A] text-white shadow-md'
                      : 'text-[#8F9BAE] hover:text-white hover:bg-[#1A2234]'
                  }`}
                >
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />

                  {/* Active Indicator Dot on right border edge */}
                  {isActive && (
                    <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm shadow-white/80" />
                  )}
                </button>

                {/* Rich Floating Tooltip */}
                <div className="absolute left-[70px] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#111625] text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-slate-700/60 z-50 flex items-center space-x-1.5">
                  <span>{item.label}</span>
                  {item.id === 'network' && <ExternalLink className="w-3 h-3 text-stone-400" />}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Artwork & Caregiver Profile Avatar */}
      <div className="flex flex-col items-center space-y-4 w-full" ref={profileRef}>
        {/* Colorful 3D clay torus accent SVG */}
        <div className="w-12 h-12 relative flex items-center justify-center pointer-events-none opacity-90 transition-transform hover:scale-110">
          <svg viewBox="0 0 60 60" className="w-12 h-12 drop-shadow-md">
            <defs>
              <linearGradient id="clayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#FB7185" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
            </defs>
            <path
              d="M 18 35 C 10 25, 20 12, 35 15 C 48 18, 52 32, 42 42 C 32 52, 14 48, 22 36 C 26 30, 36 28, 40 34"
              fill="none"
              stroke="url(#clayGradient)"
              strokeWidth="10"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Profile Avatar with Sign Out dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            title={`${caregiverName} • Account & Sign Out`}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md hover:border-pink-400 transition-all cursor-pointer group"
          >
            {caregiverName.slice(0, 2).toUpperCase()}
          </button>
          
          {/* Notification / online count badge */}
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E86D7C] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-[#0E1322] pointer-events-none">
            6
          </span>

          {/* Caregiver Profile & Sign Out Popover Menu */}
          {isProfileOpen && (
            <div className="absolute left-[70px] bottom-0 w-64 bg-white rounded-2xl shadow-warm-xl border border-stone-200 p-3 z-50 animate-fadeIn text-[#111625]">
              <div className="flex items-center space-x-3 p-2 bg-stone-50 rounded-xl mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#111625] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {caregiverName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold truncate block text-[#111625]">
                    {caregiverName}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                    Family Caregiver
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenLinkModal?.();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-stone-500" />
                    <span>Manage Linked Patients</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onTabChange?.('settings');
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
                    <span>Settings & Alerts</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </button>

                <div className="pt-2 mt-1 border-t border-stone-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 p-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
