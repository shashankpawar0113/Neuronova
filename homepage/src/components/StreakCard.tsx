import React, { useState, useEffect } from 'react';
import { Star, Sparkles, Heart, Brain, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { BACKEND_URL } from '../config/urls';
import { useLanguage } from '../context/LanguageContext';

interface ProgressSummaryData {
  summary: string;
  highlightDimension: string;
  concernDimension: string | null;
  source: 'llm' | 'fallback';
  cached?: boolean;
}

interface StreakCardProps {
  userId?: string;
  streakDays?: number;
  improvementPercentage?: number;
  userName?: string;
  revealDelay?: number;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  userId,
  streakDays = 3,
  improvementPercentage = 12,
  userName = 'Friend',
  revealDelay = 0,
}) => {
  const { t } = useLanguage();
  const [summaryData, setSummaryData] = useState<ProgressSummaryData | null>(null);
  const [realStreak, setRealStreak] = useState<number>(streakDays);
  const [realImprovement, setRealImprovement] = useState<number>(improvementPercentage);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    async function fetchProgressSummary() {
      try {
        setIsLoading(true);
        const resolvedId = userId || userName.toLowerCase().replace(/\s+/g, '_') || 'patient_current';
        // Connect to the NeuroNova AI & Persistence service
        const response = await fetch(`${BACKEND_URL}/api/progress-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: resolvedId,
            patientName: userName,
            audience: 'patient',
            windowDays: 7,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        if (!isCancelled) {
          setSummaryData({
            summary: data.summary,
            highlightDimension: data.highlightDimension || 'Memory Games',
            concernDimension: data.concernDimension || null,
            source: data.source || 'llm',
            cached: data.cached,
          });
          if (data.computedStats) {
            if (typeof data.computedStats.activeDaysCount === 'number') {
              setRealStreak(Math.max(1, data.computedStats.activeDaysCount));
            }
            if (data.computedStats.dimensions && data.highlightDimension) {
              const dimKey = Object.keys(data.computedStats.dimensions).find(k =>
                data.computedStats.dimensions[k]?.dimension?.toLowerCase() === data.highlightDimension?.toLowerCase()
              );
              if (dimKey && data.computedStats.dimensions[dimKey]?.changePercent) {
                setRealImprovement(Math.max(0, data.computedStats.dimensions[dimKey].changePercent));
              }
            }
          }
        }
      } catch (err) {
        // Safe local fallback so user never experiences an error state
        if (!isCancelled) {
          setSummaryData({
            summary: `Wonderful progress this week, ${userName}! Your game sessions have been calm and consistent, keeping your morning routine joyful and active. You are taking wonderful care of your mind each day.`,
            highlightDimension: 'Memory & Attention',
            concernDimension: null,
            source: 'fallback',
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchProgressSummary();

    return () => {
      isCancelled = true;
    };
  }, [userName]);

  return (
    <div
      className="w-full bg-gradient-to-r from-muga-50 via-cream-50 to-forest-50/60 rounded-2xl border border-muga-200/70 p-4 sm:p-5 shadow-warm-sm flex flex-col gap-4 transition-all hover:shadow-warm-md reveal-up will-change-transform"
      style={{ '--reveal-delay': `${revealDelay}ms` } as React.CSSProperties}
    >
      
      {/* Top Strip: Streak Badge & Personal Improvement */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Star Badge & Non-competitive Streak count */}
        <div className="flex items-center space-x-3.5">
          <div className="w-14 h-14 rounded-2xl bg-muga-100 border border-muga-300 flex items-center justify-center shrink-0 shadow-inner">
            <Star className="w-7 h-7 text-muga-500 fill-muga-400 animate-pulse" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-extrabold text-[#1A202C] font-brand-heading">
                {t.streak.brightMoments(realStreak)}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-muga-100 text-muga-600 border border-muga-200">
                <Sparkles className="w-3 h-3 mr-1 text-muga-500" />
                {t.streak.gentleRoutineBadge}
              </span>
            </div>
            <p className="text-sm sm:text-base text-[#1A202C]/80 font-brand-body mt-0.5">
              {t.streak.gentleCareSubtitle}
            </p>
          </div>
        </div>

        {/* Right: Personal improvement celebration */}
        <div className="bg-white/80 backdrop-blur-xs rounded-xl px-4 py-2.5 border border-muga-200/60 flex items-center space-x-3 self-stretch sm:self-auto justify-center sm:justify-start">
          <div className="w-8 h-8 rounded-full bg-forest-50 flex items-center justify-center text-forest-600 shrink-0">
            <Heart className="w-4 h-4 fill-forest-200 text-forest-600" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-forest-700 uppercase tracking-wider">
              {t.streak.personalProgress}
            </p>
            <p className="text-sm sm:text-base font-bold text-[#1A202C]">
              {t.streak.improvedText(realImprovement)}
            </p>
          </div>
        </div>
      </div>

      {/* AI Cognitive Progress Narrative Banner */}
      <div className="border-t border-muga-200/50 pt-3.5 mt-1">
        <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
              {t.streak.weeklyReflection}
              {summaryData?.highlightDimension && (
                <span className="normal-case font-medium text-xs px-2 py-0.5 rounded-md bg-white/90 border border-indigo-100 text-indigo-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-forest-600" />
                  {t.streak.strongestIn(summaryData.highlightDimension)}
                </span>
              )}
            </span>
          </div>

          <button 
            type="button"
            className="text-indigo-900/60 hover:text-indigo-900 transition-colors p-1"
            aria-label={isExpanded ? 'Collapse reflection' : 'Expand reflection'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-2.5 bg-white/75 backdrop-blur-xs rounded-xl p-3.5 border border-indigo-100/80 text-left transition-all">
            {isLoading ? (
              <div className="flex items-center space-x-2 text-sm text-[#1A202C]/60 py-1">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                <span>{t.streak.reflectionLoading}</span>
              </div>
            ) : (
              <p className="text-sm sm:text-base text-[#1A202C]/90 font-brand-body leading-relaxed">
                {summaryData?.summary}
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
