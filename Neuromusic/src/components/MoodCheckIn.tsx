import React from 'react';
import { MoodType } from '../types';
import { MOOD_OPTIONS } from '../data/musicConstants';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';

interface MoodCheckInProps {
  phase: 'pre' | 'post';
  userName: string;
  selectedMood: MoodType | null;
  onSelectMood: (mood: MoodType) => void;
  onConfirm: () => void;
}

export const MoodCheckIn: React.FC<MoodCheckInProps> = ({
  phase,
  userName,
  selectedMood,
  onSelectMood,
  onConfirm,
}) => {
  const isPre = phase === 'pre';

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-[#E8DFD1] p-6 sm:p-10 shadow-warm-md text-center transition-all animate-gentle-glow">
      
      {/* Icon Badge */}
      <div className="w-16 h-16 rounded-2xl bg-terracotta-100 border border-terracotta-300 flex items-center justify-center text-terracotta-700 mx-auto mb-5 shadow-inner">
        <Heart className="w-8 h-8 text-terracotta-600 fill-terracotta-200" />
      </div>

      {/* Header Tagline */}
      <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold bg-terracotta-100 text-terracotta-800 border border-terracotta-200 mb-3">
        <Sparkles className="w-3.5 h-3.5 mr-1.5 text-terracotta-600" />
        {isPre ? 'Gentle Preparation' : 'Gentle Reflection'}
      </span>

      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A202C] font-brand-heading mb-2">
        {isPre 
          ? `How is your heart feeling, ${userName}?`
          : `How do you feel after this melody, ${userName}?`}
      </h2>
      <p className="text-base sm:text-lg text-[#1A202C]/75 font-brand-body max-w-xl mx-auto mb-8">
        {isPre
          ? 'Take a peaceful breath. Choosing a mood helps us set a calming rhythm for your music session.'
          : 'Thank you for sharing your quiet moments with music today. How are you feeling now?'}
      </p>

      {/* 4 Large Senior-Friendly Mood Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {MOOD_OPTIONS.map((opt) => {
          const isSelected = selectedMood === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectMood(opt.id)}
              className={`min-h-[90px] p-5 rounded-2xl border-2 text-left flex items-center space-x-4 transition-all duration-200 ${opt.colorBg} ${
                isSelected
                  ? 'border-terracotta-600 ring-4 ring-terracotta-400/30 scale-[1.02] shadow-warm-md'
                  : `${opt.colorBorder} hover:shadow-warm-sm`
              }`}
            >
              <div className="text-3xl sm:text-4xl shrink-0 select-none">
                {opt.emoji}
              </div>
              <div>
                <h3 className={`text-lg sm:text-xl font-bold font-brand-heading ${opt.colorText}`}>
                  {opt.label}
                </h3>
                <p className="text-xs sm:text-sm text-[#1A202C]/70 font-brand-body mt-0.5">
                  {opt.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm Button */}
      <button
        type="button"
        disabled={!selectedMood}
        onClick={onConfirm}
        className={`w-full max-w-md min-h-[58px] py-4 px-8 rounded-2xl text-lg sm:text-xl font-extrabold font-brand-heading shadow-warm-md flex items-center justify-center space-x-2 mx-auto transition-all ${
          selectedMood
            ? 'bg-terracotta-600 hover:bg-terracotta-700 text-white active:scale-98 cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <span>{isPre ? 'Begin Gentle Music Session' : 'Complete Music Session'}</span>
        <ArrowRight className="w-5 h-5 ml-1" />
      </button>

    </div>
  );
};
