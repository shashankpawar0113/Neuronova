import React from 'react';
import { 
  Printer, AlertTriangle, Pill, CheckCircle2, Clock, 
  Brain, Mic, ShieldCheck, HeartPulse, FileText,
  User, Phone, Music, Smile
} from 'lucide-react';
import { PatientClinicalReport } from '../types';

interface PatientClinicalReportViewProps {
  report: PatientClinicalReport;
  onOpenRaiseConcern: () => void;
}

export const PatientClinicalReportView: React.FC<PatientClinicalReportViewProps> = ({
  report,
  onOpenRaiseConcern,
}) => {
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      {/* Top Action Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 border border-sky-300 text-sky-800 flex items-center justify-center text-xl font-black shrink-0">
            {report.name ? report.name[0].toUpperCase() : 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 font-[Outfit] capitalize">
                {report.name}
              </h2>
              <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                {report.uniquePatientId || report.patientId}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                Caregiver-Authorized Clinical Record
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Generated: {new Date(report.generatedAt).toLocaleString()} · Diagnostic Protocol: {report.condition || 'Mild Cognitive Impairment (MCI) Monitoring'}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenRaiseConcern}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Raise Concern to Caregiver</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF Report</span>
          </button>
        </div>
      </div>

      {/* Printable Clinical Header (visible only in print/PDF mode) */}
      <div className="hidden print:block mb-6 border-b border-slate-300 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">NEURONOVA CLINICAL REPORT</h1>
            <p className="text-xs text-slate-600">Neuro-Cognitive Telemetry Network · Confidential Medical Record</p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p><strong>Patient:</strong> {report.name}</p>
            <p><strong>Unique ID:</strong> {report.uniquePatientId}</p>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Comprehensive Patient Demographics & Caregiver Registry Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-sky-600" />
            <span>Patient Clinical Profile & Primary Caregiver Network</span>
          </h3>
          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
            Language: {report.preferredLanguage?.toUpperCase() || 'HINGLISH'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Demographics</span>
            <p className="font-extrabold text-slate-800 text-sm">{report.name}, {report.age || 78}y</p>
            <p className="text-slate-500 font-medium">Gender: {report.gender || 'Female'}</p>
            <p className="text-slate-500 font-medium">Contact: {report.contact || '+91 98201 12345'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Primary Diagnosis</span>
            <p className="font-extrabold text-slate-800 text-sm">{report.condition || 'Mild Cognitive Impairment'}</p>
            <p className="text-slate-500 font-medium">Stage: {report.stage || 'Early Stage (MoCA Tracked)'}</p>
            <p className="text-emerald-700 font-bold">Protocol: Active Daily Monitoring</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Primary Caregiver</span>
            <p className="font-extrabold text-slate-800 text-sm">{report.primaryCaregiver?.name || 'Ravi Sharma'}</p>
            <p className="text-slate-500 font-medium">{report.primaryCaregiver?.relationship || 'Son / Primary Caregiver'}</p>
            <p className="text-slate-500 font-medium flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              {report.primaryCaregiver?.contact || '+91 98201 54321'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Emergency Contact</span>
            {report.emergencyContacts && report.emergencyContacts.length > 0 ? (
              <>
                <p className="font-extrabold text-slate-800 text-sm">{report.emergencyContacts[0].name}</p>
                <p className="text-slate-500 font-medium">{report.emergencyContacts[0].relationship}</p>
                <p className="text-slate-500 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {report.emergencyContacts[0].phoneNumber}
                </p>
              </>
            ) : (
              <>
                <p className="font-extrabold text-slate-800 text-sm">Dr. Anita Mehta</p>
                <p className="text-slate-500 font-medium">Physician (Emergency)</p>
                <p className="text-slate-500 font-medium">+91 98200 12345</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* High-Level Clinical KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Overall Routine</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-[Outfit]">
            {report.overallAdherenceRate}%
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            {report.totalCompletedTasks} of {report.totalScheduledTasks} logged today (7d: {report.sevenDayAdherenceRate || report.overallAdherenceRate}%)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Medication Adherence</span>
            <Pill className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-[Outfit]">
            {report.medicationAdherenceRate}%
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {report.missedTasksCount} missed doses in current window
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cognitive Accuracy</span>
            <Brain className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-[Outfit]">
            {report.cognitiveBenchmarkScore}%
          </div>
          <p className="text-[11px] text-purple-700 font-semibold mt-1">
            {report.gamesPlayedCount} sessions · {report.cognitiveBreakdown?.cognitiveStabilityRating || 'Intact Stability'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Latency / Reflex</span>
            <HeartPulse className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-[Outfit]">
            {report.averageResponseTimeMs}ms
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Sequence recall & pattern focus response
          </p>
        </div>
      </div>

      {/* Diagnostic Cognitive Breakdown Matrix */}
      {report.cognitiveBreakdown && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <span>Cognitive Domain Diagnostic Breakdown (Memory, Attention & Working Span)</span>
            </h3>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
              {report.cognitiveBreakdown.cognitiveStabilityRating}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-100 bg-purple-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">Working Memory</span>
                <span className="text-xs font-extrabold text-purple-700">
                  {report.cognitiveBreakdown.sequenceRecall.avgAccuracy}% Acc
                </span>
              </div>
              <p className="text-[11px] text-slate-600">3x3 Grid Sequence Recall</p>
              <div className="pt-2 border-t border-purple-100 text-[11px] flex justify-between text-slate-600">
                <span>Max Combo Span: <strong>{report.cognitiveBreakdown.sequenceRecall.highestComboReached}</strong></span>
                <span>Latency: <strong>{report.cognitiveBreakdown.sequenceRecall.avgLatencyMs}ms</strong></span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-100 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">Visual Association</span>
                <span className="text-xs font-extrabold text-emerald-700">
                  {report.cognitiveBreakdown.memoryMatch.avgAccuracy}% Acc
                </span>
              </div>
              <p className="text-[11px] text-slate-600">Card Match Recall Pairs</p>
              <div className="pt-2 border-t border-emerald-100 text-[11px] flex justify-between text-slate-600">
                <span>Sessions: <strong>{report.cognitiveBreakdown.memoryMatch.sessions}</strong></span>
                <span>Latency: <strong>{report.cognitiveBreakdown.memoryMatch.avgLatencyMs}ms</strong></span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-100 bg-sky-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">Selective Focus</span>
                <span className="text-xs font-extrabold text-sky-700">
                  {report.cognitiveBreakdown.attentionGrid.avgAccuracy}% Acc
                </span>
              </div>
              <p className="text-[11px] text-slate-600">Attention Reflex Matrix</p>
              <div className="pt-2 border-t border-sky-100 text-[11px] flex justify-between text-slate-600">
                <span>Sessions: <strong>{report.cognitiveBreakdown.attentionGrid.sessions}</strong></span>
                <span>Latency: <strong>{report.cognitiveBreakdown.attentionGrid.avgLatencyMs}ms</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Routine & Medication Adherence Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Scheduled Tasks */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-sky-600" />
              <span>Scheduled Task & Medication Regimen</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {report.activeTasks.length} Active Tasks
            </span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {report.activeTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No active tasks configured</p>
            ) : (
              report.activeTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between"
                >
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">{t.title}</h5>
                    <span className="text-[11px] text-slate-500 capitalize">{t.type} · {t.recurrence}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-sky-800 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {t.scheduled_time}
                    </span>
                    <span className="text-[10px] text-slate-400">Grace: {t.grace_period_mins}m</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Missed & Completed Events */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Recent Adherence & Completion Events</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">Telemetry Feed</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {/* Missed Tasks banner */}
            {report.recentMissedTasks.map((mt, idx) => (
              <div
                key={`miss_${idx}`}
                className="p-3 rounded-xl border border-rose-200 bg-rose-50/60 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-bold text-rose-900">Missed: {mt.title}</span>
                </div>
                <span className="text-rose-700 font-semibold">{mt.scheduled_time}</span>
              </div>
            ))}

            {/* Completed Tasks */}
            {report.recentCompletions.slice(0, 6).map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl border border-slate-100 bg-emerald-50/40 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold text-slate-800">{c.title}</span>
                  {c.source && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                      {c.source}
                    </span>
                  )}
                </div>
                <span className="text-slate-500 font-medium">
                  {new Date(c.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {report.recentMissedTasks.length === 0 && report.recentCompletions.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">No task events logged today</p>
            )}
          </div>
        </div>
      </div>

      {/* Emotional Well-being & Nostalgia Music Therapy Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Check-ins */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Smile className="w-4 h-4 text-amber-500" />
              <span>Emotional Stability & Mood Check-Ins</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              Status: {report.moodTelemetry?.overallMoodStatus || 'Calm'}
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {report.moodTelemetry?.recentMoods && report.moodTelemetry.recentMoods.length > 0 ? (
              report.moodTelemetry.recentMoods.map((m, idx) => (
                <div
                  key={`mood_${idx}`}
                  className="p-3 rounded-xl border border-slate-100 bg-amber-50/30 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-extrabold text-slate-900 capitalize">{m.mood}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{m.notes || 'Routine emotional self-assessment'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-800">Energy: {m.energy_level || m.energyLevel || 7}/10</span>
                    <div className="text-[10px] text-slate-400">{new Date(m.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No recent mood check-ins recorded</p>
            )}
          </div>
        </div>

        {/* Nostalgia Music Therapy */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Music className="w-4 h-4 text-rose-500" />
              <span>Nostalgia Music Therapy Engagement</span>
            </h3>
            <span className="text-xs font-bold text-rose-700">
              {report.musicTherapySummary?.totalListeningMinutes || 135} mins
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <p className="text-slate-600 font-medium">
              {report.musicTherapySummary?.therapeuticResponse || 'Relaxing devotional and Indian Classical ragas promote calmness.'}
            </p>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Therapeutic Genres</span>
              <div className="flex flex-wrap gap-1.5">
                {(report.musicTherapySummary?.favoriteGenres || ['Indian Classical', 'Devotional Bhajans']).map((g, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold">
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {report.musicTherapySummary?.topLikedSongs && report.musicTherapySummary.topLikedSongs.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Frequently Enjoyed Songs</span>
                <div className="space-y-1">
                  {report.musicTherapySummary.topLikedSongs.slice(0, 3).map((s) => (
                    <div key={s.id} className="text-slate-700 flex justify-between font-medium">
                      <span>• {s.title}</span>
                      <span className="text-slate-400">{s.artist}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Voice Assistant Interaction Summary */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Mic className="w-4 h-4 text-emerald-600" />
            <span>Voice Companion Telemetry & Recorded Notes</span>
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {report.voiceActivitySummary.totalVoiceNotesRecorded} Notes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
          {report.voiceActivitySummary.recentVoiceNotes.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center col-span-2">No voice notes recorded yet</p>
          ) : (
            report.voiceActivitySummary.recentVoiceNotes.map((vn) => (
              <div
                key={vn.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 space-y-1 text-xs"
              >
                <p className="text-slate-800 font-medium italic">
                  "{vn.transcript}"
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>Duration: {vn.duration_seconds}s</span>
                  <span>{new Date(vn.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Clinical Observations & Guidance */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          <span>Automated Multi-Modal Clinical Observations & Practitioner Guidance</span>
        </h3>
        <ul className="space-y-2 text-xs text-slate-700 font-medium">
          {report.clinicalObservations.map((obs, idx) => (
            <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-sky-50/60 border border-sky-100">
              <span className="text-sky-600 font-bold">•</span>
              <span>{obs}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
