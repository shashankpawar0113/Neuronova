import React, { useState, useEffect, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { GameHeader } from '../components/GameHeader';
import { GameResultScreen } from '../components/GameResultScreen';
import { GameResult } from '../types';
import { persistGameResult } from '../services/gamePersistence';

// Color pairs per level: [baseHue, oddHue] in HSL
const LEVEL_CONFIGS = [
  { label: 'Gentle — clear difference', gridSize: 4, roundsToWin: 5 },
  { label: 'Steady — moderate contrast', gridSize: 6, roundsToWin: 7 },
  { label: 'Sharp — subtle difference', gridSize: 9, roundsToWin: 10 },
];

type Circle = { id: number; hsl: string; isOdd: boolean };

function generateRound(gridSize: number, level: number): Circle[] {
  const baseH = Math.floor(Math.random() * 360);
  const baseS = 65 + Math.floor(Math.random() * 20);
  const baseL = 52 + Math.floor(Math.random() * 10);
  // Odd one differs more at low levels, subtly at higher
  const hueDelta = level === 1 ? 60 + Math.random() * 60 : level === 2 ? 25 + Math.random() * 25 : 12 + Math.random() * 12;
  const oddH = (baseH + hueDelta) % 360;
  const oddIdx = Math.floor(Math.random() * gridSize);

  return Array.from({ length: gridSize }, (_, i) => ({
    id: i,
    hsl: i === oddIdx
      ? `hsl(${oddH}, ${baseS}%, ${baseL}%)`
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
    setCircles(generateRound(cfg.gridSize, level));
  }, [cfg.gridSize, level]);

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
    setLevel(lvl);
    setRound(1);
    setCorrect(0);
    setAttempts(0);
    setFeedback(null);
    setResult(null);
    setCircles(generateRound(LEVEL_CONFIGS[lvl - 1].gridSize, lvl));
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

  const cols = cfg.gridSize === 4 ? 'grid-cols-2' : cfg.gridSize === 6 ? 'grid-cols-3' : 'grid-cols-3';

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

        <div className={`grid ${cols} gap-4 sm:gap-6`}>
          {circles.map((circle) => (
            <button
              key={circle.id}
              onClick={() => handleTap(circle)}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer shadow-md border-2 border-white/30"
              style={{ backgroundColor: circle.hsl }}
              aria-label="Circle"
            />
          ))}
        </div>
      </main>
    </div>
  );
};
