import React, { useState, useMemo, useCallback } from 'react';
import {
  Sun, Pill, Coffee, Droplets, Footprints, Brain, Phone,
  MoveUp, MoveDown, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { GameHeader } from '../components/GameHeader';
import { GameResultScreen } from '../components/GameResultScreen';
import { GameResult } from '../types';
import { persistGameResult } from '../services/gamePersistence';

// Routine steps — reuse the same items from homepage mockRoutine for consistency
const ALL_STEPS = [
  {
    id: 'wake',
    label: 'Wake Up & Morning Sunshine',
    hint: 'Start the day with gentle light',
    Icon: Sun,
    iconColor: 'text-gold-600',
    bg: 'bg-gold-50',
    border: 'border-gold-300',
    correctOrder: 1,
  },
  {
    id: 'medicine',
    label: 'Take Morning Medicine',
    hint: 'With a glass of water',
    Icon: Pill,
    iconColor: 'text-river-600',
    bg: 'bg-river-50',
    border: 'border-river-200',
    correctOrder: 2,
  },
  {
    id: 'breakfast',
    label: 'Warm Breakfast & Tea',
    hint: 'Nourish yourself with warmth',
    Icon: Coffee,
    iconColor: 'text-muga-600',
    bg: 'bg-muga-50',
    border: 'border-muga-200',
    correctOrder: 3,
  },
  {
    id: 'water',
    label: 'Drink a Glass of Water',
    hint: 'Stay refreshed through the morning',
    Icon: Droplets,
    iconColor: 'text-river-500',
    bg: 'bg-river-50',
    border: 'border-river-100',
    correctOrder: 4,
  },
  {
    id: 'walk',
    label: 'Peaceful Garden Walk',
    hint: 'A few minutes of calm fresh air',
    Icon: Footprints,
    iconColor: 'text-forest-600',
    bg: 'bg-forest-50',
    border: 'border-forest-200',
    correctOrder: 5,
  },
  {
    id: 'game',
    label: 'Daily Brain Game',
    hint: 'Keep your mind smiling',
    Icon: Brain,
    iconColor: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    correctOrder: 6,
  },
  {
    id: 'family',
    label: 'Call Family (Evening)',
    hint: 'Hear a cheerful, familiar voice',
    Icon: Phone,
    iconColor: 'text-terracotta-600',
    bg: 'bg-terracotta-50',
    border: 'border-terracotta-200',
    correctOrder: 7,
  },
];

const LEVEL_CONFIGS = [
  { steps: 3, label: '3 steps — easy start' },
  { steps: 5, label: '5 steps — good effort' },
  { steps: 7, label: '7 steps — full day!' },
];

type Step = typeof ALL_STEPS[number];

function shuffleSteps(steps: Step[]): Step[] {
  const arr = [...steps];
  // Fisher-Yates, but ensure it's never already in correct order
  let sorted = false;
  while (!sorted) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    sorted = !arr.every((s, i) => s.id === steps[i].id);
  }
  return arr;
}

interface DailyRoutineRecallGameProps { onBack: () => void; }

