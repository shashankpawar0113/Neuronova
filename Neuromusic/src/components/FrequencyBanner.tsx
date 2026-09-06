import React from 'react';
import { CalendarCheck, Sparkles, CheckCircle2, Circle } from 'lucide-react';

interface FrequencyBannerProps {
  completedThisWeek: number;
  targetWeekly: number;
}

export const FrequencyBanner: React.FC<FrequencyBannerProps> = ({
  completedThisWeek = 1,
  targetWeekly = 2,
}) => {
  return (
    <div className="w-full bg-gradient-to-r from-forest-50 via-cream-50 to-muga-50 rounded-2xl border border-forest-200/80 p-4 sm:p-5 shadow-warm-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      
      {/* Left Description */}
      <div className="flex items-center space-x-3.5">
        <div className="w-12 h-12 rounded-xl bg-forest-100 border border-forest-300 flex items-center justify-center text-forest-700 shrink-0">
          <CalendarCheck className="w-6 h-6 text-forest-700" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-base sm:text-lg font-bold text-forest-900 font-brand-heading">
              Weekly Music Therapy Rhythm
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-forest-100 text-forest-700 border border-forest-200">
              <Sparkles className="w-3 h-3 mr-1 text-forest-600" />
              Clinical Guideline
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#1A202C]/75 font-brand-body mt-0.5">
            Targeting 2 sessions weekly (30–60 mins each) helps sustain emotional well-being and memory familiarity.
          </p>
        </div>
      </div>

      {/* Right: Progress Tracker indicators */}
      <div className="bg-white/85 rounded-xl px-4 py-2.5 border border-forest-200 flex items-center space-x-3 self-stretch sm:self-auto justify-center">
        <div className="flex items-center space-x-1.5">
          {Array.from({ length: targetWeekly }).map((_, i) => {
            const isDone = i < completedThisWeek;
            return isDone ? (
              <CheckCircle2 key={i} className="w-5 h-5 text-forest-600 fill-forest-100" />
            ) : (
              <Circle key={i} className="w-5 h-5 text-gray-300" />
            );
          })}
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-forest-800 uppercase tracking-wider">
            Sessions This Week
          </p>
          <p className="text-xs sm:text-sm font-bold text-[#1A202C]">
            {completedThisWeek} of {targetWeekly} suggested completed
          </p>
        </div>
      </div>

    </div>
  );
};
