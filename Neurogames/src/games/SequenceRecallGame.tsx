import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Trophy, CheckCircle2, Flag } from 'lucide-react';
import { GameHeader } from '../components/GameHeader';
import { GameResultScreen } from '../components/GameResultScreen';
import { GameResult } from '../types';
import { persistGameResult } from '../services/gamePersistence';

// Fixed 3x3 grid: 9 richly colored, high-contrast, visually distinct light-up pads
// Clean palette with vibrant azure, forest emerald, warm gold, royal purple, etc.
const ALL_PADS = [
  {
    id: 0,
    label: 'Red',
    idle: 'bg-[#E05342] hover:bg-[#D04332] border-2 border-[#B83222] shadow-sm',
    active: 'bg-[#FF3B26] border-2 border-white scale-105 shadow-[0_0_30px_rgba(255,59,38,0.95)] ring-4 ring-red-200',
  },
  {
    id: 1,
    label: 'Blue',
    idle: 'bg-[#2D7DD2] hover:bg-[#1E6EC3] border-2 border-[#165AA5] shadow-sm',
    active: 'bg-[#2BB0FF] border-2 border-white scale-105 shadow-[0_0_30px_rgba(43,176,255,0.95)] ring-4 ring-blue-200',
  },
  {
    id: 2,
    label: 'Green',
    idle: 'bg-[#2E9B48] hover:bg-[#22873B] border-2 border-[#1B7030] shadow-sm',
    active: 'bg-[#34D35D] border-2 border-white scale-105 shadow-[0_0_30px_rgba(52,211,93,0.95)] ring-4 ring-green-200',
  },
  {
    id: 3,
    label: 'Yellow',
    idle: 'bg-[#E5A918] hover:bg-[#D49808] border-2 border-[#B68102] shadow-sm',
    active: 'bg-[#FFD23F] border-2 border-white scale-105 shadow-[0_0_30px_rgba(255,210,63,0.95)] ring-4 ring-amber-200',
  },
  {
    id: 4,
    label: 'Purple',
    idle: 'bg-[#8E44AD] hover:bg-[#7D389C] border-2 border-[#682A85] shadow-sm',
    active: 'bg-[#B968DF] border-2 border-white scale-105 shadow-[0_0_30px_rgba(185,104,223,0.95)] ring-4 ring-purple-200',
  },
  {
    id: 5,
    label: 'Orange',
    idle: 'bg-[#E67E22] hover:bg-[#D35400] border-2 border-[#B34700] shadow-sm',
    active: 'bg-[#FF9F43] border-2 border-white scale-105 shadow-[0_0_30px_rgba(255,159,67,0.95)] ring-4 ring-orange-200',
  },
  {
    id: 6,
    label: 'Teal',
    idle: 'bg-[#16A085] hover:bg-[#117A65] border-2 border-[#0E6251] shadow-sm',
    active: 'bg-[#1ABC9C] border-2 border-white scale-105 shadow-[0_0_30px_rgba(26,188,156,0.95)] ring-4 ring-teal-200',
  },
  {
    id: 7,
    label: 'Pink',
    idle: 'bg-[#D81B60] hover:bg-[#C2185B] border-2 border-[#880E4F] shadow-sm',
    active: 'bg-[#FF4081] border-2 border-white scale-105 shadow-[0_0_30px_rgba(255,64,129,0.95)] ring-4 ring-pink-200',
  },
  {
    id: 8,
    label: 'Indigo',
    idle: 'bg-[#3F51B5] hover:bg-[#303F9F] border-2 border-[#1A237E] shadow-sm',
    active: 'bg-[#5C6BC0] border-2 border-white scale-105 shadow-[0_0_30px_rgba(92,107,192,0.95)] ring-4 ring-indigo-200',
  },
];

// Soothing harmonic chime frequencies for therapeutic auditory feedback
const TONE_FREQUENCIES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];

function playPadTone(padId: number) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(TONE_FREQUENCIES[padId % TONE_FREQUENCIES.length], ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch (_) {
    // Audio optional
  }
}

type Phase = 'watch' | 'repeat' | 'result';

interface SequenceRecallGameProps {
  onBack: () => void;
  onGameComplete?: (result: GameResult) => void;
  initialLevel?: number;
}

// 7 levels: controls starting sequence length and how many pads are active
const SEQUENCE_LEVEL_CONFIG = [
  { label: 'Level 1 — 3 steps, 4 pads',   initSteps: 3, padsActive: 4,  maxSteps: 5  },
  { label: 'Level 2 — 4 steps, 6 pads',   initSteps: 4, padsActive: 6,  maxSteps: 6  },
  { label: 'Level 3 — 5 steps, 9 pads',   initSteps: 5, padsActive: 9,  maxSteps: 7  },
  { label: 'Level 4 — 6 steps, 9 pads',   initSteps: 6, padsActive: 9,  maxSteps: 8  },
  { label: 'Level 5 — 7 steps, 9 pads',   initSteps: 7, padsActive: 9,  maxSteps: 9  },
  { label: 'Level 6 — 8 steps, 9 pads',   initSteps: 8, padsActive: 9,  maxSteps: 10 },
  { label: 'Level 7 — 9 steps, 9 pads',   initSteps: 9, padsActive: 9,  maxSteps: 12 },
];

