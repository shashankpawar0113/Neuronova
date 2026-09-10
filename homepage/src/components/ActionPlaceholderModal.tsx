import React from 'react';
import { X, ArrowLeft, Sparkles, CheckCircle2, HeartHandshake, Music } from 'lucide-react';
import { RoutineItem } from '../types';
import { NEUROGAMES_URL, NEUROMUSIC_URL } from '../config/urls';

interface ActionPlaceholderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string | null;
  cardTitle: string;
  cardDescription: string;
  routineSchedule: RoutineItem[];
}

export const ActionPlaceholderModal: React.FC<ActionPlaceholderModalProps> = ({
  isOpen,
  onClose,
  cardId,
  cardTitle,
  cardDescription: _cardDescription,
  routineSchedule,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#FAF7F2] rounded-3xl border-2 border-forest-300 p-6 sm:p-8 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-section-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-forest-800 transition-colors"
              aria-label="Go back to home screen"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest-700 font-brand-body">
                NeuroNova Activity Space
              </span>
              <h3 id="modal-section-title" className="text-2xl sm:text-3xl font-extrabold text-[#1A202C] font-brand-heading">
                {cardTitle}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-cream-200 hover:bg-cream-300 text-[#1A202C] flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Dynamic content depending on card */}
        {cardId === 'routine' || cardId === 'routine-full' ? (
          <div>
            <p className="text-base sm:text-lg text-[#1A202C]/80 font-brand-body mb-5">
              Here is your full gentle daily schedule. Everything is planned at an easy, peaceful pace:
            </p>

            <div className="space-y-3">
              {routineSchedule.map((item) => (
                <div 
                  key={item.id}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                    item.completed
                      ? 'bg-forest-50/70 border-forest-200 opacity-80'
                      : 'bg-white border-river-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <span className="w-20 text-sm font-extrabold text-forest-700 bg-cream-100 px-2.5 py-1.5 rounded-xl border border-cream-300 text-center">
                      {item.displayTime}
                    </span>
                    <div>
                      <p className={`text-base sm:text-lg font-bold ${item.completed ? 'line-through text-forest-900/60' : 'text-[#1A202C]'}`}>
                        {item.title}
                      </p>
                      <p className="text-xs sm:text-sm text-[#1A202C]/65">
                        {item.friendlyPrompt}
                      </p>
                    </div>
                  </div>

                  {item.completed ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-forest-100 text-forest-700">
                      <CheckCircle2 className="w-4 h-4 mr-1 text-forest-600" />
                      Done
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-river-700 bg-river-50 px-2.5 py-1 rounded-lg">
                      Scheduled
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : cardId === 'games' ? (
          <div>
            <div className="p-5 rounded-2xl bg-forest-50 border-2 border-forest-200 mb-6 flex items-start space-x-3.5">
              <Sparkles className="w-7 h-7 text-forest-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xl font-bold text-forest-900 font-brand-heading">
                  Neurogames
                </h4>
                <p className="text-sm sm:text-base text-forest-800/80 font-brand-body mt-1">
                  Designed specifically to exercise recall, visual focus, and spatial memories in a joyful, non-stressful way.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              {[
                { name: 'Memory Match', desc: 'Pair familiar peaceful cards at your own pace.' },
                { name: 'Attention Game', desc: 'Find the circle that looks a little different.' },
                { name: 'Sequence Recall', desc: 'Watch a light pattern and tap it back.' },
                { name: 'Cultural Heritage', desc: 'Traditional stories and local landmarks.' },
                { name: 'Daily Routine Recall', desc: 'Arrange your morning steps in the right order.', isNew: true },
              ].map((g, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white border border-forest-200 shadow-xs">
                  <p className="font-bold text-base text-forest-900">
                    {g.name}
                    {(g as { isNew?: boolean }).isNew && (
                      <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-gold-100 text-gold-700 border border-gold-200">NEW</span>
                    )}
                  </p>
                  <p className="text-xs sm:text-sm text-[#1A202C]/70 mt-1">{g.desc}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => { window.location.href = `${NEUROGAMES_URL}/`; }}
              className="w-full min-h-[56px] py-3.5 mb-2 rounded-2xl bg-forest-600 hover:bg-forest-700 text-white font-extrabold text-lg shadow-warm-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Open Neurogames →</span>
            </button>
          </div>
        ) : cardId === 'vault' ? (
          <div>
            <div className="p-5 rounded-2xl bg-muga-50 border-2 border-muga-200 mb-6 flex items-start space-x-3.5">
              <HeartHandshake className="w-7 h-7 text-muga-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xl font-bold text-muga-900 font-brand-heading">
                  Family Memories &amp; Photos
                </h4>
                <p className="text-sm sm:text-base text-[#1A202C]/80 font-brand-body mt-1">
                  A comforting digital album filled with photos of your grandchildren, family holidays, and audio greetings from loved ones.
                </p>
              </div>
            </div>
            <p className="text-base text-[#1A202C]/75 font-brand-body mb-4">
              Your family members and caregivers can upload new moments here anytime to bring a warm smile to your day.
            </p>
            <button
              type="button"
              onClick={() => { window.location.href = `${NEUROGAMES_URL}/?game=vault`; }}
              className="w-full min-h-[56px] py-3.5 mb-2 rounded-2xl bg-muga-500 hover:bg-muga-600 text-white font-extrabold text-lg shadow-warm-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Open Family Memory Vault →</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="p-5 rounded-2xl bg-terracotta-50 border-2 border-terracotta-200 mb-6 flex items-start space-x-3.5">
              <Music className="w-7 h-7 text-terracotta-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xl font-bold text-terracotta-900 font-brand-heading">
                  Music Therapy &amp; Familiar Tunes
                </h4>
                <p className="text-sm sm:text-base text-[#1A202C]/80 font-brand-body mt-1">
                  Gentle acoustic sitar, nostalgic golden-era songs, and calming nature soundscapes designed to comfort and soothe.
                </p>
              </div>
            </div>
            <p className="text-base text-[#1A202C]/75 font-brand-body mb-6">
              Music stimulates deep emotional memory and fosters deep peace and happiness throughout the morning and evening.
            </p>
            <button
              type="button"
              onClick={() => {
                const urlParams = new URLSearchParams(window.location.search);
                const name = urlParams.get('name') || 'Dada Anand';
                window.location.href = `${NEUROMUSIC_URL}/?name=${encodeURIComponent(name)}&role=patient`;
              }}
              className="w-full min-h-[56px] py-3.5 mb-2 rounded-2xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-extrabold text-lg shadow-warm-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Open Music &amp; Nostalgia Therapy →</span>
            </button>
          </div>
        )}

        {/* Back to Home Button */}
        <div className="mt-6 pt-4 border-t border-[#E8DFD1]">
          <button
            onClick={onClose}
            className="w-full min-h-[56px] py-3.5 rounded-2xl bg-forest-600 hover:bg-forest-700 text-white font-extrabold text-lg shadow-warm-md transition-colors"
          >
            ← Back to Main Home Screen
          </button>
        </div>

      </div>
    </div>
  );
};
