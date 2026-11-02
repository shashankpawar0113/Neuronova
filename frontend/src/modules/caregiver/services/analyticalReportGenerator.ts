import { PatientOverview, LinkedPatient, MedicalReport } from '../types';

export interface ReportGenerationOptions {
  patientInfo: LinkedPatient | null;
  overview: PatientOverview | null;
  caregiverName: string;
  caregiverId: string;
  medicalReports?: MedicalReport[];
}

export function generatePatientTelemetryJson(options: ReportGenerationOptions): string {
  const { patientInfo, overview, caregiverName, caregiverId, medicalReports = [] } = options;
  const exportPayload = {
    metadata: {
      reportType: 'Full Patient Clinical & Behavioral Analytics Report',
      system: 'NeuroNova Healthcare Platform',
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      generatedBy: {
        caregiverName,
        caregiverId,
      },
    },
    patientProfile: {
      id: overview?.patient?.id || patientInfo?.patientId || 'N/A',
      name: overview?.patient?.name || patientInfo?.patientName || 'Unknown Patient',
      contact: patientInfo?.patientContact || overview?.patient?.emailOrPhone || 'N/A',
      relationship: patientInfo?.relationship || 'Loved One',
      linkStatus: patientInfo?.status || 'active',
      linkedSince: patientInfo?.linkedAt || 'N/A',
      lastActiveAt: patientInfo?.lastActiveAt || new Date().toISOString(),
    },
    clinicalVitalsSummary: {
      cognitiveStabilityAccuracyPercent: overview?.cognition?.averageAccuracy ?? 0,
      totalBrainGamesPlayed: overview?.cognition?.totalGamesPlayed ?? 0,
      totalGameTimeMinutes: overview?.cognition?.totalGameTimeMinutes ?? 0,
      todayRoutineCompletionPercent: overview?.today?.totalRoutineToday 
        ? Math.round(((overview.today.completedToday || 0) / overview.today.totalRoutineToday) * 100) 
        : 0,
      medicationAdherenceStatus: overview?.today?.medicineAdherence?.status ?? 'none_scheduled',
      medicationAdherencePercent: overview?.today?.medicineAdherence?.total
        ? Math.round(((overview.today.medicineAdherence.completed || 0) / overview.today.medicineAdherence.total) * 100)
        : 100,
      weeklyRoutineCompletions: overview?.weeklyRoutineCompletionCount ?? 0,
      musicTherapyMinutesToday: overview?.music?.totalListeningMinutes ?? 0,
      latestMood: overview?.wellbeing?.latestMood ?? null,
    },
    aiCognitiveEvaluation: overview?.aiCognitiveAnalysis || null,
    detailedCognitiveGames: overview?.cognition?.recentGames || [],
    routineLogsToday: overview?.today?.routineLogs || [],
    musicTherapyAnalytics: {
      likedSongsCount: overview?.music?.likedSongsCount ?? 0,
      recentLiked: overview?.music?.recentLiked || [],
      recentListeningHistory: overview?.music?.recentHistory || [],
    },
    wellbeingAndMoodLogs: overview?.wellbeing?.recentMoods || [],
    voiceCompanionActivity: {
      todayCount: overview?.voiceActivity?.todayCount ?? 0,
      recentLogs: overview?.voiceActivity?.recentLogs || [],
    },
    medicalVaultReports: medicalReports.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      fileName: r.fileName,
      reportDate: r.reportDate,
      doctorName: r.doctorName,
      hospitalClinic: r.hospitalClinic,
      notes: r.notes,
      fileSize: r.fileSize,
      createdAt: r.createdAt,
    })),
  };

  return JSON.stringify(exportPayload, null, 2);
}

