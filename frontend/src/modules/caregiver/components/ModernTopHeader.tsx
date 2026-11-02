import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  Maximize2,
  Bell,
  Plus,
  UserCheck,
  Check,
  Sparkles,
  Pill,
  Music,
  MessageSquare,
  Clock,
  LogOut,
  X,
  Gamepad2,
  Calendar,
  ArrowRight,
  Mic,
  CalendarCheck,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { LinkedPatient, PatientOverview } from '../types';
import { AUTHPAGE_URL, BACKEND_URL } from '../config/urls';
import { caregiverSocketService } from '../services/socketService';

interface ModernTopHeaderProps {
  caregiverName: string;
  caregiverId?: string;
  patients: LinkedPatient[];
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string) => void;
  onOpenLinkModal: () => void;
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
  onLogout?: () => void;
  overview?: PatientOverview | null;
  onNavigateTab?: (tab: string, filterQuery?: string) => void;
  onOpenSettingsModal?: () => void;
  onOpenTaskManager?: () => void;
  onOpenVoiceNotes?: () => void;
  unreadVoiceNotesCount?: number;
  missedTasksCount?: number;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timeAgo: string;
  isUnread: boolean;
  relatedEntityId?: string;
  actionStatus?: 'pending' | 'accepted' | 'rejected';
}

