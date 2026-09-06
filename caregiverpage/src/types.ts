export interface CaregiverSession {
  userId: string;
  name: string;
  role: 'caregiver';
}

export interface LinkedPatient {
  linkId: number;
  patientId: string;
  patientName: string;
  patientContact: string;
  relationship: string;
  status: 'active' | 'revoked' | 'pending';
  linkedAt: string;
  todayRoutineCount: number;
  todayCompletedCount: number;
  totalGamesPlayed: number;
  lastActiveAt: string;
  lastMood: string | null;
}

export interface VoiceAssistantLog {
  id: number;
  userId: string;
  userName?: string;
  rawQuestion: string;
  translatedQuestion?: string;
  detectedLanguage: string;
  intent: string;
  replyText: string;
  spokenReply?: string;
  actionLabel?: string;
  actionUrl?: string;
  actionIcon?: string;
  songName?: string;
  source: string;
  createdAt: string;
}

export interface PatientOverview {
  patient: {
    id: string;
    name: string;
    emailOrPhone: string;
    role: string;
  };
  today: {
    date: string;
    routineLogs: Array<{
      routineId: string;
      title: string;
      completed: boolean;
      scheduledTime?: string;
      completedAt?: string;
    }>;
    completedToday: number;
    totalRoutineToday: number;
    medicineAdherence: {
      completed: number;
      total: number;
      status: 'none_scheduled' | 'all_taken' | 'pending';
    };
  };
  cognition: {
    totalGamesPlayed: number;
    averageAccuracy: number;
    recentGames: Array<{
      gameType: string;
      level: number;
      accuracy: number;
      responseTimeMs: number;
      attempts: number;
      timestamp: string;
    }>;
  };
  music: {
    likedSongsCount: number;
    recentLiked: Array<{
      id: string;
      title: string;
      artist: string;
      genre?: string;
    }>;
  };
  wellbeing: {
    recentMoods: Array<{
      id: number;
      mood: string;
      energyLevel?: number;
      notes?: string;
      timestamp: string;
    }>;
    latestMood: {
      mood: string;
      energyLevel?: number;
      notes?: string;
      timestamp: string;
    } | null;
  };
  weeklyRoutineCompletionCount: number;
  voiceActivity?: {
    recentLogs: VoiceAssistantLog[];
    todayCount: number;
  };
}
