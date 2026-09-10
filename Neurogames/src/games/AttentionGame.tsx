import React, { useState, useEffect, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { GameHeader } from '../components/GameHeader';
import { GameResultScreen } from '../components/GameResultScreen';
import { GameResult } from '../types';
import { persistGameResult } from '../services/gamePersistence';

// 6 progressive difficulty levels for Attention Game
const LEVEL_CONFIGS = [
  { label: 'Level 1 — very clear difference',   gridSize: 4,  roundsToWin: 5,  hueDelta: [90, 120], sVariance: 0,  lVariance: 0   },
  { label: 'Level 2 — clear difference',         gridSize: 6,  roundsToWin: 6,  hueDelta: [55, 75],  sVariance: 0,  lVariance: 0   },
  { label: 'Level 3 — moderate contrast',        gridSize: 9,  roundsToWin: 7,  hueDelta: [28, 45],  sVariance: 5,  lVariance: 0   },
  { label: 'Level 4 — subtle difference',        gridSize: 12, roundsToWin: 8,  hueDelta: [18, 28],  sVariance: 8,  lVariance: 5   },
  { label: 'Level 5 — very subtle difference',   gridSize: 16, roundsToWin: 9,  hueDelta: [12, 18],  sVariance: 10, lVariance: 7   },
  { label: 'Level 6 — expert — challenging contrast', gridSize: 16, roundsToWin: 10, hueDelta: [9, 15], sVariance: 12, lVariance: 8 },
];

type Circle = { id: number; hsl: string; isOdd: boolean };

function generateRound(cfg: typeof LEVEL_CONFIGS[0]): Circle[] {
  const baseH = Math.floor(Math.random() * 360);
  const baseS = 60 + Math.floor(Math.random() * 20);   // 60–80%
  const baseL = 50 + Math.floor(Math.random() * 10);   // 50–60%

  // Odd hue delta: random within the range for this level
  const [minDelta, maxDelta] = cfg.hueDelta;
  const hueDelta = minDelta + Math.random() * (maxDelta - minDelta);
  const oddH = (baseH + hueDelta) % 360;

  // At higher levels also slightly vary saturation/lightness of odd circle
  const oddS = baseS + (Math.random() > 0.5 ? 1 : -1) * (Math.random() * cfg.sVariance);
  const oddL = baseL + (Math.random() > 0.5 ? 1 : -1) * (Math.random() * cfg.lVariance);

  // ALWAYS place exactly one odd circle — guaranteed
  const oddIdx = Math.floor(Math.random() * cfg.gridSize);

  return Array.from({ length: cfg.gridSize }, (_, i) => ({
    id: i,
    hsl: i === oddIdx
      ? `hsl(${oddH.toFixed(0)}, ${Math.min(95, Math.max(30, oddS)).toFixed(0)}%, ${Math.min(75, Math.max(35, oddL)).toFixed(0)}%)`
      : `hsl(${baseH}, ${baseS}%, ${baseL}%)`,
    isOdd: i === oddIdx,
  }));
}

interface AttentionGameProps {
  onBack: () => void;
  onGameComplete?: (result: GameResult) => void;
  initialLevel?: number;
}

export const AttentionGame: React.FC<AttentionGameProps> = ({ onBack, onGameComplete, initialLevel = 1 }) => {
  const safeInitialLevel = Math.max(1, Math.min(initialLevel, LEVEL_CONFIGS.length));
  const [level, setLevel] = useState(safeInitialLevel);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [startTime] = useState(Date.now());
  const [result, setResult] = useState<GameResult | null>(null);

  const cfg = LEVEL_CONFIGS[level - 1];

  const nextRound = useCallback(() => {
    setFeedback(null);
    setCircles(generateRound(cfg));
  }, [cfg]);

  useEffect(() => { nextRound(); }, [nextRound]);

  const handleTap = (circle: Circle) => {
    if (result) return;
    setAttempts((a) => a + 1);
    if (circle.isOdd) {
      setCorrect((c) => c + 1);
      setFeedback('correct');
      if (round >= cfg.roundsToWin) {
        const elapsed = Date.now() - startTime;
        const acc = Math.round(((correct + 1) / (attempts + 1)) * 100);
        const res: GameResult = {
          gameType: 'attentionGame',
          level,
          accuracy: acc,
          responseTimeMs: elapsed,
          attempts: attempts + 1,
          timestamp: new Date().toISOString(),
        };
        setTimeout(() => {
          setResult(res);
          persistGameResult(res);
          if (onGameComplete) {
            setTimeout(() => onGameComplete(res), 800);
          }
        }, 600);
        return;
      }
      setTimeout(() => { setRound((r) => r + 1); nextRound(); }, 600);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 700);
    }
  };

  const resetGame = (lvl = level) => {
    const newCfg = LEVEL_CONFIGS[Math.max(0, Math.min(lvl - 1, LEVEL_CONFIGS.length - 1))];
    setLevel(Math.max(1, Math.min(lvl, LEVEL_CONFIGS.length)));
    setRound(1);
    setCorrect(0);
    setAttempts(0);
    setFeedback(null);
    setResult(null);
    setCircles(generateRound(newCfg));
  };

  if (result) {
    return (
      <GameResultScreen
        result={result}
        customEmoji={<Eye className="w-10 h-10 text-forest-600" />}
        currentLevel={level}
        maxLevel={LEVEL_CONFIGS.length}
        onNextLevel={() => resetGame(level + 1)}
        onPlayAgain={() => resetGame(level)}
        onBack={onBack}
      />
    );
  }

  const cols =
    cfg.gridSize <= 4  ? 'grid-cols-2' :
    cfg.gridSize <= 6  ? 'grid-cols-3' :
    cfg.gridSize <= 9  ? 'grid-cols-3' :
    cfg.gridSize <= 12 ? 'grid-cols-4' : 'grid-cols-4';

  const circleSize =
    cfg.gridSize <= 6  ? 'w-20 h-20 sm:w-24 sm:h-24' :
    cfg.gridSize <= 9  ? 'w-16 h-16 sm:w-20 sm:h-20' :
    cfg.gridSize <= 12 ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-12 h-12 sm:w-14 sm:h-14';

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <GameHeader
        title="Attention Game"
        subtitle="Tap the circle that looks different!"
        level={level}
        maxLevel={LEVEL_CONFIGS.length}
        onBack={onBack}
        onReset={() => resetGame(level)}
        accentColor="text-river-700"
      />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 gap-6">
        <div className="text-center">
          <p className="text-sm text-[#1A202C]/60 font-[Plus_Jakarta_Sans]">
            Round {round} of {cfg.roundsToWin} • {correct} correct
          </p>
          {feedback === 'correct' && <p className="text-forest-600 font-bold text-sm mt-1 animate-fade-in">✓ Well spotted!</p>}
          {feedback === 'wrong' && <p className="text-terracotta-600 font-bold text-sm mt-1 animate-fade-in">Keep looking — one circle is different!</p>}
        </div>

        <div className={`grid ${cols} gap-3 sm:gap-4`}>
          {circles.map((circle) => (
            <button
              key={circle.id}
              onClick={() => handleTap(circle)}
              className={`${circleSize} rounded-full transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer shadow-md border-2 border-white/30`}
              style={{ backgroundColor: circle.hsl }}
              aria-label="Circle"
            />
          ))}
        </div>
      </main>
    </div>
  );
};