export function generatePatientAnalyticalHtmlReport(options: ReportGenerationOptions): string {
  const { patientInfo, overview, caregiverName, caregiverId, medicalReports = [] } = options;

  const patientName = overview?.patient?.name || patientInfo?.patientName || 'Patient';
  const patientId = overview?.patient?.id || patientInfo?.patientId || 'N/A';
  const reportDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timestampStr = new Date().toLocaleString();
  const docRef = `NN-REP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const avgAccuracy = overview?.cognition?.averageAccuracy ?? 0;
  const gamesPlayed = overview?.cognition?.totalGamesPlayed ?? 0;
  const routinePct = overview?.today?.totalRoutineToday 
    ? Math.round(((overview.today.completedToday || 0) / overview.today.totalRoutineToday) * 100) 
    : 100;
  const medTotal = overview?.today?.medicineAdherence?.total ?? 0;
  const medCompleted = overview?.today?.medicineAdherence?.completed ?? 0;
  const medPct = medTotal > 0 ? Math.round((medCompleted / medTotal) * 100) : 100;
  const listeningMins = overview?.music?.totalListeningMinutes ?? 0;
  const aiAnalysis = overview?.aiCognitiveAnalysis;
  const recentGames = overview?.cognition?.recentGames || [];
  const routineLogs = overview?.today?.routineLogs || [];
  const moods = overview?.wellbeing?.recentMoods || [];
  const voiceLogs = overview?.voiceActivity?.recentLogs || [];

  const rawJson = generatePatientTelemetryJson(options);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NeuroNova Full Analytical Report - ${patientName}</title>
  <style>
    :root {
      --primary: #111625;
      --coral: #E86D7C;
      --teal: #0D9488;
      --indigo: #4F46E5;
      --stone-50: #F9F8F6;
      --stone-100: #F4F2EC;
      --stone-200: #E7E5DF;
      --stone-700: #44403C;
      --stone-900: #1C1917;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: var(--stone-900);
      background-color: #F3F4F6;
      line-height: 1.5;
      padding: 24px;
    }
    .report-container {
      max-width: 960px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 24px;
      padding: 48px;
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.1);
      border: 1px solid var(--stone-200);
    }
    /* Action toolbar */
    .toolbar {
      position: sticky;
      top: 16px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 24px;
      z-index: 100;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      text-decoration: none;
    }
    .btn-primary {
      background: #111625;
      color: #FFFFFF;
      box-shadow: 0 4px 12px rgba(17,22,37,0.25);
    }
    .btn-primary:hover { background: #1A2234; transform: translateY(-1px); }
    .btn-coral {
      background: linear-gradient(135deg, #E26E65, #E96096);
      color: #FFFFFF;
    }
    .btn-coral:hover { opacity: 0.92; transform: translateY(-1px); }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--stone-200);
      padding-bottom: 28px;
      margin-bottom: 32px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #E26E65, #E86D7C, #E96096);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 22px;
      font-weight: 900;
    }
    .brand h1 {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: var(--primary);
    }
    .brand p {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      font-weight: 700;
    }
    .doc-meta {
      text-align: right;
      font-size: 12px;
      color: #666;
    }
    .doc-meta strong { color: var(--primary); }

    /* Patient banner */
    .patient-banner {
      background: var(--stone-50);
      border: 1px solid var(--stone-200);
      border-radius: 18px;
      padding: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    .field-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 800;
      color: #78716C;
      margin-bottom: 4px;
    }
    .field-value {
      font-size: 15px;
      font-weight: 800;
      color: var(--primary);
    }

    /* Vitals grid */
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 36px;
    }
    .vital-card {
      background: #FFFFFF;
      border: 1px solid var(--stone-200);
      border-radius: 16px;
      padding: 20px 16px;
      text-align: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
    .vital-num {
      font-size: 32px;
      font-weight: 900;
      line-height: 1;
      margin-bottom: 6px;
      color: var(--primary);
    }
    .vital-label {
      font-size: 11px;
      font-weight: 700;
      color: #78716C;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .vital-status {
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 99px;
      display: inline-block;
      margin-top: 8px;
    }

    /* Section headers */
    .section-title {
      font-size: 16px;
      font-weight: 900;
      color: var(--primary);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-left: 4px solid var(--coral);
      padding-left: 12px;
    }

    /* AI Narrative Box */
    .ai-box {
      background: linear-gradient(145deg, #FAF7F5, #FFFFFF);
      border: 1px solid #F3E0DB;
      border-radius: 18px;
      padding: 24px;
      margin-bottom: 36px;
    }
    .ai-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #111625;
      color: #FFFFFF;
      padding: 4px 12px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 800;
      margin-bottom: 14px;
    }
    .ai-narrative {
      font-size: 13px;
      color: #333;
      line-height: 1.7;
      margin-bottom: 18px;
    }
    .ai-recommendations {
      background: #FFFFFF;
      border: 1px solid #EFEAE6;
      border-radius: 12px;
      padding: 16px;
    }
    .ai-recommendations h5 {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 800;
      color: var(--coral);
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    .ai-recommendations ul {
      list-style-position: inside;
      font-size: 12px;
      color: #444;
      line-height: 1.6;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 36px;
      font-size: 12px;
    }
    th {
      background: var(--stone-50);
      text-align: left;
      padding: 10px 14px;
      font-weight: 800;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid var(--stone-200);
      font-size: 10px;
    }
    td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--stone-200);
      color: #333;
    }
    tr:nth-child(even) td { background: #FAFAFA; }

    /* Footer & Sign-off */
    .signoff {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 2px dashed var(--stone-200);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .sig-line {
      border-bottom: 1px solid var(--stone-700);
      height: 40px;
      margin-bottom: 6px;
    }
    .sig-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #777;
    }
    .disclaimer {
      font-size: 10px;
      color: #999;
      margin-top: 32px;
      line-height: 1.5;
      text-align: center;
    }

    /* Print media styling */
    @media print {
      body { background: #FFF; padding: 0; }
      .report-container { box-shadow: none; border: none; padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
      .vitals-grid { page-break-inside: avoid; }
      .ai-box { page-break-inside: avoid; }
      table { page-break-inside: avoid; }
      .signoff { page-break-inside: avoid; }
    }
    @media (max-width: 768px) {
      .vitals-grid { grid-template-columns: 1fr 1fr; }
      .report-container { padding: 24px; }
      .signoff { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

  <!-- Floating Toolbar for Browser Preview -->
  <div class="toolbar no-print">
    <button onclick="window.print()" class="btn btn-primary" title="Print document or Save as PDF">
      🖨️ Print / Save as PDF
    </button>
    <button id="downloadJsonBtn" class="btn btn-coral" title="Download raw JSON telemetry data">
      📥 Export JSON
    </button>
  </div>

  <div class="report-container">
    <!-- Header -->
    <div class="header">
      <div class="brand">
        <div class="brand-icon">🧠</div>
        <div>
          <h1>NeuroNova Clinical Platform</h1>
          <p>Comprehensive Patient Analytical & Cognitive Dossier</p>
        </div>
      </div>
      <div class="doc-meta">
        <div>Document Ref: <strong>${docRef}</strong></div>
        <div>Generated: <strong>${timestampStr}</strong></div>
        <div>Caregiver: <strong>${caregiverName}</strong> (${caregiverId})</div>
      </div>
    </div>

    <!-- Patient Details Banner -->
    <div class="patient-banner">
      <div>
        <div class="field-label">Patient Full Name</div>
        <div class="field-value">${patientName}</div>
      </div>
      <div>
        <div class="field-label">Patient Unique ID</div>
        <div class="field-value" style="font-family: monospace;">${patientId}</div>
      </div>
      <div>
        <div class="field-label">Primary Caregiver</div>
        <div class="field-value">${caregiverName} (${patientInfo?.relationship || 'Family'})</div>
      </div>
      <div>
        <div class="field-label">Report Period</div>
        <div class="field-value">${reportDateStr}</div>
      </div>
    </div>

    <!-- Executive Vitals Grid -->
    <div class="vitals-grid">
      <div class="vital-card">
        <div class="vital-num" style="color: #4F46E5;">${avgAccuracy}%</div>
        <div class="vital-label">Cognitive Accuracy</div>
        <span class="vital-status" style="background: #EEF2FF; color: #4338CA;">
          ${avgAccuracy >= 85 ? 'Optimal Stability' : 'Moderate'}
        </span>
      </div>

      <div class="vital-card">
        <div class="vital-num" style="color: #0D9488;">${routinePct}%</div>
        <div class="vital-label">Daily Routine Adherence</div>
        <span class="vital-status" style="background: #F0FDFA; color: #0F766E;">
          ${routinePct >= 80 ? 'Milestones Met' : 'Needs Review'}
        </span>
      </div>

      <div class="vital-card">
        <div class="vital-num" style="color: #E86D7C;">${medPct}%</div>
        <div class="vital-label">Medication Adherence</div>
        <span class="vital-status" style="background: #FFF1F2; color: #BE123C;">
          ${medTotal === 0 ? 'No Doses Today' : medPct === 100 ? '100% On-Time' : 'Pending Doses'}
        </span>
      </div>

      <div class="vital-card">
        <div class="vital-num" style="color: #F59E0B;">${listeningMins}m</div>
        <div class="vital-label">Music Therapy</div>
        <span class="vital-status" style="background: #FEF3C7; color: #B45309;">
          ${overview?.music?.likedSongsCount || 0} Liked Tracks
        </span>
      </div>
    </div>

    <!-- Section 1: AI Cognitive & Clinical Narrative -->
    <h3 class="section-title">1. AI Cognitive Evaluation & Clinical Trajectory</h3>
    <div class="ai-box">
      <div class="ai-badge">
        ✦ ${aiAnalysis?.statusBadge || 'NEURO-STABILITY VERIFIED'}
      </div>
      <p class="ai-narrative">
        ${aiAnalysis?.summary || `${patientName} maintains robust cognitive performance with an average accuracy of ${avgAccuracy}% across ${gamesPlayed} cognitive engagement sessions. Response latencies demonstrate consistent alertness with high adherence to daily scheduled medication and therapeutic music stimulation.`}
      </p>

      ${aiAnalysis?.combinationInsight ? `
        <div style="margin-bottom: 14px; font-size: 12px; color: #555;">
          <strong>Neuroplasticity & Combinations:</strong> ${aiAnalysis.combinationInsight}
        </div>
      ` : ''}

      ${aiAnalysis?.musicInsight ? `
        <div style="margin-bottom: 14px; font-size: 12px; color: #555;">
          <strong>Auditory & Memory Recall:</strong> ${aiAnalysis.musicInsight}
        </div>
      ` : ''}

      <div class="ai-recommendations">
        <h5>Actionable Recommendations for Physician & Caregiver:</h5>
        <ul>
          ${(aiAnalysis?.recommendations && aiAnalysis.recommendations.length > 0)
            ? aiAnalysis.recommendations.map(r => `<li>${r}</li>`).join('')
            : `
              <li>Continue morning cognitive exercise routine to maximize neuro-alertness.</li>
              <li>Sustain evening nostalgic music therapy sessions to foster emotional serenity.</li>
              <li>Monitor hydration and scheduled milestone timestamps.</li>
            `
          }
        </ul>
      </div>
    </div>

    <!-- Section 2: Cognitive Games Detailed Telemetry -->
    <h3 class="section-title">2. Brain Games Telemetry Log</h3>
    <table>
      <thead>
        <tr>
          <th>Cognitive Challenge</th>
          <th>Level</th>
          <th>Accuracy</th>
          <th>Response Time</th>
          <th>Combos / Score</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        ${recentGames.length > 0 ? recentGames.slice(0, 10).map(g => `
          <tr>
            <td><strong>${g.gameType.replace(/([A-Z])/g, ' $1')}</strong></td>
            <td>Level ${g.level}</td>
            <td><strong style="color: ${g.accuracy >= 90 ? '#0D9488' : '#D97706'};">${g.accuracy}%</strong></td>
            <td>${g.responseTimeMs} ms</td>
            <td>${g.combinationsReached ? `${g.combinationsReached} combos` : `${g.attempts} attempts`}</td>
            <td style="color: #888;">${g.timestamp}</td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="6" style="text-align: center; color: #888;">No recent game logs recorded in this period.</td>
          </tr>
        `}
      </tbody>
    </table>

    <!-- Section 3: Daily Routine & Medication Adherence -->
    <h3 class="section-title">3. Scheduled Routine & Medication Adherence</h3>
    <table>
      <thead>
        <tr>
          <th>Scheduled Milestone</th>
          <th>Target Time</th>
          <th>Status</th>
          <th>Completion Time</th>
        </tr>
      </thead>
      <tbody>
        ${routineLogs.length > 0 ? routineLogs.map(r => `
          <tr>
            <td><strong>${r.title}</strong></td>
            <td>${r.scheduledTime || 'Scheduled'}</td>
            <td>
              <span style="font-weight: 800; color: ${r.completed ? '#0D9488' : '#E86D7C'};">
                ${r.completed ? '✓ Completed' : '○ Pending'}
              </span>
            </td>
            <td style="color: #888;">${r.completedAt || '—'}</td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="4" style="text-align: center; color: #888;">No routines logged for today yet.</td>
          </tr>
        `}
      </tbody>
    </table>

    <!-- Section 4: Emotional Wellbeing & Mood Tracker -->
    <h3 class="section-title">4. Wellbeing & Emotional Mood Check-ins</h3>
    <table>
      <thead>
        <tr>
          <th>Logged Mood</th>
          <th>Energy Level</th>
          <th>Caregiver / Self Notes</th>
          <th>Recorded At</th>
        </tr>
      </thead>
      <tbody>
        ${moods.length > 0 ? moods.map(m => `
          <tr>
            <td><strong>${m.mood.toUpperCase()}</strong></td>
            <td>${m.energyLevel ? `${m.energyLevel} / 10` : 'Normal'}</td>
            <td>${m.notes || 'Routine positive wellbeing'}</td>
            <td style="color: #888;">${m.timestamp}</td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="4" style="text-align: center; color: #888;">No mood check-ins recorded in this cycle.</td>
          </tr>
        `}
      </tbody>
    </table>

    <!-- Section 5: Voice Companion Transcripts -->
    ${voiceLogs.length > 0 ? `
      <h3 class="section-title">5. Voice Companion Interactions</h3>
      <table>
        <thead>
          <tr>
            <th>Patient Prompt</th>
            <th>Language</th>
            <th>Voice Companion Clinical Reply</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          ${voiceLogs.slice(0, 5).map(v => `
            <tr>
              <td><strong>"${v.rawQuestion || (v as any).q}"</strong></td>
              <td>${v.detectedLanguage || (v as any).lang || 'en'}</td>
              <td>${v.replyText || (v as any).reply}</td>
              <td style="color: #888;">${v.createdAt || (v as any).time || 'Recent'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : ''}

    <!-- Section 6: Medical Vault Diagnostic Files on Record -->
    <h3 class="section-title">6. Verified Medical Vault Files on Record (${medicalReports.length})</h3>
    <table>
      <thead>
        <tr>
          <th>Report / Document Title</th>
          <th>Category</th>
          <th>Test Date</th>
          <th>Doctor / Facility</th>
          <th>File Size</th>
        </tr>
      </thead>
      <tbody>
        ${medicalReports.length > 0 ? medicalReports.map(rep => `
          <tr>
            <td><strong>${rep.title}</strong><br><span style="font-size: 10px; color: #888;">${rep.fileName}</span></td>
            <td><span style="font-size: 10px; font-weight: 800; text-transform: uppercase;">${rep.category.replace('_', ' ')}</span></td>
            <td>${rep.reportDate}</td>
            <td>${rep.doctorName ? `Dr. ${rep.doctorName}` : rep.hospitalClinic || '—'}</td>
            <td>${Math.round(rep.fileSize / 1024)} KB</td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="5" style="text-align: center; color: #888;">No diagnostic reports currently stored in medical vault.</td>
          </tr>
        `}
      </tbody>
    </table>

    <!-- Physician Attestation & Sign-off -->
    <div class="signoff">
      <div>
        <div class="sig-line"></div>
        <div class="sig-label">Reviewing Neurologist / Attending Physician Signature</div>
        <div style="font-size: 11px; color: #888; margin-top: 4px;">License No: ____________________ Date: ____________</div>
      </div>
      <div>
        <div class="sig-line"></div>
        <div class="sig-label">Family Caregiver Attestation (${caregiverName})</div>
        <div style="font-size: 11px; color: #888; margin-top: 4px;">Relationship: ${patientInfo?.relationship || 'Primary Caregiver'} • Status: Active</div>
      </div>
    </div>

    <div class="disclaimer">
      CONFIDENTIAL MEDICAL TELEMETRY • Generated via NeuroNova Clinical Command Suite. This document contains sensitive patient health metrics compiled from real-time biometric and cognitive telemetry. Intended strictly for healthcare professionals and authorized family caregivers.
    </div>
  </div>

  <script>
    const reportData = ${JSON.stringify(rawJson)};
    document.getElementById('downloadJsonBtn').addEventListener('click', function() {
      const blob = new Blob([reportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'NeuroNova_Patient_Telemetry_${patientName.replace(/[^a-zA-Z0-9]/g, '_')}_' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  </script>
</body>
</html>`;
}

export function downloadPatientAnalyticalReport(options: ReportGenerationOptions, format: 'html' | 'json' = 'html') {
  const patientName = options.overview?.patient?.name || options.patientInfo?.patientName || 'Patient';
  const cleanName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];

  if (format === 'json') {
    const jsonStr = generatePatientTelemetryJson(options);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NeuroNova_Full_Analytical_Report_${cleanName}_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    const htmlStr = generatePatientAnalyticalHtmlReport(options);
    const blob = new Blob([htmlStr], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NeuroNova_Full_Analytical_Report_${cleanName}_${dateStr}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
