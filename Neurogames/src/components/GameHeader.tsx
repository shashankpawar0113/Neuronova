import { ArrowLeft, Home, RotateCcw } from 'lucide-react';

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  level?: number;
  maxLevel?: number;
  customBadge?: React.ReactNode;
  onBack: () => void;
  onReset?: () => void;
  accentColor?: string; // tailwind class like 'text-forest-700'
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  subtitle,
  level,
  maxLevel,
  customBadge,
  onBack,
  onReset,
  accentColor = 'text-forest-700',
}) => {
  return (
    <header className="w-full flex items-center justify-between py-4 px-4 sm:px-6 border-b border-cream-300 bg-cream-50/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-cream-300 text-forest-800 hover:bg-forest-50 hover:border-forest-300 transition-all text-sm font-bold shadow-sm cursor-pointer"
          aria-label="Back to games hub"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Games</span>
        </button>

        <div>
          <h1 className={`text-xl sm:text-2xl font-extrabold font-[Outfit] ${accentColor} leading-tight`}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#1A202C]/60 font-[Plus_Jakarta_Sans]">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {customBadge ? (
          customBadge
        ) : level !== undefined ? (
          <span className="px-3.5 py-1.5 rounded-full bg-forest-100 text-forest-800 text-xs font-extrabold border border-forest-200 shadow-xs">
            Level {level}{maxLevel ? ` of ${maxLevel}` : ''}
          </span>
        ) : null}

        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 hover:border-amber-400 transition-all text-xs sm:text-sm font-bold shadow-sm cursor-pointer"
            aria-label="Reset game"
            title="Reset current game"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}

        <button
          onClick={() => { window.location.href = 'http://localhost:5175'; }}
          className="w-9 h-9 rounded-xl bg-white border border-cream-300 text-[#1A202C]/60 hover:bg-cream-200 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Go to main home screen"
          title="← Back to Main Home Screen"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
