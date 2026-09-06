import React, { useState, useMemo } from 'react';
import { Landmark, Sun, Music2, Flower2, Mountain, Leaf, Star, Globe } from 'lucide-react';
import { GameHeader } from '../components/GameHeader';
import { GameResultScreen } from '../components/GameResultScreen';
import { GameResult } from '../types';
import { persistGameResult } from '../services/gamePersistence';

// Cultural Q&A bank (India-focused, elder-friendly)
const QUESTIONS = [
  {
    id: 'q1',
    Icon: Landmark,
    iconColor: 'text-river-600',
    bg: 'bg-river-50',
    prompt: 'This beautiful white marble monument was built as a symbol of eternal love. What is it called?',
    answer: 'Taj Mahal',
    options: ['Taj Mahal', 'Red Fort', 'Qutub Minar', 'India Gate'],
    fact: 'The Taj Mahal in Agra was built by Emperor Shah Jahan for his beloved wife Mumtaz Mahal. 🕌',
  },
  {
    id: 'q2',
    Icon: Flower2,
    iconColor: 'text-terracotta-500',
    bg: 'bg-terracotta-50',
    prompt: 'During this joyful festival, people throw colorful powder and water at each other. Which festival is this?',
    answer: 'Holi',
    options: ['Holi', 'Diwali', 'Navratri', 'Eid'],
    fact: 'Holi, the Festival of Colors, celebrates the arrival of spring and the triumph of good over evil. 🌈',
  },
  {
    id: 'q3',
    Icon: Sun,
    iconColor: 'text-gold-600',
    bg: 'bg-gold-50',
    prompt: 'During this festival of lights, homes are decorated with tiny lamps called diyas. What is this festival?',
    answer: 'Diwali',
    options: ['Diwali', 'Baisakhi', 'Onam', 'Pongal'],
    fact: 'Diwali, the Festival of Lights, symbolizes the spiritual victory of light over darkness. 🪔',
  },
  {
    id: 'q4',
    Icon: Music2,
    iconColor: 'text-purple-600',
    bg: 'bg-purple-50',
    prompt: 'This graceful stringed instrument is central to Indian classical music. What is it called?',
    answer: 'Sitar',
    options: ['Sitar', 'Tabla', 'Veena', 'Sarod'],
    fact: 'The sitar is a plucked string instrument used in Hindustani classical music, famous worldwide thanks to Ravi Shankar. 🎶',
  },
  {
    id: 'q5',
    Icon: Mountain,
    iconColor: 'text-forest-700',
    bg: 'bg-forest-50',
    prompt: 'The world\'s highest mountain peak stands in the Himalayas. What is its name?',
    answer: 'Mount Everest',
    options: ['Mount Everest', 'K2', 'Kangchenjunga', 'Annapurna'],
    fact: 'Mount Everest, at 8,848 meters, is the highest point on Earth and sits on the Nepal–Tibet border. 🏔️',
  },
  {
    id: 'q6',
    Icon: Leaf,
    iconColor: 'text-forest-600',
    bg: 'bg-forest-50',
    prompt: 'India produces more of this than any other country in the world, and it is enjoyed in millions of cups every morning. What is it?',
    answer: 'Tea',
    options: ['Tea', 'Coffee', 'Spices', 'Rice'],
    fact: 'India is the second largest tea producer in the world, with Assam and Darjeeling teas known globally. 🍵',
  },
  {
    id: 'q7',
    Icon: Globe,
    iconColor: 'text-river-500',
    bg: 'bg-river-50',
    prompt: 'This ancient language, considered the mother of many Indian languages, is still used in Hindu rituals and prayers. What is it?',
    answer: 'Sanskrit',
    options: ['Sanskrit', 'Tamil', 'Pali', 'Prakrit'],
    fact: 'Sanskrit is one of the oldest known languages, and many modern Indian languages have roots in it. 🕉️',
  },
  {
    id: 'q8',
    Icon: Star,
    iconColor: 'text-gold-600',
    bg: 'bg-gold-50',
    prompt: 'This ancient Indian board game that originated over 1,500 years ago is now played worldwide. What is it called?',
    answer: 'Chess',
    options: ['Chess', 'Ludo', 'Kabaddi', 'Pachisi'],
    fact: 'Chess, called Chaturanga in ancient India, was invented here over 1,500 years ago! ♟️',
  },
];

const LEVEL_CONFIGS = [
  { questions: 3, label: '3 questions — gentle' },
  { questions: 5, label: '5 questions — good' },
  { questions: 8, label: 'All 8 — wonderful!' },
];

interface CulturalGameProps { onBack: () => void; }

