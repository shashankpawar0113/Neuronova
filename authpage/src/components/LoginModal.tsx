import React, { useState, useEffect } from 'react';
import { Sparkles, HeartHandshake, Stethoscope, ShieldCheck, X } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: (role?: UserRole) => void;
  initialRole?: UserRole;
  onLoginSuccess: (role: UserRole) => void;
}

const ROLES: { id: UserRole; label: string; icon: React.ComponentType<{ className?: string }>; tag: string }[] = [
  { id: 'patient', label: 'Patient / Senior', icon: Sparkles, tag: 'Simple, large text' },
  { id: 'caregiver', label: 'Caregiver', icon: HeartHandshake, tag: 'Family & vitals' },
  { id: 'asha_worker', label: 'ASHA Worker', icon: Stethoscope, tag: 'Field screenings' },
  { id: 'admin', label: 'Doctor / Admin', icon: ShieldCheck, tag: 'Clinical portal' },
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignup,
  initialRole = 'patient',
  onLoginSuccess,
}) => {
  const { login, loginWithGoogle } = useAuth();
  const [role, setRole] = useState<UserRole>(initialRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync role state with incoming initialRole prop whenever modal opens or initialRole changes
  useEffect(() => {
    if (isOpen) {
      setRole(initialRole || 'patient');
      setErrorMsg('');
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await loginWithGoogle(role);
      setIsLoading(false);
      if (res.success) {
        onLoginSuccess(role);
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Google sign-in could not be completed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your phone number or email to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(role, identifier, password);
      setIsLoading(false);
      if (res.success) {
        onLoginSuccess(role);
      } else {
        setErrorMsg(res.error || 'Something gently went wrong. Please try again.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Something gently went wrong. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#18261C]/60 backdrop-blur-md animate-fade-in-up">
      <div 
        className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl shadow-2xl border border-muga-200/80 p-6 sm:p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft decorative background accent */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-muga-100 rounded-full blur-2xl opacity-40 pointer-events-none" />

        {/* Header with Close */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-200 flex items-center justify-center text-forest-700 shadow-xs">
              <Sparkles className="w-6 h-6 text-forest-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1A202C] font-brand-heading">
                Welcome Back
              </h2>
              <p className="text-xs sm:text-sm text-forest-700 font-medium">
                Caring for our elders, every single day.
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

        {/* Role Selector Tabs (Elderly friendly with large touch targets) */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-800 mb-2 font-brand-body">
            I am signing in as:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => {
              const isActive = role === r.id;
              const RoleIcon = r.icon;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => {
                    setRole(r.id);
                    setErrorMsg('');
                  }}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex items-center space-x-2.5 ${
                    isActive
                      ? 'bg-forest-600 text-[#FAF7F2] border-forest-700 shadow-sm'
                      : 'bg-white/80 text-charcoal-800 border-muga-200 hover:border-forest-600/50'
                  }`}
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-forest-700/60 text-[#FAF7F2]' : 'bg-forest-50 text-forest-700 border border-forest-100'
                  }`}>
                    <RoleIcon className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold leading-tight">{r.label}</div>
                    <div className={`text-[10px] ${isActive ? 'text-[#FAF7F2]/80' : 'text-[#1A202C]/60'}`}>
                      {r.tag}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#1A202C] mb-1.5 font-brand-body">
              {role === 'patient' ? 'Your Mobile Number or Name' : 'Email or Phone Number'}
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={role === 'patient' ? 'e.g. 9876543210 or Kamla Ji' : 'name@example.com'}
              className="w-full px-4 py-3.5 rounded-xl bg-white border border-muga-200 text-[#1A202C] text-base placeholder:text-[#1A202C]/40 focus:bg-white focus:border-forest-600 transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-[#1A202C] font-brand-body">
                {role === 'patient' ? '4-Digit PIN or Password' : 'Password'}
              </label>
              <button
                type="button"
                onClick={() => alert('A quick recovery code has been sent to your registered number.')}
                className="text-xs text-forest-700 hover:text-forest-800 font-semibold underline"
              >
                Forgot PIN?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={role === 'patient' ? 'Enter 4-digit PIN (e.g. 1234)' : 'Enter your password'}
              className="w-full px-4 py-3.5 rounded-xl bg-white border border-muga-200 text-[#1A202C] text-base placeholder:text-[#1A202C]/40 focus:bg-white focus:border-forest-600 transition-colors"
            />
          </div>

          {/* Friendly Amber Warning/Error Banner (not harsh red) */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FFF6E5] border border-[#D4A373] text-[#8C5E28] text-xs sm:text-sm font-medium flex items-center space-x-2">
              <span>🌾</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Demo Pre-fill helper */}
          <div className="flex items-center justify-between text-[11px] text-charcoal-800/70 pt-1">
            <span>Demo: click to autofill</span>
            <button
              type="button"
              onClick={() => {
                setIdentifier('kamla.sharma@family.care');
                setPassword('1234');
              }}
              className="text-forest-700 font-semibold hover:underline"
            >
              Fill Sample Elder Login
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-forest-600 hover:bg-forest-700 text-[#FAF7F2] text-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            {isLoading ? (
              <span className="inline-flex items-center space-x-2">
                <span className="w-5 h-5 border-2 border-[#FAF7F2] border-t-transparent rounded-full animate-spin"></span>
                <span>Signing you in...</span>
              </span>
            ) : (
              <span>Sign In to Your Space</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-muga-200/80" />
          <span className="absolute bg-[#FAF7F2] px-3 text-xs uppercase tracking-wider text-charcoal-800/60 font-semibold font-brand-body">
            or continue with
          </span>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-cream-50 border border-muga-200 hover:border-forest-600/50 text-[#1A202C] text-base font-semibold shadow-xs hover:shadow-sm transition-all flex items-center justify-center space-x-3 active:scale-[0.99] disabled:opacity-60"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
          <span>Sign In with Google</span>
        </button>

        {/* Footer switch to Signup */}
        <div className="mt-6 pt-4 border-t border-muga-200/60 text-center">
          <p className="text-sm text-[#1A202C]/80 font-brand-body">
            New here?{' '}
            <button
              type="button"
              onClick={() => onSwitchToSignup(role)}
              className="text-forest-700 font-bold underline hover:text-forest-800"
            >
              Create an Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
