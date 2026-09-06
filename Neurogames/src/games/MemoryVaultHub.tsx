import React, { useState, useMemo } from 'react';
import {
  Heart, HeartHandshake, Camera, Sparkles, X,
  ChevronRight, RefreshCw, Home, Flower2,
} from 'lucide-react';
import { ReminiscenceEvent } from '../types';

// Mock tagged photos — seeded with name + relationship
// In a real implementation these would come from the caregiver upload flow
const MOCK_VAULT_PHOTOS = [
  {
    id: 'p1',
    personName: 'Rohan',
    relationship: 'Grandson',
    emoji: '👦',
    caption: 'Rohan at his school play — such a bright star!',
    bgColor: '#D4E8C2',
    accentColor: '#1E6B1E',
    textColor: '#082808',
  },
  {
    id: 'p2',
    personName: 'Priya',
    relationship: 'Daughter',
    emoji: '👩',
    caption: 'Priya on her birthday — full of joy and love!',
    bgColor: '#C2D4E8',
    accentColor: '#1B5E8A',
    textColor: '#0D3150',
  },
  {
    id: 'p3',
    personName: 'Vikram',
    relationship: 'Son',
    emoji: '👨',
    caption: 'Vikram during the family reunion last Diwali.',
    bgColor: '#E8D4C2',
    accentColor: '#6B5010',
    textColor: '#2D200A',
  },
  {
    id: 'p4',
    personName: 'Meera',
    relationship: 'Granddaughter',
    emoji: '👧',
    caption: 'Little Meera learning to make roti — so precious!',
    bgColor: '#E8C2D4',
    accentColor: '#7B3FAE',
    textColor: '#3B1565',
  },
  {
    id: 'p5',
    personName: 'Arjun',
    relationship: 'Husband',
    emoji: '👴',
    caption: 'Arjun at the garden — 47 beautiful years together.',
    bgColor: '#D4ECD4',
    accentColor: '#165416',
    textColor: '#082808',
  },
  {
    id: 'p6',
    personName: 'Kavya',
    relationship: 'Daughter-in-law',
    emoji: '👩‍🦱',
    caption: 'Kavya during Diwali puja — always so warm and caring.',
    bgColor: '#ECD4D4',
    accentColor: '#A0432A',
    textColor: '#3D150D',
  },
];

type Photo = typeof MOCK_VAULT_PHOTOS[number];
type QuizState = 'idle' | 'quiz' | 'answered';
type AnswerResult = 'correct' | 'warm_miss' | null;

function getDistractors(correctPhoto: Photo, all: Photo[]): string[] {
  const others = all.filter((p) => p.id !== correctPhoto.id);
  const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 2);
  const options = [correctPhoto.personName, ...shuffled.map((p) => p.personName)];
  return options.sort(() => Math.random() - 0.5);
}

interface MemoryVaultHubProps {
  onBack: () => void;
}

