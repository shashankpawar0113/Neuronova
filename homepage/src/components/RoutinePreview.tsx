import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  BellRing, 
  Pill, 
  Coffee, 
  Droplet, 
  Footprints, 
  Gamepad2, 
  PhoneCall, 
  Sun,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { RoutineItem } from '../types';

interface RoutinePreviewProps {
  schedule: RoutineItem[];
  onOpenFullSchedule: () => void;
  onMarkDone?: (id: string, title: string) => void;
  revealDelay?: number;
}

export const RoutinePreview: React.FC<RoutinePreviewProps> = ({
  schedule,
  onOpenFullSchedule,
  onMarkDone,
  revealDelay = 0,
}) => {
  // Local state for items
  const [items, setItems] = useState<RoutineItem[]>(schedule);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  // Keep items synchronized with parent schedule updates
  useEffect(() => {
    setItems(schedule);
  }, [schedule]);

  // Tick every minute so the UI stays current
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  // Parse a task's time string ("HH:MM") into today's Date for comparison
  const parseTaskTime = (timeStr: string): Date => {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  };

  // A task is "upcoming" if: not completed AND its scheduled time is in the future (or within the last 5 min)
  const upcomingItems = items
    .filter(item => {
      if (item.completed) return false;
      const taskTime = parseTaskTime(item.time);
      // Show tasks that haven't passed yet (give a 5-min grace window so "just passed" tasks still show)
      return taskTime.getTime() >= now.getTime() - 5 * 60 * 1000;
    })
    .slice(0, 2);

  const currentItem = upcomingItems[0];
  const secondItem = upcomingItems[1];

  // Human-friendly relative time label
  const getTimeLabel = (timeStr: string): string => {
    const taskTime = parseTaskTime(timeStr);
    const diffMs = taskTime.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60_000);
    if (diffMin <= 0) return 'Right now';
    if (diffMin < 60) return `in ${diffMin} min`;
    const hrs = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return mins > 0 ? `in ${hrs}h ${mins}m` : `in ${hrs}h`;
  };

  // Helper for category icon
  const getCategoryIcon = (category: RoutineItem['category']) => {
    switch (category) {
      case 'medicine':
        return <Pill className="w-6 h-6 text-river-600 shrink-0" />;
      case 'meal':
        return <Coffee className="w-6 h-6 text-muga-600 shrink-0" />;
      case 'hydration':
        return <Droplet className="w-6 h-6 text-river-500 shrink-0" />;
      case 'activity':
        return <Footprints className="w-6 h-6 text-forest-600 shrink-0" />;
      case 'game':
        return <Gamepad2 className="w-6 h-6 text-forest-700 shrink-0" />;
      case 'family':
        return <PhoneCall className="w-6 h-6 text-muga-600 shrink-0" />;
      case 'wake':
      default:
        return <Sun className="w-6 h-6 text-muga-500 shrink-0" />;
    }
  };

  const handleMarkDone = (id: string, title: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, completed: true } : item));
    onMarkDone?.(id, title);
    setCelebrationMessage(`Taken with care! You completed: ${title}`);
    setTimeout(() => {
      setCelebrationMessage(null);
    }, 4000);
  };

  const handleRemindLater = (_id: string, title: string) => {
    setCelebrationMessage(`No rush at all. We will gently remind you about "${title}" in 15 minutes.`);
    setTimeout(() => {
      setCelebrationMessage(null);
    }, 4500);
  };

  return (
    <section 
      aria-labelledby="routine-preview-heading"
      className="w-full bg-[#FAF7F2] rounded-3xl border-2 border-river-200/80 p-5 sm:p-7 shadow-warm-md relative overflow-hidden reveal-up"
      style={{ '--reveal-delay': `${revealDelay}ms` } as React.CSSProperties}
    >
      {/* Decorative Warm Accent bar on left */}
      <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-river-500" aria-hidden="true" />

      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <span className="p-2 rounded-xl bg-river-100 border border-river-300/60 text-river-700">
            <Clock className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <span className="text-xs sm:text-sm font-bold tracking-wider text-river-700 uppercase font-brand-body">
              Today's Gentle Routine
            </span>
            <h2 id="routine-preview-heading" className="text-xl sm:text-2xl font-extrabold text-[#1A202C] font-brand-heading">
              Up Next For You
            </h2>
          </div>
        </div>

        {/* Link to view full 7-step schedule */}
        <button
          onClick={onOpenFullSchedule}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-river-50 hover:bg-river-100 text-river-700 font-semibold text-sm sm:text-base inline-flex items-center space-x-1.5 transition-colors border border-river-200 active:scale-98"
        >
          <span>View all 7 routine steps</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Toast / Micro-celebration Feedback */}
      {celebrationMessage && (
        <div 
          role="status"
          className="mb-4 p-4 rounded-2xl bg-forest-50 border-2 border-forest-300 text-forest-900 flex items-center space-x-3 animate-fade-in shadow-warm-sm"
        >
          <div className="w-8 h-8 rounded-full bg-forest-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="font-bold text-base sm:text-lg">
            {celebrationMessage}
          </p>
        </div>
      )}

      {/* Primary Upcoming Item */}
      {currentItem ? (
        <div className="bg-white rounded-2xl border border-river-100 p-5 sm:p-6 shadow-warm-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Left item details */}
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-river-50 border border-river-200/80 flex items-center justify-center shrink-0 shadow-inner">
              {getCategoryIcon(currentItem.category)}
            </div>

            <div>
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-river-100 text-river-800 border border-river-300/60">
                  {currentItem.displayTime}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-forest-700">
                  {getTimeLabel(currentItem.time)}
                </span>
              </div>

              {/* Warm, personal phrasing rather than clinical alert */}
              <h3 className="text-xl sm:text-2xl font-bold text-[#1A202C] font-brand-heading mt-2">
                {currentItem.friendlyPrompt}
              </h3>

              {currentItem.notes && (
                <p className="text-sm sm:text-base text-[#1A202C]/70 font-brand-body mt-1">
                  Note: {currentItem.notes}
                </p>
              )}
            </div>
          </div>

          {/* Right: Two Large Touch Action Buttons (Min 56px height) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 pt-2 lg:pt-0">
            
            {/* Primary Action Button: DONE */}
            <button
              onClick={() => handleMarkDone(currentItem.id, currentItem.title)}
              className="min-h-[56px] px-8 py-3.5 rounded-2xl bg-forest-600 hover:bg-forest-700 text-white font-extrabold text-lg shadow-warm-md hover:shadow-warm-lg active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2.5 border-2 border-forest-700 focus-visible:ring-4 focus-visible:ring-forest-500"
              aria-label={`Mark ${currentItem.title} as done`}
            >
              <CheckCircle2 className="w-6 h-6 text-white" aria-hidden="true" />
              <span>DONE</span>
            </button>

            {/* Secondary Action Button: REMIND ME LATER */}
            <button
              onClick={() => handleRemindLater(currentItem.id, currentItem.title)}
              className="min-h-[56px] px-6 py-3.5 rounded-2xl bg-cream-50 hover:bg-cream-200 text-[#1A202C] font-bold text-base sm:text-lg border-2 border-river-300 hover:border-river-400 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2 shadow-warm-sm focus-visible:ring-4 focus-visible:ring-river-400"
              aria-label={`Remind me about ${currentItem.title} later`}
            >
              <BellRing className="w-5 h-5 text-river-600" aria-hidden="true" />
              <span>REMIND ME LATER</span>
            </button>

          </div>
        </div>
      ) : (
        /* All items completed state */
        <div className="bg-white rounded-2xl border border-forest-200 p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-forest-600 mx-auto mb-2" />
          <h3 className="text-xl font-bold text-forest-900 font-brand-heading">
            All caught up for today!
          </h3>
          <p className="text-base text-[#1A202C]/80 font-brand-body mt-1">
            You have completed all planned activities with grace. Rest well and enjoy your afternoon.
          </p>
        </div>
      )}

      {/* Second upcoming item preview (if available) */}
      {secondItem && (
        <div className="mt-3.5 pt-3 border-t border-river-200/60 flex items-center justify-between text-sm sm:text-base text-[#1A202C]/80">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-river-800">Then at {secondItem.displayTime}:</span>
            <span>{secondItem.title}</span>
          </div>
          <span className="text-xs text-river-700 font-semibold uppercase tracking-wider">
            Up Next
          </span>
        </div>
      )}

    </section>
  );
};
