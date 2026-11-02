export interface HealthWorkerSession {
  userId: string;
  name: string;
  role: string;
  organization?: string;
  title?: string;
}

export interface AuthorizedPatient {
  id: string;
  worker_id?: string;
  patient_id: string;
  unique_id?: string;
  uniquePatientId?: string;
  patient_name?: string;
  name?: string;
  access_level?: string;
  authorized_at?: string;
  authorizedAt?: string;
}

export interface PatientClinicalReport {
  patientId: string;
  uniquePatientId: string;
  name: string;
  age?: number;
  gender?: string;
  condition?: string;
  stage?: string;
  preferredLanguage?: string;
  contact?: string;
  primaryCaregiver?: {
    name: string;
    relationship: string;
    contact: string;
  };
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phoneNumber: string;
    isPrimary: boolean;
  }>;
  generatedAt: string;
  overallAdherenceRate: number;
  medicationAdherenceRate: number;
  sevenDayAdherenceRate?: number;
  totalScheduledTasks: number;
  totalCompletedTasks: number;
  missedTasksCount: number;
  cognitiveBenchmarkScore: number;
  gamesPlayedCount: number;
  averageResponseTimeMs: number;
  cognitiveBreakdown?: {
    sequenceRecall: {
      gameTitle: string;
      sessions: number;
      avgAccuracy: number;
      highestComboReached: number;
      avgLatencyMs: number;
    };
    memoryMatch: {
      gameTitle: string;
      sessions: number;
      avgAccuracy: number;
      avgLatencyMs: number;
    };
    attentionGrid: {
      gameTitle: string;
      sessions: number;
      avgAccuracy: number;
      avgLatencyMs: number;
    };
    cognitiveStabilityRating: string;
  };
  musicTherapySummary?: {
    totalListeningMinutes: number;
    totalTracksPlayed: number;
    favoriteGenres: string[];
    topLikedSongs: Array<{
      id: string;
      title: string;
      artist: string;
      genre?: string;
    }>;
    therapeuticResponse: string;
  };
  moodTelemetry?: {
    recentMoods: Array<{
      mood: string;
      energy_level?: number;
      energyLevel?: number;
      notes?: string;
      timestamp: string;
    }>;
    overallMoodStatus: string;
  };
  activeTasks: Array<{
    id: string;
    title: string;
    description?: string;
    type: string;
    scheduled_time: string;
    recurrence: string;
    grace_period_mins: number;
    is_active?: boolean | number;
  }>;
  recentCompletions: Array<{
    id: string;
    title: string;
    type: string;
    completed_at: string;
    source?: string;
  }>;
  recentMissedTasks: Array<{
    id: string;
    title: string;
    scheduled_time: string;
  }>;
  gameTrends: Array<{
    gameType: string;
    accuracy: number;
    responseTimeMs: number;
    level: number;
    timestamp: string;
  }>;
  voiceActivitySummary: {
    totalVoiceNotesRecorded: number;
    recentVoiceNotes: Array<{
      id: string;
      transcript: string;
      duration_seconds: number;
      created_at: string;
    }>;
  };
  clinicalObservations: string[];
  clinicalConcerns?: Array<{
    id: string;
    concern_type?: string;
    concernType?: string;
    description: string;
    status: string;
    created_at?: string;
  }>;
}
