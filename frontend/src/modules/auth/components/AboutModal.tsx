import React from 'react';
import { Sparkles, X, Heart, Users, ShieldCheck } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#18261C]/60 backdrop-blur-md animate-fade-in-up"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl shadow-2xl border border-muga-200 p-6 sm:p-8 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-200 flex items-center justify-center text-forest-700 shadow-xs">
              <Sparkles className="w-6 h-6 text-forest-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A202C] font-brand-heading">
                About NeuroNova
              </h2>
              <p className="text-xs text-forest-700 font-medium">
                AI cognitive gaming and compassionate dementia memory care.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-cream-200/60 hover:bg-cream-200 text-[#1A202C] flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm text-[#1A202C]/85 font-brand-body leading-relaxed">
          {/* Mission & Purpose */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-muga-200">
            <div className="flex items-center space-x-2 text-forest-700 font-bold text-base font-brand-heading mb-2">
              <Heart className="w-4 h-4 text-forest-600 shrink-0" />
              <h3>Cognitive Care Built for Our Elders</h3>
            </div>
            <p className="text-xs sm:text-sm text-[#1A202C]/85 leading-relaxed">
              NeuroNova is an AI-powered cognitive gaming and memory-assistance platform built with warmth and patience specifically to support elderly loved ones living with dementia or age-related memory decline. 
              Designed for seniors alongside the devoted family caregivers and healthcare/ASHA workers who care for them, our platform gently adapts to each elder's ability level through engaging games centered on memory, attention, and joyful recall. 
              With personalized routine and medication reminders, a comforting memory vault of cherished family photos, and real-time wellbeing monitoring, NeuroNova helps elders stay mentally active, reassured, and deeply connected to their circle of care.
            </p>
          </div>

          {/* Pillars */}
          <div className="p-4 rounded-2xl bg-white border border-muga-200 space-y-3">
            <div className="flex items-center space-x-2 text-forest-700 font-bold text-base font-brand-heading">
              <Users className="w-4 h-4 text-forest-600 shrink-0" />
              <h3>How NeuroNova Supports Daily Life</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5 text-xs sm:text-sm">
              <div className="p-2.5 rounded-xl bg-forest-50/70 border border-forest-100">
                <span className="font-bold text-forest-800">Adaptive Cognitive Games:</span> Gentle exercises in memory, focus, and recall that calibrate in real time to the elder's comfort level without stress.
              </div>
              <div className="p-2.5 rounded-xl bg-muga-50/70 border border-muga-200/60">
                <span className="font-bold text-[#8C5D31]">Memory Vault & Routine Prompts:</span> A private album for familiar family photos paired with soothing audio and visual reminders for daily routines and medications.
              </div>
              <div className="p-2.5 rounded-xl bg-river-50/70 border border-river-100">
                <span className="font-bold text-river-800">Caregiver Wellbeing Monitoring:</span> Non-intrusive daily check-ins that offer family members and community health workers continuous reassurance.
              </div>
            </div>
          </div>

          {/* Core Value */}
          <div className="p-3.5 rounded-2xl bg-forest-50 border border-forest-200 text-xs text-forest-800 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-forest-600 shrink-0 mt-0.5" />
            <span>
              <strong>Dignity & Privacy Always:</strong> We celebrate our elders as cherished individuals whose stories, dignity, and autonomy come first. All health notes and interactions remain strictly private and secure.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-forest-600 text-white font-semibold text-sm hover:bg-forest-700 transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
