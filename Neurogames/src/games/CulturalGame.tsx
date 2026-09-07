import React, { useState, useMemo } from 'react';
import { Landmark, Sun, Music2, Flower2, Mountain, Leaf, Star, Globe } from 'lucide-react';
import { GameHeader } from '../components/GameHeader';
import { GameResultScreen } from '../components/GameResultScreen';
import { GameResult } from '../types';
import { persistGameResult } from '../services/gamePersistence';

// Cultural Q&A bank with beautiful reference photographs designed specifically for seniors
const QUESTIONS = [
  {
    id: 'q1',
    Icon: Landmark,
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80',
    prompt: 'Which famous white marble monument of love is shown in the picture?',
    answer: 'Taj Mahal',
    options: ['Taj Mahal', 'Red Fort', 'Qutub Minar', 'India Gate'],
    fact: 'The Taj Mahal in Agra was built by Emperor Shah Jahan in memory of Mumtaz Mahal. 🕌',
  },
  {
    id: 'q2',
    Icon: Flower2,
    image: 'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?w=800&auto=format&fit=crop&q=80',
    prompt: 'Which joyful festival of colors and spring is shown in the picture?',
    answer: 'Holi',
    options: ['Holi', 'Diwali', 'Navratri', 'Eid'],
    fact: 'Holi celebrates spring with vibrant gulal colors, festive music, and traditional sweets! 🌈',
  },
  {
    id: 'q3',
    Icon: Sun,
    image: 'https://images.unsplash.com/photo-1605629921711-2f6b00c6bbf4?w=800&auto=format&fit=crop&q=80',
    prompt: 'Which festival of lights is celebrated by lighting these earthen diyas?',
    answer: 'Diwali',
    options: ['Diwali', 'Baisakhi', 'Onam', 'Pongal'],
    fact: 'Diwali symbolizes the spiritual victory of light over darkness and hope over despair. 🪔',
  },
  {
    id: 'q4',
    Icon: Music2,
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80',
    prompt: 'Which classical Indian string instrument is shown here?',
    answer: 'Sitar',
    options: ['Sitar', 'Tabla', 'Veena', 'Flute'],
    fact: 'The sitar is central to Indian classical music, made world-famous by Pandit Ravi Shankar. 🎶',
  },
  {
    id: 'q5',
    Icon: Mountain,
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    prompt: 'What is the name of the highest mountain peak on Earth shown here?',
    answer: 'Mount Everest',
    options: ['Mount Everest', 'K2', 'Kangchenjunga', 'Annapurna'],
    fact: 'Mount Everest in the Himalayas stands proudly at 8,848 meters above sea level. 🏔️',
  },
  {
    id: 'q6',
    Icon: Leaf,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
    prompt: 'Which beloved hot morning beverage, famous across Assam and Darjeeling, is shown here?',
    answer: 'Chai (Tea)',
    options: ['Chai (Tea)', 'Coffee', 'Lassi', 'Coconut Water'],
    fact: 'Aromatic masala chai with cardamom and ginger is enjoyed in millions of Indian homes every day. 🍵',
  },
  {
    id: 'q7',
    Icon: Star,
    image: 'https://images.unsplash.com/photo-1536514498073-50e69d39c6cf?w=800&auto=format&fit=crop&q=80',
    prompt: 'Which magnificent bird with colorful feathers is the National Bird of India?',
    answer: 'Peacock (Mor)',
    options: ['Peacock (Mor)', 'Parrot (Tota)', 'Kingfisher', 'Swan (Hans)'],
    fact: 'The Indian Peacock was declared the National Bird of India in 1963 for its beauty and cultural grace. 🦚',
  },
  {
    id: 'q8',
    Icon: Globe,
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop&q=80',
    prompt: 'Which ancient strategy board game originated in India as "Chaturanga"?',
    answer: 'Chess',
    options: ['Chess', 'Ludo', 'Carrom', 'Snakes & Ladders'],
    fact: 'Chess was invented in ancient India over 1,500 years ago before spreading around the world! ♟️',
  },
  {
    id: 'q9',
    Icon: Flower2,
    image: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=800&auto=format&fit=crop&q=80',
    prompt: 'Which sacred river flows through the holy city of Varanasi shown here?',
    answer: 'Ganga',
    options: ['Ganga', 'Yamuna', 'Godavari', 'Narmada'],
    fact: 'The holy river Ganga is affectionately revered as mother Ganga and sustains millions of lives. 🌊',
  },
  {
    id: 'q10',
    Icon: Landmark,
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80',
    prompt: 'What type of magnificent ancient Indian temple tower is shown in this picture?',
    answer: 'Temple Gopuram',
    options: ['Temple Gopuram', 'Fort Gate', 'Royal Palace', 'Stepwell'],
    fact: 'South Indian Gopuram towers are famous worldwide for hundreds of intricate classical stone sculptures. 🛕',
  },
];

