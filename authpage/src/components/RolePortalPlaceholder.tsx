import React from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { NEUROMUSIC_URL, CAREGIVERPAGE_URL } from '../config/urls';

interface RolePortalPlaceholderProps {
  onBackToAuth: () => void;
}

const PORTAL_DATA: Record<
  UserRole,
  {
    badge: string;
    title: string;
    description: string;
    icon: string;
    nextRoute: string;
    highlights: string[];
    accentColor: string;
    accentBg: string;
  }
> = {
  patient: {
    badge: 'Senior & Patient Sanctuary',
    title: 'Senior Daily Wellness Space',
    description:
      'Warm audio check-ins, soothing memory games, family photo stories, and gentle medicine reminders.',
    icon: '🌸',
    nextRoute: '/dashboard/patient-companion',
    highlights: [
      'Daily morning wellness check-in and gentle memory prompts',
      'Cognitive games: Memory Flower Match & Daily Word Recall',
      'Direct 1-tap call to family caregiver',
    ],
    accentColor: 'text-forest-700',
    accentBg: 'bg-forest-50 border-forest-200',
  },
  caregiver: {
    badge: 'Caregiver Command Hub',
    title: 'Family & Caregiver Portal',
    description:
      'Real-time cognitive progress logs, activity summaries, medication adherence alerts, and safety perimeter tracking.',
    icon: '🤝',
    nextRoute: '/caregiverpage',
    highlights: [
      'Live mood and cognitive engagement metrics',
      'Medication and hydration confirmation stream',
      'Shared notes with visiting ASHA health workers',
    ],
    accentColor: 'text-muga-700',
    accentBg: 'bg-muga-50 border-muga-300',
  },
  asha_worker: {
    badge: 'Community Healthcare Portal',
    title: 'ASHA Field Worker Workspace',
    description:
      'Community screening assessments, Mini-Mental State Examination (MMSE) logs, and patient visit scheduling.',
    icon: '🩺',
    nextRoute: '/dashboard/asha-community',
    highlights: [
      'Offline-first community screening roster',
      'Early cognitive impairment flag alerts',
      'Automated referral routing to district hospital neurologists',
    ],
    accentColor: 'text-river-700',
    accentBg: 'bg-river-50 border-river-200',
  },
  admin: {
    badge: 'Clinical Administration',
    title: 'Doctor & Neurological Oversight',
    description:
      'Aggregated cohort metrics, clinical trial enrollment, AI companion accuracy audits, and health system integration.',
    icon: '🏛️',
    nextRoute: '/dashboard/clinical-oversight',
    highlights: [
      'Longitudinal cognitive progression charts',
      'HIPAA / DISHA compliant clinical record export',
      'AI companion voice conversation review',
    ],
    accentColor: 'text-charcoal-900',
    accentBg: 'bg-cream-100 border-charcoal-800/20',
  },
};

