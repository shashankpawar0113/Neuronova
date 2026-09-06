import React, { useState, useEffect } from 'react';
import { Sparkles, HeartHandshake, Stethoscope, ShieldCheck, X } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: (role?: UserRole) => void;
  initialRole?: UserRole;
  onSignupSuccess: (role: UserRole) => void;
}

interface RoleCard {
  id: UserRole;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  badgeBg: string;
}

const ROLE_CARDS: RoleCard[] = [
  {
    id: 'patient',
    title: 'Patient / Elder',
    subtitle: 'Gentle voice prompts, memory exercises & daily warmth.',
    icon: Sparkles,
    badge: 'Simplest Setup',
    badgeBg: 'bg-muga-100 text-muga-700 border-muga-300',
  },
  {
    id: 'caregiver',
    title: 'Family Caregiver',
    subtitle: 'Stay close with real-time logs, medication alerts & peace of mind.',
    icon: HeartHandshake,
    badge: 'Family Connected',
    badgeBg: 'bg-forest-50 text-forest-700 border-forest-200',
  },
  {
    id: 'asha_worker',
    title: 'ASHA Worker',
    subtitle: 'Manage community cohorts, cognitive screenings & grassroots care.',
    icon: Stethoscope,
    badge: 'Community Care',
    badgeBg: 'bg-river-50 text-river-700 border-river-200',
  },
  {
    id: 'admin',
    title: 'Doctor / Clinical Admin',
    subtitle: 'Longitudinal clinical analytics, care team rosters & oversight.',
    icon: ShieldCheck,
    badge: 'Clinical Portal',
    badgeBg: 'bg-charcoal-800/10 text-charcoal-900 border-charcoal-800/20',
  },
];

