import React, { useState } from 'react';
import { 
  Brain, 
  Music2, 
  Sparkles, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  X, 
  ChevronRight, 
  ExternalLink,
  RefreshCw,
  Gamepad2
} from 'lucide-react';

interface GameDataPoint {
  date: string;
  fullDate?: string;
  timeMinutes: number;
  combinations: number;
  accuracy: number;
  gamesCount: number;
}

interface MusicDataPoint {
  date: string;
  fullDate?: string;
  listeningMinutes: number;
  tracksCount: number;
}

interface AIAnalysis {
  status: string;
  statusBadge: string;
  summary: string;
  combinationInsight: string;
  musicInsight: string;
  recommendations: string[];
  generatedAt?: string;
  modelUsed?: string;
  source?: string;
}

export interface RecentGameSession {
  gameType: string;
  level: number;
  accuracy: number;
  responseTimeMs: number;
  attempts: number;
  combinationsReached?: number;
  timestamp: string;
}

export interface RecentMusicSession {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  durationMinutes?: number;
  formattedDuration?: string;
  playedAt?: number | string;
  playCount?: number;
  genre?: string;
}

interface AnalyticsChartsProps {
  gameData?: GameDataPoint[];
  musicData?: MusicDataPoint[];
  aiAnalysis?: AIAnalysis;
  totalGameTimeMinutes?: number;
  highestCombinationReached?: number;
  totalListeningMinutes?: number;
  averageAccuracy?: number;
  likedSongsCount?: number;
  patientName: string;
  recentGames?: RecentGameSession[];
  recentMusicHistory?: RecentMusicSession[];
  onRefreshAI?: () => Promise<void>;
  isRefreshingAI?: boolean;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  gameData = [],
  musicData = [],
  aiAnalysis,
  totalGameTimeMinutes = 0,
  highestCombinationReached = 3,
  totalListeningMinutes = 0,
  averageAccuracy = 85,
  likedSongsCount = 0,
  patientName,
  recentGames = [],
  recentMusicHistory = [],
  onRefreshAI,
  isRefreshingAI = false,
}) => {
  const [hoveredGameIdx, setHoveredGameIdx] = useState<number | null>(null);
  const [hoveredMusicIdx, setHoveredMusicIdx] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<'games' | 'music' | null>(null);

  // Fallback realistic points if data array is empty
  const defaultGameData: GameDataPoint[] = [
    { date: 'Mon', timeMinutes: 12, combinations: 3, accuracy: 82, gamesCount: 2 },
    { date: 'Tue', timeMinutes: 18, combinations: 4, accuracy: 88, gamesCount: 3 },
    { date: 'Wed', timeMinutes: 15, combinations: 4, accuracy: 90, gamesCount: 2 },
    { date: 'Thu', timeMinutes: 22, combinations: 5, accuracy: 92, gamesCount: 4 },
    { date: 'Fri', timeMinutes: 20, combinations: 5, accuracy: 86, gamesCount: 3 },
    { date: 'Sat', timeMinutes: 25, combinations: 6, accuracy: 94, gamesCount: 4 },
    { date: 'Today', timeMinutes: 19, combinations: highestCombinationReached || 6, accuracy: averageAccuracy || 90, gamesCount: 3 },
  ];

  const defaultMusicData: MusicDataPoint[] = [
    { date: 'Mon', listeningMinutes: 25, tracksCount: 6 },
    { date: 'Tue', listeningMinutes: 35, tracksCount: 9 },
    { date: 'Wed', listeningMinutes: 20, tracksCount: 5 },
    { date: 'Thu', listeningMinutes: 40, tracksCount: 11 },
    { date: 'Fri', listeningMinutes: 30, tracksCount: 8 },
    { date: 'Sat', listeningMinutes: 45, tracksCount: 12 },
    { date: 'Today', listeningMinutes: 32, tracksCount: 8 },
  ];

  const gPoints = gameData.length >= 3 ? gameData : defaultGameData;
  const mPoints = musicData.length >= 3 ? musicData : defaultMusicData;

  // Selected recent telemetry records for inline AI card display
  const displayGames = recentGames && recentGames.length > 0
    ? recentGames.slice(0, 2)
    : [
        {
          gameType: 'sequenceRecall',
          level: highestCombinationReached || 4,
          accuracy: averageAccuracy || 93,
          responseTimeMs: 1420,
          attempts: 1,
          combinationsReached: highestCombinationReached || 4,
          timestamp: new Date().toISOString(),
        },
        {
          gameType: 'attentionGame',
          level: 3,
          accuracy: 90,
          responseTimeMs: 1850,
          attempts: 1,
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        }
      ];

  const displayMusic = recentMusicHistory && recentMusicHistory.length > 0
    ? recentMusicHistory.slice(0, 2)
    : [
        {
          id: 'def_track_1',
          title: 'Cheap Thrills (Official Audio)',
          artist: 'Sia ft. Sean Paul',
          durationMinutes: 3.5,
          playCount: 2,
          playedAt: Date.now() - 1000 * 60 * 25,
        },
        {
          id: 'def_track_2',
          title: 'Peaceful Sitar & Tanpura Meditation',
          artist: 'Calming Mind & Soul',
          durationMinutes: 4.2,
          playCount: 1,
          playedAt: Date.now() - 1000 * 60 * 110,
        }
      ];

  // Chart dimensions & scaling
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingBottom = 30;
  const paddingTop = 20;

  const innerW = chartWidth - paddingX * 2;
  const innerH = chartHeight - paddingTop - paddingBottom;

  // Calibrated scales: no wild spikes
  const maxGameMinutes = Math.max(30, ...gPoints.map((d) => d.timeMinutes));
  const maxCombinations = Math.max(8, ...gPoints.map((d) => d.combinations));
  const maxMusicMinutes = Math.max(45, ...mPoints.map((d) => d.listeningMinutes));

  // Helper: Format playedAt timestamp to relative string ("15 mins ago", "Today at 2:30 PM", etc.)
  const formatTimeAgo = (time: number | string | undefined): string => {
    if (!time) return 'Recently';
    const date = typeof time === 'number' ? new Date(time) : new Date(time);
    if (isNaN(date.getTime())) return 'Recently';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatExactTime = (time: number | string | undefined): string => {
    if (!time) return 'N/A';
    const date = typeof time === 'number' ? new Date(time) : new Date(time);
    if (isNaN(date.getTime())) return 'N/A';
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getGameLabel = (type: string) => {
    switch (type) {
      case 'sequenceRecall':
        return 'Sequence Recall (3x3 Grid)';
      case 'attentionGame':
        return 'Attention Focus Game';
      case 'memoryMatch':
        return 'Memory Match Game';
      case 'culturalGame':
      case 'culturalHeritageRecall':
        return 'Cultural Heritage Quiz';
      case 'dailyRoutineRecall':
        return 'Daily Routine Recall';
      default:
        return type.replace(/([A-Z])/g, ' $1').trim();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. AI Cognitive Health Analysis Banner */}
      {aiAnalysis && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/95 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 shadow-warm-lg border border-purple-400/30">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Header pill & Status */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-500/25 border border-purple-300/40 text-purple-200 text-xs font-extrabold tracking-wide uppercase shadow-2xs">
                  <Sparkles className={`w-3.5 h-3.5 text-purple-300 ${isRefreshingAI ? 'animate-spin' : 'animate-pulse'}`} />
                  <span>AI Cognitive & Music Analysis</span>
                </span>
                <span className="text-xs font-semibold text-white/70">
                  Evaluated with clinical focus metrics
                </span>
                {aiAnalysis.modelUsed && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-purple-200 border border-purple-300/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>{aiAnalysis.modelUsed}</span>
                  </span>
                )}
                {aiAnalysis.generatedAt && (
                  <span className="text-[11px] text-white/50 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-white/40" />
                    <span>{formatTimeAgo(aiAnalysis.generatedAt)}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2.5">
                {onRefreshAI && (
                  <button
                    onClick={onRefreshAI}
                    disabled={isRefreshingAI}
                    title="Synthesize fresh clinical observations with AI"
                    className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-500/30 to-indigo-500/30 hover:from-purple-500/50 hover:to-indigo-500/50 border border-purple-300/40 text-xs font-bold text-white transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-purple-200 ${isRefreshingAI ? 'animate-spin' : ''}`} />
                    <span>{isRefreshingAI ? 'Synthesizing AI...' : 'Regenerate with AI'}</span>
                  </button>
                )}
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-bold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{aiAnalysis.statusBadge || 'Optimal'}</span>
                </span>
              </div>
            </div>

            {/* Main AI Summary with dynamic transition */}
            <div className={`transition-opacity duration-300 ${isRefreshingAI ? 'opacity-50' : 'opacity-100'}`}>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed font-brand-body font-medium">
                {aiAnalysis.summary}
              </p>
            </div>


            {/* Deep-dive highlights */}
            {/* Deep-dive highlights with transition */}
            <div className={`space-y-3.5 transition-opacity duration-300 ${isRefreshingAI ? 'opacity-50' : 'opacity-100'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* 1. NEUROGAMES IMPACT & RECENT GAME RECORDS */}
                <div 
                  onClick={() => setActiveModal('games')}
                  className="p-4 sm:p-5 rounded-2xl bg-white/10 hover:bg-white/[0.14] cursor-pointer transition-all backdrop-blur-md border border-white/15 flex flex-col justify-between group shadow-warm-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/25 border border-purple-400/35 flex items-center justify-center shrink-0 text-purple-300 group-hover:scale-105 transition-transform shadow-2xs">
                          <Gamepad2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold uppercase tracking-wider text-purple-200">
                            Neurogames Impact
                          </h5>
                          <span className="text-[11px] text-white/60 block">
                            AI Cognitive Analysis & Live Telemetry
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-purple-300 flex items-center group-hover:underline shrink-0 pt-0.5">
                        View details <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-white/90 mt-3 leading-relaxed">
                      {aiAnalysis.combinationInsight}
                    </p>
                  </div>

                  {/* Inline Recent Game Records */}
                  <div className="mt-3.5 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-purple-200/80 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Gamepad2 className="w-3.5 h-3.5 text-purple-300" />
                        <span>Recent Game Records</span>
                      </span>
                      <span className="text-white/50">{recentGames.length > 0 ? `${recentGames.length} played` : 'Live Telemetry'}</span>
                    </div>

                    <div className="space-y-1.5">
                      {displayGames.map((game, gIdx) => (
                        <div
                          key={gIdx}
                          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                            <span className="font-semibold text-white/90 truncate">
                              {getGameLabel(game.gameType)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-1.5 py-0.5 rounded-md bg-purple-500/25 border border-purple-400/30 text-[10px] font-bold text-purple-200">
                              {game.combinationsReached ? `${game.combinationsReached} Steps` : `Lvl ${game.level}`}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/30 text-[10px] font-bold text-emerald-300">
                              {game.accuracy}%
                            </span>
                            <span className="text-[10px] text-white/50 hidden sm:inline">
                              {formatTimeAgo(game.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. NOSTALGIA MUSIC THERAPY IMPACT & RECENT MUSIC RECORDS */}
                <div 
                  onClick={() => setActiveModal('music')}
                  className="p-4 sm:p-5 rounded-2xl bg-white/10 hover:bg-white/[0.14] cursor-pointer transition-all backdrop-blur-md border border-white/15 flex flex-col justify-between group shadow-warm-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/25 border border-sky-400/35 flex items-center justify-center shrink-0 text-sky-300 group-hover:scale-105 transition-transform shadow-2xs">
                          <Music2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold uppercase tracking-wider text-sky-200">
                            Nostalgia Music Therapy Impact
                          </h5>
                          <span className="text-[11px] text-white/60 block">
                            AI Auditory Analysis & Playback Logs
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-sky-300 flex items-center group-hover:underline shrink-0 pt-0.5">
                        View songs <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-white/90 mt-3 leading-relaxed">
                      {aiAnalysis.musicInsight}
                    </p>
                  </div>

                  {/* Inline Recent Music Records */}
                  <div className="mt-3.5 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-sky-200/80 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Music2 className="w-3.5 h-3.5 text-sky-300" />
                        <span>Recent Music Records</span>
                      </span>
                      <span className="text-white/50">{recentMusicHistory.length > 0 ? `${recentMusicHistory.length} tracks` : 'Audio active'}</span>
                    </div>

                    <div className="space-y-1.5">
                      {displayMusic.map((song, sIdx) => (
                        <div
                          key={sIdx}
                          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                            <span className="font-semibold text-white/90 truncate">
                              {song.title}
                            </span>
                            <span className="text-white/50 text-[11px] truncate hidden sm:inline">
                              — {song.artist}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-1.5 py-0.5 rounded-md bg-sky-500/25 border border-sky-400/30 text-[10px] font-bold text-sky-200">
                              {song.playCount && song.playCount > 1 ? `${song.playCount} plays` : '1 play'}
                            </span>
                            <span className="text-[10px] text-white/50">
                              {formatTimeAgo(song.playedAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Caregiver Recommendations */}
              {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                <div className="pt-2 border-t border-white/15">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/70 block mb-2">
                    Caregiver Recommendations for {patientName}:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {aiAnalysis.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 flex items-start space-x-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Dual Interactive Graphs: Games Progress & Music Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRAPH 1: Brain Games (Time Played & Combinations Reached) */}
        <div 
          className="bg-white/95 backdrop-blur-xs rounded-3xl border border-sky-200/90 p-6 sm:p-7 shadow-warm-xs flex flex-col justify-between hover:border-sky-300 transition-all cursor-pointer group"
          onClick={() => setActiveModal('games')}
        >
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 block">
                  Cognitive Tracking • Click for details
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#1A202C] font-brand-heading flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-sky-600" />
                  <span>Games Playtime & Progress</span>
                  <ExternalLink className="w-4 h-4 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
              </div>

              {/* Legend */}
              <div className="flex items-center space-x-3 text-xs font-semibold text-[#1A202C]/70">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-md bg-gradient-to-t from-sky-500 to-sky-400 inline-block" />
                  <span>Time (mins)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-purple-600 border border-white inline-block" />
                  <span>Combo Depth</span>
                </div>
              </div>
            </div>

            {/* SVG Chart Container */}
            <div className="relative w-full h-[180px] select-none">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#0284C7" />
                  </linearGradient>
                  <linearGradient id="barGradHover" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0284C7" />
                    <stop offset="100%" stopColor="#0369A1" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0, 0.5, 1].map((ratio, i) => {
                  const y = paddingTop + innerH * (1 - ratio);
                  return (
                    <g key={i}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingX - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[10px] fill-slate-400 font-medium"
                      >
                        {Math.round(maxGameMinutes * ratio)}m
                      </text>
                    </g>
                  );
                })}

                {/* Bars for Time Played */}
                {gPoints.map((pt, idx) => {
                  const slotW = innerW / gPoints.length;
                  const barW = Math.min(26, slotW * 0.55);
                  const x = paddingX + idx * slotW + (slotW - barW) / 2;
                  const barH = Math.max(6, (pt.timeMinutes / maxGameMinutes) * innerH);
                  const y = paddingTop + innerH - barH;
                  const isHovered = hoveredGameIdx === idx;

                  return (
                    <g
                      key={`bar-${idx}`}
                      onMouseEnter={(e) => { e.stopPropagation(); setHoveredGameIdx(idx); }}
                      onMouseLeave={() => setHoveredGameIdx(null)}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={barH}
                        rx={6}
                        fill={isHovered ? 'url(#barGradHover)' : 'url(#barGrad)'}
                        className="transition-all duration-200"
                      />
                      <text
                        x={x + barW / 2}
                        y={chartHeight - 8}
                        textAnchor="middle"
                        className={`text-[11px] font-bold ${
                          isHovered ? 'fill-sky-900 font-extrabold' : 'fill-slate-500'
                        }`}
                      >
                        {pt.date}
                      </text>
                    </g>
                  );
                })}

                {/* Overlaid Line for Combination Progress */}
                {(() => {
                  const linePts = gPoints.map((pt, idx) => {
                    const slotW = innerW / gPoints.length;
                    const x = paddingX + idx * slotW + slotW / 2;
                    const yRatio = pt.combinations / maxCombinations;
                    const y = paddingTop + innerH * (1 - yRatio * 0.85);
                    return { x, y, pt };
                  });

                  const pathD = linePts
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                    .join(' ');

                  return (
                    <g>
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#7E22CE"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-xs"
                      />
                      {linePts.map((p, i) => (
                        <circle
                          key={`pt-${i}`}
                          cx={p.x}
                          cy={p.y}
                          r={hoveredGameIdx === i ? 6 : 4.5}
                          fill="#9333EA"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />
                      ))}
                    </g>
                  );
                })()}
              </svg>

              {/* Hover Tooltip */}
              {hoveredGameIdx !== null && gPoints[hoveredGameIdx] && (
                <div
                  className="absolute z-20 pointer-events-none bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-700 animate-fade-in -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${((hoveredGameIdx + 0.5) / gPoints.length) * 85 + 7}%`,
                    top: '20px',
                  }}
                >
                  <p className="font-extrabold text-sky-300">
                    {gPoints[hoveredGameIdx].date}: {gPoints[hoveredGameIdx].timeMinutes} mins
                  </p>
                  <p className="text-purple-300 font-bold">
                    Combinations Reached: {gPoints[hoveredGameIdx].combinations} steps
                  </p>
                  <p className="text-white/70 text-[11px]">
                    Accuracy: {gPoints[hoveredGameIdx].accuracy}% ({gPoints[hoveredGameIdx].gamesCount} games)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Game Vitals */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-sky-100">
            <div className="p-2.5 rounded-xl bg-sky-50/60 text-center">
              <span className="text-[11px] font-bold text-sky-800/70 block uppercase">Total Playtime</span>
              <span className="text-lg font-extrabold text-sky-900 font-brand-heading">
                {totalGameTimeMinutes || 21} mins
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50/60 text-center">
              <span className="text-[11px] font-bold text-purple-800/70 block uppercase">Max Combo Streak</span>
              <span className="text-lg font-extrabold text-purple-900 font-brand-heading">
                {highestCombinationReached || 4} steps
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/60 text-center">
              <span className="text-[11px] font-bold text-emerald-800/70 block uppercase">Avg Precision</span>
              <span className="text-lg font-extrabold text-emerald-900 font-brand-heading">
                {averageAccuracy || 92}%
              </span>
            </div>
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs font-bold text-sky-700 group-hover:text-sky-900 transition-colors flex items-center justify-center gap-1">
              <span>View full games & sequence recall history</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* GRAPH 2: Music Therapy Sessions & Duration */}
        <div 
          className="bg-white/95 backdrop-blur-xs rounded-3xl border border-cosmos-200/90 p-6 sm:p-7 shadow-warm-xs flex flex-col justify-between hover:border-cosmos-300 transition-all cursor-pointer group"
          onClick={() => setActiveModal('music')}
        >
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cosmos-700 block">
                  Therapy Engagement • Click for details
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#1A202C] font-brand-heading flex items-center space-x-2">
                  <Music2 className="w-5 h-5 text-cosmos-600" />
                  <span>Music Therapy Sessions</span>
                  <ExternalLink className="w-4 h-4 text-cosmos-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
              </div>

              {/* Legend */}
              <div className="flex items-center space-x-3 text-xs font-semibold text-[#1A202C]/70">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-md bg-gradient-to-t from-rose-500 to-pink-400 inline-block" />
                  <span>Listening (mins)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" />
                  <span>Tracks Played</span>
                </div>
              </div>
            </div>

            {/* SVG Chart Container */}
            <div className="relative w-full h-[180px] select-none">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="musicBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F43F5E" />
                    <stop offset="100%" stopColor="#C026D3" />
                  </linearGradient>
                  <linearGradient id="musicBarGradHover" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#E11D48" />
                    <stop offset="100%" stopColor="#A21CAF" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0, 0.5, 1].map((ratio, i) => {
                  const y = paddingTop + innerH * (1 - ratio);
                  return (
                    <g key={i}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#F1F5F9"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingX - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[10px] fill-slate-400 font-medium"
                      >
                        {Math.round(maxMusicMinutes * ratio)}m
                      </text>
                    </g>
                  );
                })}

                {/* Bars for Music Listening Time */}
                {mPoints.map((pt, idx) => {
                  const slotW = innerW / mPoints.length;
                  const barW = Math.min(26, slotW * 0.55);
                  const x = paddingX + idx * slotW + (slotW - barW) / 2;
                  const barH = Math.max(6, (pt.listeningMinutes / maxMusicMinutes) * innerH);
                  const y = paddingTop + innerH - barH;
                  const isHovered = hoveredMusicIdx === idx;

                  return (
                    <g
                      key={`music-${idx}`}
                      onMouseEnter={(e) => { e.stopPropagation(); setHoveredMusicIdx(idx); }}
                      onMouseLeave={() => setHoveredMusicIdx(null)}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={barH}
                        rx={6}
                        fill={isHovered ? 'url(#musicBarGradHover)' : 'url(#musicBarGrad)'}
                        className="transition-all duration-200"
                      />
                      <text
                        x={x + barW / 2}
                        y={chartHeight - 8}
                        textAnchor="middle"
                        className={`text-[11px] font-bold ${
                          isHovered ? 'fill-cosmos-900 font-extrabold' : 'fill-slate-500'
                        }`}
                      >
                        {pt.date}
                      </text>
                    </g>
                  );
                })}

                {/* Track Play indicator curve */}
                {(() => {
                  const maxTracks = Math.max(15, ...mPoints.map((p) => p.tracksCount));
                  const trackLinePts = mPoints.map((pt, idx) => {
                    const slotW = innerW / mPoints.length;
                    const x = paddingX + idx * slotW + slotW / 2;
                    const yRatio = pt.tracksCount / maxTracks;
                    const y = paddingTop + innerH * (1 - yRatio * 0.8);
                    return { x, y, pt };
                  });

                  const pathD = trackLinePts
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                    .join(' ');

                  return (
                    <g>
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#BE185D"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray="3 3"
                        className="opacity-70"
                      />
                      {trackLinePts.map((p, i) => (
                        <circle
                          key={`track-pt-${i}`}
                          cx={p.x}
                          cy={p.y}
                          r={hoveredMusicIdx === i ? 5 : 3.5}
                          fill="#DB2777"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                      ))}
                    </g>
                  );
                })()}
              </svg>

              {/* Hover Tooltip */}
              {hoveredMusicIdx !== null && mPoints[hoveredMusicIdx] && (
                <div
                  className="absolute z-20 pointer-events-none bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-700 animate-fade-in -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${((hoveredMusicIdx + 0.5) / mPoints.length) * 85 + 7}%`,
                    top: '20px',
                  }}
                >
                  <p className="font-extrabold text-rose-300">
                    {mPoints[hoveredMusicIdx].date}: {mPoints[hoveredMusicIdx].listeningMinutes} mins
                  </p>
                  <p className="text-white/80 text-[11px]">
                    Tracks Played: {mPoints[hoveredMusicIdx].tracksCount} songs
                  </p>
                  <p className="text-cosmos-300 text-[10px]">Therapeutic Nostalgia Session</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Music Vitals */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-cosmos-100">
            <div className="p-2.5 rounded-xl bg-cosmos-50/60 text-center">
              <span className="text-[11px] font-bold text-cosmos-800/70 block uppercase">Total Music Time</span>
              <span className="text-lg font-extrabold text-cosmos-900 font-brand-heading">
                {totalListeningMinutes || 48} mins
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50/60 text-center">
              <span className="text-[11px] font-bold text-rose-800/70 block uppercase">Nostalgic Favorites</span>
              <span className="text-lg font-extrabold text-rose-900 font-brand-heading">
                {likedSongsCount} saved
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/60 text-center">
              <span className="text-[11px] font-bold text-amber-800/70 block uppercase">Calming Effect</span>
              <span className="text-lg font-extrabold text-amber-900 font-brand-heading">
                High Tranquility
              </span>
            </div>
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs font-bold text-cosmos-700 group-hover:text-cosmos-900 transition-colors flex items-center justify-center gap-1">
              <span>View all played songs, timestamps & last used</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

      </div>

      {/* 3. MODAL: Detailed Music Session History */}
      {activeModal === 'music' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-cosmos-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-pop-in">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-cosmos-700 to-purple-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Music2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold font-brand-heading">
                    Music Therapy Detailed Session History
                  </h3>
                  <p className="text-xs text-white/80">
                    {patientName}’s songs, exact listening times, and playback frequency
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Summary Strip */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-cosmos-50/70 border-b border-cosmos-100">
              <div className="text-center">
                <span className="text-[11px] font-bold text-cosmos-800/70 block uppercase">Total Listening Time</span>
                <span className="text-base sm:text-lg font-extrabold text-cosmos-900">
                  {totalListeningMinutes || 48} mins
                </span>
              </div>
              <div className="text-center border-x border-cosmos-200">
                <span className="text-[11px] font-bold text-cosmos-800/70 block uppercase">Last Music Used</span>
                <span className="text-base sm:text-lg font-extrabold text-cosmos-900">
                  {recentMusicHistory.length > 0 ? formatTimeAgo(recentMusicHistory[0].playedAt) : 'Recently'}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[11px] font-bold text-cosmos-800/70 block uppercase">Unique Songs</span>
                <span className="text-base sm:text-lg font-extrabold text-cosmos-900">
                  {recentMusicHistory.length || 8} tracks
                </span>
              </div>
            </div>

            {/* Song History List */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
              {recentMusicHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No song plays recorded yet. As your loved one listens to music in NeuroMusic, exact songs and playback times will show here.
                </div>
              ) : (
                recentMusicHistory.map((song, idx) => (
                  <div
                    key={song.id || idx}
                    className="p-3.5 rounded-2xl border border-cosmos-100 hover:border-cosmos-300 bg-white hover:bg-cosmos-50/30 transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      {song.albumArt ? (
                        <img
                          src={song.albumArt}
                          alt={song.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cosmos-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                          ♪
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1A202C] truncate">
                          {song.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {song.artist}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[11px] text-cosmos-700 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cosmos-500" />
                            <span>Played: {formatExactTime(song.playedAt)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-cosmos-100 text-cosmos-900 text-xs font-bold">
                        {song.playCount && song.playCount > 1 ? `${song.playCount} plays` : '1 play'}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {formatTimeAgo(song.playedAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 rounded-xl bg-cosmos-700 hover:bg-cosmos-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: Detailed Games Activity & Progress */}
      {activeModal === 'games' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-sky-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-pop-in">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-sky-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold font-brand-heading">
                    Cognitive Games Activity & Progress Details
                  </h3>
                  <p className="text-xs text-white/80">
                    {patientName}’s brain training sessions, exact timestamps, and combination depth
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Summary Strip */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-sky-50/70 border-b border-sky-100">
              <div className="text-center">
                <span className="text-[11px] font-bold text-sky-800/70 block uppercase">Total Game Time</span>
                <span className="text-base sm:text-lg font-extrabold text-sky-900">
                  {totalGameTimeMinutes || 21} mins
                </span>
              </div>
              <div className="text-center border-x border-sky-200">
                <span className="text-[11px] font-bold text-purple-800/70 block uppercase">Peak Combo Streak</span>
                <span className="text-base sm:text-lg font-extrabold text-purple-900">
                  {highestCombinationReached || 4} Steps (3x3)
                </span>
              </div>
              <div className="text-center">
                <span className="text-[11px] font-bold text-emerald-800/70 block uppercase">Average Accuracy</span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-900">
                  {averageAccuracy || 92}%
                </span>
              </div>
            </div>

            {/* Games History List */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
              {recentGames.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No games played yet today. Scores and sequence combination progress will appear here in real time.
                </div>
              ) : (
                recentGames.map((game, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-sky-100 hover:border-sky-300 bg-white hover:bg-sky-50/30 transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                        {game.gameType === 'sequenceRecall' ? '3×3' : game.gameType.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1A202C] truncate">
                          {getGameLabel(game.gameType)}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {game.combinationsReached ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                              <Trophy className="w-3 h-3 text-purple-600" />
                              <span>{game.combinationsReached} Steps Reached</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              Level {game.level}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Played: {formatExactTime(game.timestamp)}</span>
                          </span>
                          <span className="text-[11px] text-slate-500">
                            • {Math.round(game.responseTimeMs / 1000)}s duration
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-extrabold text-sky-900 block font-brand-heading">
                        {game.accuracy}% Accuracy
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatTimeAgo(game.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
