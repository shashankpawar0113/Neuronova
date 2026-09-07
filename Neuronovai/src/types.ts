export interface GameResult {
  gameType: 'memory' | 'attention' | 'working_memory' | 'cultural_recall' | string;
  level: number;
  accuracy: number; // 0 to 100
  responseTimeMs: number;
  attempts: number;
  combinationsReached?: number;
  durationMs?: number;
  timestamp: string; // ISO date string
}

export interface RoutineLog {
  routineId: string;
  title: string;
  completed: boolean;
  scheduledTime: string;
  completedAt?: string;
}

export interface ComputedDimensionStats {
  dimension: string;
  currentAccuracy: number;
  previousAccuracy: number;
  changePercent: number; // e.g. +8 or -4
  gamesPlayed: number;
  avgResponseTimeMs: number;
}

export interface ComputedStats {
  patientId: string;
  patientName?: string;
  windowDays: number;
  dimensions: {
    memory: ComputedDimensionStats;
    attention: ComputedDimensionStats;
    working_memory: ComputedDimensionStats;
    cultural_recall: ComputedDimensionStats;
    [key: string]: ComputedDimensionStats;
  };
  routineAdherencePercent: number;
  totalGamesPlayed: number;
  activeDaysCount: number;
  highlightDimension: string;
  concernDimension: string | null;
}

export interface ProgressSummaryRequest {
  patientId: string;
  patientName?: string;
  audience?: 'patient' | 'caregiver';
  gameResults?: GameResult[];
  routineLogs?: RoutineLog[];
  windowDays?: number;
}

export interface ProgressSummaryResponse {
  summary: string;
  highlightDimension: string;
  concernDimension: string | null;
  source: 'llm' | 'fallback';
  audience: 'patient' | 'caregiver';
  computedStats: ComputedStats;
  generatedAt: string;
}
