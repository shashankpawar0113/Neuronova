import React, { useState, useCallback, useEffect } from 'react';
import {
  Sun, Moon, Heart, Star, Leaf, Bird, Flower2, Cloud,
  Music2, Umbrella, Fish, Sparkles, Mountain, TreePine, Waves, Coffee,
} from 'lucide-react';
import { GameHeader } from '../components/GameHeader';
import { GameResultScreen } from '../components/GameResultScreen';
import { GameResult } from '../types';
import { persistGameResult } from '../services/gamePersistence';

// ---------- Card data ----------
const ALL_ICONS = [
  { id: 'sun', Icon: Sun, label: 'Sun', color: 'text-gold-600' },
  { id: 'moon', Icon: Moon, label: 'Moon', color: 'text-river-500' },
  { id: 'heart', Icon: Heart, label: 'Heart', color: 'text-terracotta-500' },
  { id: 'star', Icon: Star, label: 'Star', color: 'text-gold-500' },
  { id: 'leaf', Icon: Leaf, label: 'Leaf', color: 'text-forest-600' },
  { id: 'bird', Icon: Bird, label: 'Bird', color: 'text-river-600' },
  { id: 'flower', Icon: Flower2, label: 'Flower', color: 'text-muga-500' },
  { id: 'cloud', Icon: Cloud, label: 'Cloud', color: 'text-river-400' },
  { id: 'music', Icon: Music2, label: 'Music', color: 'text-purple-600' },
  { id: 'umbrella', Icon: Umbrella, label: 'Umbrella', color: 'text-terracotta-600' },
  { id: 'fish', Icon: Fish, label: 'Fish', color: 'text-river-700' },
  { id: 'sparkles', Icon: Sparkles, label: 'Sparkle', color: 'text-gold-500' },
  { id: 'mountain', Icon: Mountain, label: 'Mountain', color: 'text-forest-700' },
  { id: 'tree', Icon: TreePine, label: 'Tree', color: 'text-forest-500' },
  { id: 'waves', Icon: Waves, label: 'Waves', color: 'text-river-500' },
  { id: 'coffee', Icon: Coffee, label: 'Coffee', color: 'text-muga-700' },
];

const LEVEL_CONFIG = [
  { pairs: 3, label: '3 pairs — gentle start' },
  { pairs: 4, label: '4 pairs — a little more' },
  { pairs: 5, label: '5 pairs — keeping sharp' },
  { pairs: 6, label: '6 pairs — wonderful challenge' },
];