const LEVEL_CONFIGS = [
  { questions: 3, label: 'Level 1: 3 questions' },
  { questions: 5, label: 'Level 2: 5 questions' },
  { questions: 7, label: 'Level 3: 7 questions' },
  { questions: 10, label: 'Level 4: All 10 questions' },
];

interface CulturalGameProps {
  onBack: () => void;
}

export const CulturalGame: React.FC<CulturalGameProps> = ({ onBack }) => {
  const [level, setLevel] = useState(1);
  const [qIdx, setQIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [result, setResult] = useState<GameResult | null>(null);

  const totalQs = (LEVEL_CONFIGS[level - 1] || LEVEL_CONFIGS[0]).questions;

  const shuffledQuestions = useMemo(() => {
    return [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, totalQs);
  }, [level, totalQs]);

  const currentQ = shuffledQuestions[qIdx] || QUESTIONS[0];

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
    const targetLvl = Math.min(Math.max(1, lvl), LEVEL_CONFIGS.length);
    setLevel(targetLvl);
    setQIdx(0);
    setCorrect(0);
    setAttempts(0);
    setSelectedAnswer(null);
    setResult(null);
  };

  if (result) {
    return (
      <GameResultScreen
        result={result}
        customEmoji={<Landmark className="w-10 h-10 text-forest-600" />}
        currentLevel={level}
        maxLevel={LEVEL_CONFIGS.length}
        onNextLevel={() => resetGame(level + 1)}
        onPlayAgain={() => resetGame(level)}
        onBack={onBack}
      />
    );
  }

  const { Icon, image, prompt, options, answer, fact } = currentQ;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <GameHeader
        title="Cultural Heritage"
        subtitle="Celebrate our beautiful traditions!"
        level={level}
        maxLevel={LEVEL_CONFIGS.length}
        onBack={onBack}
        onReset={() => resetGame(level)}
        accentColor="text-muga-600"
      />

      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 gap-5 max-w-xl mx-auto w-full">
        {/* Progress bar */}
        <div className="flex gap-2 w-full px-1">
          {shuffledQuestions.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                i < qIdx ? 'bg-forest-500' : i === qIdx ? 'bg-muga-400 scale-y-125' : 'bg-cream-300'
              }`}
            />
          ))}
        </div>

        {/* Question card with reference photograph */}
        <div className="w-full bg-white rounded-3xl border-2 border-cream-300 overflow-hidden shadow-sm flex flex-col animate-fade-in">
          {/* Reference Image */}
          <div className="relative w-full h-52 sm:h-64 bg-cream-100 overflow-hidden">
            <img
              src={image}
              alt={answer}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              loading="lazy"
            />
            {/* Visual guide badge */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <Icon className="w-3.5 h-3.5 text-gold-300" />
              <span>Reference Picture</span>
            </div>
          </div>

          {/* Short, high-contrast prompt */}
          <div className="p-5 sm:p-6 flex flex-col items-center gap-3 text-center">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1A202C] font-[Outfit] leading-snug">
              {prompt}
            </h2>

            {selectedAnswer && (
              <div
                className={`w-full p-3.5 rounded-2xl text-sm sm:text-base font-semibold text-center animate-fade-in ${
                  selectedAnswer === answer
                    ? 'bg-forest-100 text-forest-900 border border-forest-300'
                    : 'bg-muga-100 text-muga-900 border border-muga-300'
                }`}
              >
                {selectedAnswer === answer ? '✓ Wonderful! ' : `That's okay — `}
                {fact}
              </div>
            )}
          </div>
        </div>

        {/* Answer options */}
        <div className="grid grid-cols-2 gap-3.5 w-full">
          {options.map((opt) => {
            const isSelected = selectedAnswer === opt;
            const isCorrect = opt === answer;
            let cls = 'bg-white border-cream-300 text-[#1A202C] hover:bg-forest-50 hover:border-forest-300 shadow-xs';
            if (selectedAnswer) {
              if (isCorrect) cls = 'bg-forest-100 border-forest-500 text-forest-900 font-extrabold shadow-md scale-[1.02]';
              else if (isSelected && !isCorrect) cls = 'bg-terracotta-100 border-terracotta-400 text-terracotta-900 opacity-90';
              else cls = 'bg-white/60 border-cream-200 text-[#1A202C]/40 cursor-default';
            }
            return (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                disabled={!!selectedAnswer}
                className={`py-4 px-3 rounded-2xl border-2 font-bold text-base sm:text-lg font-[Plus_Jakarta_Sans] transition-all cursor-pointer select-none ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};
