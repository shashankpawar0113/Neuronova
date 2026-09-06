import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  HeartHandshake, 
  Stethoscope, 
  ArrowRight 
} from 'lucide-react';
import { useTypewriter } from '../hooks/useTypewriter';
import { UserRole } from '../context/AuthContext';

interface HeroSectionProps {
  onSelectAction: (action: 'login' | 'signup', preselectedRole?: UserRole) => void;
  onOpenHelp: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSelectAction,
  onOpenHelp: _onOpenHelp,
}) => {
  const [showPills, setShowPills] = useState(false);

  // Ref and state for interactive cursor unblur lens on intro text
  const introContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [isHoveredIntro, setIsHoveredIntro] = useState(false);

  // Typewriter hook for welcome text
  const { displayedText, isComplete } = useTypewriter({
    text: "Glad you're here. Let's get you signed in.",
    speed: 38,
    startDelay: 600,
  });

  // Action pill buttons fade-in + slide-up 400ms after load, independent of typewriter
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPills(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Track cursor movement across the whole page to create a fluid unblur lens over the blurred text
  useEffect(() => {
    let rafId: number;

    const updateCoordinates = (clientX: number, clientY: number) => {
      if (!introContainerRef.current) return;
      const rect = introContainerRef.current.getBoundingClientRect();
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (introContainerRef.current) {
          introContainerRef.current.style.setProperty('--mouse-x', `${relX}px`);
          introContainerRef.current.style.setProperty('--mouse-y', `${relY}px`);
        }
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      updateCoordinates(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateCoordinates(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-80px)] mt-16 sm:mt-20 flex flex-col justify-end md:justify-center px-5 sm:px-10 md:px-16 lg:px-24 pb-12 sm:pb-16 md:pb-0">
      

      <div className="max-w-xl lg:max-w-2xl flex flex-col items-start text-left">
        
        {/* 1. Interactive Blurred Intro Label with Dynamic Cursor Unblur Lens (100% Transparent, No Colored Halo) */}
        <div 
          ref={introContainerRef}
          onMouseEnter={() => setIsHoveredIntro(true)}
          onMouseLeave={() => setIsHoveredIntro(false)}
          className="relative select-none text-[#1E4D2B] font-semibold leading-snug tracking-tight mb-8 sm:mb-10 cursor-default transition-all duration-300"
          style={{
            fontSize: 'clamp(18px, 4vw, 26px)',
          } as React.CSSProperties}
        >
          {/* Base Layer: Softly Blurred Text */}
          <div 
            className="transition-opacity duration-300 opacity-75"
            style={{
              filter: 'blur(5px)',
            }}
            aria-hidden="true"
          >
            <div>Caring for our elders with dignity, warmth & love</div>
            <div>Here to help you get started.</div>
          </div>

          {/* Top Layer: Sharp Unblurred Text revealed dynamically around cursor movement */}
          <div 
            className="absolute inset-0 select-none pointer-events-none text-[#143C22] font-semibold leading-snug tracking-tight"
            style={{
              filter: 'none',
              WebkitMaskImage: `radial-gradient(circle ${isHoveredIntro ? '175px' : '145px'} at var(--mouse-x, -999px) var(--mouse-y, -999px), black 30%, rgba(0,0,0,0.6) 65%, transparent 100%)`,
              maskImage: `radial-gradient(circle ${isHoveredIntro ? '175px' : '145px'} at var(--mouse-x, -999px) var(--mouse-y, -999px), black 30%, rgba(0,0,0,0.6) 65%, transparent 100%)`,
              opacity: 1,
            }}
          >
            <div>Caring for our elders with dignity, warmth & love</div>
            <div>Here to help you get started.</div>
          </div>
        </div>

        {/* Crisp Sub-label badge (Fix 3: Lucide Sparkles icon, no emojis) */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-forest-50 border border-forest-200/80 mb-3 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse shrink-0" aria-hidden="true"></span>
          <Sparkles className="w-4 h-4 text-forest-600 shrink-0" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-semibold text-forest-700 font-brand-body">
            NeuroNova • Compassionate Care for Our Elders
          </span>
        </div>

        {/* 2. Typewriter Welcome Text with Blinking Cursor */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1A202C] tracking-tight font-brand-heading leading-[1.15] min-h-[3.6rem] sm:min-h-[4.4rem]">
          <span>{displayedText}</span>
          {!isComplete && (
            <span
              className="inline-block w-[3px] h-[1em] bg-forest-600 align-middle ml-1.5 animate-blink"
              aria-hidden="true"
            />
          )}
        </h1>

        {/* Gentle reassuring subtitle */}
        <p className="mt-3 text-base sm:text-lg text-[#1A202C]/80 font-brand-body max-w-lg leading-relaxed">
          A gentle, accessible space designed for seniors, families, and caring community workers.
        </p>
        <p className="mt-1.5 text-base sm:text-lg text-[#1A202C]/80 font-brand-body max-w-lg leading-relaxed">
          Built especially for those living with dementia and memory loss, and the people who care for them every day.
        </p>

        {/* 3. Action Pill Buttons (Fix 2 & 3: Role selection hierarchy vs. Utility) */}
        <div
          className={`mt-7 sm:mt-9 flex flex-wrap gap-3 sm:gap-4 transition-all duration-700 ease-out transform ${
            showPills
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6 pointer-events-none'
          }`}
        >
          {/* Primary Pill: Log In */}
          <button
            onClick={() => onSelectAction('login')}
            className="px-7 py-3.5 rounded-full bg-forest-600 text-[#FAF7F2] font-bold text-base sm:text-lg shadow-md hover:bg-forest-700 hover:shadow-lg active:scale-98 transition-all duration-200 flex items-center space-x-2 border border-forest-700"
          >
            <span>Log In</span>
            <ArrowRight className="w-5 h-5 ml-1" aria-hidden="true" />
          </button>

          {/* Primary Pill: Create an Account */}
          <button
            onClick={() => onSelectAction('signup')}
            className="px-6 py-3.5 rounded-full bg-[#D4A373] text-[#1A202C] font-bold text-base sm:text-lg shadow-sm hover:bg-[#C58F5B] hover:text-[#FAF7F2] hover:shadow-md active:scale-98 transition-all duration-200 border border-muga-400"
          >
            Create an Account
          </button>

          {/* Role Pill: Caregiver (Fix 2: Distinct River Teal outline & accent; Fix 3: Lucide HeartHandshake) */}
          <button
            onClick={() => onSelectAction('login', 'caregiver')}
            className="group px-5 py-3 rounded-full bg-cream-50/90 backdrop-blur-md text-river-800 font-semibold text-sm sm:text-base border-2 border-river-500/80 hover:bg-river-600 hover:text-white hover:border-river-600 shadow-xs active:scale-98 transition-all duration-200 flex items-center space-x-2"
          >
            <HeartHandshake className="w-[18px] h-[18px] text-river-600 group-hover:text-white transition-colors shrink-0" aria-hidden="true" />
            <span>I'm a Caregiver</span>
          </button>

          {/* Role Pill: Healthcare Worker (Fix 2: Distinct River Teal outline & accent; Fix 3: Lucide Stethoscope) */}
          <button
            onClick={() => onSelectAction('login', 'asha_worker')}
            className="group px-5 py-3 rounded-full bg-cream-50/90 backdrop-blur-md text-river-800 font-semibold text-sm sm:text-base border-2 border-river-500/80 hover:bg-river-600 hover:text-white hover:border-river-600 shadow-xs active:scale-98 transition-all duration-200 flex items-center space-x-2"
          >
            <Stethoscope className="w-[18px] h-[18px] text-river-600 group-hover:text-white transition-colors shrink-0" aria-hidden="true" />
            <span>I'm a Healthcare Worker</span>
          </button>
        </div>
      </div>
    </div>
  );
};
