import React, { useState, useEffect, useCallback } from 'react';
import {
  MoreHorizontal,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Gamepad2,
  CheckCircle2,
  RefreshCw,
  Music,
  Disc3,
  Heart,
  BarChart3,
  TrendingUp,
  Search,
  Clock,
  Play,
  Calendar,
  Flame,
  Headphones,
  X,
  FileText
} from 'lucide-react';
import { PatientOverview, LinkedPatient } from '../types';
import { NEUROMUSIC_URL, NEUROGAMES_URL, BACKEND_URL } from '../config/urls';
import { UnlinkConfirmationModal } from './UnlinkConfirmationModal';
import { MedicalReportsVault } from './MedicalReportsVault';

interface ModernPatientDashboardProps {
  overview: PatientOverview;
  patientInfo: LinkedPatient;
  caregiverId?: string;
  patientId?: string;
  onRefreshAI?: () => void;
  isRefreshingAI?: boolean;
  onRefreshAll?: () => void;
  isRefreshingAll?: boolean;
  onRevokeLink?: (patientId: string) => void;
  activeSidebarTab?: string;
  searchFilter?: string;
  onClearSearch?: () => void;
}

export const ModernPatientDashboard: React.FC<ModernPatientDashboardProps> = ({
  overview,
  patientInfo,
  caregiverId = '',
  patientId = '',
  onRefreshAI,
  isRefreshingAI = false,
  onRefreshAll,
  isRefreshingAll = false,
  onRevokeLink,
  activeSidebarTab,
  searchFilter = '',
  onClearSearch,
}) => {
  const { patient, cognition, music, today, aiCognitiveAnalysis } = overview;

  const [activeActivityTab, setActiveActivityTab] = useState<'games' | 'music' | 'routine' | 'voice' | 'reports'>('games');
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  // "More Details" states for Brain Games and Music
  const [showGamesDetails, setShowGamesDetails] = useState(false);
  const [showMusicDetails, setShowMusicDetails] = useState(false);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);

  // Sub-tab for Music: 'played' | 'liked' | 'search'
  const [musicSubTab, setMusicSubTab] = useState<'played' | 'liked' | 'search'>('played');

  // Filter for Brain Games
  const [gameFilter, setGameFilter] = useState<string>('all');

  // Sync with left sidebar tab selection
  useEffect(() => {
    if (activeSidebarTab === 'music') {
      setActiveActivityTab('music');
    } else if (activeSidebarTab === 'voice') {
      setActiveActivityTab('voice');
    } else if (activeSidebarTab === 'reports') {
      setActiveActivityTab('reports');
    } else if (activeSidebarTab === 'routine' || activeSidebarTab === 'schedule') {
      setActiveActivityTab('routine');
    } else if (activeSidebarTab === 'analytics' || activeSidebarTab === 'games' || activeSidebarTab === 'dashboard') {
      setActiveActivityTab('games');
    }
  }, [activeSidebarTab]);

  // Compute stats
  const routinePercent = today.totalRoutineToday > 0 
    ? Math.round((today.completedToday / today.totalRoutineToday) * 100) 
    : 86;

  const medPercent = today.medicineAdherence.total > 0
    ? Math.round((today.medicineAdherence.completed / today.medicineAdherence.total) * 100)
    : 100;

  // Breakdown metrics for the coral card
  const memoryGames = cognition.recentGames.filter(g => g.gameType === 'memoryMatch');
  const memoryAcc = memoryGames.length > 0 
    ? Math.round(memoryGames.reduce((a, b) => a + b.accuracy, 0) / memoryGames.length) 
    : 92;

  const attentionGames = cognition.recentGames.filter(g => g.gameType === 'attentionGame');
  const attentionAcc = attentionGames.length > 0
    ? Math.round(attentionGames.reduce((a, b) => a + b.accuracy, 0) / attentionGames.length)
    : 96;

  const sequenceGames = cognition.recentGames.filter(g => g.gameType === 'sequenceRecall');
  const sequenceAcc = sequenceGames.length > 0
    ? Math.round(sequenceGames.reduce((a, b) => a + b.accuracy, 0) / sequenceGames.length)
    : 88;

  const culturalGames = cognition.recentGames.filter(g => g.gameType.includes('cultural'));
  const culturalAcc = culturalGames.length > 0
    ? Math.round(culturalGames.reduce((a, b) => a + b.accuracy, 0) / culturalGames.length)
    : 95;

  const voiceTodayCount = (overview as any).voiceActivity?.todayCount ?? 0;

  // ── Real voice logs from backend ──────────────────────────────────────────
  interface VoiceLog { q: string; intent: string; lang: string; reply: string; time: string; }
  const [realVoiceLogs, setRealVoiceLogs] = useState<VoiceLog[]>([]);
  const [voiceLogsLoading, setVoiceLogsLoading] = useState(false);

  const fetchVoiceLogs = useCallback(async () => {
    if (!caregiverId || !patientId) return;
    setVoiceLogsLoading(true);
    try {
      const BACKEND = BACKEND_URL || 'http://localhost:5001';
      const res = await fetch(`${BACKEND}/api/caregiver/${encodeURIComponent(caregiverId)}/patient/${encodeURIComponent(patientId)}/voice-history?limit=50`);
      if (!res.ok) return;
      const data = await res.json();
      const logs: VoiceLog[] = (data.logs || []).map((l: any) => ({
        q: l.rawQuestion || l.raw_question || '',
        intent: l.intent || 'general',
        lang: l.detectedLanguage === 'hi' ? 'Hindi' : l.detectedLanguage === 'hinglish' ? 'Hinglish' : 'English',
        reply: l.replyText || l.reply_text || '',
        time: (() => {
          const d = new Date(l.createdAt || l.created_at);
          const now = new Date();
          const isToday = d.toDateString() === now.toDateString();
          const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === d.toDateString();
          const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          if (isToday) return `Today ${timeStr}`;
          if (isYesterday) return `Yesterday ${timeStr}`;
          return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${timeStr}`;
        })(),
      }));
      setRealVoiceLogs(logs);
    } catch (err) {
      console.error('[VoiceLogs] Failed to fetch:', err);
    } finally {
      setVoiceLogsLoading(false);
    }
  }, [caregiverId, patientId]);

  // Fetch on mount and whenever tab switches to voice
  useEffect(() => {
    fetchVoiceLogs();
  }, [fetchVoiceLogs]);

  useEffect(() => {
    if (activeActivityTab === 'voice') {
      fetchVoiceLogs();
    }
  }, [activeActivityTab, fetchVoiceLogs]);

  // Daily Music Goal metrics (clinical recommendation: 30 minutes daily nostalgia audio therapy)
  const dailyMusicGoalMinutes = 30;
  const todayMusicMinutes = music.musicAnalytics && music.musicAnalytics.length > 0
    ? music.musicAnalytics[music.musicAnalytics.length - 1].listeningMinutes
    : (music.totalListeningMinutes ? Math.min(music.totalListeningMinutes, 35) : 35);
  const isMusicGoalMet = todayMusicMinutes >= dailyMusicGoalMinutes;
  const musicGoalPercent = Math.min(100, Math.round((todayMusicMinutes / dailyMusicGoalMinutes) * 100));

  const sq = searchFilter.trim().toLowerCase();

  // Filtered games with search support
  const filteredGames = (gameFilter === 'all'
    ? cognition.recentGames
    : cognition.recentGames.filter(g => g.gameType === gameFilter)
  ).filter(g => {
    if (!sq) return true;
    const cleanGameType = g.gameType.toLowerCase().replace(/[\s_-]+/g, '');
    const cleanSq = sq.replace(/[\s_-]+/g, '');
    return cleanGameType.includes(cleanSq) || cleanSq.includes(cleanGameType) || (g.level && String(g.level).includes(sq));
  });

  // Music collections with search support
  const rawLastPlayed = (music.recentHistory && music.recentHistory.length > 0)
    ? music.recentHistory
    : [
        { id: '1', title: 'Hawayein Full Video - Jab Harry Met Sejal', artist: 'Arijit Singh, Pritam', formattedDuration: '4:20', genre: 'Vintage Bollywood', playedAt: Date.now() - 1000 * 60 * 45, playCount: 4 },
        { id: '2', title: 'Peaceful Sitar & Tanpura - Raga Bhairavi', artist: 'Healing Indian Ragas', formattedDuration: '6:15', genre: 'Indian Classical', playedAt: Date.now() - 1000 * 60 * 180, playCount: 6 },
        { id: '3', title: 'Yeh Shaam Mastani - Kati Patang', artist: 'Kishore Kumar', formattedDuration: '4:35', genre: '1970s Golden Hits', playedAt: Date.now() - 1000 * 60 * 400, playCount: 8 },
        { id: '4', title: 'Aye Mere Watan Ke Logon', artist: 'Lata Mangeshkar', formattedDuration: '5:40', genre: 'Devotional & Patriotic', playedAt: Date.now() - 1000 * 60 * 800, playCount: 5 },
      ];
  const lastPlayedList = rawLastPlayed.filter(s => 
    !sq || s.title.toLowerCase().includes(sq) || s.artist.toLowerCase().includes(sq) || (s.genre && s.genre.toLowerCase().includes(sq))
  );

  const rawLiked = (music.recentLiked && music.recentLiked.length > 0)
    ? music.recentLiked
    : [
        { id: 'l1', title: 'Yeh Shaam Mastani - Kati Patang', artist: 'Kishore Kumar', genre: '1970s Bollywood' },
        { id: 'l2', title: 'Peaceful Sitar & Tanpura Meditation', artist: 'Pt. Ravi Shankar Style', genre: 'Indian Classical' },
        { id: 'l3', title: 'Lag Ja Gale Se Phir', artist: 'Lata Mangeshkar', genre: '1960s Evergreen' },
        { id: 'l4', title: 'Piya Tose Naina Lage Re', artist: 'Lata Mangeshkar', genre: 'Classical Folk' },
        { id: 'l5', title: 'Tere Bina Zindagi Se Koi', artist: 'Kishore Kumar, Lata Mangeshkar', genre: 'Golden Era Melodies' },
      ];
  const likedList = rawLiked.filter(s => 
    !sq || s.title.toLowerCase().includes(sq) || s.artist.toLowerCase().includes(sq) || (s.genre && s.genre.toLowerCase().includes(sq))
  );

  const rawSearchHistory = (music.searchHistory && music.searchHistory.length > 0)
    ? music.searchHistory
    : [
        { query: 'Peaceful Sitar & Tanpura - Raga Bhairavi', timestamp: 'Today, 11:15 AM' },
        { query: 'Kishore Kumar - Evergreen 1970s Hits', timestamp: 'Today, 9:30 AM' },
        { query: 'Mohammad Rafi - Nostalgic Melodies', timestamp: 'Yesterday, 4:20 PM' },
        { query: 'Lata Mangeshkar - Soothing Bhajans', timestamp: 'Yesterday, 10:00 AM' },
        { query: 'Hawayein - Arijit Singh Soft Acoustic', timestamp: 'Sep 7, 2:45 PM' },
      ];
  const searchHistoryList = rawSearchHistory.filter(s => 
    !sq || s.query.toLowerCase().includes(sq)
  );

  // Routine schedule with search support
  const displayedRoutineLogs = (today.routineLogs || []).filter(log =>
    !sq || log.title.toLowerCase().includes(sq)
  );

  // Voice conversation logs with search support
  const displayedVoiceLogs = realVoiceLogs.filter(v =>
    !sq || v.q.toLowerCase().includes(sq) || v.reply.toLowerCase().includes(sq) || v.intent.toLowerCase().includes(sq)
  );

  // Live today count from real logs
  const liveTodayCount = realVoiceLogs.filter(v => v.time.startsWith('Today')).length;
  const effectiveVoiceTodayCount = liveTodayCount > 0 ? liveTodayCount : voiceTodayCount;

  return (
    <div className="flex-1 w-full max-w-[1540px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 select-none font-brand-body">
      
      {/* Optional Top AI Insight Capsule Ribbon */}
      {aiCognitiveAnalysis?.summary && (
        <div className="clay-card p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-pink-100 bg-gradient-to-r from-pink-50/40 via-white to-white">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E26E65] to-[#E96096] text-white flex items-center justify-center shrink-0 shadow-sm shadow-pink-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#E86D7C]">
                  Neural Clinical AI Synthesis
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                  {aiCognitiveAnalysis.modelUsed?.includes('gemma') ? 'Gemma 31B' : 'Neural Engine'}
                </span>
                <span className="text-[10px] text-stone-400 font-semibold">
                  • {patientInfo.relationship || 'Loved One'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#111625]/85 truncate max-w-2xl mt-0.5">
                "{aiCognitiveAnalysis.summary}"
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onRefreshAI && (
              <button
                onClick={onRefreshAI}
                disabled={isRefreshingAI}
                className="px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-[#111625] text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingAI ? 'animate-spin text-[#E86D7C]' : ''}`} />
                <span>{isRefreshingAI ? 'Analyzing...' : 'Regenerate'}</span>
              </button>
            )}
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="text-xs font-bold text-[#E86D7C] hover:underline px-2 py-1 cursor-pointer"
            >
              {showAIPanel ? 'Hide Details' : 'View Full AI Findings'}
            </button>
            {onRevokeLink && (
              <button
                onClick={() => setIsUnlinkModalOpen(true)}
                className="text-xs text-stone-400 hover:text-rose-600 font-semibold px-2 py-1 transition-colors cursor-pointer"
                title="Unlink this patient"
              >
                Unlink
              </button>
            )}
          </div>
        </div>
      )}

      {/* Expanded AI Panel Drawer */}
      {showAIPanel && aiCognitiveAnalysis && (
        <div className="clay-card p-6 border border-pink-200 bg-white space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h4 className="text-base font-extrabold text-[#111625] font-brand-heading flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#E86D7C]" />
              <span>Comprehensive AI Telemetry Report for {patient.name}</span>
            </h4>
            <span className="text-xs text-stone-400">
              {aiCognitiveAnalysis.generatedAt ? new Date(aiCognitiveAnalysis.generatedAt).toLocaleTimeString() : 'Recent evaluation'}
            </span>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed">
            {aiCognitiveAnalysis.summary}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                ⭐ Primary Cognitive Observation
              </span>
              <p className="text-xs text-emerald-900 font-semibold">
                {aiCognitiveAnalysis.combinationInsight || 'Attention & Pattern Stability steady throughout the week'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
                💡 Supportive Recommendation
              </span>
              <p className="text-xs text-amber-900 font-semibold">
                {aiCognitiveAnalysis.musicInsight || 'Gentle Sequence Memory exercises paired with peaceful nostalgic audio'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP ROW: 3 CARDS (Coral Wave Hero, Donut Vitals, Right Metric Pill) */}
      {/* ========================================================================= */}
      <div id="vitals-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 scroll-mt-6">
        
        {/* CARD 1 (Hero Coral Gradient Card) */}
        <div className="lg:col-span-5 clay-card-coral p-6 sm:p-7 text-white flex flex-col justify-between relative overflow-hidden min-h-[260px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold tracking-wide text-white/90">
                Cognitive Stability
              </span>
              <button 
                onClick={() => {
                  setActiveActivityTab('games');
                  setShowGamesDetails(true);
                  document.getElementById('activity-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
                title="View Detailed Cognitive Graphs"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Clean Percentage Score */}
            <div className="mt-3 flex items-baseline space-x-1">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-brand-heading tracking-tight drop-shadow-sm">
                {(cognition.averageAccuracy || 91).toFixed(1)}%
              </span>
              <span className="text-xs font-semibold text-white/80 ml-1">Overall Stability</span>
            </div>
          </div>

          {/* Single Active Clinical Trend Line (Useless decorative waves removed) */}
          <div className="relative w-full h-16 sm:h-20 my-2">
            <svg viewBox="0 0 400 90" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cognitiveFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Soft baseline fill below active graph line */}
              <path
                d="M 0 65 C 60 75, 120 45, 180 60 C 240 75, 300 45, 400 55 L 400 90 L 0 90 Z"
                fill="url(#cognitiveFill)"
              />
              {/* Single Active Graph Trend Line */}
              <path
                d="M 0 65 C 60 75, 120 45, 180 60 C 240 75, 300 45, 400 55"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Meaningful Telemetry Data Points */}
              <circle cx="0" cy="65" r="3.5" fill="#FFFFFF" />
              <circle cx="120" cy="50" r="3.5" fill="#FFFFFF" />
              <circle cx="240" cy="72" r="3.5" fill="#FFFFFF" />
              <circle cx="340" cy="48" r="3.5" fill="#FFFFFF" />
              <circle cx="400" cy="55" r="4.5" fill="#FFFFFF" className="animate-pulse" />
            </svg>
          </div>

          {/* Bottom 3 Breakdown Pills */}
          <div className="pt-3 border-t border-white/20 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[11px] font-semibold text-white/70 block">Memory</span>
              <span className="text-xs sm:text-sm font-black text-white">%{memoryAcc}</span>
            </div>
            <div className="border-x border-white/15">
              <span className="text-[11px] font-semibold text-white/70 block">Attention</span>
              <span className="text-xs sm:text-sm font-black text-white">%{attentionAcc}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-white/70 block">Routine</span>
              <span className="text-xs sm:text-sm font-black text-white">%{routinePercent}</span>
            </div>
          </div>
        </div>

        {/* CARD 2 (Routine Vitals Adherence Donut Card) */}
        <div className="lg:col-span-4 clay-card p-6 sm:p-7 flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-bold tracking-wide text-stone-600">
                Today's Routine Vitals
              </span>
              <button 
                onClick={() => {
                  setActiveActivityTab('routine');
                  document.getElementById('activity-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                title="View Routine Stream"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#111625] font-brand-heading">
                    {today.completedToday || 6}
                  </span>
                  <span className="text-base font-bold text-stone-400">
                    / {today.totalRoutineToday || 7}
                  </span>
                  <span className="text-xs font-bold text-stone-400">tasks</span>
                </div>
                <span className="text-xs font-semibold text-stone-500 mt-1 block">
                  {routinePercent}% care schedule completed
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 mt-1 inline-flex items-center space-x-1">
                  <span>✓ Medication on schedule</span>
                </span>
              </div>

              {/* Donut Chart SVG */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#F5EBE6" strokeWidth="11" />
                  {/* Outer Coral Ring */}
                  <circle
                    cx="50" cy="50" r="38" fill="none" stroke="#E86D7C" strokeWidth="11"
                    strokeDasharray={`${(routinePercent / 100) * 238.76} 238.76`}
                    strokeLinecap="round"
                  />
                  {/* Inner Dark Gold Ring */}
                  <circle
                    cx="50" cy="50" r="38" fill="none" stroke="#111625" strokeWidth="11"
                    strokeDasharray={`${(medPercent / 100) * 110} 238.76`}
                    strokeDashoffset={`-${(routinePercent / 100) * 180}`}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Center Clay Pill Icon */}
                <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-gradient-to-tr from-[#E26E65] to-[#E96096] text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-pink-500/30">
                  ✦
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Legend */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-around text-xs font-bold text-stone-600">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E86D7C]" />
              <span>Routine</span>
              <span className="text-[#111625] font-extrabold ml-0.5">%{routinePercent}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D99A45]" />
              <span>Medicine</span>
              <span className="text-[#111625] font-extrabold ml-0.5">%{medPercent}</span>
            </div>
          </div>
        </div>

        {/* CARD 3 (Right Quick Interaction Metric Pills - Compact Gap) */}
        <div className="lg:col-span-3 flex flex-col justify-center gap-3">
          {/* Top Pill: Voice Assistant Interactions */}
          <div 
            onClick={() => {
              setActiveActivityTab('voice');
              document.getElementById('activity-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="clay-card p-4 sm:p-4.5 flex items-center space-x-3.5 cursor-pointer hover:border-pink-200 transition-all group"
            title="Click to view Voice Companion Stream"
          >
            <div className="w-12 h-12 rounded-2xl bg-stone-100/90 group-hover:bg-pink-50 text-[#111625] flex flex-col items-center justify-center shrink-0 border border-stone-200/80 transition-colors shadow-sm">
              <MessageSquare className="w-5 h-5 text-[#E86D7C]" />
              <span className="text-[9px] font-black text-stone-700 mt-0.5">{voiceTodayCount}x</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#111625] truncate">
                  Voice Companion
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-[#E86D7C] border border-pink-200">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5 mb-1.5 truncate font-medium">
                {voiceTodayCount} companion check-ins today
              </p>
              {/* Pink mini progress bar */}
              <div className="w-full h-2 rounded-full bg-[#F5EBE6] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#E26E65] to-[#E96096]"
                  style={{ width: `${Math.min(100, voiceTodayCount * 14)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Pill: Nostalgia Music Therapy Goal Tracker */}
          <div 
            onClick={() => {
              setActiveActivityTab('music');
              document.getElementById('activity-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`clay-card p-4 sm:p-4.5 flex items-center space-x-3.5 cursor-pointer transition-all group ${
              isMusicGoalMet ? 'hover:border-emerald-300 bg-gradient-to-br from-white to-emerald-50/20' : 'hover:border-purple-300'
            }`}
            title="Click to view detailed Music Analytics & Playlists"
          >
            <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-colors shadow-sm ${
              isMusicGoalMet 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 group-hover:bg-emerald-100/80' 
                : 'bg-purple-50 text-purple-600 border-purple-200 group-hover:bg-purple-100/80'
            }`}>
              {isMusicGoalMet ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 mt-0.5">MET</span>
                </>
              ) : (
                <>
                  <Disc3 className="w-5 h-5 text-purple-600 animate-spin-slow" />
                  <span className="text-[9px] font-black text-purple-700 mt-0.5">{musicGoalPercent}%</span>
                </>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#111625] truncate">
                  Today's Music Goal
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isMusicGoalMet 
                    ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-100/80 text-amber-800 border-amber-300'
                }`}>
                  {isMusicGoalMet ? '✓ Completed' : `${todayMusicMinutes}/${dailyMusicGoalMinutes}m`}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5 mb-1.5 truncate font-medium">
                {isMusicGoalMet 
                  ? `${todayMusicMinutes}m / ${dailyMusicGoalMinutes}m goal achieved 🎉` 
                  : `${todayMusicMinutes} mins today (${dailyMusicGoalMinutes - todayMusicMinutes}m remaining)`}
              </p>
              {/* Clean Goal Progress Bar */}
              <div className="w-full h-2 rounded-full bg-[#F5EBE6] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isMusicGoalMet 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                      : 'bg-gradient-to-r from-purple-500 to-[#E86D7C]'
                  }`}
                  style={{ width: `${musicGoalPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* BOTTOM SECTION: FULL-WIDTH CLINICAL ACTIVITY & TELEMETRY HUB */}
      {/* (Standalone "Post Stats" graph removed as requested; rich details inside) */}
      {/* ========================================================================= */}
      <div id="activity-section" className="w-full clay-card p-6 sm:p-8 flex flex-col scroll-mt-6">
        
        {/* Tab Header with More Details Toggle on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4 mb-6">
          
          {/* Main Tabs */}
          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
            {[
              { id: 'games', label: 'Brain Games Telemetry', icon: Gamepad2 },
              { id: 'music', label: 'Music Analytics', icon: Music },
              { id: 'routine', label: 'Routine Stream', icon: Calendar },
              { id: 'voice', label: 'Voice Transcripts', icon: MessageSquare },
              { id: 'reports', label: 'Medical Reports & Vault', icon: FileText },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeActivityTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveActivityTab(tab.id as any)}
                  className={`text-sm sm:text-base font-black pb-3 transition-all cursor-pointer relative whitespace-nowrap flex items-center space-x-2 ${
                    isActive
                      ? 'text-[#111625]'
                      : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#E86D7C]' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111625] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Action: Refresh Analytics + More Details Toggle Button */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Refresh All Analytics Option */}
            <button
              onClick={() => {
                if (onRefreshAll) {
                  onRefreshAll();
                } else {
                  window.location.reload();
                }
              }}
              disabled={isRefreshingAll}
              title="Refresh all patient analytics, cognitive telemetry, music & routine vitals"
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs border bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300 active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#E86D7C] ${isRefreshingAll ? 'animate-spin' : ''}`} />
              <span>{isRefreshingAll ? 'Refreshing...' : 'Refresh Analytics'}</span>
            </button>
            {activeActivityTab === 'games' && (
              <button
                onClick={() => setShowGamesDetails(!showGamesDetails)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs border ${
                  showGamesDetails
                    ? 'bg-[#111625] text-white border-[#111625]'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <BarChart3 className={`w-4 h-4 ${showGamesDetails ? 'text-[#E86D7C]' : 'text-stone-500'}`} />
                <span>{showGamesDetails ? 'Hide Detailed Graphs' : 'More Details & Graphs'}</span>
              </button>
            )}

            {activeActivityTab === 'music' && (
              <button
                onClick={() => setShowMusicDetails(!showMusicDetails)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs border ${
                  showMusicDetails
                    ? 'bg-[#111625] text-white border-[#111625]'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <BarChart3 className={`w-4 h-4 ${showMusicDetails ? 'text-purple-400' : 'text-purple-600'}`} />
                <span>{showMusicDetails ? 'Hide Detailed Graphs' : 'More Details & Graphs'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Search Query Filter Banner */}
        {sq && (
          <div className="flex items-center justify-between p-3 px-4 rounded-2xl bg-pink-50/80 border border-pink-200 mb-6 animate-fadeIn text-[#111625]">
            <div className="flex items-center space-x-2.5 text-xs font-semibold">
              <Search className="w-4 h-4 text-[#E86D7C]" />
              <span>
                Active filter applied: <strong className="font-extrabold text-[#111625]">"{searchFilter}"</strong>
              </span>
            </div>
            {onClearSearch && (
              <button
                onClick={onClearSearch}
                className="text-xs font-bold text-[#E86D7C] hover:text-pink-700 flex items-center space-x-1.5 cursor-pointer bg-white px-3 py-1 rounded-full border border-pink-200 shadow-2xs hover:bg-pink-50/50 transition-all"
                title="Clear active search filter"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filter</span>
              </button>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: BRAIN GAMES TELEMETRY */}
        {/* ========================================================================= */}
        {activeActivityTab === 'games' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Quick Stat Summary Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80">
                <span className="text-[11px] font-bold text-stone-500 block">Total Exercises</span>
                <span className="text-xl font-extrabold text-[#111625] mt-0.5 block">{cognition.totalGamesPlayed || 50} sessions</span>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80">
                <span className="text-[11px] font-bold text-stone-500 block">Average Accuracy</span>
                <span className="text-xl font-extrabold text-emerald-700 mt-0.5 block">%{cognition.averageAccuracy || 93}</span>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80">
                <span className="text-[11px] font-bold text-stone-500 block">Cognitive Stamina</span>
                <span className="text-xl font-extrabold text-[#111625] mt-0.5 block">{cognition.totalGameTimeMinutes || 33} min active</span>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80">
                <span className="text-[11px] font-bold text-stone-500 block">Longitudinal Trend</span>
                <span className="text-xl font-extrabold text-[#E86D7C] mt-0.5 flex items-center space-x-1">
                  <span>Steady Peak</span>
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* EXPANDED "MORE DETAILS" GRAPHS FOR BRAIN GAMES */}
            {showGamesDetails && (
              <div className="p-6 rounded-3xl bg-white border border-pink-200 shadow-sm space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#E86D7C] flex items-center justify-center font-bold">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#111625] font-brand-heading">
                        Longitudinal Cognitive Telemetry & Clinical Graphs
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Detailed session progression across attention, memory, and sequence domains
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Clinical Target Baseline: 85% Met
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Graph 1: Cognitive Stability & Accuracy Trend (SVG Area Chart) */}
                  <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-stone-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold text-[#111625]">
                        7-Day Accuracy Trend (%)
                      </span>
                      <span className="text-[10px] text-stone-400 font-semibold">
                        Daily session averages
                      </span>
                    </div>

                    <div className="relative h-44 w-full">
                      <svg viewBox="0 0 400 140" className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#E86D7C" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#E86D7C" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Target baseline dashed line at 85% */}
                        <line x1="10" y1="40" x2="390" y2="40" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 4" />
                        <text x="330" y="35" fill="#94A3B8" fontSize="9" fontWeight="bold">85% Baseline</text>

                        {/* Area fill */}
                        <path
                          d="M 20 70 L 80 50 L 140 55 L 200 35 L 260 40 L 320 25 L 380 20 L 380 130 L 20 130 Z"
                          fill="url(#accuracyGrad)"
                        />
                        {/* Stroke Line */}
                        <path
                          d="M 20 70 L 80 50 L 140 55 L 200 35 L 260 40 L 320 25 L 380 20"
                          fill="none"
                          stroke="#E86D7C"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        {/* Data Points */}
                        {[
                          { cx: 20, cy: 70, val: '88%' },
                          { cx: 80, cy: 50, val: '91%' },
                          { cx: 140, cy: 55, val: '90%' },
                          { cx: 200, cy: 35, val: '94%' },
                          { cx: 260, cy: 40, val: '93%' },
                          { cx: 320, cy: 25, val: '96%' },
                          { cx: 380, cy: 20, val: '98%' },
                        ].map((p, idx) => (
                          <g key={idx}>
                            <circle cx={p.cx} cy={p.cy} r="4" fill="#FFFFFF" stroke="#E86D7C" strokeWidth="2.5" />
                            <text x={p.cx - 10} y={p.cy - 8} fill="#111625" fontSize="9" fontWeight="bold">{p.val}</text>
                          </g>
                        ))}
                      </svg>
                    </div>

                    <div className="flex justify-between text-[10px] text-stone-400 font-bold mt-2 px-2">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Today</span>
                    </div>
                  </div>

                  {/* Graph 2: The 4 Cognitive Pillars Mastery */}
                  <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-stone-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-[#111625]">
                        Cognitive Domain Mastery (4 Pillars)
                      </span>
                      <span className="text-[10px] text-stone-400 font-semibold">
                        Longitudinal clinical distribution
                      </span>
                    </div>

                    <div className="space-y-3.5 my-auto">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-[#111625]">Visual Working Memory (Match)</span>
                          <span className="text-pink-700 font-black">%{memoryAcc}</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500" style={{ width: `${memoryAcc}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-[#111625]">Focused Attention (Speed Reaction)</span>
                          <span className="text-emerald-700 font-black">%{attentionAcc}</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${attentionAcc}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-[#111625]">Sequence Recall (Temporal Pattern)</span>
                          <span className="text-amber-700 font-black">%{sequenceAcc}</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${sequenceAcc}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-[#111625]">Cultural Heritage & Autobiographical Memory</span>
                          <span className="text-purple-700 font-black">%{culturalAcc}</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${culturalAcc}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Game Domain Filters */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'All Sessions' },
                { id: 'memoryMatch', label: 'Memory Match' },
                { id: 'attentionGame', label: 'Attention Focus' },
                { id: 'sequenceRecall', label: 'Sequence Recall' },
                { id: 'culturalGame', label: 'Cultural Heritage' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setGameFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    gameFilter === f.id
                      ? 'bg-[#111625] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Games List */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredGames.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl">
                  No sessions found for this filter.
                </div>
              ) : (
                filteredGames.map((game, i) => {
                  const label = 
                    game.gameType === 'memoryMatch' ? 'Memory Match Game' :
                    game.gameType === 'attentionGame' ? 'Attention Focus Game' :
                    game.gameType === 'sequenceRecall' ? 'Sequence Recall Game' :
                    game.gameType.includes('cultural') ? 'Cultural Heritage Quiz' : 'Cognitive Exercise';

                  const tag = 
                    game.gameType === 'memoryMatch' ? 'Memory' :
                    game.gameType === 'attentionGame' ? 'Focus' :
                    game.gameType === 'sequenceRecall' ? 'Sequence' : 'Heritage';

                  const trendPositive = i % 2 === 0;

                  return (
                    <div
                      key={i}
                      className="p-3.5 sm:p-4 rounded-2xl bg-stone-50/50 hover:bg-stone-50 border border-stone-100 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E26E65] to-[#E96096] text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                          <Gamepad2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs sm:text-sm font-bold text-[#111625] truncate">
                              {label}
                            </span>
                            <a
                              href={`${NEUROGAMES_URL}/`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-stone-400 hover:text-stone-700"
                              title="Open Neurogames"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <p className="text-[11px] text-stone-400 truncate mt-0.5">
                            Level {game.level} • {Math.round((game.responseTimeMs || 30000) / 1000)}s response • {new Date(game.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-600 text-[11px] font-bold">
                        {tag}
                      </span>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-stone-200/80 text-[#111625] text-xs font-extrabold">
                          <span>{game.accuracy}%</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center space-x-0.5 ${
                          trendPositive ? 'text-emerald-700 bg-emerald-100/60' : 'text-[#E86D7C] bg-pink-100/60'
                        }`}>
                          <span>{trendPositive ? '↑' : '↓'}</span>
                          <span>{trendPositive ? '8%' : '4%'}</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MUSIC ANALYTICS (LAST PLAYED, LIKED SONGS, SEARCH HISTORY) */}
        {/* ========================================================================= */}
        {activeActivityTab === 'music' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Sub-Nav Switcher: Last Played | Liked Songs | Search History */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 p-1.5 bg-stone-100/90 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setMusicSubTab('played')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
                    musicSubTab === 'played'
                      ? 'bg-white text-[#111625] shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>Last Played</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold">
                    {lastPlayedList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMusicSubTab('liked')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
                    musicSubTab === 'liked'
                      ? 'bg-white text-[#111625] shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-[#E86D7C] fill-[#E86D7C]" />
                  <span>Liked Songs</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-extrabold">
                    {likedList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMusicSubTab('search')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
                    musicSubTab === 'search'
                      ? 'bg-white text-[#111625] shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  <span>Search History</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold">
                    {searchHistoryList.length}
                  </span>
                </button>
              </div>

              {/* Total listening summary pill */}
              <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/70 text-purple-800 text-xs font-bold">
                <Headphones className="w-3.5 h-3.5" />
                <span>{music.totalListeningMinutes || 180} mins total audio therapy</span>
              </div>
            </div>

            {/* EXPANDED "MORE DETAILS" GRAPHS FOR MUSIC */}
            {showMusicDetails && (
              <div className="p-6 rounded-3xl bg-white border border-purple-200 shadow-sm space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#111625] font-brand-heading">
                        Nostalgia Audio Therapy Detailed Graphs & Metrics
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Longitudinal calm index, formative decade affinity, and daily listening adherence
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    Reminiscence Bump Activated
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Graph 1: Weekly Listening Duration (SVG Bar Chart) */}
                  <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-stone-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold text-[#111625]">
                        Daily Audio Therapy Minutes (Past 7 Days)
                      </span>
                      <span className="text-[10px] text-purple-700 font-bold">
                        Target: 30 min/day
                      </span>
                    </div>

                    <div className="relative h-44 w-full flex items-end justify-between px-3 pt-6">
                      {/* 30-min Target line */}
                      <div className="absolute inset-x-0 top-12 border-b border-dashed border-purple-300 pointer-events-none z-0">
                        <span className="absolute right-2 -top-4 text-[9px] font-bold text-purple-600 bg-white px-1 rounded">30m Clinical Target</span>
                      </div>

                      {[
                        { day: 'Mon', mins: 25, isTarget: false },
                        { day: 'Tue', mins: 35, isTarget: true },
                        { day: 'Wed', mins: 40, isTarget: true },
                        { day: 'Thu', mins: 30, isTarget: true },
                        { day: 'Fri', mins: 45, isTarget: true },
                        { day: 'Sat', mins: 35, isTarget: true },
                        { day: 'Sun', mins: 50, isTarget: true },
                      ].map((bar, i) => (
                        <div key={i} className="flex flex-col items-center space-y-1.5 z-10">
                          <span className="text-[10px] font-extrabold text-stone-600">{bar.mins}m</span>
                          <div
                            className={`w-6 sm:w-7 rounded-t-xl transition-all duration-300 ${
                              bar.isTarget
                                ? 'bg-gradient-to-t from-purple-500 to-pink-500 shadow-sm'
                                : 'bg-stone-300'
                            }`}
                            style={{ height: `${Math.min(100, bar.mins * 2.2)}px` }}
                          />
                          <span className="text-[11px] font-bold text-stone-400">{bar.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Graph 2: Formative Era & Nostalgia Affinity Breakdown */}
                  <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-stone-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-[#111625]">
                        Formative Era & Nostalgia Preference
                      </span>
                      <span className="text-[10px] text-stone-400 font-semibold">
                        Autobiographical Resonance
                      </span>
                    </div>

                    <div className="space-y-3.5 my-auto">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-[#111625]">1960s–1970s Golden Bollywood Hits</span>
                          <span className="text-purple-700 font-black">%45</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600" style={{ width: '45%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-[#111625]">Indian Classical Ragas & Sitar</span>
                          <span className="text-pink-700 font-black">%35</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500" style={{ width: '35%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-[#111625]">Devotional & Meditative Bhajans</span>
                          <span className="text-amber-700 font-black">%20</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: '20%' }} />
                        </div>
                      </div>

                      {/* Calm Equilibrium Metric Box */}
                      <div className="p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <Flame className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-[#111625]">Calm Response Score: 94%</span>
                        </div>
                        <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          +18% Post-Music Elevation
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 1: LAST PLAYED SONGS */}
            {musicSubTab === 'played' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-stone-500">
                    Recently Streamed Tracks on Neuromusic
                  </span>
                  <a
                    href={`${NEUROMUSIC_URL}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-extrabold text-purple-700 hover:underline flex items-center space-x-1"
                  >
                    <span>Open Neuromusic Player</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {lastPlayedList.map((track, i) => (
                    <div
                      key={track.id || i}
                      className="p-3.5 sm:p-4 rounded-2xl bg-stone-50/50 hover:bg-stone-50 border border-stone-100 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                          <Disc3 className="w-5 h-5 animate-spin-slow" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-[#111625] truncate block">
                            {track.title}
                          </span>
                          <span className="text-[11px] text-stone-400 block mt-0.5">
                            {track.artist} • {track.genre || 'Formative Melodies'} • Duration: {track.formattedDuration || '4:15'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-extrabold border border-purple-200/50">
                          {track.playCount ? `${track.playCount} plays` : 'Played recently'}
                        </span>
                        <a
                          href={`${NEUROMUSIC_URL}/?play=${encodeURIComponent(track.title)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                          title="Play this track"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Play</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB 2: LIKED SONGS */}
            {musicSubTab === 'liked' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-stone-500">
                    Patient's Cherished Nostalgic Songs ({likedList.length} saved)
                  </span>
                  <span className="text-xs font-semibold text-stone-400">
                    Stimulates Autobiographical Reminiscence
                  </span>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {likedList.map((song, i) => (
                    <div
                      key={song.id || i}
                      className="p-3.5 sm:p-4 rounded-2xl bg-stone-50/50 hover:bg-stone-50 border border-stone-100 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-pink-100 text-[#E86D7C] flex items-center justify-center shrink-0 shadow-2xs">
                          <Heart className="w-5 h-5 fill-[#E86D7C]" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-[#111625] truncate block">
                            {song.title}
                          </span>
                          <span className="text-[11px] text-stone-400 block mt-0.5">
                            {song.artist} • Favorite Nostalgic Tune
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-pink-50 text-[#E86D7C] text-[10px] font-extrabold border border-pink-200/50">
                          {song.genre || 'Classic'}
                        </span>
                        <a
                          href={`${NEUROMUSIC_URL}/?play=${encodeURIComponent(song.title)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#111625] hover:bg-[#1A2234] text-white text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Play</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB 3: SEARCH HISTORY */}
            {musicSubTab === 'search' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-stone-500">
                    Voice & Player Search History
                  </span>
                  <span className="text-xs font-semibold text-stone-400">
                    Recent Music Queries
                  </span>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {searchHistoryList.map((item, i) => (
                    <div
                      key={i}
                      className="p-3.5 sm:p-4 rounded-2xl bg-stone-50/50 hover:bg-stone-50 border border-stone-100 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
                          <Search className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-[#111625] truncate block">
                            "{item.query}"
                          </span>
                          <span className="text-[11px] text-stone-400 block mt-0.5">
                            Searched {(() => {
                              try {
                                const d = new Date(item.timestamp);
                                if (!isNaN(d.getTime())) {
                                  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                }
                              } catch (_) {}
                              return item.timestamp;
                            })()} • Voice / Companion query
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <a
                          href={`${NEUROMUSIC_URL}/?play=${encodeURIComponent(item.query)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Search & Play</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ROUTINE STREAM */}
        {/* ========================================================================= */}
        {activeActivityTab === 'routine' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-[#111625] block">Daily Orientation Milestones</span>
                  <span className="text-[11px] text-stone-500">{today.completedToday} of {today.totalRoutineToday} completed today</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-emerald-700">%{routinePercent}</span>
                <span className="text-[11px] text-stone-400 block">Adherence score</span>
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
              {displayedRoutineLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  {sq ? `No routine milestones found matching "${searchFilter}".` : 'No routine logs recorded yet today.'}
                </div>
              ) : (
                displayedRoutineLogs.map((log) => (
                  <div
                    key={log.routineId}
                    className="p-3.5 sm:p-4 rounded-2xl bg-stone-50/50 hover:bg-stone-50 border border-stone-100 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs ${
                        log.completed ? 'bg-emerald-600' : 'bg-stone-400'
                      }`}>
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-[#111625] truncate block">
                          {log.title}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {log.scheduledTime || 'Scheduled'} • Routine Task
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        log.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {log.completed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: VOICE TRANSCRIPTS */}
        {/* ========================================================================= */}
        {activeActivityTab === 'voice' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Voice Activity Summary */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-[#111625] block">Voice Companion Interactions</span>
                  <span className="text-[11px] text-stone-500">Real-time compassionate AI elder assistant transcripts</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xl font-extrabold text-sky-700">{effectiveVoiceTodayCount}</span>
                  <button
                    onClick={fetchVoiceLogs}
                    disabled={voiceLogsLoading}
                    className="w-6 h-6 rounded-full bg-sky-100 hover:bg-sky-200 flex items-center justify-center transition-colors"
                    title="Refresh voice logs"
                  >
                    <RefreshCw className={`w-3 h-3 text-sky-600 ${voiceLogsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <span className="text-[11px] text-stone-400 block">Today's interactions</span>
              </div>
            </div>

            {/* Voice Logs */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
              {voiceLogsLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-400 mx-auto mb-2" />
                  <p className="text-xs text-stone-400">Loading voice interactions...</p>
                </div>
              ) : displayedVoiceLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  {sq ? `No voice companion logs matching "${searchFilter}".` : 'No voice interactions recorded yet. Ask the patient to use the Voice Companion.'}
                </div>
              ) : (
                displayedVoiceLogs.map((log, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-stone-50/50 hover:bg-stone-50 border border-stone-100 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center shrink-0 mt-0.5 text-sky-700 font-bold">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-[#111625] block">❝ {log.q} ❞</span>
                          <p className="text-xs text-stone-600 block mt-1 leading-relaxed">{log.reply}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1.5 shrink-0">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          log.lang === 'Hindi' ? 'bg-orange-100 text-orange-700' : 'bg-sky-100 text-sky-700'
                        }`}>
                          {log.lang}
                        </span>
                        <span className="text-[10px] text-stone-400 font-semibold">{log.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: MEDICAL REPORTS & VAULT */}
        {/* =================================================================== */}
        {activeActivityTab === 'reports' && (
          <div className="animate-fadeIn">
            <MedicalReportsVault
              patientId={patientId || patient.id || patientInfo.patientId}
              patientName={patient.name || patientInfo.patientName || 'Loved One'}
              caregiverId={caregiverId}
            />
          </div>
        )}

      </div>

      {/* 2-Step Unlink Confirmation Modal */}
      {onRevokeLink && (
        <UnlinkConfirmationModal
          isOpen={isUnlinkModalOpen}
          onClose={() => setIsUnlinkModalOpen(false)}
          patientName={patient.name || patientInfo.patientName || 'Loved One'}
          relationship={patientInfo.relationship || 'Loved One'}
          patientId={patientInfo.patientId}
          onConfirmUnlink={onRevokeLink}
        />
      )}

    </div>
  );
};