export const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  initialRole = 'patient',
  onSignupSuccess,
}) => {
  const { signup, loginWithGoogle } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  
  // Sync selectedRole with incoming initialRole prop whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRole(initialRole || 'patient');
      setWarningMsg('');
    }
  }, [isOpen, initialRole]);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [specialField, setSpecialField] = useState(''); // e.g. Pin, Clinic, or Relation
  
  const [password, setPassword] = useState('');
  const [warningMsg, setWarningMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignup = async () => {
    setWarningMsg('');
    setIsLoading(true);
    try {
      const res = await loginWithGoogle(selectedRole);
      setIsLoading(false);
      if (res.success) {
        onSignupSuccess(selectedRole);
      } else if (res.error) {
        setWarningMsg(res.error);
      }
    } catch (err: any) {
      setIsLoading(false);
      setWarningMsg(err?.message || 'Google sign-up could not be completed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarningMsg('');

    if (!fullName.trim()) {
      setWarningMsg('Please kindly enter your full name.');
      return;
    }

    if (!emailOrPhone.trim()) {
      setWarningMsg('Please provide a phone number or email so we can keep your records safe.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signup(selectedRole, {
        name: fullName,
        emailOrPhone,
        password: password || undefined,
        emergencyContact: emergencyContact || undefined,
        location: specialField || undefined,
      });
      setIsLoading(false);
      if (res.success) {
        onSignupSuccess(selectedRole);
      } else {
        setWarningMsg(res.error || 'Unable to complete enrollment. Please try again.');
      }
    } catch (err) {
      setIsLoading(false);
      setWarningMsg('Unable to complete enrollment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-[#18261C]/65 backdrop-blur-md overflow-y-auto animate-fade-in-up">
      <div
        className="relative w-full max-w-2xl bg-[#FAF7F2] rounded-3xl shadow-2xl border border-muga-200/80 p-4 sm:p-6 my-auto overflow-hidden max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft decorative background accent */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-forest-100 rounded-full blur-3xl opacity-30 pointer-events-none" />

        {/* Header with Close */}
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-forest-50 border border-forest-200 flex items-center justify-center text-forest-700 shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 text-forest-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1A202C] font-brand-heading leading-tight">
                Create Your Account
              </h2>
              <p className="text-[11px] sm:text-xs text-forest-700 font-medium">
                Choose your role and let us tailor your care experience.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cream-200/60 hover:bg-cream-200 text-[#1A202C] flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Role Selection as Compact Cards */}
        <div className="mb-3">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-800 mb-1.5 font-brand-body">
            Choose how you will be using NeuroNova:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ROLE_CARDS.map((card) => {
              const isSelected = selectedRole === card.id;
              const CardIcon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => {
                    setSelectedRole(card.id);
                    setWarningMsg('');
                  }}
                  className={`cursor-pointer p-2 sm:p-2.5 rounded-xl border-2 transition-all text-left flex flex-col justify-between relative ${
                    isSelected
                      ? 'border-forest-600 bg-white shadow-xs ring-2 ring-forest-600/20'
                      : 'border-muga-200/80 bg-white/70 hover:border-forest-600/50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center space-x-2">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-forest-600 text-white' : 'bg-forest-50 text-forest-700 border border-forest-100'
                      }`}>
                        <CardIcon className="w-4 h-4" />
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#1A202C] font-brand-heading leading-tight">
                        {card.title}
                      </h3>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${card.badgeBg}`}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#1A202C]/70 leading-tight font-brand-body pl-9">
                    {card.subtitle}
                  </p>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-forest-600 text-white flex items-center justify-center shadow-xs">
                      <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Form Fields in Clean 2x2 Grid */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#1A202C] mb-1 font-brand-body">
                {selectedRole === 'patient' ? 'Patient / Elder Full Name' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={selectedRole === 'patient' ? 'e.g. Kamla Sharma' : 'Your name'}
                className="w-full px-3 py-2 rounded-xl bg-white border border-muga-200 text-[#1A202C] text-xs sm:text-sm focus:border-forest-600 transition-colors"
              />
            </div>

            {/* Phone Number / Email */}
            <div>
              <label className="block text-xs font-semibold text-[#1A202C] mb-1 font-brand-body">
                {selectedRole === 'patient' ? 'Your Phone Number' : 'Work Email / Phone'}
              </label>
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder={selectedRole === 'patient' ? '10-digit mobile number' : 'name@care.org'}
                className="w-full px-3 py-2 rounded-xl bg-white border border-muga-200 text-[#1A202C] text-xs sm:text-sm focus:border-forest-600 transition-colors"
              />
            </div>

            {/* Password / PIN */}
            <div>
              <label className="block text-xs font-semibold text-[#1A202C] mb-1 font-brand-body">
                {selectedRole === 'patient' ? '4-Digit PIN or Password' : 'Password (min 6 chars)'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={selectedRole === 'patient' ? 'e.g. 1234 or simple word' : 'Enter password'}
                className="w-full px-3 py-2 rounded-xl bg-white border border-muga-200 text-[#1A202C] text-xs sm:text-sm focus:border-forest-600 transition-colors"
              />
            </div>

            {/* Role-Specific Secondary Field */}
            <div>
              <label className="block text-xs font-semibold text-[#1A202C] mb-1 font-brand-body truncate">
                {selectedRole === 'patient'
                  ? 'Emergency Contact (Optional)'
                  : selectedRole === 'caregiver'
                  ? 'Relationship to Senior'
                  : selectedRole === 'asha_worker'
                  ? 'ASHA Health Center / Ward'
                  : 'Clinic / License ID'}
              </label>
              <input
                type="text"
                value={selectedRole === 'patient' ? emergencyContact : specialField}
                onChange={(e) =>
                  selectedRole === 'patient'
                    ? setEmergencyContact(e.target.value)
                    : setSpecialField(e.target.value)
                }
                placeholder={
                  selectedRole === 'patient'
                    ? "Son / Daughter's Phone or Name"
                    : selectedRole === 'caregiver'
                    ? 'e.g. Daughter, Son, Nurse'
                    : selectedRole === 'asha_worker'
                    ? 'e.g. Ward 4B, Sonapur PHC'
                    : 'e.g. AIIMS Dept. of Neurology'
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-muga-200 text-[#1A202C] text-xs sm:text-sm focus:border-forest-600 transition-colors"
              />
            </div>
          </div>

          {/* Validation Alert */}
          {warningMsg && (
            <div className="p-2 rounded-xl bg-[#FFF8EB] border border-[#D4A373] text-[#8C5E28] text-xs font-medium flex items-center space-x-2">
              <span className="text-sm">⚠️</span>
              <span>{warningMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-[#D4A373] hover:bg-[#C58F5B] text-[#1A202C] hover:text-[#FAF7F2] text-sm sm:text-base font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 mt-1"
          >
            {isLoading ? (
              <span className="inline-flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-[#1A202C] border-t-transparent rounded-full animate-spin"></span>
                <span>Creating your safe space...</span>
              </span>
            ) : (
              <span>Begin Journey with NeuroNova</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-2.5 flex items-center justify-center">
          <div className="w-full border-t border-muga-200/80" />
          <span className="absolute bg-[#FAF7F2] px-2.5 text-[10px] uppercase tracking-wider text-charcoal-800/60 font-semibold font-brand-body">
            or continue with
          </span>
        </div>

        {/* Google Sign-Up Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleSignup}
          className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-cream-50 border border-muga-200 hover:border-forest-600/50 text-[#1A202C] text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all flex items-center justify-center space-x-2.5 active:scale-[0.99] disabled:opacity-60"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Sign Up with Google</span>
        </button>

        {/* Footer switch to Login */}
        <div className="mt-2.5 pt-2 border-t border-muga-200/60 text-center">
          <p className="text-xs text-[#1A202C]/80 font-brand-body">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onSwitchToLogin(selectedRole)}
              className="text-forest-700 font-bold underline hover:text-forest-800"
            >
              Sign In Here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
