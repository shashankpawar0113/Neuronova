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
    totalGameTimeMinutes?: number;
    highestCombinationReached?: number;
    recentGames: Array<{
      gameType: string;
      level: number;
      accuracy: number;
      responseTimeMs: number;
      attempts: number;
      combinationsReached?: number;
      timestamp: string;
    }>;
    gameAnalytics?: Array<{
      date: string;
      fullDate?: string;
      timeMinutes: number;
      combinations: number;
      accuracy: number;
      gamesCount: number;
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
    totalListeningMinutes?: number;
    musicAnalytics?: Array<{
      date: string;
      fullDate?: string;
      listeningMinutes: number;
      tracksCount: number;
    }>;
    recentHistory?: Array<{
      id: string;
      title: string;
      artist: string;
      albumArt?: string;
      durationMinutes?: number;
      formattedDuration?: string;
      playedAt?: number | string;
      playCount?: number;
      genre?: string;
    }>;
    searchHistory?: Array<{
      query: string;
      timestamp: string;
      count?: number;
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
  aiCognitiveAnalysis?: {
    status: string;
    statusBadge: string;
    summary: string;
    combinationInsight: string;
    musicInsight: string;
    recommendations: string[];
    generatedAt?: string;
    modelUsed?: string;
    source?: string;
  };
  voiceActivity?: {
    recentLogs: VoiceAssistantLog[];
    todayCount: number;
  };
}