export const RolePortalPlaceholder: React.FC<RolePortalPlaceholderProps> = ({ onBackToAuth }) => {
  const { user, logout, getRoleRedirectPath } = useAuth();

  if (!user) return null;

  const portal = PORTAL_DATA[user.role];
  const redirectPath = getRoleRedirectPath(user.role);

  return (
    <div className="relative z-20 w-full min-h-[calc(100vh-80px)] mt-16 sm:mt-20 flex flex-col items-center justify-center px-4 sm:px-8 py-8 animate-fade-in-up">
      <div className="max-w-2xl w-full bg-[#FAF7F2]/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 shadow-2xl border border-muga-200">
        
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-muga-200/70 pb-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-forest-700">
              Authenticated Session
            </span>
            <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Cloud Connected (Firestore & Auth)</span>
            </span>
          </div>
          <button
            onClick={() => {
              logout();
              onBackToAuth();
            }}
            className="text-xs font-bold text-red-600 hover:text-red-700 underline px-2 py-1"
          >
            Sign Out
          </button>
        </div>

        {/* Companion Welcome */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-forest-100/80 border border-forest-300 flex items-center justify-center text-3xl shadow-sm">
            {portal.icon}
          </div>
          <div>
            <div className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border mb-1.5 ${portal.accentBg}`}>
              {portal.badge}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A202C] font-brand-heading">
              Welcome, {user.name}!
            </h2>
            <p className="text-xs sm:text-sm text-forest-700 font-medium">
              Signed in as <span className="capitalize font-bold">{user.role.replace('_', ' ')}</span> ({user.emailOrPhone})
            </p>
            {user.uid && (
              <p className="text-[11px] text-charcoal-800/60 font-mono mt-0.5">
                Firebase UID: {user.uid}
              </p>
            )}
          </div>
        </div>

        {/* Portal Information Card */}
        <div className="bg-white/80 rounded-2xl p-5 sm:p-6 border border-muga-200 mb-6 shadow-xs">
          <h3 className="text-lg font-bold text-[#1A202C] font-brand-heading mb-1">
            {portal.title}
          </h3>
          <p className="text-sm text-[#1A202C]/80 leading-relaxed mb-4 font-brand-body">
            {portal.description}
          </p>

          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-charcoal-800/80">
              Role Modules Ready to Connect:
            </div>
            {portal.highlights.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 text-sm text-charcoal-800">
                <span className="text-forest-600 font-bold">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Caregiver Music Management Feature Card */}
        {user.role === 'caregiver' && (
          <div className="bg-forest-50/90 rounded-2xl p-5 border-2 border-forest-300 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-forest-800">
                  Caregiver Music Console
                </span>
                <h4 className="text-lg font-extrabold text-forest-900 font-brand-heading">
                  Manage Patient's Music & Therapeutic Playlists
                </h4>
                <p className="text-xs sm:text-sm text-forest-800/80 mt-0.5">
                  Browse YouTube audio catalog, curate golden-era queues, and monitor 30-day listening history.
                </p>
              </div>
              <a
                href={`${NEUROMUSIC_URL}/?name=${encodeURIComponent(user.name)}&role=caregiver`}
                className="px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm shadow-xs transition-colors shrink-0 inline-flex items-center justify-center space-x-1.5"
              >
                <span>Open Manager →</span>
              </a>
            </div>
          </div>
        )}

        {/* Mock Navigation Notice */}
        <div className="bg-muga-50/80 border border-muga-200 rounded-2xl p-4 mb-6 text-xs text-charcoal-800 flex items-start space-x-3">
          <span className="text-lg">🧭</span>
          <div>
            <span className="font-bold">Role-Based Target Route: </span>
            <code className="bg-white px-2 py-0.5 rounded text-forest-700 font-mono text-xs border border-muga-200">
              {redirectPath}
            </code>
            <p className="text-[#1A202C]/70 mt-1">
              (This is the dedicated endpoint for your role in the full NeuroNova suite. Local session is persisted in your browser.)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              if (user.role === 'caregiver') {
                const uid = encodeURIComponent(user.uid || `user_${(user.name || 'caregiver').toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
                const name = encodeURIComponent(user.name || 'Caregiver');
                window.location.href = `${CAREGIVERPAGE_URL}/?userId=${uid}&name=${name}&role=caregiver`;
                return;
              }
              alert(`Simulating navigation to ${redirectPath}... (Connecting to ${portal.title})`);
            }}
            className="flex-1 py-3.5 rounded-full bg-forest-600 hover:bg-forest-700 text-[#FAF7F2] font-bold text-base shadow-md transition-all text-center cursor-pointer"
          >
            Launch {portal.title} →
          </button>
          <button
            onClick={onBackToAuth}
            className="py-3.5 px-6 rounded-full bg-white hover:bg-cream-100 text-[#1A202C] font-semibold text-sm border border-muga-300 transition-colors"
          >
            Back to Companion Screen
          </button>
        </div>
      </div>
    </div>
  );
};
