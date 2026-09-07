// Shared result shape emitted by all 5 games
export interface GameResult {
  gameType:
    | 'memoryMatch'
    | 'attentionGame'
    | 'sequenceRecall'
    | 'culturalGame'
    | 'dailyRoutineRecall';
  level: number;
  accuracy: number;       // 0–100
  responseTimeMs: number;
  attempts: number;
  combinationsReached?: number; // Highest combination streak reached (e.g. in Sequence Recall)
  durationMs?: number;          // Total session duration in milliseconds
  timestamp: string;      // ISO 8601
}

// Reminiscence engagement event (Memory Vault — kept separate from GameResult)
export interface ReminiscenceEvent {
  photoId: string;
  personName: string;
  relationship: string;
  interacted: boolean;    // did the patient engage with the quiz?
  responded: boolean;     // did they select any option?
  timestamp: string;
}

export type GameType =
  | 'memoryMatch'
  | 'attentionGame'
  | 'sequenceRecall'
  | 'culturalGame'
  | 'dailyRoutineRecall'
  | 'vault';

// Runtime export safeguards for Vite module resolution
export const GameResult = {} as unknown;
export const ReminiscenceEvent = {} as unknown;
export const GameType = {} as unknown;
