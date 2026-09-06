import React from 'react';
import { FormativeEra, MusicGenreKey } from '../types';
import { AGE_PRESETS, GENRE_OPTIONS, calculateFormativeEra } from '../data/musicConstants';
import { Calendar, Radio, Music, Sparkles } from 'lucide-react';

interface FormativeEraSelectorProps {
  currentAge: number;
  onAgeChange: (age: number) => void;
  formativeEra: FormativeEra;
  selectedGenre: MusicGenreKey;
  onSelectGenre: (genre: MusicGenreKey) => void;
}

export const FormativeEraSelector: React.FC<FormativeEraSelectorProps> = ({
  currentAge,
  onAgeChange,
  formativeEra,
  selectedGenre,
  onSelectGenre,
}) => {
  return (
    <div className="w-full bg-white/90 backdrop-blur-sm rounded-3xl border border-[#E8DFD1] p-5 sm:p-7 shadow-warm-sm flex flex-col gap-6">
      
      {/* Top Banner: Formative Years Insight */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-[#E8DFD1]">
        
        {/* Left: Decade & Formative Ages explanation */}
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-muga-100 border border-muga-300 flex items-center justify-center text-muga-700 shrink-0">
            <Radio className="w-6 h-6 text-muga-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-extrabold text-[#1A202C] font-brand-heading">
                {formativeEra.decade} Musical Memories
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-forest-100 text-forest-800 border border-forest-200">
                <Sparkles className="w-3 h-3 mr-1 text-forest-600" />
                Formative Era
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#1A202C]/75 font-brand-body mt-0.5">
              Targeted to your youth ({formativeEra.formativeStartYear}–{formativeEra.formativeEndYear}, ages 15–22), when musical memories create their deepest, most comforting emotional resonance.
            </p>
          </div>
        </div>

        {/* Right: Age quick chips & adjustment */}
        <div className="flex flex-col items-start md:items-end gap-1.5 self-stretch md:self-auto">
          <span className="text-xs font-bold text-[#1A202C]/70 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-terracotta-600" />
            Patient Age ({currentAge} yrs)
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {AGE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onAgeChange(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold border transition-all ${
                  currentAge === preset
                    ? 'bg-terracotta-600 border-terracotta-600 text-white shadow-warm-xs'
                    : 'bg-white border-[#E8DFD1] text-[#1A202C]/80 hover:border-terracotta-300'
                }`}
              >
                {preset}
              </button>
            ))}

            {/* Direct Number Input */}
            <input
              type="number"
              min={50}
              max={105}
              value={currentAge}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) onAgeChange(val);
              }}
              className="w-16 px-2 py-1 text-xs sm:text-sm font-extrabold text-center rounded-xl border border-[#E8DFD1] bg-white focus:outline-none focus:border-terracotta-600"
              aria-label="Custom Patient Age"
            />
          </div>
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Music className="w-4 h-4 text-terracotta-600" />
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-terracotta-900">
            Select Melody Tradition
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {GENRE_OPTIONS.map((genre) => {
            const isSelected = selectedGenre === genre.id;
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => onSelectGenre(genre.id)}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? 'bg-terracotta-50 border-terracotta-600 text-terracotta-900 shadow-warm-xs'
                    : 'bg-white/80 border-[#E8DFD1] text-[#1A202C]/80 hover:border-terracotta-300'
                }`}
              >
                <div className="text-sm font-bold font-brand-heading leading-tight">
                  {genre.label}
                </div>
                <div className="text-[11px] text-[#1A202C]/65 line-clamp-1 mt-0.5">
                  {genre.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
