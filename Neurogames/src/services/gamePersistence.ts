import type { GameResult } from '../types';
import { BACKEND_URL } from '../config/urls';

export interface GameUserSession {
  userId: string;
  name: string;
  role: string;
}

export const getGameUserSession = (): GameUserSession => {
  try {
    // 0. Query parameters (passed when navigating from homepage or authpage)
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get('userId') || params.get('uid');
      const queryName = params.get('name') || params.get('user') || params.get('displayName');
      const queryRole = params.get('role') || 'patient';

      if (queryId || queryName) {
        const userId = queryId || `user_${(queryName || 'friend').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        const name = queryName ? queryName.trim() : 'Friend';
        const session: GameUserSession = { userId, name, role: queryRole };
        try {
          localStorage.setItem('neuronova_auth_session', JSON.stringify({
            ...session,
            signedInAt: new Date().toISOString(),
          }));
        } catch (_) {}
        return session;
      }
    }

    // 1. Check local session storage
    const rawSession = localStorage.getItem('neuronova_auth_session');
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      const name = (parsed?.name || parsed?.displayName || parsed?.emailOrPhone?.split('@')[0] || 'Friend').trim();
      const userId = parsed?.userId || parsed?.uid || `user_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const role = parsed?.role || 'patient';
      return { userId, name, role };
    }
  } catch (err) {
    console.warn('Could not read user session in games:', err);
  }

  return { userId: 'guest_user', name: 'Friend', role: 'patient' };
};

export const persistGameResult = async (result: GameResult): Promise<void> => {
  const session = getGameUserSession();
  const userId = session.userId;

  // 1. Scoped local backup (strictly per-user)
  try {
    const localKey = `neuronova_game_history_${userId}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
    existing.unshift(result);
    localStorage.setItem(localKey, JSON.stringify(existing.slice(0, 50)));
  } catch (err) {
    console.warn('Could not write scoped local game cache:', err);
  }

  // 2. Central backend persistence
  try {
    const response = await fetch(`${BACKEND_URL}/api/user/${encodeURIComponent(userId)}/games/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
    console.log(`[Persistence] Game result successfully saved for user: ${userId}`);
  } catch (err) {
    console.error(`[Persistence Error] Failed to persist game result to backend:`, err);
  }
};

export const fetchUserGameResults = async (): Promise<GameResult[]> => {
  const session = getGameUserSession();
  const userId = session.userId;

  try {
    const response = await fetch(`${BACKEND_URL}/api/user/${encodeURIComponent(userId)}/games/results`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.results)) {
        return data.results.map((r: any) => ({
          gameType: r.game_type,
          level: r.level,
          accuracy: r.accuracy,
          responseTimeMs: r.response_time_ms,
          attempts: r.attempts,
          timestamp: r.played_at || r.timestamp,
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to fetch user game results from backend, checking local cache:', err);
  }

  // Fallback to per-user cache
  try {
    const localKey = `neuronova_game_history_${userId}`;
    return JSON.parse(localStorage.getItem(localKey) || '[]');
  } catch {
    return [];
  }
};