export const MemoryVaultHub: React.FC<MemoryVaultHubProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'gallery' | 'invite' | 'quiz'>('gallery');
  const [quizPhotoIdx, setQuizPhotoIdx] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>('idle');
  const [answerResult, setAnswerResult] = useState<AnswerResult>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [engagementLog, setEngagementLog] = useState<ReminiscenceEvent[]>([]);
  const [completedQuiz, setCompletedQuiz] = useState(false);

  const shuffledPhotos = useMemo(() => [...MOCK_VAULT_PHOTOS].sort(() => Math.random() - 0.5), []);
  const currentPhoto = shuffledPhotos[quizPhotoIdx];
  const options = useMemo(
    () => (currentPhoto ? getDistractors(currentPhoto, MOCK_VAULT_PHOTOS) : []),
    [currentPhoto]
  );

  const logEvent = (photo: Photo, responded: boolean) => {
    const event: ReminiscenceEvent = {
      photoId: photo.id,
      personName: photo.personName,
      relationship: photo.relationship,
      interacted: true,
      responded,
      timestamp: new Date().toISOString(),
    };
    setEngagementLog((prev) => [...prev, event]);
    // In a real app this would be persisted to localStorage or sent to backend
  };

  const handleAnswer = (answer: string) => {
    if (quizState === 'answered') return;
    setSelectedAnswer(answer);
    setQuizState('answered');
    logEvent(currentPhoto, true);
    setAnswerResult(answer === currentPhoto.personName ? 'correct' : 'warm_miss');
  };

  const nextQuizPhoto = () => {
    if (quizPhotoIdx + 1 >= shuffledPhotos.length) {
      setCompletedQuiz(true);
      setMode('gallery');
      return;
    }
    setQuizPhotoIdx((i) => i + 1);
    setQuizState('idle');
    setAnswerResult(null);
    setSelectedAnswer(null);
  };

  const startQuiz = () => {
    setQuizPhotoIdx(0);
    setQuizState('idle');
    setAnswerResult(null);
    setSelectedAnswer(null);
    setCompletedQuiz(false);
    setMode('quiz');
  };

  // ──────────── GALLERY mode ────────────
  if (mode === 'gallery') {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-cream-50/90 backdrop-blur-sm border-b border-cream-300 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-cream-300 text-forest-800 hover:bg-forest-50 transition-all text-sm font-bold shadow-sm">
              ← Games
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold font-[Outfit] text-muga-700 leading-tight">Family Memory Vault</h1>
              <p className="text-xs text-[#1A202C]/60">Your cherished faces & moments</p>
            </div>
          </div>
          <button onClick={() => { window.location.href = 'http://localhost:5175'; }}
            className="w-9 h-9 rounded-xl bg-white border border-cream-300 text-[#1A202C]/60 hover:bg-cream-200 flex items-center justify-center transition-colors" title="← Back to Main Home Screen">
            <Home className="w-4 h-4" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full">
          {/* "Remember Together" invite banner */}
          {!completedQuiz ? (
            <div className="mb-6 p-5 rounded-3xl bg-muga-50 border-2 border-muga-200 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-muga-100 border border-muga-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-7 h-7 text-muga-600" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-extrabold text-muga-900 font-[Outfit]">Would you like to remember together? 💚</h3>
                <p className="text-sm text-muga-700 mt-1">A gentle, warm activity to bring back lovely memories of your family.</p>
              </div>
              <button onClick={startQuiz}
                className="shrink-0 px-5 py-3 rounded-2xl bg-muga-500 hover:bg-muga-600 text-white font-extrabold text-sm transition-colors flex items-center gap-2 shadow-md">
                Let's Remember <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="mb-6 p-5 rounded-3xl bg-forest-50 border-2 border-forest-200 flex items-center gap-4">
              <Heart className="w-8 h-8 text-forest-600 fill-forest-200" />
              <div>
                <p className="text-base font-bold text-forest-800">What a lovely time remembering together! 🌸</p>
                <p className="text-sm text-forest-700/80">You engaged with {engagementLog.length} memories today.</p>
              </div>
              <button onClick={startQuiz} className="ml-auto px-3 py-2 rounded-xl bg-white border border-forest-300 text-forest-700 text-xs font-bold hover:bg-forest-50 transition-colors flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Again
              </button>
            </div>
          )}

          {/* Photo grid */}
          <h2 className="text-base font-extrabold text-[#1A202C] mb-3 font-[Outfit]">Your Family</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {MOCK_VAULT_PHOTOS.map((photo) => (
              <div key={photo.id} className="flex flex-col rounded-2xl border-2 border-cream-300 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all group">
                {/* Photo placeholder */}
                <div
                  className="aspect-square flex flex-col items-center justify-center gap-2"
                  style={{ backgroundColor: photo.bgColor }}
                >
                  <span className="text-5xl">{photo.emoji}</span>
                  <Camera className="w-4 h-4 opacity-30" style={{ color: photo.accentColor }} />
                </div>
                {/* Name tag */}
                <div className="p-3">
                  <p className="font-extrabold text-sm text-[#1A202C]">{photo.personName}</p>
                  <p className="text-xs text-[#1A202C]/60">{photo.relationship}</p>
                  <p className="text-xs text-[#1A202C]/50 mt-1 leading-relaxed line-clamp-2">{photo.caption}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="mt-6 text-xs text-center text-[#1A202C]/40 font-[Plus_Jakarta_Sans]">
            Photos are stored privately and only shared with your family's consent.
          </p>
        </main>
      </div>
    );
  }

  // ──────────── QUIZ mode ────────────
  if (mode === 'quiz' && currentPhoto) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-cream-50/90 backdrop-blur-sm border-b border-cream-300 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('gallery')} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-cream-300 text-forest-800 hover:bg-forest-50 transition-all text-sm font-bold shadow-sm">
              <X className="w-4 h-4" /> Stop
            </button>
            <h1 className="text-xl font-extrabold font-[Outfit] text-muga-700">Remembering Together</h1>
          </div>
          <span className="text-xs font-bold text-[#1A202C]/50 bg-cream-100 px-2.5 py-1 rounded-full border border-cream-300">
            {quizPhotoIdx + 1} / {shuffledPhotos.length}
          </span>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 gap-5 max-w-md mx-auto w-full">
          {/* Photo card */}
          <div
            className="w-full aspect-square max-w-xs rounded-3xl flex flex-col items-center justify-center gap-3 border-2 border-white/50 shadow-lg relative overflow-hidden"
            style={{ backgroundColor: currentPhoto.bgColor }}
          >
            <span className="text-8xl drop-shadow-lg">{currentPhoto.emoji}</span>
            {quizState !== 'idle' && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className={`px-4 py-2.5 rounded-2xl text-center animate-fade-in ${
                  answerResult === 'correct'
                    ? 'bg-forest-600 text-white'
                    : 'bg-white/90 text-[#1A202C]'
                }`}>
                  {answerResult === 'correct' ? (
                    <p className="font-bold text-sm">✓ Yes! This is <strong>{currentPhoto.personName}</strong>, your {currentPhoto.relationship}! 💚</p>
                  ) : (
                    <p className="font-semibold text-sm">That's okay — this is <strong>{currentPhoto.personName}</strong>, your loving {currentPhoto.relationship}. What a special memory. 🌸</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Caption */}
          <p className="text-sm text-[#1A202C]/60 text-center italic font-[Plus_Jakarta_Sans]">{currentPhoto.caption}</p>

          {/* Question */}
          {quizState === 'idle' && (
            <div className="w-full text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muga-50 border border-muga-200 mb-4">
                <HeartHandshake className="w-4 h-4 text-muga-500" />
                <span className="text-sm font-bold text-muga-700">Who is this?</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {options.map((opt) => (
                  <button key={opt} onClick={() => handleAnswer(opt)}
                    className="w-full py-4 rounded-2xl bg-white border-2 border-muga-200 hover:bg-muga-50 hover:border-muga-400 text-[#1A202C] font-bold text-lg transition-all cursor-pointer font-[Outfit] shadow-sm">
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* After answer */}
          {quizState === 'answered' && (
            <div className="w-full flex flex-col gap-3">
              {/* Show selected answer feedback on buttons */}
              <div className="grid grid-cols-1 gap-3">
                {options.map((opt) => {
                  const isCorrect = opt === currentPhoto.personName;
                  const isSelected = opt === selectedAnswer;
                  let cls = 'bg-white border-cream-200 text-[#1A202C]/40 cursor-default';
                  if (isCorrect) cls = 'bg-forest-100 border-forest-400 text-forest-900 font-extrabold';
                  else if (isSelected) cls = 'bg-cream-100 border-cream-300 text-[#1A202C]/60';
                  return (
                    <button key={opt} disabled className={`w-full py-4 rounded-2xl border-2 text-lg font-bold font-[Outfit] transition-all ${cls}`}>
                      {isCorrect && '✓ '}{opt}
                    </button>
                  );
                })}
              </div>

              <button onClick={nextQuizPhoto}
                className="w-full py-4 rounded-2xl bg-muga-500 hover:bg-muga-600 text-white font-extrabold text-lg font-[Outfit] flex items-center justify-center gap-2 transition-colors shadow-md mt-1">
                {quizPhotoIdx + 1 >= shuffledPhotos.length ? (
                  <><Heart className="w-5 h-5 fill-white" /> That's all for today!</>
                ) : (
                  <>Next Memory <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          )}

          {/* Warm footer note */}
          <p className="text-xs text-center text-[#1A202C]/40 font-[Plus_Jakarta_Sans] flex items-center gap-1.5">
            <Flower2 className="w-3 h-3 text-muga-300" />
            This is just for fun — there are no right or wrong answers that matter.
          </p>
        </main>
      </div>
    );
  }

  return null;
};
