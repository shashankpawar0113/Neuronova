import React from 'react';
import {
  Brain, Eye, Music2, Landmark, Sun, HeartHandshake,
  ArrowRight, Home, Sparkles,
} from 'lucide-react';
import { GameType } from '../types';
import { HOMEPAGE_URL, performLogout } from '../config/urls';

interface Game {
  id: GameType;
  title: string;
  tagline: string;
  description: string;
  Icon: React.FC<{ className?: string }>;
  iconBg: string;
  cardBg: string;
  cardBorder: string;
  badge: string;
  badgeBg: string;
  cognitive: string;
}

const GAMES: Game[] = [
  {
    id: 'memoryMatch',
    title: 'Memory Match',
    tagline: 'Working Memory',
    description: 'Flip cards and find matching pairs of familiar symbols. Take your time — no rush!',
    Icon: Brain,
    iconBg: 'bg-forest-600 text-white',
    cardBg: 'bg-forest-50/90 hover:bg-forest-100',
    cardBorder: 'border-forest-300 hover:border-forest-500',
    badge: '7 levels · 3–9 pairs',
    badgeBg: 'bg-forest-100 text-forest-800 border-forest-200',
    cognitive: 'Recall & Recognition',
  },
  {
    id: 'attentionGame',
    title: 'Attention Game',
    tagline: 'Focus & Perception',
    description: 'Spot the one circle that looks a little different from the rest. Sharp eyes win!',
    Icon: Eye,
    iconBg: 'bg-river-500 text-white',
    cardBg: 'bg-river-50/90 hover:bg-river-100',
    cardBorder: 'border-river-300 hover:border-river-500',
    badge: '8 levels · 4–9 circles (max 3×3)',
    badgeBg: 'bg-river-100 text-river-800 border-river-200',
    cognitive: 'Visual Attention',
  },
  {
    id: 'sequenceRecall',
    title: 'Sequence Recall',
    tagline: 'Pattern Memory',
    description: 'Watch a colorful light pattern, then tap the same colors in the same order.',
    Icon: Music2,
    iconBg: 'bg-purple-600 text-white',
    cardBg: 'bg-purple-50/90 hover:bg-purple-100',
    cardBorder: 'border-purple-300 hover:border-purple-500',
    badge: '7 levels · 4–9 boxes & 3–9 steps',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    cognitive: 'Short-Term Sequencing',
  },
  {
    id: 'culturalGame',
    title: 'Cultural Heritage',
    tagline: 'Tradition & Wisdom',
    description: 'Celebrate India\'s beautiful traditions — answer gentle questions about culture and history.',
    Icon: Landmark,
    iconBg: 'bg-muga-500 text-white',
    cardBg: 'bg-muga-50/90 hover:bg-muga-100',
    cardBorder: 'border-muga-300 hover:border-muga-500',
    badge: '3 levels · 8 questions',
    badgeBg: 'bg-muga-100 text-muga-800 border-muga-200',
    cognitive: 'Semantic Long-Term Memory',
  },
  {
    id: 'dailyRoutineRecall',
    title: 'Daily Routine Recall',
    tagline: 'Your Day, Your Way',
    description: 'Arrange the steps of your daily routine in the right order — from morning sunshine to evening calls.',
    Icon: Sun,
    iconBg: 'bg-gold-600 text-white',
    cardBg: 'bg-gold-50/90 hover:bg-gold-100',
    cardBorder: 'border-gold-300 hover:border-gold-500',
    badge: '3 levels · 3–7 steps',
    badgeBg: 'bg-gold-100 text-gold-800 border-gold-200',
    cognitive: 'Procedural Memory',
  },
];

import { getGameUserSession, fetchUserGameResults } from '../services/gamePersistence';

interface GamesHubProps {
  onSelectGame: (id: GameType) => void;
}