interface Card {
  uid: string;   // unique per card (two cards share same id, different uid)
  id: string;
  Icon: React.FC<{ className?: string }>;
  label: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function buildDeck(pairs: number): Card[] {
  const pool = [...ALL_ICONS].sort(() => Math.random() - 0.5).slice(0, pairs);
  const doubled = [...pool, ...pool].sort(() => Math.random() - 0.5);
  return doubled.map((item, i) => ({
    uid: `${item.id}-${i}`,
    id: item.id,
    Icon: item.Icon,
    label: item.label,
    color: item.color,
    isFlipped: false,
    isMatched: false,
  }));
}

interface MemoryMatchGameProps {
  onBack: () => void;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ onBack }) => {
  const [level, setLevel] = useState(1);
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(LEVEL_CONFIG[0].pairs));
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [result, setResult] = useState<GameResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const pairs = LEVEL_CONFIG[level - 1].pairs;

  const flipCard = useCallback(
    (uid: string) => {
      if (isChecking) return;
      const card = deck.find((c) => c.uid === uid);
      if (!card || card.isFlipped || card.isMatched) return;
      if (flippedUids.length === 2) return;

      const newFlipped = [...flippedUids, uid];
      setDeck((prev) => prev.map((c) => (c.uid === uid ? { ...c, isFlipped: true } : c)));
      setFlippedUids(newFlipped);

      if (newFlipped.length === 2) {
        setIsChecking(true);
        setAttempts((a) => a + 1);
        const [uid1, uid2] = newFlipped;
        const c1 = deck.find((c) => c.uid === uid1)!;
        const c2 = deck.find((c) => c.uid === uid2)!;

        setTimeout(() => {
          if (c1.id === c2.id) {
            setDeck((prev) =>
              prev.map((c) =>
                c.uid === uid1 || c.uid === uid2 ? { ...c, isMatched: true } : c
              )
            );
            setMatchedCount((m) => m + 1);
          } else {
            setDeck((prev) =>
              prev.map((c) =>
                c.uid === uid1 || c.uid === uid2 ? { ...c, isFlipped: false } : c
              )
            );
          }
          setFlippedUids([]);
          setIsChecking(false);
        }, 900);
      }
    },
    [deck, flippedUids, isChecking]
  );

  // Check win
  useEffect(() => {
    if (matchedCount > 0 && matchedCount === pairs) {
      const elapsed = Date.now() - startTime;
      const acc = Math.max(50, Math.round(100 - (attempts - pairs) * 5));
      const res: GameResult = {
        gameType: 'memoryMatch',
        level,
        accuracy: acc,
        responseTimeMs: elapsed,
        attempts,
        timestamp: new Date().toISOString(),
      };
      setResult(res);
      persistGameResult(res);
    }
  }, [matchedCount, pairs]);

  const resetGame = (lvl = level) => {
    setDeck(buildDeck(LEVEL_CONFIG[lvl - 1].pairs));
    setFlippedUids([]);
    setAttempts(0);
    setMatchedCount(0);
    setResult(null);
    setIsChecking(false);
  };

  if (result) {
    return (
      <GameResultScreen
        result={result}
        onPlayAgain={() => resetGame(level)}
        onBack={onBack}
      />
    );
  }

  const cols = pairs <= 3 ? 'grid-cols-3' : pairs <= 4 ? 'grid-cols-4' : pairs <= 5 ? 'grid-cols-5' : 'grid-cols-4';

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <GameHeader
        title="Memory Match"
        subtitle="Find matching pairs — take your time!"
        level={level}
        onBack={onBack}
        accentColor="text-forest-700"
      />

      {/* Level selector */}
      <div className="flex gap-2 px-4 sm:px-6 pt-4 overflow-x-auto pb-1">
        {LEVEL_CONFIG.map((_cfg, i) => (
          <button
            key={i}
            onClick={() => { setLevel(i + 1); resetGame(i + 1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
              level === i + 1
                ? 'bg-forest-600 text-white border-forest-600 shadow-md'
                : 'bg-white border-cream-300 text-[#1A202C]/70 hover:border-forest-300'
            }`}
          >
            Level {i + 1}
          </button>
        ))}
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <p className="text-sm text-[#1A202C]/60 mb-6 font-[Plus_Jakarta_Sans]">
          {pairs - matchedCount} pairs left • {attempts} flips so far
        </p>

        <div className={`grid ${cols} gap-3 sm:gap-4 max-w-lg w-full`}>
          {deck.map((card) => {
            const { Icon } = card;
            return (
              <button
                key={card.uid}
                onClick={() => flipCard(card.uid)}
                className={`aspect-square rounded-2xl border-2 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm ${
                  card.isMatched
                    ? 'bg-forest-100 border-forest-400 scale-95 opacity-60 cursor-default'
                    : card.isFlipped
                    ? 'bg-white border-forest-400 shadow-md scale-105'
                    : 'bg-forest-600 border-forest-700 hover:bg-forest-500 hover:scale-105'
                }`}
                aria-label={card.isFlipped || card.isMatched ? card.label : 'Hidden card'}
                disabled={card.isMatched}
              >
                {(card.isFlipped || card.isMatched) ? (
                  <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${card.color} animate-fade-in`} />
                ) : (
                  <Star className="w-5 h-5 text-forest-300 opacity-50" />
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};
