import React from 'react';
import { 
  CalendarCheck, 
  HeartHandshake, 
  Music, 
  ArrowRight,
  Brain
} from 'lucide-react';

interface HeroActionCardsProps {
  onSelectCard: (cardId: string, title: string, description: string) => void;
  revealDelay?: number; // base delay — header uses this, cards stagger from it
}

export const HeroActionCards: React.FC<HeroActionCardsProps> = ({ onSelectCard, revealDelay = 0 }) => {
  const cards = [
    {
      id: 'games',
      title: 'Neurogames',
      tagline: 'Keep Your Mind Refreshed',
      description: 'Playful daily memory puzzles and sequence games crafted with joy.',
      icon: Brain,
      theme: {
        bg: 'bg-forest-50/90',
        hoverBg: 'hover:bg-forest-100',
        border: 'border-forest-300',
        hoverBorder: 'hover:border-forest-600',
        iconBg: 'bg-forest-600 text-white',
        titleColor: 'text-forest-900',
        arrowColor: 'text-forest-700',
        badgeBg: 'bg-forest-100 text-forest-800 border-forest-200',
      },
      gamesList: 'Memory Match • Attention • Sequence • Cultural • Daily Routine',
    },
    {
      id: 'routine',
      title: "Today's Routine & Medicine",
      tagline: 'Gentle Daily Flow',
      description: 'Your medicine schedule, water reminders, and peaceful walking times.',
      icon: CalendarCheck,
      theme: {
        bg: 'bg-river-50/90',
        hoverBg: 'hover:bg-river-100',
        border: 'border-river-300',
        hoverBorder: 'hover:border-river-600',
        iconBg: 'bg-river-500 text-white',
        titleColor: 'text-river-900',
        arrowColor: 'text-river-700',
        badgeBg: 'bg-river-100 text-river-800 border-river-200',
      },
      gamesList: '7 daily gentle milestones',
    },
    {
      id: 'vault',
      title: 'Family Memory Vault',
      tagline: 'Stories & Loved Ones',
      description: 'Cherished photos, family recordings, and familiar faces you love.',
      icon: HeartHandshake,
      theme: {
        bg: 'bg-muga-50/90',
        hoverBg: 'hover:bg-muga-100',
        border: 'border-muga-300',
        hoverBorder: 'hover:border-muga-600',
        iconBg: 'bg-muga-500 text-white',
        titleColor: 'text-muga-900',
        arrowColor: 'text-muga-700',
        badgeBg: 'bg-muga-100 text-muga-800 border-muga-200',
      },
      gamesList: 'Family photos & audio voice notes',
    },
    {
      id: 'music',
      title: 'Music & Nostalgia',
      tagline: 'Peaceful Melodies',
      description: 'Calming instrumental melodies and timeless songs from your favorite eras.',
      icon: Music,
      theme: {
        bg: 'bg-terracotta-50/90',
        hoverBg: 'hover:bg-terracotta-100',
        border: 'border-terracotta-300',
        hoverBorder: 'hover:border-terracotta-600',
        iconBg: 'bg-terracotta-600 text-white',
        titleColor: 'text-terracotta-900',
        arrowColor: 'text-terracotta-700',
        badgeBg: 'bg-terracotta-100 text-terracotta-800 border-terracotta-200',
      },
      gamesList: 'Relaxing ragas, old classics & hymns',
    },
  ];

  return (
    <section aria-labelledby="hero-cards-heading" className="w-full">
      {/* Section header — fades/slides in just before the cards */}
      <div
        className="flex items-center justify-between mb-4 reveal-up"
        style={{ '--reveal-delay': `${revealDelay}ms` } as React.CSSProperties}
      >
        <div>
          <span className="text-xs sm:text-sm font-bold tracking-wider text-forest-700 uppercase font-brand-body">
            What would you like to do?
          </span>
          <h2 id="hero-cards-heading" className="text-2xl sm:text-3xl font-extrabold text-[#1A202C] font-brand-heading">
            Your Daily Activities
          </h2>
        </div>
      </div>

      {/* Grid of 4 Large Cards — each staggered 120ms apart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {cards.map((card, index) => {
          const IconComponent = card.icon;
          // Each card gets an additional 120ms stagger on top of the section base
          const cardDelay = revealDelay + 80 + index * 120;
          return (
            <button
              key={card.id}
              onClick={() => onSelectCard(card.id, card.title, card.description)}
              className={`min-h-[160px] p-6 sm:p-7 rounded-3xl border-2 ${card.theme.bg} ${card.theme.hoverBg} ${card.theme.border} ${card.theme.hoverBorder} text-left transition-all duration-300 shadow-warm-sm hover:shadow-warm-lg active:scale-[0.98] flex flex-col justify-between group focus-visible:ring-4 focus-visible:ring-forest-500 reveal-up-card`}
              style={{ '--reveal-delay': `${cardDelay}ms` } as React.CSSProperties}
            >
              {/* Card Top Row: Icon + Badge + Arrow */}
              <div className="flex items-start justify-between gap-4 w-full">
                <div className="flex items-center space-x-3.5">
                  <div className={`w-14 h-14 rounded-2xl ${card.theme.iconBg} flex items-center justify-center shrink-0 shadow-warm-sm group-hover:scale-105 transition-transform duration-200`}>
                    <IconComponent className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#1A202C]/60 block font-brand-body">
                      {card.tagline}
                    </span>
                    <h3 className={`text-2xl font-extrabold font-brand-heading ${card.theme.titleColor} group-hover:underline decoration-2 underline-offset-4`}>
                      {card.title}
                    </h3>
                  </div>
                </div>

                {/* Right Arrow indicator */}
                <div className={`w-10 h-10 rounded-full bg-white/80 border border-black/5 flex items-center justify-center shrink-0 ${card.theme.arrowColor} group-hover:translate-x-1.5 transition-transform duration-200 shadow-xs`}>
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </div>
              </div>

              {/* Card One-line description */}
              <p className="mt-4 text-base sm:text-lg text-[#1A202C]/80 font-brand-body leading-relaxed">
                {card.description}
              </p>

              {/* Card footer indicator */}
              <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${card.theme.badgeBg}`}>
                  {card.gamesList}
                </span>
                <span className="text-xs font-bold text-[#1A202C]/70 group-hover:text-forest-700">
                  Tap to open →
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
