import React from 'react';
import { HeartHandshake, KeyRound, ShieldCheck, Sparkles, Smartphone, Clock, ArrowRight } from 'lucide-react';

interface UnlinkedEmptyStateProps {
  onOpenLinkModal: () => void;
  caregiverName: string;
}

export const UnlinkedEmptyState: React.FC<UnlinkedEmptyStateProps> = ({
  onOpenLinkModal,
  caregiverName,
}) => {
  return (
    <div className="max-w-4xl mx-auto w-full py-8 sm:py-12 px-4 flex flex-col items-center text-center">
      
      {/* Scenic Anime Meadow Showcase Banner */}
      <div className="w-full relative rounded-3xl overflow-hidden border-2 border-sky-200/80 shadow-warm-md mb-8 group">
        <div 
          className="h-48 sm:h-64 w-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
          style={{ backgroundImage: "url('/meadow-bg.png')" }}
        />
        {/* Soft anime gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Floating badge inside scenic card */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-white text-left">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white inline-flex items-center space-x-1 mb-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>NeuroNova Caregiver Portal</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold font-brand-heading text-white drop-shadow-md">
              A peaceful sanctuary for your loved one's care
            </h3>
          </div>
          <span className="text-xs text-white/90 font-medium hidden md:block backdrop-blur-xs bg-black/25 px-3 py-1.5 rounded-xl border border-white/20">
            Dementia & Memory Care Sanctuary
          </span>
        </div>
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-meadow-700 mb-2">
        Welcome to your family dashboard
      </span>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A202C] font-brand-heading leading-tight mb-3">
        Namaste, {caregiverName}
      </h2>
      <p className="text-sm sm:text-base text-[#1A202C]/75 font-brand-body max-w-2xl mb-6 leading-relaxed">
        Stay effortlessly connected with your elder’s daily routine, medication adherence, and cognitive milestones with complete clinical-grade privacy and peace of mind.
      </p>

      {/* Action CTA — Moved above 3-step setup */}
      <button
        onClick={onOpenLinkModal}
        className="group relative px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-black/60 hover:bg-black/75 active:bg-black/85 backdrop-blur-xl border border-white/25 hover:border-white/45 text-white text-sm sm:text-base font-bold shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center space-x-2.5 cursor-pointer mb-8"
        style={{
          boxShadow: '0 12px 28px -10px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
        }}
      >
        <HeartHandshake className="w-4.5 h-4.5 text-[#EEDAC2] transition-transform group-hover:scale-110" />
        <span className="tracking-wide text-white drop-shadow-sm">Enter Connection Code Now</span>
        <ArrowRight className="w-4 h-4 text-[#EEDAC2] transition-transform group-hover:translate-x-1" />
      </button>

      {/* Guided 3-Step Linking Card with Anime Meadow Harmonized Colors */}
      <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl border border-sky-100 p-6 sm:p-8 shadow-warm-sm mb-8 text-left">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center space-x-2">
          <KeyRound className="w-4 h-4 text-meadow-600" />
          <span>Quick 3-step setup to connect your elder:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Step 1: Meadow Green theme */}
          <div className="p-4 rounded-2xl bg-meadow-50/70 border border-meadow-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-full bg-meadow-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  1
                </span>
                <Smartphone className="w-4 h-4 text-meadow-700" />
              </div>
              <h4 className="text-sm font-bold text-[#1A202C] font-brand-heading mb-1">
                Open Patient App
              </h4>
              <p className="text-xs text-[#1A202C]/70 font-brand-body leading-relaxed">
                On your elder’s tablet or phone, open the NeuroNova home screen.
              </p>
            </div>
          </div>

          {/* Step 2: Anime Azure Sky theme */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  2
                </span>
                <Clock className="w-4 h-4 text-sky-700" />
              </div>
              <h4 className="text-sm font-bold text-[#1A202C] font-brand-heading mb-1">
                Tap Clock 3 Times
              </h4>
              <p className="text-xs text-[#1A202C]/70 font-brand-body leading-relaxed">
                Triple-tap the time badge in the top right, then select Display Settings to find their connection code.
              </p>
            </div>
          </div>

          {/* Step 3: Wildflower Cosmos Pink theme */}
          <div className="p-4 rounded-2xl bg-cosmos-50/70 border border-cosmos-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-full bg-cosmos-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  3
                </span>
                <HeartHandshake className="w-4 h-4 text-cosmos-700" />
              </div>
              <h4 className="text-sm font-bold text-[#1A202C] font-brand-heading mb-1">
                Enter Code Above
              </h4>
              <p className="text-xs text-[#1A202C]/70 font-brand-body leading-relaxed">
                Click the button above to link accounts and unlock live peace of mind.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Privacy note — dark transparent */}
      <div className="flex items-center space-x-2 text-xs text-white/90 bg-black/45 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-lg">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Data is encrypted, clinical-grade, and isolated strictly between you and your elder.</span>
      </div>
    </div>
  );
};
