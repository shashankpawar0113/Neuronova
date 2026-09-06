import React from 'react';
import { 
  HeartHandshake, 
  Users, 
  Plus, 
  LogOut, 
  Music,
  ExternalLink
} from 'lucide-react';
import { LinkedPatient } from '../types';

interface CaregiverNavbarProps {
  caregiverName: string;
  patients: LinkedPatient[];
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string) => void;
  onOpenLinkModal: () => void;
  onLogout: () => void;
}

export const CaregiverNavbar: React.FC<CaregiverNavbarProps> = ({
  caregiverName,
  patients,
  selectedPatientId,
  onSelectPatient,
  onOpenLinkModal,
  onLogout,
}) => {
  return (
    <header className="w-full bg-white/85 backdrop-blur-md border-b border-sky-100 sticky top-0 z-40 px-4 sm:px-8 py-3.5 shadow-warm-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-meadow-600 via-meadow-500 to-sky-600 text-white flex items-center justify-center shadow-warm-xs">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold text-[#1A202C] font-brand-heading leading-tight">
                Neuro<span className="text-meadow-600">Nova</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs">
                Caregiver Hub
              </span>
            </div>
            <p className="text-[11px] text-[#1A202C]/65 font-brand-body hidden sm:block">
              Peaceful monitoring & cognitive companion portal
            </p>
          </div>
        </div>

        {/* Center: Patient Selector (if patients linked) */}
        {patients.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="relative inline-block text-left">
              <label htmlFor="patient-select" className="sr-only">Select Patient</label>
              <div className="flex items-center bg-white/90 border border-meadow-200 rounded-2xl px-3 py-1.5 shadow-2xs">
                <Users className="w-4 h-4 text-meadow-700 mr-2 shrink-0" />
                <select
                  id="patient-select"
                  value={selectedPatientId || ''}
                  onChange={(e) => onSelectPatient(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-extrabold text-[#1A202C] focus:outline-none cursor-pointer pr-4"
                >
                  {patients.map((p) => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.patientName} ({p.relationship})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Link another patient */}
            <button
              onClick={onOpenLinkModal}
              title="Connect another loved one"
              className="p-2 rounded-xl bg-meadow-50 hover:bg-meadow-100 text-meadow-800 border border-meadow-200 transition-colors cursor-pointer text-xs font-bold flex items-center space-x-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Connect Another</span>
            </button>
          </div>
        )}

        {/* Right: Caregiver profile & Exit */}
        <div className="flex items-center space-x-3">
          {/* Music Manager direct link */}
          <a
            href={`http://localhost:5177/?name=${encodeURIComponent(caregiverName)}&role=caregiver`}
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cosmos-50 text-cosmos-800 border border-cosmos-200 hover:bg-cosmos-100 text-xs font-bold transition-colors shadow-2xs"
          >
            <Music className="w-3.5 h-3.5 text-cosmos-600" />
            <span>Nostalgia Console</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          <div className="flex items-center space-x-2 pl-2 border-l border-sky-200/70">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-extrabold text-[#1A202C] block">
                {caregiverName}
              </span>
              <span className="text-[10px] text-meadow-700 font-semibold uppercase tracking-wider block">
                Family Caregiver
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-cream-100 hover:bg-rose-50 text-[#1A202C]/80 hover:text-rose-700 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
              title="Return to Auth Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
