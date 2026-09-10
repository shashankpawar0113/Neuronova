import React from 'react';

interface CelestialGreetingBoxProps {
  hours?: number;
  className?: string;
}

export const CelestialGreetingBox: React.FC<CelestialGreetingBoxProps> = ({
  hours: currentHours,
  className = '',
}) => {
  // If no hours provided, use current local hours
  const actualHours = currentHours !== undefined ? currentHours : new Date().getHours();
  
  // Real-time time of day check strictly driven by clock:
  // Night / Evening: 5 PM to 4:59 AM (hours >= 17 || hours < 5)
  // Morning: 5 AM to 11:59 AM (hours >= 5 && hours < 12)
  // Afternoon: 12 PM to 4:59 PM (hours >= 12 && hours < 17)
  const isNight = actualHours >= 17 || actualHours < 5;
  const isMorning = !isNight && actualHours >= 5 && actualHours < 12;

  const skyLabel = isNight 
    ? 'Nighttime • Crescent Moon & Twinkling Stars' 
    : isMorning 
      ? 'Morning • Radiant Warm Sun' 
      : 'Afternoon • Sunlit Blue Sky';

  return (
    <div
      role="img"
      aria-label={skyLabel}
      title={`Live Celestial Sky: ${skyLabel}`}
      className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-[70px] md:h-[70px] rounded-2xl sm:rounded-[22px] overflow-hidden flex items-center justify-center shrink-0 select-none shadow-sm ${
        isNight
          ? 'bg-gradient-to-b from-[#131627] via-[#0E111F] to-[#070913] border-2 border-[#1E2638] shadow-md shadow-black/40'
          : isMorning
            ? 'bg-gradient-to-b from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] border-2 border-amber-300/90 shadow-md shadow-amber-500/20'
            : 'bg-gradient-to-b from-[#BAE6FD] via-[#7DD3FC] to-[#38BDF8] border-2 border-sky-300/90 shadow-md shadow-sky-500/25'
      } ${className}`}
    >
      {isNight ? (
        /* ─── NIGHT SKY: CRESCENT MOON & STARS (Clean, static, calm aesthetic) ─── */
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          {/* Subtle cosmic glow aura behind moon */}
          <div className="absolute inset-0 bg-radial from-amber-400/10 via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Star 1: Top Right (4-point sparkle diamond) */}
          <div className="absolute top-[18%] right-[20%]">
            <svg width="10" height="10" viewBox="-5 -5 10 10" className="text-slate-300">
              <polygon
                points="0,-5 1.5,-1.5 5,0 1.5,1.5 0,5 -1.5,1.5 -5,0 -1.5,-1.5"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Star 2: Left Middle (4-point sparkle diamond) */}
          <div className="absolute top-[42%] left-[18%]">
            <svg width="8" height="8" viewBox="-4 -4 8 8" className="text-slate-400">
              <polygon
                points="0,-4 1.2,-1.2 4,0 1.2,1.2 0,4 -1.2,1.2 -4,0 -1.2,-1.2"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Star 3: Bottom Left (Subtle small star) */}
          <div className="absolute bottom-[22%] left-[24%]">
            <svg width="6" height="6" viewBox="-3 -3 6 6" className="text-slate-500">
              <polygon
                points="0,-3 0.9,-0.9 3,0 0.9,0.9 0,3 -0.9,0.9 -3,0 -0.9,-0.9"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Center Crescent Moon (Golden Warm Yellow) */}
          <div className="relative z-10">
            <svg
              viewBox="0 0 36 36"
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
            >
              {/* Crescent Moon Path: Convex on left, opening tilted toward top-right */}
              <path
                d="M 24.5 7 A 12.5 12.5 0 1 0 29.5 25.5 A 10.5 10.5 0 0 1 24.5 7 Z"
                fill="#F6C445"
              />
            </svg>
          </div>
        </div>
      ) : (
        /* ─── DAY SKY: RADIANT SUN & SUNBEAMS ─── */
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          {/* Subtle warm sun aura */}
          <div className="absolute inset-0 bg-radial from-amber-400/25 via-transparent to-transparent opacity-80 pointer-events-none" />

          {/* Sun Sparkle 1: Top Right */}
          <div className="absolute top-[16%] right-[18%]">
            <svg width="9" height="9" viewBox="-4 -4 8 8" className={isMorning ? 'text-amber-500' : 'text-white'}>
              <polygon
                points="0,-4 1.2,-1.2 4,0 1.2,1.2 0,4 -1.2,1.2 -4,0 -1.2,-1.2"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Sun Sparkle 2: Left Middle */}
          <div className="absolute top-[46%] left-[16%]">
            <svg width="7" height="7" viewBox="-3 -3 6 6" className={isMorning ? 'text-amber-400' : 'text-white/85'}>
              <polygon
                points="0,-3 1,-1 3,0 1,1 0,3 -1,1 -3,0 -1,-1"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Sun Rays Corona */}
          <div className="absolute inset-0 flex items-center justify-center opacity-70">
            <svg viewBox="0 0 44 44" className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14">
              <g stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
                <line x1="22" y1="4" x2="22" y2="8" />
                <line x1="22" y1="36" x2="22" y2="40" />
                <line x1="4" y1="22" x2="8" y2="22" />
                <line x1="36" y1="22" x2="40" y2="22" />
                <line x1="9.3" y1="9.3" x2="12.1" y2="12.1" />
                <line x1="31.9" y1="31.9" x2="34.7" y2="34.7" />
                <line x1="9.3" y1="34.7" x2="12.1" y2="31.9" />
                <line x1="31.9" y1="12.1" x2="34.7" y2="9.3" />
              </g>
            </svg>
          </div>

          {/* Center Sun Sphere */}
          <div className="relative z-10">
            <svg
              viewBox="0 0 32 32"
              className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 drop-shadow-[0_0_10px_rgba(245,158,11,0.65)]"
            >
              <circle cx="16" cy="16" r="10" fill="#FBBF24" />
              <circle cx="16" cy="16" r="8" fill="#F59E0B" opacity="0.3" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
