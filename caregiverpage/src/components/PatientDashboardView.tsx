import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Pill, 
  Brain, 
  Music2, 
  Heart, 
  Smile, 
  Clock, 
  ShieldAlert, 
  UserX, 
  AlertCircle,
  RefreshCw,
  Mic,
  MessageSquare,
  PlayCircle,
  Gamepad2,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import { PatientOverview, LinkedPatient, VoiceAssistantLog } from '../types';
import { AnalyticsCharts } from './AnalyticsCharts';

interface PatientDashboardViewProps {
  overview: PatientOverview;
  patientInfo: LinkedPatient;
  onRevokeLink: (patientId: string) => Promise<void>;
  isLoading: boolean;
}

export const PatientDashboardView: React.FC<PatientDashboardViewProps> = ({
  overview,
  patientInfo,
  onRevokeLink,
  isLoading,
}) => {
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'voice'>('overview');

  const { patient, today, cognition, music, wellbeing, voiceActivity } = overview;
  const routineAdherencePercent = today.totalRoutineToday > 0 
    ? Math.round((today.completedToday / today.totalRoutineToday) * 100) 
    : 0;

  const voiceLogs: VoiceAssistantLog[] = voiceActivity?.recentLogs || [];
  const voiceTodayCount = voiceActivity?.todayCount || 0;

  // Helper: human-readable intent label
  const intentLabel = (intent: string) => {
    const map: Record<string, string> = {
      play_specific_song: '🎵 Music Request',
      play_general_music: '🎶 Play Music',
      pause_music: '⏸ Pause Music',
      resume_music: '▶️ Resume Music',
      routine_inquiry: '📋 Routine Check',
      date_time_inquiry: '🕐 Time & Date',
      game_inquiry: '🎮 Game Request',
      open_ended: '💬 Conversation',
    };
    return map[intent] || intent.replace(/_/g, ' ');
  };

  const intentColor = (intent: string) => {
    if (intent.includes('music') || intent.includes('song')) return 'bg-cosmos-50 text-cosmos-800 border-cosmos-200';
    if (intent.includes('routine')) return 'bg-meadow-50 text-meadow-800 border-meadow-200';
    if (intent.includes('game')) return 'bg-sky-50 text-sky-800 border-sky-200';
    if (intent.includes('date') || intent.includes('time')) return 'bg-marigold-50 text-marigold-800 border-marigold-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const handleConfirmRevoke = async () => {
    setIsRevoking(true);
    try {
      await onRevokeLink(patient.id);
      setShowRevokeConfirm(false);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* 1. Patient Header & Connection Strip — Scenic Anime Meadow Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-sky-200/90 shadow-warm-lg min-h-[170px] sm:min-h-[190px] flex items-end">
        {/* Background Meadow Artwork with full saturation & zero white fog */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-100"
          style={{ backgroundImage: "url('/meadow-bg.png')" }}
        />
        
        {/* Very subtle bottom-up vignette strictly to ground the cards, no foggy white wash */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent pointer-events-none" />

        {/* Foreground Content: Crisp Frosted Glass Floating Pods */}
        <div className="relative z-10 w-full p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div className="flex items-center space-x-4 bg-white/88 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/90 shadow-lg">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-meadow-600 via-meadow-500 to-sky-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-warm-sm ring-2 ring-white/80 shrink-0">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A202C] font-brand-heading">
                  {patient.name}
                </h2>
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-cosmos-50 text-cosmos-800 border border-cosmos-200 shadow-2xs">
                  {patientInfo.relationship}
                </span>
                <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-meadow-50 text-meadow-800 border border-meadow-300 flex items-center space-x-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-meadow-600 animate-pulse"></span>
                  <span>Active Connection</span>
                  {isLoading && <RefreshCw className="w-3 h-3 text-meadow-700 animate-spin ml-1" />}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#1A202C]/75 mt-1 font-brand-body flex items-center space-x-3">
                <span>Patient ID: <code className="font-mono text-xs font-bold text-meadow-900 bg-meadow-50/80 px-2 py-0.5 rounded-md border border-meadow-200/60">{patient.id}</code></span>
                <span>•</span>
                <span>Connected since: {new Date(patientInfo.linkedAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          {/* Action: Manage / Disconnect */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowRevokeConfirm(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/90 hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer backdrop-blur-md"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Revoke Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1a. Tab Switcher */}
      <div className="flex items-center space-x-2">
        <button
          id="tab-daily-overview"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
            activeTab === 'overview'
              ? 'bg-meadow-600 text-white border-meadow-700 shadow-warm-sm'
              : 'bg-white/90 text-[#1A202C]/70 border-cream-200 hover:border-meadow-300 hover:bg-meadow-50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Daily Overview</span>
        </button>
        <button
          id="tab-voice-history"
          onClick={() => setActiveTab('voice')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
            activeTab === 'voice'
              ? 'bg-cosmos-600 text-white border-cosmos-700 shadow-warm-sm'
              : 'bg-white/90 text-[#1A202C]/70 border-cream-200 hover:border-cosmos-300 hover:bg-cosmos-50'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Voice Companion</span>
          {voiceTodayCount > 0 && (
            <span className="ml-1 bg-cosmos-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full">
              {voiceTodayCount} today
            </span>
          )}
        </button>
      </div>

      {/* 2. Key Daily Vitals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
        
        {/* Adherence Card (Meadow Fresh Green) */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-meadow-200/80 hover:border-meadow-300 shadow-warm-xs flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-meadow-800/70">
              Today's Routine
            </span>
            <div className="w-9 h-9 rounded-xl bg-meadow-50 text-meadow-700 border border-meadow-200/60 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-meadow-800 font-brand-heading">
                {routineAdherencePercent}%
              </span>
              <span className="text-xs text-[#1A202C]/65 font-semibold">
                ({today.completedToday}/{today.totalRoutineToday || 7} completed)
              </span>
            </div>
            <div className="w-full h-2 bg-meadow-100 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-meadow-500 to-meadow-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, routineAdherencePercent)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Medicine Status (Sunlit Marigold Amber) */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-marigold-200/80 hover:border-marigold-300 shadow-warm-xs flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-marigold-800/70">
              Medication Status
            </span>
            <div className="w-9 h-9 rounded-xl bg-marigold-50 text-marigold-700 border border-marigold-200/60 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-extrabold text-marigold-900 font-brand-heading">
                {today.medicineAdherence.status === 'all_taken' ? 'All Taken' : today.medicineAdherence.completed > 0 ? 'Partially Taken' : 'Pending'}
              </span>
            </div>
            <p className="text-xs text-[#1A202C]/70 mt-1">
              {today.medicineAdherence.completed} of {today.medicineAdherence.total || 2} medication doses marked DONE today
            </p>
          </div>
        </div>

        {/* Cognitive Accuracy (Anime Azure Sky) */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-sky-200/80 hover:border-sky-300 shadow-warm-xs flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-800/70">
              Cognitive Accuracy
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/60 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-sky-800 font-brand-heading">
                {cognition.averageAccuracy || 0}%
              </span>
              <span className="text-xs text-[#1A202C]/65 font-semibold">
                ({cognition.totalGamesPlayed} games recorded)
              </span>
            </div>
            <p className="text-xs text-[#1A202C]/70 mt-1">
              Gentle memory & attention exercises
            </p>
          </div>
        </div>

        {/* Music Therapy Vitals (Wildflower Cosmos Pink) */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-cosmos-200/80 hover:border-cosmos-300 shadow-warm-xs flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cosmos-800/70">
              Music Therapy
            </span>
            <div className="w-9 h-9 rounded-xl bg-cosmos-50 text-cosmos-700 border border-cosmos-200/60 flex items-center justify-center">
              <Music2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-cosmos-800 font-brand-heading">
                {music.likedSongsCount}
              </span>
              <span className="text-xs text-[#1A202C]/65 font-semibold">
                liked nostalgic tracks
              </span>
            </div>
            <p className="text-xs text-[#1A202C]/70 mt-1">
              Active calming nostalgia playlist
            </p>
          </div>
        </div>

        {/* Voice Assistant Activity (Cosmos Purple) */}
        <div className="p-5 rounded-3xl bg-white/90 backdrop-blur-sm border border-cosmos-200/80 hover:border-cosmos-300 shadow-warm-xs flex flex-col justify-between transition-all cursor-pointer" onClick={() => setActiveTab('voice')}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cosmos-800/70">
              Voice Companion
            </span>
            <div className="w-9 h-9 rounded-xl bg-cosmos-50 text-cosmos-700 border border-cosmos-200/60 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-cosmos-800 font-brand-heading">
                {voiceTodayCount}
              </span>
              <span className="text-xs text-[#1A202C]/65 font-semibold">
                interactions today
              </span>
            </div>
            <p className="text-xs text-cosmos-700/80 mt-1 flex items-center space-x-1">
              <span>{voiceLogs.length} total logged</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
        </div>

      </div>

      {/* === VOICE COMPANION HISTORY TAB === */}
      {activeTab === 'voice' && (
        <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-cosmos-200/90 shadow-warm-xs overflow-hidden">
          <div className="flex items-center justify-between px-6 sm:px-7 pt-6 pb-4 border-b border-cosmos-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cosmos-700 block">Full Interaction History</span>
              <h3 className="text-xl font-extrabold text-[#1A202C] font-brand-heading flex items-center space-x-2">
                <Mic className="w-5 h-5 text-cosmos-600" />
                <span>Voice Companion Log</span>
              </h3>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cosmos-50 text-cosmos-900 border border-cosmos-200">
              {voiceLogs.length} total entries
            </span>
          </div>

          {voiceLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-cosmos-50 text-cosmos-400 flex items-center justify-center mb-4">
                <Mic className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-[#1A202C]/70">No voice interactions yet</p>
              <p className="text-sm text-[#1A202C]/50 mt-1">When {patient.name} uses the Voice Companion, each conversation will be logged here.</p>
            </div>
          ) : (
            <div className="divide-y divide-cosmos-50/80 max-h-[580px] overflow-y-auto">
              {voiceLogs.map((log) => (
                <div key={log.id} className="px-6 sm:px-7 py-4 hover:bg-cosmos-50/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Intent badge + timestamp */}
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${intentColor(log.intent)}`}>
                          {intentLabel(log.intent)}
                        </span>
                        {log.detectedLanguage === 'hi' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-marigold-50 text-marigold-800 border border-marigold-200">🇮🇳 Hindi</span>
                        )}
                        <span className="text-[11px] text-[#1A202C]/40">
                          {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Patient's question */}
                      <div className="flex items-start space-x-2 mb-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageSquare className="w-3 h-3" />
                        </div>
                        <p className="text-sm font-semibold text-[#1A202C] leading-snug">
                          {log.rawQuestion}
                        </p>
                      </div>

                      {/* AI Reply */}
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 rounded-full bg-cosmos-100 text-cosmos-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Mic className="w-3 h-3" />
                        </div>
                        <p className="text-xs text-[#1A202C]/65 leading-relaxed line-clamp-2">
                          {log.replyText}
                        </p>
                      </div>

                      {/* Action taken (if any) */}
                      {log.actionLabel && (
                        <div className="flex items-center space-x-2 mt-2">
                          {log.actionIcon === 'music' ? (
                            <PlayCircle className="w-3.5 h-3.5 text-cosmos-600" />
                          ) : log.actionIcon === 'game' ? (
                            <Gamepad2 className="w-3.5 h-3.5 text-sky-600" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span className="text-[11px] font-bold text-cosmos-700 bg-cosmos-50 px-2.5 py-0.5 rounded-lg border border-cosmos-200">
                            {log.actionLabel}
                          </span>
                          {log.songName && (
                            <span className="text-[11px] text-cosmos-600/80">— {log.songName}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === DAILY OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <div className="space-y-6 sm:space-y-8">
          {/* AI Cognitive Health Analysis & Interactive Progress Graphs */}
          <AnalyticsCharts
            gameData={cognition.gameAnalytics}
            musicData={music.musicAnalytics}
            aiAnalysis={overview.aiCognitiveAnalysis}
            totalGameTimeMinutes={cognition.totalGameTimeMinutes}
            highestCombinationReached={cognition.highestCombinationReached}
            totalListeningMinutes={music.totalListeningMinutes}
            averageAccuracy={cognition.averageAccuracy}
            likedSongsCount={music.likedSongsCount}
            patientName={patient.name}
            recentGames={cognition.recentGames}
            recentMusicHistory={music.recentHistory}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left 2 Cols: Today's Routine & Medicine Feed */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Routine Schedule */}
          <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-meadow-200/90 p-6 sm:p-7 shadow-warm-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-meadow-700 block">
                  Live Daily Stream
                </span>
                <h3 className="text-xl font-extrabold text-[#1A202C] font-brand-heading">
                  Today's Routine & Medicine Adherence
                </h3>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-meadow-50 text-meadow-900 border border-meadow-200">
                {today.date}
              </span>
            </div>

            {today.routineLogs.length === 0 ? (
              <div className="p-6 rounded-2xl bg-cream-50 text-center text-sm text-[#1A202C]/60">
                No routine logs recorded yet today. Routine steps will appear here as your elder marks them.
              </div>
            ) : (
              <div className="space-y-3">
                {today.routineLogs.map((log) => {
                  const isDone = log.completed;
                  const isMedicine = log.title.toLowerCase().includes('medicine') || log.routineId.includes('med');

                  return (
                    <div
                      key={log.routineId}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isDone 
                          ? 'bg-meadow-50/70 border-meadow-200' 
                          : 'bg-white border-cream-200 hover:border-meadow-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isDone 
                            ? 'bg-meadow-600 text-white shadow-xs' 
                            : 'bg-cream-200 text-[#1A202C]/40'
                        }`}>
                          {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm sm:text-base font-bold ${
                              isDone ? 'text-meadow-900 line-through opacity-80' : 'text-[#1A202C]'
                            }`}>
                              {log.title}
                            </span>
                            {isMedicine && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-marigold-50 text-marigold-800 border border-marigold-200">
                                Medicine
                              </span>
                            )}
                          </div>
                          {log.completedAt && (
                            <p className="text-xs text-meadow-700 mt-0.5 font-medium flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Completed at {new Date(log.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isDone ? 'bg-meadow-100 text-meadow-800' : 'bg-cream-100 text-[#1A202C]/50'
                      }`}>
                        {isDone ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cognitive Performance Feed */}
          <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-sky-200/90 p-6 sm:p-7 shadow-warm-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 block">
                  Cognitive Health
                </span>
                <h3 className="text-xl font-extrabold text-[#1A202C] font-brand-heading">
                  Brain Game Sessions & Scores
                </h3>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                {cognition.recentGames.length} recent sessions
              </span>
            </div>

            {cognition.recentGames.length === 0 ? (
              <div className="p-6 rounded-2xl bg-cream-50 text-center text-sm text-[#1A202C]/60">
                No brain game scores recorded yet. Scores from Memory Match, Attention, and Cultural Heritage will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {cognition.recentGames.map((game, i) => (
                  <div 
                    key={i}
                    className="p-3.5 sm:p-4 rounded-2xl bg-sky-50/40 border border-sky-100 hover:border-sky-200 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                        {game.gameType.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#1A202C]">
                          {game.gameType === 'memoryMatch' && 'Memory Match Game'}
                          {game.gameType === 'attentionGame' && 'Attention Focus Game'}
                          {game.gameType === 'sequenceRecall' && 'Sequence Recall Game'}
                          {game.gameType === 'culturalGame' && 'Cultural Heritage Quiz'}
                          {game.gameType === 'dailyRoutineRecall' && 'Daily Routine Recall'}
                        </div>
                        <p className="text-xs text-[#1A202C]/60 flex items-center gap-1.5 flex-wrap mt-0.5">
                          {game.combinationsReached ? (
                            <span className="font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md border border-purple-200 text-[11px]">
                              {game.combinationsReached} Steps Reached
                            </span>
                          ) : (
                            <span>Level {game.level}</span>
                          )}
                          <span>•</span>
                          <span>{Math.round(game.responseTimeMs / 1000)}s response time</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm sm:text-base font-extrabold text-sky-900 block font-brand-heading">
                        {game.accuracy}% Accuracy
                      </span>
                      <span className="text-[11px] text-[#1A202C]/50">
                        {new Date(game.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Col: Music & Wellbeing Insights */}
        <div className="space-y-6">
          
          {/* Liked Songs Strip */}
          <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-cosmos-200/90 p-6 shadow-warm-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-extrabold text-[#1A202C] font-brand-heading flex items-center space-x-2">
                <Heart className="w-4 h-4 text-cosmos-600" />
                <span>Nostalgic Music Library</span>
              </h4>
              <span className="text-xs font-bold text-cosmos-800 bg-cosmos-50 px-2.5 py-0.5 rounded-full border border-cosmos-200 shadow-2xs">
                {music.likedSongsCount} saved
              </span>
            </div>

            {music.recentLiked.length === 0 ? (
              <p className="text-xs text-[#1A202C]/60 text-center py-4">
                No songs liked yet. When your elder likes songs in NeuroMusic, they will show here.
              </p>
            ) : (
              <div className="space-y-2.5">
                {music.recentLiked.map((song) => (
                  <div key={song.id} className="p-3 rounded-xl bg-gradient-to-r from-cosmos-50/40 via-white to-white border border-cosmos-100 hover:border-cosmos-200 flex items-center space-x-3 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cosmos-500 to-cosmos-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      ♪
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#1A202C] truncate">
                        {song.title}
                      </p>
                      <p className="text-[11px] text-[#1A202C]/60 truncate">
                        {song.artist}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Emotional Wellbeing Card */}
          <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-marigold-200/90 p-6 shadow-warm-xs">
            <h4 className="text-base font-extrabold text-[#1A202C] font-brand-heading flex items-center space-x-2 mb-4">
              <Smile className="w-4 h-4 text-marigold-600" />
              <span>Emotional Wellbeing</span>
            </h4>

            {wellbeing.latestMood ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-marigold-50/90 via-cream-50 to-amber-50/50 border border-marigold-200 text-center">
                <span className="text-xs font-bold text-marigold-800 uppercase tracking-wider block mb-1">
                  Most Recent Reflection
                </span>
                <span className="text-xl font-extrabold text-marigold-950 font-brand-heading block capitalize">
                  {wellbeing.latestMood.mood}
                </span>
                <p className="text-xs text-[#1A202C]/60 mt-1">
                  Checked in on {new Date(wellbeing.latestMood.timestamp).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-cream-50 text-center text-xs text-[#1A202C]/60">
                No mood check-ins recorded yet this week.
              </div>
            )}
          </div>

          {/* Privacy & Safety Certification */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-sky-950 via-slate-900 to-meadow-950 text-white shadow-warm-sm border border-sky-800/40">
            <div className="flex items-center space-x-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-sky-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
                Data Security
              </span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              This dashboard is securely linked to {patient.name}’s account. All health and activity logs are verified against your active caregiver relationship.
            </p>
          </div>

        </div>

      </div>
      </div>
      )}

      {/* Revocation Confirmation Modal */}
      {showRevokeConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border-2 border-terracotta-300 p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-[#1A202C] font-brand-heading mb-2">
              Disconnect from {patient.name}?
            </h3>
            <p className="text-sm text-[#1A202C]/70 leading-relaxed mb-6 font-brand-body">
              Are you sure you want to revoke this connection? You will immediately lose access to {patient.name}’s routine and cognitive logs until you re-enter their connection code.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowRevokeConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-cream-300 text-xs font-bold text-[#1A202C]/80 hover:bg-cream-100 cursor-pointer"
              >
                Keep Connection
              </button>
              <button
                type="button"
                disabled={isRevoking}
                onClick={handleConfirmRevoke}
                className="px-5 py-2.5 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isRevoking ? 'Revoking...' : 'Yes, Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