export const GamesHub: React.FC<GamesHubProps> = ({ onSelectGame }) => {
  const [session] = React.useState(() => getGameUserSession());
  const [gameCount, setGameCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let active = true;
    fetchUserGameResults().then(results => {
      if (active) setGameCount(results.length);
    });
    return () => { active = false; };
  }, [session.userId]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-cream-50/90 backdrop-blur-sm border-b border-cream-300 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-forest-700">NeuroNova</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-[Outfit] text-[#1A202C] leading-tight">
              Neurogames
            </h1>
          </div>
          <button
            onClick={() => {
              const u = encodeURIComponent(session.userId);
              const n = encodeURIComponent(session.name);
              const r = encodeURIComponent(session.role);
              window.location.href = `${HOMEPAGE_URL}/?userId=${u}&name=${n}&role=${r}`;
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-cream-300 text-forest-800 hover:bg-forest-50 transition-all text-sm font-bold shadow-sm"
            aria-label="Back to main home screen"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
          <button
            type="button"
            onClick={() => performLogout()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-all text-sm font-bold shadow-sm cursor-pointer"
            title="Sign out of NeuroNova"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
          <button
            type="button"
            onClick={() => performLogout()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-all text-sm font-bold shadow-sm cursor-pointer"
            title="Sign out of NeuroNova"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* Intro banner */}
        <div className="mb-6 p-5 rounded-3xl bg-forest-50 border-2 border-forest-200 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-forest-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-extrabold text-forest-900 font-[Outfit]">
                Welcome, {session.name} 🌿
              </h2>
              {gameCount !== null && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-forest-100 text-forest-800 border border-forest-300">
                  {gameCount === 0 ? 'No games played yet' : `${gameCount} game${gameCount === 1 ? '' : 's'} recorded`}
                </span>
              )}
            </div>
            <p className="text-sm text-forest-800/80 mt-1 font-[Plus_Jakarta_Sans]">
              Each game gently exercises a different part of your memory. No time pressure, no wrong answers — 
              just gentle, joyful play at your own pace.
            </p>
            <div className="mt-3.5 flex items-center gap-3">
              <button
                onClick={() => onSelectGame('sequential' as any)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Start Daily Voice-Guided Games (Hands-Free)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Game grid — 2 col, last one full width */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
          {GAMES.map((game, i) => {
            const { Icon } = game;
            const isLast = i === GAMES.length - 1;
            return (
              <button
                key={game.id}
                onClick={() => onSelectGame(game.id)}
                className={`${isLast ? 'sm:col-span-2' : ''} text-left p-5 sm:p-6 rounded-3xl border-2 ${game.cardBg} ${game.cardBorder} transition-all duration-300 shadow-[0_2px_8px_rgba(30,107,30,0.08)] hover:shadow-[0_8px_32px_rgba(30,107,30,0.16)] active:scale-[0.98] group focus-visible:ring-4 focus-visible:ring-forest-500 cursor-pointer`}
                aria-label={`Play ${game.title}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-14 h-14 rounded-2xl ${game.iconBg} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1A202C]/55 block">
                        {game.tagline}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold font-[Outfit] text-[#1A202C] group-hover:text-forest-800 leading-tight">
                        {game.title}
                      </h3>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/80 border border-black/5 flex items-center justify-center shrink-0 text-[#1A202C]/50 group-hover:translate-x-1 transition-transform duration-200">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                <p className="mt-3.5 text-sm sm:text-base text-[#1A202C]/75 font-[Plus_Jakarta_Sans] leading-relaxed">
                  {game.description}
                </p>

                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${game.badgeBg}`}>
                    {game.badge}
                  </span>
                  <span className="text-xs font-semibold text-[#1A202C]/50">
                    🧠 {game.cognitive}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Memory Vault tile */}
        <button
          onClick={() => onSelectGame('vault')}
          className="w-full text-left p-5 sm:p-6 rounded-3xl border-2 bg-muga-50/90 hover:bg-muga-100 border-muga-300 hover:border-muga-500 transition-all duration-300 shadow-[0_2px_8px_rgba(107,80,16,0.08)] hover:shadow-[0_8px_32px_rgba(107,80,16,0.16)] active:scale-[0.98] group cursor-pointer"
          aria-label="Open Family Memory Vault"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-muga-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A202C]/55 block">
                  Reminiscence · Emotional Connection
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold font-[Outfit] text-[#1A202C] group-hover:text-muga-800 leading-tight">
                  Family Memory Vault
                </h3>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/80 border border-black/5 flex items-center justify-center shrink-0 text-[#1A202C]/50 group-hover:translate-x-1 transition-transform duration-200">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3.5 text-sm sm:text-base text-[#1A202C]/75 font-[Plus_Jakarta_Sans] leading-relaxed">
            View cherished photos of your loved ones. Optionally, try the gentle "Remember Together" activity — a warm, no-pressure way to reconnect with beautiful memories.
          </p>
          <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-muga-100 text-muga-800 border-muga-200">
              6 family members · voice notes
            </span>
            <span className="text-xs font-semibold text-[#1A202C]/50">
              💚 Reminiscence Mode
            </span>
          </div>
        </button>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-[#1A202C]/40 font-[Plus_Jakarta_Sans]">
          Neurogames · Designed with dignity, patience, and love for our elders.
        </p>
      </main>
    </div>
  );
};