export const SequenceRecallGame: React.FC<SequenceRecallGameProps> = ({ onBack, onGameComplete, initialLevel = 1 }) => {
  const safeLevel = Math.max(1, Math.min(initialLevel, SEQUENCE_LEVEL_CONFIG.length));
  const [level, setLevel] = useState(safeLevel);
  const levelCfg = SEQUENCE_LEVEL_CONFIG[level - 1];
  const initialComboLen = levelCfg.initSteps;
  const [comboLength, setComboLength] = useState(initialComboLen);
  const [combinationsReached, setCombinationsReached] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('watch');
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [mistakesThisRound, setMistakesThisRound] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const startTimeRef = useRef(Date.now());
  const [result, setResult] = useState<GameResult | null>(null);
  const [isShowingSeq, setIsShowingSeq] = useState(false);
  const cancelRef = useRef(false);

  // Generate sequence using only padsActive pads (lower levels use fewer pad colors)
  const buildSequence = useCallback((len: number, pads = levelCfg.padsActive) => {
    return Array.from({ length: len }, () => Math.floor(Math.random() * pads));
  }, [levelCfg.padsActive]);

  // Gentle, calm, and predictable playback pace across all combinations
  // Elderly safety: Never speed up playback
  const playSequence = useCallback(async (seq: number[]) => {
    setPhase('watch');
    setIsShowingSeq(true);
    cancelRef.current = false;
    await new Promise((r) => setTimeout(r, 650));

    for (const pad of seq) {
      if (cancelRef.current) return;
      setActivePad(pad);
      playPadTone(pad);
      // Soothing light-up duration
      await new Promise((r) => setTimeout(r, 650));
      setActivePad(null);
      // Clear gentle pause between steps
      await new Promise((r) => setTimeout(r, 320));
    }

    setIsShowingSeq(false);
    setPhase('repeat');
  }, []);

  const startRound = useCallback((len: number, pads = levelCfg.padsActive) => {
    const seq = buildSequence(len, pads);
    setSequence(seq);
    setPlayerSeq([]);
    setFeedback(null);
    setSuccessAnimation(false);
    setTotalAttempts((a) => a + 1);
    playSequence(seq);
  }, [buildSequence, playSequence, levelCfg.padsActive]);

  // Initial round start
  useEffect(() => {
    startRound(initialComboLen, levelCfg.padsActive);
    return () => {
      cancelRef.current = true;
    };
  }, [initialComboLen, levelCfg.padsActive, startRound]);

  // Finish session and record progress to backend
  const finishSession = (finalMaxCombo = combinationsReached) => {
    cancelRef.current = true;
    const elapsed = Date.now() - startTimeRef.current;
    const effectiveMax = Math.max(finalMaxCombo, comboLength > 3 ? comboLength - 1 : 0);
    const acc = Math.max(65, Math.min(100, Math.round(100 - mistakesThisRound * 10)));
    
    const res: GameResult = {
      gameType: 'sequenceRecall',
      level,
      accuracy: acc,
      responseTimeMs: elapsed,
      attempts: totalAttempts,
      combinationsReached: effectiveMax,
      durationMs: elapsed,
      timestamp: new Date().toISOString(),
    };

    setResult(res);
    persistGameResult(res);
    if (onGameComplete) {
      onGameComplete(res);
    }
  };

  // Tap handler
  const handlePadTap = (padId: number) => {
    if (phase !== 'repeat' || isShowingSeq) return;
    playPadTone(padId);
    const nextTapIndex = playerSeq.length;
    const newSeq = [...playerSeq, padId];
    setPlayerSeq(newSeq);
    setActivePad(padId);
    setTimeout(() => setActivePad(null), 220);

    // Verify step
    if (padId !== sequence[nextTapIndex]) {
      // Mistake made
      setMistakesThisRound((m) => m + 1);
      setFeedback('Not quite — watch the pattern again, you can do it! 🌿');
      setPhase('watch');
      setTimeout(() => {
        if (!cancelRef.current) {
          setPlayerSeq([]);
          playSequence(sequence);
        }
      }, 1200);
      return;
    }

    // Correct tap! Check if full sequence completed
    if (newSeq.length === sequence.length) {
      // Completed current combination successfully!
      const nextCombo = comboLength + 1;
      const newMaxCombo = Math.max(combinationsReached, comboLength);
      setCombinationsReached(newMaxCombo);
      setSuccessAnimation(true);
      setFeedback(`✨ Superb! Combination passed (${comboLength} steps)`);
      setPhase('watch');

      // Target steps to win level: in daily sequential mode finish after 2 combos
      // In standalone mode finish upon reaching maxSteps for this level
      const targetSteps = onGameComplete ? levelCfg.initSteps + 1 : levelCfg.maxSteps;
      if (comboLength >= targetSteps) {
        setTimeout(() => {
          if (!cancelRef.current) {
            finishSession(newMaxCombo);
          }
        }, 1100);
        return;
      }

      setTimeout(() => {
        if (!cancelRef.current) {
          setComboLength(nextCombo);
          setMistakesThisRound(0);
          startRound(nextCombo, levelCfg.padsActive);
        }
      }, 1300);
    }
  };

  // Reset or change level
  const resetGame = (lvl = level) => {
    cancelRef.current = true;
    const safeLvl = Math.max(1, Math.min(lvl, SEQUENCE_LEVEL_CONFIG.length));
    setLevel(safeLvl);
    const cfg = SEQUENCE_LEVEL_CONFIG[safeLvl - 1];
    startTimeRef.current = Date.now();
    setComboLength(cfg.initSteps);
    setCombinationsReached(0);
    setPlayerSeq([]);
    setTotalAttempts(0);
    setMistakesThisRound(0);
    setResult(null);
    setFeedback(null);
    setSuccessAnimation(false);
    setTimeout(() => {
      cancelRef.current = false;
      startRound(cfg.initSteps, cfg.padsActive);
    }, 200);
  };

  if (result) {
    return (
      <GameResultScreen
        result={result}
        customEmoji={<Trophy className="w-12 h-12 text-amber-500" />}
        currentLevel={level}
        maxLevel={SEQUENCE_LEVEL_CONFIG.length}
        onNextLevel={() => resetGame(level + 1)}
        onPlayAgain={() => resetGame(level)}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <GameHeader
        title="Sequence Recall"
        subtitle={
          phase === 'watch' 
            ? `${levelCfg.label} — Watch pattern...` 
            : `Now tap the pattern (${playerSeq.length}/${sequence.length})`
        }
        level={level}
        maxLevel={SEQUENCE_LEVEL_CONFIG.length}
        customBadge={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-100 text-purple-900 text-xs font-extrabold border border-purple-200 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{comboLength} Steps</span>
            </span>
            {combinationsReached > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Best: {combinationsReached}</span>
              </span>
            )}
          </div>
        }
        onBack={onBack}
        onReset={() => resetGame(level)}
        accentColor="text-purple-600"
      />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 gap-5 sm:gap-6">
        {/* Phase indicator & Instructions */}
        <div className="text-center">
          <span
            className={`inline-block px-5 py-2 rounded-full text-sm font-bold shadow-xs transition-all ${
              successAnimation
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 scale-105'
                : phase === 'watch'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-forest-100 text-forest-800 border border-forest-300'
            }`}
          >
            {successAnimation
              ? `🎉 Combination Passed! Reached ${combinationsReached} Steps!`
              : phase === 'watch'
              ? isShowingSeq
                ? '👀 Watch carefully...'
                : '⏳ Memorize pattern...'
              : `🎯 Your turn! Tap step ${playerSeq.length + 1} of ${sequence.length}`}
          </span>
          {feedback && (
            <p className="text-sm text-forest-700 font-semibold mt-2 animate-fade-in">
              {feedback}
            </p>
          )}
        </div>

        {/* Dynamic Grid: 4 pads (2x2), 6 pads (3x2), or 9 pads (3x3) */}
        <div
          className={`grid gap-3 sm:gap-4.5 w-full place-items-center ${
            levelCfg.padsActive <= 4
              ? 'grid-cols-2 max-w-[240px] sm:max-w-[280px]'
              : 'grid-cols-3 max-w-[340px] sm:max-w-[420px]'
          }`}
        >
          {ALL_PADS.slice(0, levelCfg.padsActive).map((pad) => (
            <button
              key={pad.id}
              onClick={() => handlePadTap(pad.id)}
              disabled={phase !== 'repeat'}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl transition-all duration-150 select-none ${
                activePad === pad.id ? pad.active : pad.idle
              } ${phase !== 'repeat' ? 'cursor-default opacity-90' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
              aria-label={pad.label}
              title={pad.label}
            />
          ))}
        </div>

        {/* Progress dots indicating combination steps */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2 items-center flex-wrap justify-center max-w-xs">
            {sequence.map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  i < playerSeq.length
                    ? 'bg-forest-500 scale-110 shadow-xs'
                    : 'bg-cream-300'
                }`}
              />
            ))}
          </div>

          {/* Action buttons: Finish & Save Session */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => finishSession(Math.max(combinationsReached, comboLength > 3 ? comboLength - 1 : 3))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-cream-300 hover:border-purple-300 hover:bg-purple-50 text-xs sm:text-sm font-bold text-[#1A202C]/80 shadow-2xs transition-all cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5 text-purple-600" />
              <span>Finish Session & Save</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