export const CulturalGame: React.FC<CulturalGameProps> = ({ onBack }) => {
  const [level, setLevel] = useState(1);
  const [qIdx, setQIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [result, setResult] = useState<GameResult | null>(null);

  const totalQs = LEVEL_CONFIGS[level - 1].questions;

  const shuffledQuestions = useMemo(() => {
    return [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, totalQs);
  }, [level]);

  const currentQ = shuffledQuestions[qIdx];

  const handleAnswer = (option: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    setAttempts((a) => a + 1);
    if (option === currentQ.answer) setCorrect((c) => c + 1);

    setTimeout(() => {
      if (qIdx + 1 >= totalQs) {
        const elapsed = Date.now() - startTime;
        const isCorrect = option === currentQ.answer;
        const finalCorrect = isCorrect ? correct + 1 : correct;
        const res: GameResult = {
          gameType: 'culturalGame',
          level,
          accuracy: Math.round((finalCorrect / totalQs) * 100),
          responseTimeMs: elapsed,
          attempts: attempts + 1,
          timestamp: new Date().toISOString(),
        };
        setResult(res);
        persistGameResult(res);
      } else {
        setQIdx((q) => q + 1);
        setSelectedAnswer(null);
      }
    }, 1800);
  };

  const resetGame = (lvl = level) => {
    setLevel(lvl);
    setQIdx(0);
    setCorrect(0);
    setAttempts(0);
    setSelectedAnswer(null);
    setResult(null);
  };

  if (result) {
    return <GameResultScreen result={result} customEmoji={<Landmark className="w-10 h-10 text-forest-600" />} onPlayAgain={() => resetGame(level)} onBack={onBack} />;
  }

  const { Icon, iconColor, bg, prompt, options, answer, fact } = currentQ;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <GameHeader title="Cultural Heritage" subtitle="Celebrate our beautiful traditions!" level={level} onBack={onBack} accentColor="text-muga-600" />

      <div className="flex gap-2 px-4 sm:px-6 pt-4 overflow-x-auto pb-1">
        {LEVEL_CONFIGS.map((_c, i) => (
          <button key={i} onClick={() => resetGame(i + 1)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${level === i + 1 ? 'bg-muga-500 text-white border-muga-500 shadow-md' : 'bg-white border-cream-300 text-[#1A202C]/70'}`}>
            Level {i + 1}
          </button>
        ))}
      </div>

      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8 gap-5 max-w-xl mx-auto w-full">
        {/* Progress */}
        <div className="flex gap-1.5 w-full">
          {shuffledQuestions.map((_, i) => (
            <div key={i} className={`h-2 flex-1 rounded-full transition-all ${i < qIdx ? 'bg-forest-500' : i === qIdx ? 'bg-muga-400' : 'bg-cream-300'}`} />
          ))}
        </div>

        {/* Question card */}
        <div className={`w-full rounded-3xl ${bg} border-2 border-cream-300 p-6 flex flex-col items-center gap-4 animate-fade-in`}>
          <div className="w-20 h-20 rounded-2xl bg-white border border-cream-300 flex items-center justify-center shadow-sm">
            <Icon className={`w-10 h-10 ${iconColor}`} />
          </div>
          <p className="text-lg sm:text-xl font-bold text-[#1A202C] font-[Outfit] text-center leading-snug">
            {prompt}
          </p>
          {selectedAnswer && (
            <div className={`w-full p-3 rounded-xl text-sm font-semibold text-center animate-fade-in ${selectedAnswer === answer ? 'bg-forest-100 text-forest-800 border border-forest-300' : 'bg-muga-50 text-muga-800 border border-muga-200'}`}>
              {selectedAnswer === answer ? '✓ Wonderful! ' : `That's okay — `}{fact}
            </div>
          )}
        </div>

        {/* Answer options */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {options.map((opt) => {
            const isSelected = selectedAnswer === opt;
            const isCorrect = opt === answer;
            let cls = 'bg-white border-cream-300 text-[#1A202C] hover:bg-cream-100 hover:border-muga-300';
            if (selectedAnswer) {
              if (isCorrect) cls = 'bg-forest-100 border-forest-400 text-forest-900 font-extrabold scale-105';
              else if (isSelected && !isCorrect) cls = 'bg-terracotta-50 border-terracotta-300 text-terracotta-700 opacity-80';
              else cls = 'bg-white border-cream-200 text-[#1A202C]/40 cursor-default';
            }
            return (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!selectedAnswer}
                className={`py-4 px-3 rounded-2xl border-2 font-bold text-sm sm:text-base font-[Plus_Jakarta_Sans] transition-all cursor-pointer ${cls}`}>
                {opt}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};