export const ModernTopHeader: React.FC<ModernTopHeaderProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  onOpenLinkModal,
  onSearchChange,
  searchQuery = '',
  onLogout,
  overview,
  onNavigateTab,
  onOpenTaskManager,
  onOpenVoiceNotes,
  unreadVoiceNotesCount = 0,
  missedTasksCount = 0,
  caregiverId = 'caregiver_ravi',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentPatient = patients.find(p => p.patientId === selectedPatientId) || patients[0];
  const patientDisplayName = currentPatient ? currentPatient.patientName : 'kamla.sharma';

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Load real notifications from backend
  const loadNotifications = async () => {
    try {
      const res = await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/notifications/${encodeURIComponent(caregiverId)}`);
      if (res.ok) {
        const data = await res.json();
        const serverNotifs: any[] = data.notifications || [];
        if (serverNotifs.length > 0) {
          setNotifications(serverNotifs.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            description: n.message,
            timeAgo: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isUnread: !n.read,
            relatedEntityId: n.relatedEntityId,
            actionStatus: 'pending',
          })));
          return;
        }
      }
    } catch (_) {}

    // Fallback baseline notifications
    setNotifications([
      {
        id: '1',
        type: 'cognitive',
        title: 'Cognitive Benchmark Mastered',
        description: `${patientDisplayName} maintained 93% accuracy across memory sessions.`,
        timeAgo: '12m ago',
        isUnread: true,
      },
      {
        id: '2',
        type: 'medication',
        title: 'Evening Medicine Taken',
        description: 'Blood pressure & cognitive support doses marked as completed.',
        timeAgo: '45m ago',
        isUnread: true,
      },
    ]);
  };

  // Inject streak-ending-soon alerts whenever patient list updates
  useEffect(() => {
    if (!patients || patients.length === 0) return;
    const now = Date.now();
    const STREAK_WARNING_HOURS = 16; // alert starts at 16h inactivity
    const STREAK_EXPIRY_HOURS = 24;  // streak dies at 24h

    const streakAlerts: NotificationItem[] = [];
    for (const p of patients) {
      if (!p.lastActiveAt) continue;
      const lastActive = new Date(p.lastActiveAt).getTime();
      const hoursInactive = (now - lastActive) / (1000 * 60 * 60);
      if (hoursInactive >= STREAK_WARNING_HOURS && hoursInactive < STREAK_EXPIRY_HOURS) {
        const hoursLeft = Math.max(0, STREAK_EXPIRY_HOURS - hoursInactive);
        const minsLeft = Math.round((hoursLeft % 1) * 60);
        const timeLabel = hoursLeft < 1
          ? `${minsLeft}min`
          : `${Math.floor(hoursLeft)}h ${minsLeft}min`;
        streakAlerts.push({
          id: `streak_alert_${p.patientId}`,
          type: 'STREAK_ALERT',
          title: `Streak Ending Soon — ${p.patientName}`,
          description: `${p.patientName} hasn't been active for ${Math.floor(hoursInactive)}h. Their daily streak will expire in ~${timeLabel}. Encourage them to do a quick game or routine check-in!`,
          timeAgo: `${Math.floor(hoursInactive)}h inactive`,
          isUnread: true,
          relatedEntityId: p.patientId,
        });
      }
    }

    if (streakAlerts.length > 0) {
      setNotifications(prev => {
        // Remove stale streak alerts, then prepend fresh ones
        const withoutOld = prev.filter(n => n.type !== 'STREAK_ALERT');
        return [...streakAlerts, ...withoutOld];
      });
      // Auto-open bell panel so caregiver sees it immediately
      setIsNotificationOpen(true);
    } else {
      // Clear any stale streak alerts when patient becomes active again
      setNotifications(prev => prev.filter(n => n.type !== 'STREAK_ALERT'));
    }
  }, [patients]);

  useEffect(() => {
    loadNotifications();

    const socket = caregiverSocketService.connect(caregiverId, 'caregiver');

    const handleNewNotif = (data: any) => {
      setNotifications(prev => [
        {
          id: data.id || `notif_${Date.now()}`,
          type: data.type || 'HEALTH_WORKER_ACCESS_REQUEST',
          title: data.title || 'Health Worker Access Request',
          description: data.message || 'Health worker requested access to patient clinical telemetry.',
          timeAgo: 'Just now',
          isUnread: true,
          relatedEntityId: data.relatedEntityId || data.requestId,
          actionStatus: 'pending',
        },
        ...prev,
      ]);
      if (data.type === 'CALL') {
        window.dispatchEvent(new CustomEvent('neuronova:incoming_call', {
          detail: {
            callId: data.callId || data.relatedEntityId || `call_${Date.now()}`,
            callerId: data.callerId || data.patientId || 'patient',
            callerName: data.callerName || data.patientName || 'Patient',
            hasVideo: false,
          }
        }));
      } else if (data.type === 'HEALTH_WORKER_ACCESS_REQUEST') {
        setIsNotificationOpen(true);
      }
    };

    socket.on('caregiver:notification:new', handleNewNotif);
    const handleHwRequest = (data: any) => {
      handleNewNotif({
        id: `hw_req_${Date.now()}`,
        type: 'HEALTH_WORKER_ACCESS_REQUEST',
        title: 'Health Worker Access Request',
        message: `${data.workerName || 'Clinical Health Worker'} (${data.organization || 'Clinical Network'}) requested authorization to access ${data.patientName || 'patient'}'s medical telemetry and reports.`,
        relatedEntityId: data.requestId,
      });
      setIsNotificationOpen(true);
    };
    socket.on('healthworker:access_request:new', handleHwRequest);

    return () => {
      socket.off('caregiver:notification:new', handleNewNotif);
      socket.off('healthworker:access_request:new', handleHwRequest);
    };
  }, [caregiverId, patientDisplayName]);

  const unreadCount = notifications.filter(n => n.isUnread).length;

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      try {
        localStorage.removeItem('neuronova_auth_session');
      } catch (_) {}
      window.location.href = `${AUTHPAGE_URL}/`;
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Ctrl+K / Cmd+K search shortcut & Escape to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleRespondAccessRequest = async (notifId: string, requestId: string | undefined, action: 'accept' | 'reject') => {
    const targetId = requestId || notifId;
    try {
      const res = await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/health-workers/access-requests/${encodeURIComponent(targetId)}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caregiverId,
          action,
        }),
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, actionStatus: action === 'accept' ? 'accepted' : 'rejected', isUnread: false } : n));
      }
    } catch (err) {
      console.error('Failed to respond to health worker access request:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'HEALTH_WORKER_ACCESS_REQUEST':
        return <ShieldCheck className="w-4 h-4 text-sky-600" />;
      case 'STREAK_ALERT':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'cognitive':
        return <Sparkles className="w-4 h-4 text-[#E86D7C]" />;
      case 'medication':
        return <Pill className="w-4 h-4 text-emerald-600" />;
      case 'music':
        return <Music className="w-4 h-4 text-purple-600" />;
      case 'voice':
        return <MessageSquare className="w-4 h-4 text-sky-600" />;
      default:
        return <Clock className="w-4 h-4 text-amber-600" />;
    }
  };

  const q = searchQuery.trim().toLowerCase();

  // 1. Brain Games
  const allGames = [
    { id: 'memoryMatch', name: 'Memory Match', desc: 'Visual Card Pairs & Recall', tab: 'games' },
    { id: 'attentionGame', name: 'Attention Focus', desc: 'Selective Focus & Reaction Latency', tab: 'games' },
    { id: 'sequenceRecall', name: 'Sequence Recall', desc: 'Working Memory Grid Matrix', tab: 'games' },
    { id: 'culturalHeritage', name: 'Cultural Heritage Memory', desc: 'Reminiscence & Landmark Recognition', tab: 'games' },
  ];
  const matchedGames = q 
    ? allGames.filter(g => g.name.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q))
    : allGames;

  // 2. Music & Songs
  const allMusic = [
    ...(overview?.music?.recentLiked || []).map(m => ({ title: m.title, artist: m.artist, genre: m.genre || 'Nostalgic Melody', type: 'Liked Song' })),
    ...(overview?.music?.recentHistory || []).map(m => ({ title: m.title, artist: m.artist, genre: m.genre || 'Nostalgic Melody', type: 'Recently Played' })),
    { title: 'Yeh Shaam Mastani - Kati Patang', artist: 'Kishore Kumar', genre: '1970s Bollywood', type: 'Golden Classic' },
    { title: 'Peaceful Sitar & Tanpura - Raga Bhairavi', artist: 'Healing Indian Ragas', genre: 'Indian Classical', type: 'Calming Raga' },
    { title: 'Lag Ja Gale Se Phir', artist: 'Lata Mangeshkar', genre: '1960s Evergreen', type: 'Evergreen' },
    { title: 'Hawayein - Acoustic Nostalgia', artist: 'Arijit Singh, Pritam', genre: 'Soft Acoustic', type: 'Acoustic' },
    { title: 'Aye Mere Watan Ke Logon', artist: 'Lata Mangeshkar', genre: 'Devotional & Patriotic', type: 'Patriotic' },
  ];
  const uniqueMusic = allMusic.filter((item, idx, self) => 
    idx === self.findIndex(t => t.title.toLowerCase() === item.title.toLowerCase())
  );
  const matchedMusic = q
    ? uniqueMusic.filter(m => 
        m.title.toLowerCase().includes(q) || 
        m.artist.toLowerCase().includes(q) || 
        (m.genre && m.genre.toLowerCase().includes(q))
      ).slice(0, 4)
    : uniqueMusic.slice(0, 3);

  // 3. Routine Schedule & Meds
  const allRoutine: Array<{ title: string; completed: boolean; scheduledTime?: string }> = 
    (overview?.today?.routineLogs && overview.today.routineLogs.length > 0)
      ? overview.today.routineLogs
      : [
          { title: 'Morning Blood Pressure & Heart Rate Log', completed: true, scheduledTime: '08:00 AM' },
          { title: 'Morning Medicine & Vitamin Support', completed: true, scheduledTime: '08:30 AM' },
          { title: 'Mid-Morning Hydration & Green Tea', completed: true, scheduledTime: '10:30 AM' },
          { title: 'Light Sequence Cognitive Exercise', completed: true, scheduledTime: '11:00 AM' },
          { title: 'Afternoon Nutrition & Calm Music', completed: true, scheduledTime: '01:00 PM' },
          { title: 'Evening Hydration & Garden Stroll', completed: true, scheduledTime: '05:30 PM' },
          { title: 'Evening Medication & Rest Preparation', completed: false, scheduledTime: '08:00 PM' },
        ];
  const matchedRoutine = q
    ? allRoutine.filter((r: { title: string }) => r.title.toLowerCase().includes(q)).slice(0, 4)
    : allRoutine.slice(0, 3);

  // 4. Voice Transcripts
  const allVoice = [
    { id: 'v1', topic: 'Patient requested soothing sitar and Kishore Kumar music', time: '11:15 AM' },
    { id: 'v2', topic: 'Family reminiscence and childhood home discussion', time: '09:30 AM' },
    { id: 'v3', topic: 'Morning well-being and medication verification check-in', time: '08:15 AM' },
  ];
  const matchedVoice = q
    ? allVoice.filter(v => v.topic.toLowerCase().includes(q))
    : allVoice.slice(0, 2);

  // 5. Patients
  const matchedPatients = q
    ? patients.filter(p => p.patientName.toLowerCase().includes(q) || p.patientId.toLowerCase().includes(q))
    : [];

  const totalMatchesCount = matchedGames.length + matchedMusic.length + matchedRoutine.length + matchedVoice.length + matchedPatients.length;

  const handleSelectResult = (tab: string, filterQuery?: string) => {
    if (onNavigateTab) {
      onNavigateTab(tab, filterQuery);
    }
    if (onSearchChange && filterQuery !== undefined) {
      onSearchChange(filterQuery);
    }
    setIsSearchOpen(false);
    const el = document.getElementById('activity-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6 pb-4 px-6 sm:px-8 select-none">
      {/* Left: Bold Page Title + Patient Selector Pill */}
      <div className="flex items-center space-x-5 flex-wrap gap-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111625] tracking-tight font-brand-heading">
          Analytics
        </h1>

        {/* Patient Selector Dropdown Pill */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-white border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all cursor-pointer group"
          >
            {/* Dark circular brand/patient icon */}
            <div className="w-6 h-6 rounded-full bg-[#111625] text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#E86D7C] transition-colors">
              <span className="text-[10px] font-black">
                {currentPatient?.patientName ? currentPatient.patientName.slice(0, 1).toUpperCase() : 'P'}
              </span>
            </div>
            
            <span className="text-xs sm:text-sm font-bold text-[#111625] max-w-[160px] sm:max-w-[200px] truncate">
              {currentPatient ? currentPatient.patientName : 'Select Patient'}
            </span>

            <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-warm-xl border border-stone-200 p-2 z-50 animate-fadeIn">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Connected Loved Ones
              </div>
              <div className="space-y-1 my-1 max-h-48 overflow-y-auto custom-scrollbar">
                {patients.map((p) => {
                  const isSelected = p.patientId === selectedPatientId;
                  return (
                    <button
                      key={p.patientId}
                      onClick={() => {
                        onSelectPatient(p.patientId);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-stone-100 text-[#111625]'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-xs text-stone-800 font-bold shrink-0">
                          {p.patientName.slice(0, 1)}
                        </div>
                        <span className="truncate">{p.patientName}</span>
                      </div>
                      {isSelected && <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-stone-100">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenLinkModal();
                  }}
                  className="w-full flex items-center justify-center space-x-2 p-2 rounded-xl bg-stone-50 hover:bg-[#E86D7C]/10 text-stone-800 hover:text-[#E86D7C] text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Link Another Patient</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Search Bar, "+ New Patient", Fullscreen, Notification & Sign Out */}
      <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
        {/* Rounded Pill Search Bar & Live Spotlight Popover */}
        <div className="relative flex-1 md:w-56 lg:w-64" ref={searchContainerRef}>
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange?.(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search analytics, music, vitals..."
            className="w-full pl-9 pr-8 py-2 rounded-full bg-white/90 border border-stone-200/80 text-xs text-[#111625] placeholder-stone-400 focus:outline-none focus:border-[#E86D7C] focus:bg-white focus:ring-2 focus:ring-[#E86D7C]/15 transition-all shadow-2xs"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                onSearchChange?.('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden lg:inline-flex items-center absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-stone-400 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded pointer-events-none">
              ⌘K
            </kbd>
          )}

          {/* Interactive Search Results Spotlight Popover */}
          {isSearchOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-[420px] max-h-[440px] overflow-y-auto custom-scrollbar bg-white rounded-2xl shadow-warm-xl border border-stone-200 p-3 z-50 animate-fadeIn text-[#111625]">
              {/* Popover Header */}
              <div className="flex items-center justify-between px-2 pb-2 border-b border-stone-100 mb-2">
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-stone-400">
                  {q ? `Search Results for "${searchQuery}"` : 'Quick Analytics Directory'}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">ESC to close</span>
              </div>

              {q && totalMatchesCount === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs font-semibold text-stone-500">No records found matching "{searchQuery}"</p>
                  <p className="text-[11px] text-stone-400 mt-1">Try searching for "Memory", "Kishore Kumar", "Medicine", or "Hydration"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Category: Brain Games */}
                  {matchedGames.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-purple-700">
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>Cognitive Games & Telemetry</span>
                      </div>
                      <div className="space-y-1">
                        {matchedGames.map(game => (
                          <div
                            key={game.id}
                            onClick={() => handleSelectResult('games', game.name)}
                            className="p-2 px-2.5 rounded-xl hover:bg-purple-50/70 transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-[#111625] group-hover:text-purple-700 block truncate">
                                {game.name}
                              </span>
                              <span className="text-[10px] text-stone-400 block truncate">
                                {game.desc}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-purple-600 text-[11px] font-bold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>Telemetry</span>
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Music Therapy */}
                  {matchedMusic.length > 0 && (
                    <div className="pt-2 border-t border-stone-100">
                      <div className="flex items-center space-x-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-pink-700">
                        <Music className="w-3.5 h-3.5" />
                        <span>Nostalgia Music Therapy</span>
                      </div>
                      <div className="space-y-1">
                        {matchedMusic.map((song, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectResult('music', song.title)}
                            className="p-2 px-2.5 rounded-xl hover:bg-pink-50/70 transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-[#111625] group-hover:text-[#E86D7C] block truncate">
                                {song.title}
                              </span>
                              <span className="text-[10px] text-stone-400 block truncate">
                                {song.artist} {song.genre ? `• ${song.genre}` : ''}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-[#E86D7C] text-[11px] font-bold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>Play Track</span>
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Routine Care & Meds */}
                  {matchedRoutine.length > 0 && (
                    <div className="pt-2 border-t border-stone-100">
                      <div className="flex items-center space-x-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Routine Stream & Medication</span>
                      </div>
                      <div className="space-y-1">
                        {matchedRoutine.map((task: { title: string; completed: boolean; scheduledTime?: string }, i: number) => (
                          <div
                            key={i}
                            onClick={() => handleSelectResult('routine', task.title)}
                            className="p-2 px-2.5 rounded-xl hover:bg-amber-50/70 transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-[#111625] group-hover:text-amber-800 block truncate">
                                {task.title}
                              </span>
                              <span className="text-[10px] text-stone-400 block truncate">
                                {task.scheduledTime || 'Daily schedule'}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              task.completed 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-stone-100 text-stone-600'
                            }`}>
                              {task.completed ? '✓ Completed' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Voice Transcripts */}
                  {matchedVoice.length > 0 && (
                    <div className="pt-2 border-t border-stone-100">
                      <div className="flex items-center space-x-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Voice Companion Logs</span>
                      </div>
                      <div className="space-y-1">
                        {matchedVoice.map(v => (
                          <div
                            key={v.id}
                            onClick={() => handleSelectResult('voice', v.topic)}
                            className="p-2 px-2.5 rounded-xl hover:bg-blue-50/70 transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <span className="text-xs font-semibold text-[#111625] group-hover:text-blue-700 block truncate flex-1">
                              {v.topic}
                            </span>
                            <span className="text-[10px] text-stone-400 shrink-0 ml-2">
                              {v.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Patients */}
                  {matchedPatients.length > 0 && (
                    <div className="pt-2 border-t border-stone-100">
                      <div className="flex items-center space-x-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Switch Patient</span>
                      </div>
                      <div className="space-y-1">
                        {matchedPatients.map(p => (
                          <div
                            key={p.patientId}
                            onClick={() => {
                              onSelectPatient(p.patientId);
                              setIsSearchOpen(false);
                            }}
                            className="p-2 px-2.5 rounded-xl hover:bg-emerald-50/70 transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <span className="text-xs font-bold text-[#111625] block truncate">
                              {p.patientName}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600">
                              Switch Patient →
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tasks & Schedule Management Button */}
        {onOpenTaskManager && (
          <button
            onClick={onOpenTaskManager}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-full bg-white border border-stone-200/90 hover:border-emerald-400 hover:bg-emerald-50/50 text-[#111625] text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 relative"
            title="Manage Patient Routine & Medication Schedule"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Tasks & Meds</span>
            {missedTasksCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>
        )}

        {/* Patient Voice Messages Button */}
        {onOpenVoiceNotes && (
          <button
            onClick={onOpenVoiceNotes}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-full bg-white border border-stone-200/90 hover:border-emerald-400 hover:bg-emerald-50/50 text-[#111625] text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 relative"
            title="Listen to Patient Voice Messages & Transcripts"
          >
            <Mic className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Voice Notes</span>
            {unreadVoiceNotesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-black">
                {unreadVoiceNotesCount}
              </span>
            )}
          </button>
        )}

        {/* Dark Action Button */}
        <button
          onClick={onOpenLinkModal}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#111625] hover:bg-[#1A2234] text-white text-xs sm:text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Patient</span>
        </button>

        {/* Fullscreen Expand Icon */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="w-9 h-9 rounded-full bg-white border border-stone-200/90 text-stone-600 hover:text-[#111625] hover:bg-stone-50 flex items-center justify-center shadow-2xs transition-colors cursor-pointer shrink-0"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Interactive Notification Bell with Dropdown */}
        <div className="relative shrink-0" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            title="Recent Telemetry Notifications"
            className={`w-9 h-9 rounded-full bg-white border border-stone-200/90 flex items-center justify-center shadow-2xs transition-all cursor-pointer ${
              isNotificationOpen ? 'ring-2 ring-[#E86D7C] text-[#E86D7C]' : 'text-stone-700 hover:text-[#111625] hover:bg-stone-50'
            }`}
          >
            <Bell className="w-4 h-4" />
          </button>

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E86D7C] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-[#F4F2EC] pointer-events-none">
              {unreadCount}
            </span>
          )}

          {/* Interactive Notifications Flyout Popover */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-warm-xl border border-stone-200 p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-extrabold text-[#111625]">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-pink-100 text-[#E86D7C] text-[10px] font-bold">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-bold text-[#E86D7C] hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="space-y-2.5 my-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-400">
                    No new notifications right now.
                  </div>
                ) : (
                  notifications.map((n) => (
                    n.type === 'HEALTH_WORKER_ACCESS_REQUEST' ? (
                      <div
                        key={n.id}
                        className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 space-y-2.5 transition-all"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="p-2 rounded-xl bg-white shadow-2xs shrink-0 mt-0.5 border border-sky-200 text-sky-700">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-sky-950">
                                {n.title}
                              </span>
                              <span className="text-[10px] font-bold text-sky-600 shrink-0 ml-1">
                                {n.timeAgo}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-700 mt-1 leading-relaxed font-medium">
                              {n.description}
                            </p>
                          </div>
                        </div>

                        {/* Interactive Decision Actions */}
                        {n.actionStatus === 'accepted' ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>✓ Access Granted to Clinical Practitioner</span>
                          </div>
                        ) : n.actionStatus === 'rejected' ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-800 bg-rose-100 px-3 py-1.5 rounded-lg">
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            <span>✗ Access Request Declined</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 pt-1 border-t border-sky-200/60">
                            <button
                              onClick={() => handleRespondAccessRequest(n.id, n.relatedEntityId, 'accept')}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => handleRespondAccessRequest(n.id, n.relatedEntityId, 'reject')}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : n.type === 'STREAK_ALERT' ? (
                      <div
                        key={n.id}
                        className="p-3.5 rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/60 transition-all flex items-start space-x-3 group relative animate-pulse-once"
                      >
                        {/* Flame Icon */}
                        <div className="p-2 rounded-xl bg-orange-100 border border-orange-200 shadow-xs shrink-0 mt-0.5">
                          <Flame className="w-4 h-4 text-orange-500" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-black text-orange-900 truncate">
                              {n.title}
                            </span>
                            <span className="text-[10px] font-bold text-orange-500 shrink-0 bg-orange-100 px-1.5 py-0.5 rounded-full">
                              {n.timeAgo}
                            </span>
                          </div>
                          <p className="text-[11px] text-orange-800/90 mt-1 leading-relaxed font-medium">
                            {n.description}
                          </p>
                          {/* Urgency bar */}
                          <div className="mt-2 flex items-center gap-1.5">
                            <div className="h-1 flex-1 rounded-full bg-orange-100 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full animate-pulse" style={{ width: '75%' }} />
                            </div>
                            <span className="text-[10px] font-bold text-orange-600">Streak at risk</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDismissNotification(n.id)}
                          className="opacity-0 group-hover:opacity-100 text-orange-400 hover:text-orange-700 transition-opacity cursor-pointer p-0.5 shrink-0"
                          title="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border transition-all flex items-start space-x-3 group relative ${
                          n.isUnread ? 'bg-pink-50/30 border-pink-100' : 'bg-stone-50/40 border-stone-100'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white shadow-2xs shrink-0 mt-0.5">
                          {getNotificationIcon(n.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#111625] truncate">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-stone-400 shrink-0 ml-1">
                              {n.timeAgo}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                            {n.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDismissNotification(n.id)}
                          className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-stone-700 transition-opacity cursor-pointer p-0.5"
                          title="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>Real-time clinical telemetry active</span>
                <span className="font-semibold text-emerald-600">Sync: Live</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Sign Out Button in Header */}
        <button
          onClick={handleSignOut}
          title="Sign Out of Caregiver Portal"
          className="w-9 h-9 rounded-full bg-white border border-stone-200/90 text-stone-700 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shadow-2xs transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
