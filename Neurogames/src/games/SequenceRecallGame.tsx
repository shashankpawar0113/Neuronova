import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Music2 } from 'lucide-react';
import { GameHeader } from '../components/GameHeader';
import { GameResultScreen } from '../components/GameResultScreen';
import { GameResult } from '../types';
import { persistGameResult } from '../services/gamePersistence';

// 4 light-up pads, each with a unique color + Tailwind classes
const PADS = [
  { id: 0, active: 'bg-terracotta-500 shadow-[0_0_24px_rgba(160,67,42,0.6)]', idle: 'bg-terracotta-200 hover:bg-terracotta-300', label: 'Red' },
  { id: 1, active: 'bg-river-500 shadow-[0_0_24px_rgba(46,134,193,0.6)]', idle: 'bg-river-200 hover:bg-river-300', label: 'Blue' },
  { id: 2, active: 'bg-forest-500 shadow-[0_0_24px_rgba(30,107,30,0.6)]', idle: 'bg-forest-200 hover:bg-forest-300', label: 'Green' },
  { id: 3, active: 'bg-gold-500 shadow-[0_0_24px_rgba(212,160,23,0.6)]', idle: 'bg-gold-100 hover:bg-gold-200', label: 'Yellow' },
];

const LEVEL_CONFIGS = [
  { seqLen: 3, label: '3 steps — gentle' },
  { seqLen: 4, label: '4 steps — steady' },
  { seqLen: 5, label: '5 steps — sharp mind' },
  { seqLen: 6, label: '6 steps — champion!' },
];

type Phase = 'watch' | 'repeat' | 'result';

interface SequenceRecallGameProps { onBack: () => void; }

export const SequenceRecallGame: React.FC<SequenceRecallGameProps> = ({ onBack }) => {
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('watch');
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [result, setResult] = useState<GameResult | null>(null);
  const [isShowingSeq, setIsShowingSeq] = useState(false);
  const cancelRef = useRef(false);

  const seqLen = LEVEL_CONFIGS[level - 1].seqLen;

  const buildSequence = useCallback(() => {
    return Array.from({ length: seqLen }, () => Math.floor(Math.random() * 4));
  }, [seqLen]);

  const playSequence = useCallback(async (seq: number[]) => {
    setPhase('watch');
    setIsShowingSeq(true);
    cancelRef.current = false;
    await new Promise((r) => setTimeout(r, 800));
    for (const pad of seq) {
      if (cancelRef.current) return;
      setActivePad(pad);
      await new Promise((r) => setTimeout(r, 700));
      setActivePad(null);
      await new Promise((r) => setTimeout(r, 350));
    }
    setIsShowingSeq(false);
    setPhase('repeat');
  }, []);

  const startRound = useCallback(() => {
    const seq = buildSequence();
    setSequence(seq);
    setPlayerSeq([]);
    setFeedback(null);
    setAttempts((a) => a + 1);
    playSequence(seq);
  }, [buildSequence, playSequence]);

  useEffect(() => {
    startRound();
    return () => { cancelRef.current = true; };
  }, [level]);

  const handlePadTap = (padId: number) => {
    if (phase !== 'repeat') return;
    const newSeq = [...playerSeq, padId];
    setPlayerSeq(newSeq);
    setActivePad(padId);
    setTimeout(() => setActivePad(null), 200);

    // Check step by step
    const correctSoFar = newSeq.every((p, i) => p === sequence[i]);
    if (!correctSoFar) {
      setFeedback('Not quite — watch again, you can do it! 🌿');
      setPhase('watch');
      setTimeout(() => playSequence(sequence), 1200);
      return;
    }
    if (newSeq.length === sequence.length) {
      // Correct!
      const elapsed = Date.now() - startTime;
      const acc = Math.max(60, Math.round(100 - (attempts - 1) * 15));
      const res: GameResult = {
        gameType: 'sequenceRecall',
        level,
        accuracy: acc,
        responseTimeMs: elapsed,
        attempts,
        timestamp: new Date().toISOString(),
      };
      setResult(res);
      persistGameResult(res);
    }
  };

  const resetGame = (lvl = level) => {
    cancelRef.current = true;
    setLevel(lvl);
    setPlayerSeq([]);
    setAttempts(0);
    setResult(null);
    setFeedback(null);
    setTimeout(() => {
      cancelRef.current = false;
      const seq = Array.from({ length: LEVEL_CONFIGS[lvl - 1].seqLen }, () => Math.floor(Math.random() * 4));
      setSequence(seq);
      playSequence(seq);
    }, 200);
  };

  if (result) {
    return <GameResultScreen result={result} customEmoji={<Music2 className="w-10 h-10 text-forest-600" />} onPlayAgain={() => resetGame(level)} onBack={onBack} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <GameHeader title="Sequence Recall" subtitle={phase === 'watch' ? 'Watch the pattern...' : 'Now tap the same pattern!'} level={level} onBack={onBack} accentColor="text-purple-600" />

      <div className="flex gap-2 px-4 sm:px-6 pt-4 overflow-x-auto pb-1">
        {LEVEL_CONFIGS.map((_c, i) => (
          <button key={i} onClick={() => resetGame(i + 1)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${level === i + 1 ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white border-cream-300 text-[#1A202C]/70 hover:border-purple-300'}`}>
            Level {i + 1}
          </button>
        ))}
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* Phase indicator */}
        <div className="text-center">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${phase === 'watch' ? 'bg-gold-100 text-gold-700 border border-gold-300' : 'bg-forest-100 text-forest-700 border border-forest-300'}`}>
            {phase === 'watch' ? (isShowingSeq ? '👀 Watch carefully...' : '⏳ Getting ready...') : `🎯 Your turn! (${playerSeq.length}/${sequence.length})`}
          </span>
          {feedback && <p className="text-sm text-terracotta-600 font-semibold mt-2 animate-fade-in">{feedback}</p>}
        </div>

        {/* 2×2 pads */}
        <div className="grid grid-cols-2 gap-5 sm:gap-6">
          {PADS.map((pad) => (
            <button
              key={pad.id}
              onClick={() => handlePadTap(pad.id)}
              disabled={phase !== 'repeat'}
              className={`w-36 h-36 sm:w-44 sm:h-44 rounded-3xl border-2 border-white/30 transition-all duration-150 cursor-pointer ${
                activePad === pad.id ? pad.active + ' scale-105' : pad.idle
              } ${phase !== 'repeat' ? 'cursor-default' : 'hover:scale-105 active:scale-95'}`}
              aria-label={pad.label}
            />
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {sequence.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < playerSeq.length ? 'bg-forest-500' : 'bg-cream-300'}`} />
          ))}
        </div>
      </main>
    </div>
  );
};