export const DailyRoutineRecallGame: React.FC<DailyRoutineRecallGameProps> = ({ onBack }) => {
  const [level, setLevel] = useState(1);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [result, setResult] = useState<GameResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState<boolean[]>([]);

  const stepCount = LEVEL_CONFIGS[level - 1].steps;
  const correctSteps = useMemo(() => ALL_STEPS.slice(0, stepCount), [stepCount]);

  const [orderedSteps, setOrderedSteps] = useState<Step[]>(() =>
    shuffleSteps(ALL_STEPS.slice(0, stepCount))
  );

  // Re-init when level changes
  const initLevel = useCallback((lvl: number) => {
    const count = LEVEL_CONFIGS[lvl - 1].steps;
    setOrderedSteps(shuffleSteps(ALL_STEPS.slice(0, count)));
    setSubmitted(false);
    setFeedbackItems([]);
    setAttempts((a) => a + 1);
  }, []);

  const moveStep = (idx: number, dir: 'up' | 'down') => {
    if (submitted) return;
    const newArr = [...orderedSteps];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newArr.length) return;
    [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
    setOrderedSteps(newArr);
  };

  const handleSubmit = () => {
    const correct = orderedSteps.map((s, i) => s.id === correctSteps[i].id);
    const correctCount = correct.filter(Boolean).length;
    const acc = Math.round((correctCount / stepCount) * 100);
    setFeedbackItems(correct);
    setSubmitted(true);

    setTimeout(() => {
      const res: GameResult = {
        gameType: 'dailyRoutineRecall',
        level,
        accuracy: acc,
        responseTimeMs: Date.now() - startTime,
        attempts,
        timestamp: new Date().toISOString(),
      };
      setResult(res);
      persistGameResult(res);
    }, 2200);
  };

  const resetGame = (lvl = level) => {
    setLevel(lvl);
    setResult(null);
    initLevel(lvl);
  };

  if (result) {
    return (
      <GameResultScreen
        result={result}
        customEmoji={<Sun className="w-10 h-10 text-gold-500" />}
        currentLevel={level}
        maxLevel={LEVEL_CONFIGS.length}
        onNextLevel={() => resetGame(level + 1)}
        onPlayAgain={() => resetGame(level)}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <GameHeader
        title="Daily Routine Recall"
        subtitle="Arrange your day in the right order"
        level={level}
        maxLevel={LEVEL_CONFIGS.length}
        onBack={onBack}
        onReset={() => initLevel(level)}
        accentColor="text-gold-700"
      />

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-5 gap-4 max-w-lg mx-auto w-full">
        {/* Instructions */}
        <div className="w-full bg-gold-50 border border-gold-200 rounded-2xl p-4 text-sm text-gold-800 font-[Plus_Jakarta_Sans]">
          <p className="font-bold mb-1">How to play:</p>
          <p>Use the <strong>↑ ↓</strong> buttons to move each step up or down into the correct order for a typical morning. When ready, tap <strong>"Check My Day"</strong>.</p>
        </div>

        {/* Step cards */}
        <div className="flex flex-col gap-3 w-full">
          {orderedSteps.map((step, idx) => {
            const { Icon, iconColor, bg, border, label, hint } = step;
            const isCorrect = submitted ? feedbackItems[idx] : null;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 ${
                  submitted
                    ? isCorrect
                      ? 'bg-forest-50 border-forest-400 scale-[1.01]'
                      : 'bg-terracotta-50 border-terracotta-300'
                    : `${bg} ${border} hover:shadow-sm`
                } animate-fade-in`}
              >
                {/* Position number */}
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${
                  submitted
                    ? isCorrect ? 'bg-forest-500 text-white' : 'bg-terracotta-400 text-white'
                    : 'bg-white border border-cream-300 text-[#1A202C]/60'
                }`}>
                  {idx + 1}
                </span>

                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-white border border-white/60 shrink-0 shadow-sm`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm sm:text-base text-[#1A202C] leading-tight truncate">{label}</p>
                  <p className="text-xs text-[#1A202C]/55 mt-0.5">{hint}</p>
                </div>

                {/* Up/down controls or result indicator */}
                {!submitted ? (
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => moveStep(idx, 'up')}
                      disabled={idx === 0}
                      className="w-8 h-8 rounded-xl bg-white border border-cream-300 flex items-center justify-center text-[#1A202C]/60 hover:bg-cream-200 hover:text-forest-700 disabled:opacity-30 disabled:cursor-default transition-all"
                      aria-label="Move up"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveStep(idx, 'down')}
                      disabled={idx === orderedSteps.length - 1}
                      className="w-8 h-8 rounded-xl bg-white border border-cream-300 flex items-center justify-center text-[#1A202C]/60 hover:bg-cream-200 hover:text-forest-700 disabled:opacity-30 disabled:cursor-default transition-all"
                      aria-label="Move down"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="shrink-0">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-forest-500" />
                    ) : (
                      <span className="text-xs font-bold text-terracotta-500 bg-terracotta-50 px-2 py-1 rounded-lg border border-terracotta-200">
                        #{correctSteps.findIndex((s) => s.id === step.id) + 1}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        {!submitted && (
          <button
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl bg-gold-600 hover:bg-gold-700 text-white font-extrabold text-lg font-[Outfit] transition-all shadow-[0_4px_16px_rgba(212,160,23,0.3)] flex items-center justify-center gap-2 mt-2"
          >
            Check My Day
            <ArrowRight className="w-5 h-5" />
          </button>
        )}

        {submitted && (
          <p className="text-center text-sm text-forest-700 font-semibold animate-fade-in">
            Calculating your result... 🌿
          </p>
        )}
      </main>
    </div>
  );
};
