import React from 'react';
import { LifeBuoy, X, Phone, Mail, ShieldCheck, AlertCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
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
            <div className="w-12 h-12 rounded-2xl bg-river-50 border border-river-200 flex items-center justify-center text-river-700 shadow-xs">
              <LifeBuoy className="w-6 h-6 text-river-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A202C] font-brand-heading">
                Help & Safety Support
              </h2>
              <p className="text-xs text-river-700 font-medium">
                Dedicated 24/7 assistance for elders and caregivers.
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
          {/* Emergency & Direct Helplines */}
          <div className="p-4 rounded-2xl bg-white border border-muga-200">
            <div className="flex items-center space-x-2 text-forest-700 font-bold text-base font-brand-heading mb-1.5">
              <Phone className="w-4 h-4 text-forest-600 shrink-0" />
              <h3>Direct Support Hotlines</h3>
            </div>
            <p className="text-xs sm:text-sm text-[#1A202C]/80 mb-3.5">
              If you need technical help signing in or want to speak with our elder care team, we are here day and night.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <a
                href="tel:1800123456"
                className="flex-1 py-2.5 px-4 rounded-xl bg-forest-600 text-white font-bold text-center text-xs sm:text-sm hover:bg-forest-700 transition-colors shadow-xs flex items-center justify-center space-x-2"
              >
                <Phone className="w-4 h-4" />
                <span>1800-NEURONOVA</span>
              </a>
              <a
                href="mailto:support@neuronova.care"
                className="flex-1 py-2.5 px-4 rounded-xl bg-muga-100 text-charcoal-900 border border-muga-300 font-bold text-center text-xs sm:text-sm hover:bg-muga-200 transition-colors flex items-center justify-center space-x-2"
              >
                <Mail className="w-4 h-4 text-[#8C5D31]" />
                <span>support@neuronova.care</span>
              </a>
            </div>
          </div>

          {/* Urgent Elder Safety Advice */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs sm:text-sm">
            <div className="flex items-center space-x-2 text-amber-900 font-bold mb-1">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <h4>Elder Feeling Disoriented or Anxious?</h4>
            </div>
            <p className="text-amber-900/90 text-xs leading-relaxed">
              Speak gently in short, calm sentences. Play soothing familiar music or call our toll-free support line above for immediate guided calming protocols with our care team.
            </p>
          </div>

          {/* Security & Data Protection */}
          <div className="p-3.5 rounded-2xl bg-river-50 border border-river-200 text-xs text-river-800 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-river-600 shrink-0 mt-0.5" />
            <span>
              <strong>Secure & HIPAA Compliant:</strong> All personal health information and caregiver notes are encrypted with medical-grade security.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-forest-600 text-white font-semibold text-sm hover:bg-forest-700 transition-colors shadow-xs"
          >
            Understood, Thank You
          </button>
        </div>
      </div>
    </div>
  );
};
