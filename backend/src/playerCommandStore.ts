import { CleanTrack } from './youtubeClient.js';

export interface PlayerCommand {
  id: string;
  patientId: string;
  type: 'PLAY_TRACK' | 'PLAY_GENERAL' | 'PAUSE' | 'RESUME';
  track?: CleanTrack;
  query?: string;
  timestamp: number;
}

// In-memory store for active commands mapped by patientId
const activeCommands = new Map<string, PlayerCommand>();

/**
 * Dispatches a player command for a given patient.
 */
export function dispatchPlayerCommand(
  patientId: string,
  type: 'PLAY_TRACK' | 'PLAY_GENERAL' | 'PAUSE' | 'RESUME',
  track?: CleanTrack,
  query?: string
): PlayerCommand {
  const normId = (patientId || 'default-patient').trim();
  const cmd: PlayerCommand = {
    id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    patientId: normId,
    type,
    track,
    query,
    timestamp: Date.now(),
  };

  activeCommands.set(normId, cmd);
  // Also store under common patient ID aliases so mismatch never causes a dropped command
  activeCommands.set('*', cmd);
  activeCommands.set('default-patient', cmd);
  activeCommands.set('guest_user', cmd);
  return cmd;
}

/**
 * Retrieves the latest player command for a patient, optionally filtering by `sinceTimestamp`.
 */
export function getLatestPlayerCommand(patientId: string, sinceTimestamp?: number): PlayerCommand | null {
  const normId = (patientId || 'default-patient').trim();
  const cmd = activeCommands.get(normId) || activeCommands.get('*') || activeCommands.get('default-patient') || activeCommands.get('guest_user');
  if (!cmd) return null;

  // If sinceTimestamp is provided, only return if command is newer
  if (typeof sinceTimestamp === 'number' && cmd.timestamp <= sinceTimestamp) {
    return null;
  }

  // Discard commands older than 90 seconds to prevent stale replay
  if (Date.now() - cmd.timestamp > 90 * 1000) {
    return null;
  }

  return cmd;
}
