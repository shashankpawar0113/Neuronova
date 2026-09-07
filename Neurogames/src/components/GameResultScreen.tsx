import React from 'react';
import { Star, RefreshCw, Home, Trophy, Heart, ArrowRight } from 'lucide-react';
import { GameResult } from '../types';

interface GameResultScreenProps {
  result: GameResult;
  customMessage?: string;     // override the default warm message
  customEmoji?: React.ReactNode; // Lucide icon node to show at top
  onPlayAgain: () => void;
  onBack: () => void;
  currentLevel?: number;
  maxLevel?: number;
  onNextLevel?: () => void;
}

const MESSAGES: Record<string, (r: GameResult) => string> = {
  memoryMatch: (r) =>
    r.accuracy >= 90
      ? 'Wonderful! Your memory is shining bright today! ✨'
      : r.accuracy >= 70
      ? 'Great effort! Every match you made was a little victory. 🌿'
      : 'Lovely try! Each game gets a little easier. You are doing beautifully. 🌸',
  attentionGame: (r) =>
    r.accuracy >= 90
      ? 'What sharp eyes! You noticed every little detail. 💚'
      : r.accuracy >= 70
      ? 'Well spotted! Your focus is something to be proud of. 🌟'
      : 'Good effort! A calm and steady gaze goes a long way. 🌿',
  sequenceRecall: (r) =>
    r.accuracy >= 90
      ? 'Amazing memory! You remembered every step perfectly. 🎶'
      : r.accuracy >= 70
      ? 'Lovely job! Your mind held on to so much. 🌸'
      : 'Keep it up! Each time you try, your recall grows stronger. 🌱',
  culturalGame: (r) =>
    r.accuracy >= 90
      ? 'You carry our rich traditions in your heart! 🪔'
      : r.accuracy >= 70
      ? 'Beautifully done! Your cultural wisdom shines. 🌺'
      : 'Such a thoughtful journey through our traditions. 🌿',
  dailyRoutineRecall: (r) =>
    r.accuracy >= 90
      ? 'You know your day so well! Your independence is your strength. 💚'
      : r.accuracy >= 70
      ? 'Wonderful effort! You remembered your day beautifully. 🌸'
      : 'Every day follows its own gentle rhythm — you are learning yours. 🌿',
};

export const GameResultScreen: React.FC<GameResultScreenProps> = ({
  result,
  customMessage,
  customEmoji,
  onPlayAgain,
  onBack,
  currentLevel,
  maxLevel,
  onNextLevel,
}) => {
  const message = customMessage ?? MESSAGES[result.gameType]?.(result) ?? 'Well done! Every try is a step forward. 💚';
  const seconds = Math.round(result.responseTimeMs / 1000);

  const getStars = () => {
    if (result.accuracy >= 90) return 3;
    if (result.accuracy >= 70) return 2;
    return 1;
  };
  const stars = getStars();

  const hasNextLevel = Boolean(
    onNextLevel && currentLevel && maxLevel && currentLevel < maxLevel
  );
  const isFinalLevel = Boolean(
    currentLevel && maxLevel && currentLevel >= maxLevel
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-forest-200 shadow-[0_8px_32px_rgba(30,107,30,0.16)] p-8 animate-pop-in text-center">
        
        {/* Top icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-forest-100 border-2 border-forest-300 flex items-center justify-center">
            {customEmoji ?? <Trophy className="w-10 h-10 text-forest-600" />}
          </div>
        </div>

        <h2 className="text-3xl font-extrabold font-[Outfit] text-forest-900 mb-2">
          Game Complete!
        </h2>
        <p className="text-base text-[#1A202C]/75 font-[Plus_Jakarta_Sans] leading-relaxed mb-6 px-2">
          {message}
        </p>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-10 h-10 transition-all duration-300 ${
                s <= stars
                  ? 'text-gold-500 fill-gold-400'
                  : 'text-cream-300 fill-cream-200'
              }`}
            />
          ))}
        </div>

        {/* Stats */}
        <div className={`grid ${result.combinationsReached !== undefined ? 'grid-cols-4' : 'grid-cols-3'} gap-2 mb-6 bg-forest-50 rounded-2xl p-4 border border-forest-100`}>
          {result.combinationsReached !== undefined && (
            <div className="text-center">
              <p className="text-2xl font-extrabold text-purple-700">{result.combinationsReached}</p>
              <p className="text-[11px] text-[#1A202C]/60 mt-0.5">Steps Reached</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-2xl font-extrabold text-forest-700">{result.accuracy}%</p>
            <p className="text-[11px] text-[#1A202C]/60 mt-0.5">Accuracy</p>
          </div>
          <div className="text-center border-x border-forest-200">
            <p className="text-2xl font-extrabold text-forest-700">{seconds}s</p>
            <p className="text-[11px] text-[#1A202C]/60 mt-0.5">Time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-forest-700">{result.attempts}</p>
            <p className="text-[11px] text-[#1A202C]/60 mt-0.5">Attempts</p>
          </div>
        </div>

        {/* Final Level Completion Banner */}
        {isFinalLevel && (
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest-100 border border-forest-300 text-forest-800 text-sm font-extrabold shadow-xs">
            <Trophy className="w-4 h-4 text-forest-600" />
            <span>All {maxLevel} Levels Completed!</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          {hasNextLevel ? (
            <>
              <button
                onClick={onNextLevel}
                className="w-full py-4 rounded-2xl bg-forest-600 hover:bg-forest-700 text-white font-extrabold text-lg font-[Outfit] transition-all flex items-center justify-center gap-2.5 shadow-[0_6px_20px_rgba(30,107,30,0.3)] hover:shadow-xl active:scale-[0.99] cursor-pointer"
              >
                <span>Next Level</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onPlayAgain}
                className="w-full py-3.5 rounded-2xl bg-white hover:bg-forest-50 border-2 border-forest-200 text-forest-800 font-bold text-base font-[Plus_Jakarta_Sans] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-forest-600" />
                Play Again
              </button>
            </>
          ) : (
            <button
              onClick={onPlayAgain}
              className="w-full py-4 rounded-2xl bg-forest-600 hover:bg-forest-700 text-white font-extrabold text-lg font-[Outfit] transition-colors flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(30,107,30,0.25)] cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" />
              Play Again
            </button>
          )}

          <button
            onClick={onBack}
            className="w-full py-3.5 rounded-2xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-forest-800 font-bold text-base font-[Plus_Jakarta_Sans] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            All Games
          </button>
          <button
            onClick={() => { window.location.href = 'http://localhost:5175'; }}
            className="w-full py-2.5 rounded-2xl text-[#1A202C]/60 hover:text-forest-700 font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            ← Back to Main Home Screen
          </button>
        </div>

        {/* Warm footer note */}
        <p className="mt-5 text-xs text-[#1A202C]/50 font-[Plus_Jakarta_Sans] flex items-center justify-center gap-1">
          <Heart className="w-3 h-3 text-terracotta-400 fill-terracotta-400" />
          No pressure, no rush — every try is a win.
        </p>
      </div>
    </div>
  );
};
