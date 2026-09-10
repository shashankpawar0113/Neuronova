import React from 'react';
import { Stethoscope, LogOut, Search, UserCheck } from 'lucide-react';
import { HealthWorkerSession } from '../types';

interface HealthWorkerNavbarProps {
  session: HealthWorkerSession;
  onOpenLookup: () => void;
  onLogout: () => void;
  authorizedCount: number;
}

export const HealthWorkerNavbar: React.FC<HealthWorkerNavbarProps> = ({
  session,
  onOpenLookup,
  onLogout,
  authorizedCount,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand & Badge */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-900 tracking-tight font-[Outfit]">
              NEURONOVA
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-extrabold tracking-wider uppercase border border-sky-200">
              Clinical Portal
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Healthcare Practitioner & Telemetry Station
          </p>
        </div>
      </div>

      {/* Center / Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenLookup}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-sky-50 hover:border-sky-300 border border-slate-200 text-slate-700 hover:text-sky-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-sky-600" />
          <span>Patient ID Lookup</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{authorizedCount} Active Patients</span>
        </div>
      </div>

      {/* User Info & Logout */}
      <div className="flex items-center space-x-3">
        <div className="text-right hidden md:block">
          <div className="text-xs font-extrabold text-slate-900">
            {session.name}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold">
            {session.organization || 'Apex Neurological Care Network'}
          </div>
        </div>

        <div className="w-9 h-9 rounded-full bg-sky-100 border border-sky-300 text-sky-800 flex items-center justify-center text-xs font-black">
          {session.name[0] || 'D'}
        </div>

        <button
          onClick={onLogout}
          title="Sign out of Clinical Portal"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
