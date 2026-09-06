import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Sun, Moon, Sunrise, Clock, Calendar, LogOut } from 'lucide-react';

interface GreetingHeaderProps {
  userName: string;
  onOpenSettings: () => void;
  revealDelay?: number; // ms offset for stagger — set by App.tsx
}

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({
  userName,
  onOpenSettings,
  revealDelay = 0,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Live ticking clock for dementia/memory orientation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = currentDateTime.getHours();

  // Time-of-day greeting
  let timeGreeting = 'Good morning';
  let GreetingIcon = Sunrise;
  if (hours >= 12 && hours < 17) {
    timeGreeting = 'Good afternoon';
    GreetingIcon = Sun;
  } else if (hours >= 17 || hours < 4) {
    timeGreeting = 'Good evening';
    GreetingIcon = Moon;
  }

  // Formatted date and time strings
  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const formattedShortDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const dayName = currentDateTime.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = currentDateTime.toLocaleDateString('en-US', { month: 'long' });
  const dayNumber = currentDateTime.getDate();
  const yearNumber = currentDateTime.getFullYear();

  return (
    <header className="w-full bg-[#FAF7F2] border-b border-[#E8DFD1] pt-6 pb-5 px-4 sm:px-8 md:px-12 transition-colors">
      <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
        
        {/* Left: Orientation Date & Warm Greeting — slides down gently */}
        <div
          className="flex flex-col reveal-down"
          style={{ '--reveal-delay': `${revealDelay}ms` } as React.CSSProperties}
        >
          {/* Day & Date — Big, clear, prominent for memory support */}
          <div className="inline-flex items-center space-x-2 text-forest-700 font-semibold tracking-wide text-base sm:text-lg mb-1">
            <GreetingIcon className="w-5 h-5 text-muga-500 shrink-0" aria-hidden="true" />
            <span>Today is {dayName}, {monthName} {dayNumber}, {yearNumber}</span>
          </div>

          {/* Main Greeting Headline: Uses exact account name */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1A202C] tracking-tight font-brand-heading leading-tight">
            {timeGreeting}, <span className="text-forest-600">{userName}</span>
          </h1>

          <p className="mt-1.5 text-base sm:text-lg text-[#1A202C]/75 font-brand-body">
            Wishing you a peaceful, bright, and comfortable day.
          </p>
        </div>

        {/* Right: Live Date & Time Display + Settings Button — slides in from right */}
        <div
          className="shrink-0 pt-1 flex items-center space-x-2.5 sm:space-x-3.5 reveal-left"
          style={{ '--reveal-delay': `${revealDelay + 80}ms` } as React.CSSProperties}
        >
          
          {/* Live Clock & Date Badge */}
          <div className="flex flex-col items-end px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-white/90 border-2 border-forest-200/80 shadow-warm-sm">
            <div className="flex items-center space-x-1.5 text-forest-900 font-extrabold text-base sm:text-xl font-brand-heading leading-tight">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-forest-600 shrink-0" aria-hidden="true" />
              <span>{formattedTime}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs sm:text-sm font-semibold text-[#1A202C]/75 font-brand-body mt-0.5">
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muga-500 shrink-0" aria-hidden="true" />
              <span>{formattedShortDate}</span>
            </div>
          </div>

          {/* Settings & Accessibility Button */}
          <button
            onClick={onOpenSettings}
            className="min-w-[56px] min-h-[56px] p-3.5 rounded-2xl bg-forest-50 hover:bg-forest-100 border border-forest-200/80 text-forest-800 flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-warm-sm active:scale-95 group focus-visible:ring-4 focus-visible:ring-forest-500"
            aria-label="Open text size and accessibility preferences"
            title="Text Size & Display Settings"
          >
            <SlidersHorizontal className="w-6 h-6 text-forest-700 group-hover:rotate-12 transition-transform duration-200" />
            <span className="hidden sm:inline font-semibold text-sm text-forest-800">Settings</span>
          </button>

          {/* Clean Sign Out Button */}
          <button
            onClick={() => {
              try {
                localStorage.clear();
                sessionStorage.clear();
              } catch (_) {}
              window.location.href = 'http://localhost:5174/';
            }}
            className="min-w-[56px] min-h-[56px] p-3.5 rounded-2xl bg-white hover:bg-red-50 border border-[#E8DFD1] hover:border-red-200 text-[#1A202C]/80 hover:text-red-700 flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-warm-sm active:scale-95 group focus-visible:ring-4 focus-visible:ring-red-400"
            aria-label="Sign Out of NeuroNova"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 text-[#1A202C]/60 group-hover:text-red-600 transition-colors" />
            <span className="hidden sm:inline font-semibold text-sm">Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  );
};
