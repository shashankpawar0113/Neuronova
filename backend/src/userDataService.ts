import { db } from './db.js';
import { GameResult, RoutineLog, AICognitiveAnalysis } from './types.js';
import { generateAICognitiveAnalysis, generateContextualClinicalAnalysis } from './aiCognitiveAnalysisService.js';

export interface LikedSongItem {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  durationSeconds?: number;
  durationMinutes?: number;
  formattedDuration?: string;
  genre?: string;
  createdAt?: string;
}

export interface UserPlaylistItem {
  id: string;
  name: string;
  description?: string;
  color?: string;
  tracks: any[];
  createdAt: number;
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

// 1. User Profile
export function syncUserProfile(user: { id: string; name?: string; emailOrPhone?: string; role?: string }) {
  const stmt = db.prepare(`
    INSERT INTO users (id, name, email_or_phone, role, last_login)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name = COALESCE(excluded.name, users.name),
      email_or_phone = COALESCE(excluded.email_or_phone, users.email_or_phone),
      role = COALESCE(excluded.role, users.role),
      last_login = datetime('now')
  `);
  stmt.run(user.id, user.name || '', user.emailOrPhone || '', user.role || 'patient');
}

export function getUserProfile(userId: string) {
  const stmt = db.prepare(`SELECT id, name, email_or_phone as emailOrPhone, role, created_at as createdAt, last_login as lastLogin FROM users WHERE id = ?`);
  return stmt.get(userId) || null;
}

// 2. Liked Songs
export function getLikedSongs(userId: string): LikedSongItem[] {
  const stmt = db.prepare(`
    SELECT
      song_id as id,
      title,
      artist,
      album_art as albumArt,
      duration_seconds as durationSeconds,
      duration_minutes as durationMinutes,
      formatted_duration as formattedDuration,
      genre,
      created_at as createdAt
    FROM liked_songs
    WHERE user_id = ?
    ORDER BY id DESC
  `);
  return (stmt.all(userId) as any[]) || [];
}

export function toggleLikedSong(userId: string, song: LikedSongItem): { liked: boolean } {
  const checkStmt = db.prepare(`SELECT id FROM liked_songs WHERE user_id = ? AND song_id = ?`);
  const existing = checkStmt.get(userId, song.id);

  if (existing) {
    const delStmt = db.prepare(`DELETE FROM liked_songs WHERE user_id = ? AND song_id = ?`);
    delStmt.run(userId, song.id);
    return { liked: false };
  } else {
    const insStmt = db.prepare(`
      INSERT INTO liked_songs (
        user_id, song_id, title, artist, album_art, duration_seconds, duration_minutes, formatted_duration, genre
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insStmt.run(
      userId,
      song.id,
      song.title || 'Unknown Title',
      song.artist || 'Unknown Artist',
      song.albumArt || '',
      song.durationSeconds || 0,
      song.durationMinutes || 0,
      song.formattedDuration || '',
      song.genre || 'nostalgia'
    );
    return { liked: true };
  }
}

// 3. User Playlists
export function getUserPlaylists(userId: string): UserPlaylistItem[] {
  const stmt = db.prepare(`
    SELECT id, name, description, color, tracks_json, created_at as createdAt
    FROM user_playlists
    WHERE user_id = ?
    ORDER BY created_at DESC
  `);
  const rows = stmt.all(userId) as any[];
  return (rows || []).map((r) => {
    let tracks: any[] = [];
    try {
      tracks = JSON.parse(r.tracks_json || '[]');
    } catch (_) {}
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      color: r.color,
      tracks,
      createdAt: r.createdAt,
    };
  });
}

export function saveUserPlaylist(userId: string, playlist: UserPlaylistItem) {
  const stmt = db.prepare(`
    INSERT INTO user_playlists (id, user_id, name, description, color, tracks_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      color = excluded.color,
      tracks_json = excluded.tracks_json
  `);
  stmt.run(
    playlist.id,
    userId,
    playlist.name,
    playlist.description || '',
    playlist.color || '',
    JSON.stringify(playlist.tracks || []),
    playlist.createdAt || Date.now()
  );
}

// 4. Music Listening History & Top Tracks (Per Patient)
export function recordMusicPlay(userId: string, track: any) {
  const now = Date.now();
  const checkStmt = db.prepare(`SELECT id, play_count FROM music_listening_history WHERE user_id = ? AND song_id = ?`);
  const existing = checkStmt.get(userId, track.id) as any;

  if (existing) {
    const updateStmt = db.prepare(`
      UPDATE music_listening_history
      SET play_count = play_count + 1,
          played_at = ?,
          title = COALESCE(?, title),
          artist = COALESCE(?, artist),
          album_art = COALESCE(?, album_art)
      WHERE user_id = ? AND song_id = ?
    `);
    updateStmt.run(now, track.title || null, track.artist || null, track.albumArt || null, userId, track.id);
  } else {
    const insertStmt = db.prepare(`
      INSERT INTO music_listening_history (
        user_id, song_id, title, artist, album_art, duration_seconds, duration_minutes, formatted_duration, genre, played_at, play_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    insertStmt.run(
      userId,
      track.id,
      track.title || 'Unknown Title',
      track.artist || 'Unknown Artist',
      track.albumArt || '',
      track.durationSeconds || 0,
      track.durationMinutes || 0,
      track.formattedDuration || '',
      track.genre || 'nostalgia',
      now
    );
  }
}

export function getTopTracks(userId: string, limit: number = 10): any[] {
  const stmt = db.prepare(`
    SELECT
      song_id as id,
      title,
      artist,
      album_art as albumArt,
      duration_seconds as durationSeconds,
      duration_minutes as durationMinutes,
      formatted_duration as formattedDuration,
      genre,
      played_at as playedAt,
      play_count as playCount
    FROM music_listening_history
    WHERE user_id = ?
    ORDER BY play_count DESC, played_at DESC
    LIMIT ?
  `);
  return (stmt.all(userId, limit) as any[]) || [];
}

export function getMusicListeningHistory(userId: string, limit: number = 50): any[] {
  const stmt = db.prepare(`
    SELECT
      song_id as id,
      title,
      artist,
      album_art as albumArt,
      duration_seconds as durationSeconds,
      duration_minutes as durationMinutes,
      formatted_duration as formattedDuration,
      genre,
      played_at as playedAt,
      play_count as playCount
    FROM music_listening_history
    WHERE user_id = ?
    ORDER BY played_at DESC
    LIMIT ?
  `);
  return (stmt.all(userId, limit) as any[]) || [];
}

export function getMusicSearchHistory(userId: string, limit = 10): Array<{ query: string; timestamp: string }> {
  try {
    const logs = getVoiceAssistantLogs(userId, 40);
    const searches: Array<{ query: string; timestamp: string }> = [];
    logs.forEach(l => {
      if (l.songName) {
        searches.push({ query: l.songName, timestamp: l.createdAt || new Date().toISOString() });
      } else if (l.intent === 'play_specific_song' || l.intent === 'music_request' || l.intent === 'play_general_music') {
        const clean = (l.rawQuestion || '').replace(/^(play|listen to|suno|bajaao|chalao|gaana|song)\s+/i, '').trim();
        if (clean && clean.length > 2) {
          searches.push({ query: clean, timestamp: l.createdAt || new Date().toISOString() });
        }
      }
    });

    const curatedDefaults = [
      { query: 'Peaceful Sitar & Tanpura - Raga Bhairavi', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { query: 'Kishore Kumar - Evergreen 1970s Hits', timestamp: new Date(Date.now() - 14400000).toISOString() },
      { query: 'Mohammad Rafi - Nostalgic Melodies', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { query: 'Lata Mangeshkar - Soothing Bhajans', timestamp: new Date(Date.now() - 172800000).toISOString() },
      { query: 'Hawayein - Arijit Singh Soft Acoustic', timestamp: new Date(Date.now() - 259200000).toISOString() },
    ];

    const all = [...searches, ...curatedDefaults];
    const seen = new Set<string>();
    const unique: Array<{ query: string; timestamp: string }> = [];
    for (const item of all) {
      const k = item.query.toLowerCase().trim();
      if (!seen.has(k)) {
        seen.add(k);
        unique.push(item);
      }
      if (unique.length >= limit) break;
    }
    return unique;
  } catch (_) {
    return [
      { query: 'Peaceful Sitar & Tanpura - Raga Bhairavi', timestamp: new Date().toISOString() },
      { query: 'Kishore Kumar - Evergreen 1970s Hits', timestamp: new Date().toISOString() },
    ];
  }
}

// 5. Game Results
export function recordGameResult(userId: string, result: GameResult) {
  const combinations = (result as any).combinationsReached ?? (result as any).combinations_reached ?? null;
  const stmt = db.prepare(`
    INSERT INTO game_results (
      user_id, game_type, level, accuracy, response_time_ms, attempts, combinations_reached, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    userId,
    result.gameType,
    result.level,
    result.accuracy,
    result.responseTimeMs,
    result.attempts,
    combinations,
    result.timestamp || new Date().toISOString()
  );
}

export function getGameResults(userId: string, limit: number = 100): GameResult[] {
  const stmt = db.prepare(`
    SELECT
      game_type as gameType,
      level,
      accuracy,
      response_time_ms as responseTimeMs,
      attempts,
      combinations_reached as combinationsReached,
      timestamp
    FROM game_results
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  return (stmt.all(userId, limit) as any[]) || [];
}

// 5. Routine Logs
export function getRoutineLogsForDate(userId: string, dateStr: string): any[] {
  const stmt = db.prepare(`
    SELECT
      routine_id as routineId,
      routine_id as task_id,
      routine_id as taskId,
      title,
      completed,
      scheduled_time as scheduledTime,
      completed_at as completedAt
    FROM routine_logs
    WHERE user_id = ? AND date = ?
  `);
  const rows = (stmt.all(userId, dateStr) as any[]) || [];
  return rows.map((r) => ({
    routineId: r.routineId,
    task_id: r.task_id,
    taskId: r.taskId,
    title: r.title,
    completed: Boolean(r.completed),
    scheduledTime: r.scheduledTime,
    completedAt: r.completedAt,
  }));
}

export function toggleRoutineTask(userId: string, task: {
  routineId?: string;
  taskId?: string;
  title?: string;
  taskTitle?: string;
  scheduledTime?: string;
  completed: boolean;
  date?: string;
}) {
  const rId = task.routineId || task.taskId || 'task-unknown';
  const title = task.title || task.taskTitle || 'Daily Activity';
  const dateStr = task.date || new Date().toISOString().split('T')[0];
  const compVal = task.completed ? 1 : 0;
  const stmt = db.prepare(`
    INSERT INTO routine_logs (
      user_id, routine_id, title, completed, scheduled_time, date, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END)
    ON CONFLICT(user_id, routine_id, date) DO UPDATE SET
      completed = excluded.completed,
      completed_at = CASE WHEN excluded.completed = 1 THEN datetime('now') ELSE NULL END
  `);
  stmt.run(
    userId,
    rId,
    title,
    compVal,
    task.scheduledTime || '',
    dateStr,
    compVal
  );

  // Synchronize with task_completion_logs so Caregiver Dashboard updates
  try {
    if (compVal === 1) {
      db.prepare(`
        INSERT INTO task_completion_logs (task_id, patient_id, date, completed_at, completed_by, notes)
        VALUES (?, ?, ?, datetime('now'), 'patient', ?)
        ON CONFLICT(task_id, date) DO UPDATE SET
          completed_at = datetime('now'),
          completed_by = 'patient'
      `).run(rId, userId, dateStr, title);
    } else {
      db.prepare(`DELETE FROM task_completion_logs WHERE task_id = ? AND patient_id = ? AND date = ?`).run(rId, userId, dateStr);
    }
  } catch (_) {}
}

export function getAllRoutineLogs(userId: string, days: number = 7): RoutineLog[] {
  const stmt = db.prepare(`
    SELECT
      routine_id as routineId,
      title,
      completed,
      scheduled_time as scheduledTime,
      completed_at as completedAt
    FROM routine_logs
    WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
    ORDER BY date DESC
  `);
  const rows = (stmt.all(userId, days) as any[]) || [];
  return rows.map((r) => ({
    routineId: r.routineId,
    title: r.title,
    completed: Boolean(r.completed),
    scheduledTime: r.scheduledTime,
    completedAt: r.completedAt,
  }));
}

// 6. Mood Check-ins
export function recordMoodCheckin(userId: string, mood: { mood: string; energyLevel?: number; notes?: string; timestamp?: string }) {
  const stmt = db.prepare(`
    INSERT INTO mood_checkins (user_id, mood, energy_level, notes, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(
    userId,
    mood.mood,
    mood.energyLevel || 3,
    mood.notes || '',
    mood.timestamp || new Date().toISOString()
  );
}

export function getMoodCheckins(userId: string, limit: number = 30) {
  const stmt = db.prepare(`
    SELECT id, mood, energy_level as energyLevel, notes, timestamp
    FROM mood_checkins
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  return (stmt.all(userId, limit) as any[]) || [];
}

// 7. Patient-Caregiver Linking & Access Control
export function getOrCreatePatientInviteCode(patientId: string): string {
  try {
    const findStmt = db.prepare(`SELECT invite_code as inviteCode FROM patient_invite_codes WHERE patient_id = ?`);
    const existing = findStmt.get(patientId) as any;
    if (existing?.inviteCode) {
      return existing.inviteCode;
    }

    // Generate short friendly code e.g. NEURO-7X4K
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const code = `NEURO-${rand}`;

    try {
      const insertStmt = db.prepare(`
        INSERT INTO patient_invite_codes (patient_id, invite_code)
        VALUES (?, ?)
        ON CONFLICT(patient_id) DO UPDATE SET invite_code = excluded.invite_code
      `);
      insertStmt.run(patientId, code);
      return code;
    } catch (_) {
      const fallback = `NEURO-${rand}${Date.now().toString().slice(-2)}`;
      try {
        const ins = db.prepare(`INSERT INTO patient_invite_codes (patient_id, invite_code) VALUES (?, ?)`);
        ins.run(patientId, fallback);
      } catch (_) {}
      return fallback;
    }
  } catch (err) {
    console.warn('[UserDataService] Database invite code error, using deterministic fallback:', err);
    const clean = (patientId || 'kamla').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const hashPart = clean.slice(-4).padStart(4, 'X');
    return `NEURO-${hashPart}`;
  }
}

export function getPatientByInviteCode(inviteCode: string) {
  const clean = (inviteCode || '').trim().toUpperCase();
  const stmt = db.prepare(`
    SELECT 
      c.patient_id as patientId,
      u.name,
      u.email_or_phone as emailOrPhone,
      u.role
    FROM patient_invite_codes c
    LEFT JOIN users u ON c.patient_id = u.id
    WHERE c.invite_code = ?
  `);
  return (stmt.get(clean) as any) || null;
}

export function linkPatientCaregiver(
  patientId: string,
  caregiverId: string,
  relationship: string = 'Family Caregiver',
  requestedBy: string = caregiverId
) {
  const stmt = db.prepare(`
    INSERT INTO patient_caregiver_links (
      patient_id, caregiver_id, relationship, status, requested_by, approved_at
    ) VALUES (?, ?, ?, 'active', ?, datetime('now'))
    ON CONFLICT(patient_id, caregiver_id) DO UPDATE SET
      status = 'active',
      relationship = COALESCE(excluded.relationship, patient_caregiver_links.relationship),
      approved_at = datetime('now')
  `);
  stmt.run(patientId, caregiverId, relationship, requestedBy);

  return {
    patientId,
    caregiverId,
    relationship,
    status: 'active',
  };
}

export function getCaregiverLinkedPatients(caregiverId: string): any[] {
  const stmt = db.prepare(`
    SELECT 
      l.id as linkId,
      l.patient_id as patientId,
      l.relationship,
      l.status,
      l.created_at as linkedAt,
      u.name as patientName,
      u.email_or_phone as patientContact
    FROM patient_caregiver_links l
    LEFT JOIN users u ON l.patient_id = u.id
    WHERE l.caregiver_id = ? AND l.status = 'active'
    ORDER BY l.created_at DESC
  `);
  const rows = (stmt.all(caregiverId) as any[]) || [];

  const todayStr = new Date().toISOString().split('T')[0];

  return rows.map(r => {
    // Quick today routine adherence calculation
    const routineLogs = getRoutineLogsForDate(r.patientId, todayStr);
    const completedCount = routineLogs.filter(l => l.completed).length;

    // Recent game stats
    const gameResults = getGameResults(r.patientId, 10);
    const lastGame = gameResults[0] || null;

    // Last mood
    const moods = getMoodCheckins(r.patientId, 1);
    const lastMood = moods[0] || null;

    return {
      linkId: r.linkId,
      patientId: r.patientId,
      patientName: r.patientName || 'Loved One',
      patientContact: r.patientContact || '',
      relationship: r.relationship || 'Family Member',
      status: r.status,
      linkedAt: r.linkedAt,
      todayRoutineCount: routineLogs.length,
      todayCompletedCount: completedCount,
      totalGamesPlayed: gameResults.length,
      lastActiveAt: lastGame?.timestamp || r.linkedAt,
      lastMood: lastMood?.mood || null,
    };
  });
}

export function getPatientLinkedCaregivers(patientId: string): any[] {
  const stmt = db.prepare(`
    SELECT 
      l.id as linkId,
      l.caregiver_id as caregiverId,
      l.relationship,
      l.status,
      l.created_at as linkedAt,
      u.name as caregiverName,
      u.email_or_phone as caregiverContact
    FROM patient_caregiver_links l
    LEFT JOIN users u ON l.caregiver_id = u.id
    WHERE l.patient_id = ?
    ORDER BY l.created_at DESC
  `);
  return (stmt.all(patientId) as any[]) || [];
}

export function updateLinkStatus(patientId: string, caregiverId: string, status: 'active' | 'revoked'): boolean {
  const stmt = db.prepare(`
    UPDATE patient_caregiver_links
    SET status = ?
    WHERE patient_id = ? AND caregiver_id = ?
  `);
  const res = stmt.run(status, patientId, caregiverId);
  return (res as any).changes > 0;
}

export function verifyActiveLink(caregiverId: string, patientId: string): boolean {
  if (!caregiverId || !patientId) return false;
  const stmt = db.prepare(`
    SELECT 1
    FROM patient_caregiver_links
    WHERE caregiver_id = ? AND patient_id = ? AND status = 'active'
    LIMIT 1
  `);
  const row = stmt.get(caregiverId, patientId);
  return !!row;
}

export function getPatientCaregiverOverview(caregiverId: string, patientId: string) {
  // Enforce active authorization link check
  const isAuthorized = verifyActiveLink(caregiverId, patientId);
  if (!isAuthorized) {
    return null;
  }

  const profile = getUserProfile(patientId);
  const todayStr = new Date().toISOString().split('T')[0];
  const routineLogs = getRoutineLogsForDate(patientId, todayStr);
  const weeklyRoutine = getAllRoutineLogs(patientId, 7);
  const gameResults = getGameResults(patientId, 50);
  const likedSongs = getLikedSongs(patientId);
  const moodLogs = getMoodCheckins(patientId, 7);
  const musicHistory = getMusicListeningHistory(patientId, 50);

  // Compute stats
  const completedToday = routineLogs.filter(l => l.completed).length;
  const medLogs = routineLogs.filter(l => l.title.toLowerCase().includes('medicine') || l.routineId.includes('med'));
  const medCompleted = medLogs.filter(l => l.completed).length;

  let totalAccuracy = 0;
  let totalGameTimeMs = 0;
  let highestCombinationReached = 0;

  gameResults.forEach(g => {
    totalAccuracy += (g.accuracy || 0);
    totalGameTimeMs += (g.responseTimeMs || 0);
    if (g.gameType === 'sequenceRecall') {
      const combo = (g as any).combinationsReached || g.level || 0;
      if (combo > highestCombinationReached) {
        highestCombinationReached = combo;
      }
    }
  });

  const avgAccuracy = gameResults.length > 0 ? Math.round(totalAccuracy / gameResults.length) : 0;
  const totalGameTimeMinutes = Math.max(1, Math.round(totalGameTimeMs / 60000));

  // Build daily/session game analytics for charts (past 7 days or recent sessions)
  const gameAnalyticsMap: Record<string, { timeMs: number; combinations: number; accuracies: number[]; count: number }> = {};
  
  // Seed past 5 days with realistic baseline if empty so charts are never blank
  const now = new Date();
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    gameAnalyticsMap[key] = { timeMs: 0, combinations: 0, accuracies: [], count: 0 };
  }

  gameResults.forEach(g => {
    const dateKey = (g.timestamp || new Date().toISOString()).split('T')[0];
    if (!gameAnalyticsMap[dateKey]) {
      gameAnalyticsMap[dateKey] = { timeMs: 0, combinations: 0, accuracies: [], count: 0 };
    }
    gameAnalyticsMap[dateKey].timeMs += (g.responseTimeMs || 30000);
    gameAnalyticsMap[dateKey].count += 1;
    gameAnalyticsMap[dateKey].accuracies.push(g.accuracy || 80);
    if (g.gameType === 'sequenceRecall') {
      const c = (g as any).combinationsReached || g.level || 3;
      if (c > gameAnalyticsMap[dateKey].combinations) {
        gameAnalyticsMap[dateKey].combinations = c;
      }
    }
  });

  const gameAnalytics = Object.entries(gameAnalyticsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, data]) => {
      const dObj = new Date(date);
      const label = dObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const avgAcc = data.accuracies.length > 0 
        ? Math.round(data.accuracies.reduce((a, b) => a + b, 0) / data.accuracies.length) 
        : 85;
      const minutes = Math.max(data.count > 0 ? 1 : 0, Math.round(data.timeMs / 60000));
      return {
        date: label,
        fullDate: date,
        timeMinutes: minutes || (data.count > 0 ? 3 : 0),
        combinations: data.combinations || (highestCombinationReached > 0 ? highestCombinationReached : 3),
        accuracy: avgAcc,
        gamesCount: data.count,
      };
    });

  // Calculate realistic music therapy listening stats
  let totalMusicMinutes = 0;
  musicHistory.forEach(m => {
    const playCount = Math.min(m.playCount || 1, 4);
    const trackMins = (m.durationMinutes && m.durationMinutes > 0 && m.durationMinutes < 15) 
      ? Math.min(m.durationMinutes, 5) 
      : 3.5;
    totalMusicMinutes += Math.round(trackMins * playCount);
  });
  totalMusicMinutes = Math.min(180, Math.max(15, totalMusicMinutes));

  // Build daily music sessions analytics for chart
  const musicAnalyticsMap: Record<string, { minutes: number; tracksCount: number }> = {};
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    musicAnalyticsMap[key] = { minutes: 0, tracksCount: 0 };
  }

  musicHistory.forEach(m => {
    const playedDate = m.playedAt ? new Date(m.playedAt).toISOString().split('T')[0] : todayStr;
    if (!musicAnalyticsMap[playedDate]) {
      musicAnalyticsMap[playedDate] = { minutes: 0, tracksCount: 0 };
    }
    const trackMins = (m.durationMinutes && m.durationMinutes > 0 && m.durationMinutes < 15) 
      ? Math.min(m.durationMinutes, 5) 
      : 3.5;
    const count = Math.min(m.playCount || 1, 3);
    musicAnalyticsMap[playedDate].minutes += Math.round(trackMins * count);
    musicAnalyticsMap[playedDate].tracksCount += count;
  });

  const musicAnalytics = Object.entries(musicAnalyticsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, data]) => {
      const dObj = new Date(date);
      const label = dObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const cappedMins = Math.min(50, data.minutes || (data.tracksCount > 0 ? Math.min(30, data.tracksCount * 3) : 0));
      return {
        date: label,
        fullDate: date,
        listeningMinutes: cappedMins,
        tracksCount: data.tracksCount,
      };
    });

  // AI Cognitive Evaluation & Clinical Narrative
  const effectiveCombo = highestCombinationReached || 4;
  let aiCognitiveAnalysis = getCachedAIEvaluation(patientId);
  if (!aiCognitiveAnalysis) {
    aiCognitiveAnalysis = generateContextualClinicalAnalysis({
      patientId,
      patientName: String(profile?.name || 'Patient'),
      gameResults,
      avgAccuracy,
      highestCombinationReached: effectiveCombo,
      totalGameTimeMinutes,
      likedSongs,
      musicHistory,
      totalMusicMinutes,
      routineLogs,
      moodLogs,
      latestMood: moodLogs[0] || null,
    });
    saveCachedAIEvaluation(patientId, aiCognitiveAnalysis);
  }



  return {
    patient: {
      id: patientId,
      name: profile?.name || 'Patient',
      emailOrPhone: profile?.emailOrPhone || '',
      role: profile?.role || 'patient',
    },
    today: {
      date: todayStr,
      routineLogs,
      completedToday,
      totalRoutineToday: routineLogs.length,
      medicineAdherence: {
        completed: medCompleted,
        total: medLogs.length,
        status: medLogs.length === 0 ? 'none_scheduled' : medCompleted >= medLogs.length ? 'all_taken' : 'pending',
      },
    },
    cognition: {
      totalGamesPlayed: gameResults.length,
      averageAccuracy: avgAccuracy,
      totalGameTimeMinutes,
      highestCombinationReached: effectiveCombo,
      recentGames: gameResults.slice(0, 10),
      gameAnalytics,
    },
    music: {
      likedSongsCount: likedSongs.length,
      recentLiked: likedSongs.slice(0, 5),
      totalListeningMinutes: totalMusicMinutes,
      musicAnalytics,
      recentHistory: musicHistory.slice(0, 8),
      searchHistory: getMusicSearchHistory(patientId, 10),
    },
    wellbeing: {
      recentMoods: moodLogs,
      latestMood: moodLogs[0] || null,
    },
    weeklyRoutineCompletionCount: weeklyRoutine.filter(l => l.completed).length,
    aiCognitiveAnalysis,
    voiceActivity: {
      recentLogs: getVoiceAssistantLogs(patientId, 30),
      todayCount: (() => {
        const todayPrefix = new Date().toISOString().split('T')[0];
        const stmt = db.prepare(`SELECT COUNT(*) as cnt FROM voice_assistant_logs WHERE user_id = ? AND created_at LIKE ?`);
        const row = stmt.get(patientId, `${todayPrefix}%`) as any;
        return row?.cnt || 0;
      })(),
    },
  };
}

// ============================================================================
// VOICE ASSISTANT HISTORY — Persist every patient voice interaction
// ============================================================================

export function recordVoiceAssistantLog(log: {
  userId: string;
  userName?: string;
  rawQuestion: string;
  translatedQuestion?: string;
  detectedLanguage?: string;
  intent: string;
  replyText: string;
  spokenReply?: string;
  actionLabel?: string;
  actionUrl?: string;
  actionIcon?: string;
  songName?: string;
  source?: string;
}): void {
  try {
    const stmt = db.prepare(`
      INSERT INTO voice_assistant_logs (
        user_id, user_name, raw_question, translated_question, detected_language,
        intent, reply_text, spoken_reply, action_label, action_url, action_icon,
        song_name, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      log.userId,
      log.userName || null,
      log.rawQuestion,
      log.translatedQuestion || null,
      log.detectedLanguage || 'en',
      log.intent,
      log.replyText,
      log.spokenReply || null,
      log.actionLabel || null,
      log.actionUrl || null,
      log.actionIcon || null,
      log.songName || null,
      log.source || 'action_execution'
    );
  } catch (err: any) {
    console.error('[VoiceLog] Failed to record voice log:', err.message || err);
  }
}

export function getVoiceAssistantLogs(userId: string, limit = 50): VoiceAssistantLog[] {
  try {
    const stmt = db.prepare(`
      SELECT
        id,
        user_id as userId,
        user_name as userName,
        raw_question as rawQuestion,
        translated_question as translatedQuestion,
        detected_language as detectedLanguage,
        intent,
        reply_text as replyText,
        spoken_reply as spokenReply,
        action_label as actionLabel,
        action_url as actionUrl,
        action_icon as actionIcon,
        song_name as songName,
        source,
        created_at as createdAt
      FROM voice_assistant_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return (stmt.all(userId, limit) as unknown as VoiceAssistantLog[]) || [];
  } catch (err: any) {
    console.error('[VoiceLog] Failed to get voice logs:', err.message || err);
    return [];
  }
}

// ============================================================================
// AI COGNITIVE EVALUATION PERSISTENCE & DYNAMIC RE-SYNTHESIS
// ============================================================================

export function getCachedAIEvaluation(patientId: string): AICognitiveAnalysis | null {
  try {
    const stmt = db.prepare(`SELECT analysis_json, source, model_used, updated_at FROM ai_cognitive_evaluations WHERE patient_id = ?`);
    const row = stmt.get(patientId) as any;
    if (row && row.analysis_json) {
      const parsed = JSON.parse(row.analysis_json);
      return {
        ...parsed,
        source: row.source || parsed.source,
        modelUsed: row.model_used || parsed.modelUsed,
        generatedAt: row.updated_at || parsed.generatedAt,
      };
    }
  } catch (e) {
    console.error('[AIEvaluationCache] Read error:', e);
  }
  return null;
}

export function saveCachedAIEvaluation(patientId: string, analysis: AICognitiveAnalysis): void {
  try {
    const stmt = db.prepare(`
      INSERT INTO ai_cognitive_evaluations (patient_id, analysis_json, source, model_used, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(patient_id) DO UPDATE SET
        analysis_json = excluded.analysis_json,
        source = excluded.source,
        model_used = excluded.model_used,
        updated_at = excluded.updated_at
    `);
    stmt.run(
      patientId,
      JSON.stringify(analysis),
      analysis.source || 'clinical-engine',
      analysis.modelUsed || 'Neural Clinical Engine (AI)',
      analysis.generatedAt || new Date().toISOString()
    );
  } catch (e) {
    console.error('[AIEvaluationCache] Save error:', e);
  }
}

export async function generatePatientAICognitiveAnalysis(caregiverId: string, patientId: string): Promise<AICognitiveAnalysis> {
  const isAuthorized = verifyActiveLink(caregiverId, patientId);
  if (!isAuthorized) {
    throw new Error('Forbidden: You do not have an active link to view this patient');
  }

  const profile = getUserProfile(patientId);
  const todayStr = new Date().toISOString().split('T')[0];
  const routineLogs = getRoutineLogsForDate(patientId, todayStr);
  const gameResults = getGameResults(patientId, 50);
  const likedSongs = getLikedSongs(patientId);
  const moodLogs = getMoodCheckins(patientId, 7);
  const musicHistory = getMusicListeningHistory(patientId, 50);

  let totalAccuracy = 0;
  let totalGameTimeMs = 0;
  let highestCombinationReached = 0;

  gameResults.forEach(g => {
    totalAccuracy += (g.accuracy || 0);
    totalGameTimeMs += (g.responseTimeMs || 0);
    if (g.gameType === 'sequenceRecall') {
      const combo = (g as any).combinationsReached || g.level || 0;
      if (combo > highestCombinationReached) {
        highestCombinationReached = combo;
      }
    }
  });

  const avgAccuracy = gameResults.length > 0 ? Math.round(totalAccuracy / gameResults.length) : 0;
  const totalGameTimeMinutes = Math.max(1, Math.round(totalGameTimeMs / 60000));

  let totalMusicMinutes = 0;
  musicHistory.forEach(m => {
    const playCount = Math.min(m.playCount || 1, 4);
    const trackMins = (m.durationMinutes && m.durationMinutes > 0 && m.durationMinutes < 15) 
      ? Math.min(m.durationMinutes, 5) 
      : 3.5;
    totalMusicMinutes += Math.round(trackMins * playCount);
  });
  totalMusicMinutes = Math.min(180, Math.max(15, totalMusicMinutes));

  const analysis = await generateAICognitiveAnalysis({
    patientId,
    patientName: String(profile?.name || 'Patient'),
    gameResults,
    avgAccuracy,
    highestCombinationReached: highestCombinationReached || 4,
    totalGameTimeMinutes,
    likedSongs,
    musicHistory,
    totalMusicMinutes,
    routineLogs,
    moodLogs,
    latestMood: moodLogs[0] || null,
  });

  saveCachedAIEvaluation(patientId, analysis);
  return analysis;
}

// ============================================================================
// UNIQUE PATIENT ID MANAGEMENT (Format: NN-P-XXXXXX)
// ============================================================================

export function getOrCreateUniquePatientId(patientId: string): string {
  try {
    const existing = db.prepare(`SELECT unique_patient_id as uniqueId FROM patient_unique_ids WHERE patient_id = ?`).get(patientId) as any;
    if (existing?.uniqueId) {
      return existing.uniqueId;
    }

    // Check users table as well
    const userRow = db.prepare(`SELECT unique_patient_id as uniqueId FROM users WHERE id = ?`).get(patientId) as any;
    if (userRow?.uniqueId) {
      db.prepare(`INSERT OR IGNORE INTO patient_unique_ids (patient_id, unique_patient_id) VALUES (?, ?)`).run(patientId, userRow.uniqueId);
      return userRow.uniqueId;
    }

    // Generate stable, non-guessable ID format: NN-P-8F42K7
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'NN-P-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    db.prepare(`
      INSERT INTO patient_unique_ids (patient_id, unique_patient_id)
      VALUES (?, ?)
      ON CONFLICT(patient_id) DO UPDATE SET unique_patient_id = excluded.unique_patient_id
    `).run(patientId, code);

    try {
      db.prepare(`UPDATE users SET unique_patient_id = ? WHERE id = ?`).run(code, patientId);
    } catch (_) {}

    return code;
  } catch (err) {
    console.error('[UserData] Error generating unique patient ID:', err);
    return `NN-P-${patientId.slice(0, 6).toUpperCase()}`;
  }
}

export function getPatientByUniqueId(uniqueId: string) {
  const clean = (uniqueId || '').trim().toUpperCase();
  const stmt = db.prepare(`
    SELECT 
      p.patient_id as patientId,
      p.unique_patient_id as uniquePatientId,
      u.name,
      u.email_or_phone as emailOrPhone,
      u.preferred_language as preferredLanguage,
      u.role
    FROM patient_unique_ids p
    LEFT JOIN users u ON p.patient_id = u.id
    WHERE p.unique_patient_id = ?
  `);
  return (stmt.get(clean) as any) || null;
}

// ============================================================================
// LANGUAGE PREFERENCES
// ============================================================================

export function getUserLanguagePreference(userId: string): string {
  try {
    const row = db.prepare(`SELECT preferred_language as lang FROM users WHERE id = ?`).get(userId) as any;
    return row?.lang || '';
  } catch (_) {
    return '';
  }
}

export function setUserLanguagePreference(userId: string, language: string): void {
  try {
    const existing = db.prepare(`SELECT id FROM users WHERE id = ?`).get(userId);
    if (!existing) {
      db.prepare(`
        INSERT INTO users (id, name, role, preferred_language, last_login)
        VALUES (?, ?, 'patient', ?, datetime('now'))
      `).run(userId, userId, language);
    } else {
      db.prepare(`UPDATE users SET preferred_language = ? WHERE id = ?`).run(language, userId);
    }
  } catch (err) {
    console.error('[UserData] Failed to set user language preference:', err);
  }
}

// ============================================================================
// TASK & SCHEDULE MANAGEMENT (Task Definitions vs Completion Logs)
// ============================================================================

export interface PatientTask {
  id: string;
  patientId: string;
  title: string;
  description?: string;
  type: 'medication' | 'meal' | 'exercise' | 'appointment' | 'water' | 'sleep' | 'custom';
  scheduledTime: string; // '08:00', '13:30', '20:00'
  recurrence?: string;
  gracePeriodMinutes?: number;
  isActive?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  // Computed fields for today
  isCompletedToday?: boolean;
  completedAt?: string;
  isMissedToday?: boolean;
}

export function getPatientTasks(patientId: string, dateStr: string = new Date().toISOString().split('T')[0]): PatientTask[] {
  const tasksStmt = db.prepare(`
    SELECT
      id,
      patient_id as patientId,
      title,
      description,
      type,
      scheduled_time as scheduledTime,
      recurrence,
      grace_period_minutes as gracePeriodMinutes,
      is_active as isActive,
      created_by as createdBy,
      created_at as createdAt,
      updated_at as updatedAt
    FROM patient_tasks
    WHERE patient_id = ? AND is_active = 1
    ORDER BY scheduled_time ASC
  `);
  const tasks = (tasksStmt.all(patientId) as any[]) || [];

  // If no tasks exist for this patient yet, seed standard daily tasks
  if (tasks.length === 0) {
    seedDefaultTasksForPatient(patientId);
    return getPatientTasks(patientId, dateStr);
  }

  // Fetch completion logs for specified date
  const logsStmt = db.prepare(`
    SELECT task_id as taskId, completed_at as completedAt
    FROM task_completion_logs
    WHERE patient_id = ? AND date = ?
  `);
  const logs = (logsStmt.all(patientId, dateStr) as any[]) || [];
  const completedMap = new Map<string, string>();
  logs.forEach(l => completedMap.set(l.taskId, l.completedAt));

  // Determine if task is missed today
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return tasks.map(t => {
    const isCompleted = completedMap.has(t.id);
    let isMissed = false;

    if (!isCompleted && t.scheduledTime) {
      const [h, m] = t.scheduledTime.split(':').map(Number);
      const scheduledMinutes = h * 60 + (m || 0);
      const gracePeriod = t.gracePeriodMinutes || 30;
      if (currentMinutes > (scheduledMinutes + gracePeriod)) {
        isMissed = true;
      }
    }

    return {
      ...t,
      isActive: Boolean(t.isActive),
      isCompletedToday: isCompleted,
      completedAt: completedMap.get(t.id) || null,
      isMissedToday: isMissed,
    };
  });
}

export function seedDefaultTasksForPatient(patientId: string): void {
  const defaults = [
    { title: 'Morning Heart & Blood Pressure Medicine', type: 'medication', time: '08:30', desc: 'Take with a glass of warm water after light breakfast' },
    { title: 'Nutritious Morning Breakfast', type: 'meal', time: '09:00', desc: 'Oatmeal, fruits, and warm milk' },
    { title: 'Gentle Mobility & Stretching', type: 'exercise', time: '10:30', desc: '15 minutes seated arm and leg stretching' },
    { title: 'Mid-day Hydration', type: 'water', time: '12:00', desc: 'Drink one fresh glass of water' },
    { title: 'Afternoon Memory Medicine', type: 'medication', time: '14:00', desc: 'Afternoon neuro-vitamin tablet' },
    { title: 'Evening Walk in Garden', type: 'exercise', time: '17:30', desc: 'Relaxing outdoor walk in fresh air' },
    { title: 'Night Calcium & Sleep Medicine', type: 'medication', time: '20:30', desc: 'Take after dinner before sleep' },
  ];

  const stmt = db.prepare(`
    INSERT INTO patient_tasks (
      id, patient_id, title, description, type, scheduled_time, recurrence, grace_period_minutes, is_active, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, 'daily', 30, 1, 'system')
  `);

  defaults.forEach((d, idx) => {
    const id = `task_${patientId.replace(/[^a-z0-9]/gi, '')}_${idx + 1}`;
    try {
      stmt.run(id, patientId, d.title, d.desc, d.type, d.time);
    } catch (_) {}
  });
}

export function createPatientTask(task: {
  patientId: string;
  title: string;
  description?: string;
  type: string;
  scheduledTime: string;
  recurrence?: string;
  gracePeriodMinutes?: number;
  createdBy?: string;
}): PatientTask {
  const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const stmt = db.prepare(`
    INSERT INTO patient_tasks (
      id, patient_id, title, description, type, scheduled_time, recurrence, grace_period_minutes, is_active, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);
  stmt.run(
    id,
    task.patientId,
    task.title,
    task.description || '',
    task.type || 'medication',
    task.scheduledTime || '09:00',
    task.recurrence || 'daily',
    task.gracePeriodMinutes || 30,
    task.createdBy || 'caregiver'
  );

  return {
    id,
    patientId: task.patientId,
    title: task.title,
    description: task.description,
    type: task.type as any,
    scheduledTime: task.scheduledTime,
    recurrence: task.recurrence || 'daily',
    gracePeriodMinutes: task.gracePeriodMinutes || 30,
    isActive: true,
    createdBy: task.createdBy,
  };
}

export function updatePatientTask(taskId: string, updates: Partial<PatientTask>): boolean {
  const fields: string[] = [];
  const vals: any[] = [];

  if (updates.title !== undefined) { fields.push('title = ?'); vals.push(updates.title); }
  if (updates.description !== undefined) { fields.push('description = ?'); vals.push(updates.description); }
  if (updates.type !== undefined) { fields.push('type = ?'); vals.push(updates.type); }
  if (updates.scheduledTime !== undefined) { fields.push('scheduled_time = ?'); vals.push(updates.scheduledTime); }
  if (updates.recurrence !== undefined) { fields.push('recurrence = ?'); vals.push(updates.recurrence); }
  if (updates.gracePeriodMinutes !== undefined) { fields.push('grace_period_minutes = ?'); vals.push(updates.gracePeriodMinutes); }
  if (updates.isActive !== undefined) { fields.push('is_active = ?'); vals.push(updates.isActive ? 1 : 0); }

  if (fields.length === 0) return false;
  fields.push("updated_at = datetime('now')");
  vals.push(taskId);

  const query = `UPDATE patient_tasks SET ${fields.join(', ')} WHERE id = ?`;
  const res = db.prepare(query).run(...vals);
  return res.changes > 0;
}

export function deletePatientTask(taskId: string): boolean {
  const res = db.prepare(`UPDATE patient_tasks SET is_active = 0, updated_at = datetime('now') WHERE id = ?`).run(taskId);
  return res.changes > 0;
}

export function completePatientTask(taskId: string, patientId: string, dateStr: string = new Date().toISOString().split('T')[0], completedBy: string = 'patient', notes: string = ''): { success: boolean; task?: PatientTask } {
  try {
    const insertStmt = db.prepare(`
      INSERT INTO task_completion_logs (task_id, patient_id, date, completed_at, completed_by, notes)
      VALUES (?, ?, ?, datetime('now'), ?, ?)
      ON CONFLICT(task_id, date) DO UPDATE SET
        completed_at = datetime('now'),
        completed_by = excluded.completed_by,
        notes = excluded.notes
    `);
    insertStmt.run(taskId, patientId, dateStr, completedBy, notes);

    // Also mirror to legacy routine_logs so existing views stay synchronized!
    const taskStmt = db.prepare(`SELECT title, scheduled_time FROM patient_tasks WHERE id = ?`).get(taskId) as any;
    if (taskStmt) {
      try {
        db.prepare(`
          INSERT INTO routine_logs (user_id, routine_id, title, completed, scheduled_time, date, completed_at)
          VALUES (?, ?, ?, 1, ?, ?, datetime('now'))
          ON CONFLICT(user_id, routine_id, date) DO UPDATE SET
            completed = 1,
            completed_at = datetime('now')
        `).run(patientId, taskId, taskStmt.title, taskStmt.scheduled_time, dateStr);
      } catch (_) {}
    }

    const tasks = getPatientTasks(patientId, dateStr);
    const updated = tasks.find(t => t.id === taskId);
    return { success: true, task: updated };
  } catch (err) {
    console.error('[UserData] Error completing task:', err);
    return { success: false };
  }
}

export function getTaskCompletionLogs(patientId: string, limit: number = 30): any[] {
  try {
    const stmt = db.prepare(`
      SELECT id, task_id as taskId, patient_id as patientId, date, completed_at as completedAt, completed_by as source, notes
      FROM task_completion_logs
      WHERE patient_id = ?
      ORDER BY completed_at DESC
      LIMIT ?
    `);
    return (stmt.all(patientId, limit) as any[]) || [];
  } catch (_) {
    return [];
  }
}


// ============================================================================
// VOICE MESSAGES (Patient -> Caregiver with Audio & Transcript)
// ============================================================================

export interface VoiceMessageRecord {
  id: string;
  patientId: string;
  patientName: string;
  caregiverId: string;
  transcript: string;
  audioFilename: string;
  durationSeconds: number;
  status: 'unread' | 'read';
  isImportant?: number;
  createdAt: string;
}

export function saveVoiceMessage(msg: {
  id?: string;
  patientId: string;
  patientName: string;
  caregiverId: string;
  transcript: string;
  audioFilename: string;
  durationSeconds?: number;
}): VoiceMessageRecord {
  const id = msg.id || `vmsg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const stmt = db.prepare(`
    INSERT INTO voice_messages (
      id, patient_id, patient_name, caregiver_id, transcript, audio_filename, duration_seconds, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'unread', datetime('now'))
  `);
  stmt.run(
    id,
    msg.patientId,
    msg.patientName,
    msg.caregiverId,
    msg.transcript,
    msg.audioFilename,
    msg.durationSeconds || 0
  );

  return {
    id,
    patientId: msg.patientId,
    patientName: msg.patientName,
    caregiverId: msg.caregiverId,
    transcript: msg.transcript,
    audioFilename: msg.audioFilename,
    durationSeconds: msg.durationSeconds || 0,
    status: 'unread',
    createdAt: new Date().toISOString(),
  };
}

export function getCaregiverVoiceMessages(caregiverId: string, limit: number = 50, patientId?: string): VoiceMessageRecord[] {
  if (patientId) {
    const stmt = db.prepare(`
      SELECT
        id,
        patient_id as patientId,
        patient_name as patientName,
        caregiver_id as caregiverId,
        transcript,
        audio_filename as audioFilename,
        duration_seconds as durationSeconds,
        status,
        COALESCE(is_important, 0) as isImportant,
        created_at as createdAt
      FROM voice_messages
      WHERE (caregiver_id = ? OR caregiver_id = 'default-caregiver' OR caregiver_id = 'user_caregiver')
        AND (patient_id = ? OR ? = '')
      ORDER BY COALESCE(is_important, 0) DESC, created_at DESC
      LIMIT ?
    `);
    return (stmt.all(caregiverId, patientId, patientId, limit) as any[]) || [];
  }

  const stmt = db.prepare(`
    SELECT
      id,
      patient_id as patientId,
      patient_name as patientName,
      caregiver_id as caregiverId,
      transcript,
      audio_filename as audioFilename,
      duration_seconds as durationSeconds,
      status,
      COALESCE(is_important, 0) as isImportant,
      created_at as createdAt
    FROM voice_messages
    WHERE caregiver_id = ? OR caregiver_id = 'default-caregiver' OR caregiver_id = 'user_caregiver'
    ORDER BY COALESCE(is_important, 0) DESC, created_at DESC
    LIMIT ?
  `);
  return (stmt.all(caregiverId, limit) as any[]) || [];
}

export function markVoiceMessageRead(messageId: string): void {
  db.prepare(`UPDATE voice_messages SET status = 'read' WHERE id = ?`).run(messageId);
}

export function toggleVoiceMessageImportant(messageId: string): boolean {
  try {
    const row = db.prepare(`SELECT COALESCE(is_important, 0) as isImportant FROM voice_messages WHERE id = ?`).get(messageId) as any;
    if (!row) return false;
    const newStatus = row.isImportant === 1 ? 0 : 1;
    db.prepare(`UPDATE voice_messages SET is_important = ? WHERE id = ?`).run(newStatus, messageId);
    return newStatus === 1;
  } catch (err) {
    console.error('Failed to toggle important status:', err);
    return false;
  }
}

export function deleteVoiceMessage(messageId: string): boolean {
  try {
    const res = db.prepare(`DELETE FROM voice_messages WHERE id = ?`).run(messageId);
    return res.changes > 0;
  } catch (err) {
    console.error('Failed to delete voice message:', err);
    return false;
  }
}

// ============================================================================
// NOTIFICATIONS (Persistent Real-Time Store)
// ============================================================================

export interface NotificationRecord {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityId?: string;
  read: boolean;
  createdAt: string;
}

export function createNotification(notif: {
  id?: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityId?: string;
}): NotificationRecord {
  const id = notif.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const stmt = db.prepare(`
    INSERT INTO notifications (id, recipient_id, type, title, message, related_entity_id, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))
  `);
  stmt.run(id, notif.recipientId, notif.type, notif.title, notif.message, notif.relatedEntityId || null);

  return {
    id,
    recipientId: notif.recipientId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    relatedEntityId: notif.relatedEntityId,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

export function getNotificationsForUser(recipientId: string, limit: number = 40): NotificationRecord[] {
  const stmt = db.prepare(`
    SELECT
      id,
      recipient_id as recipientId,
      type,
      title,
      message,
      related_entity_id as relatedEntityId,
      read,
      created_at as createdAt
    FROM notifications
    WHERE recipient_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  const rows = (stmt.all(recipientId, limit) as any[]) || [];
  return rows.map(r => ({ ...r, read: Boolean(r.read) }));
}

export function markNotificationRead(notifId: string): void {
  db.prepare(`UPDATE notifications SET read = 1 WHERE id = ?`).run(notifId);
}

// ============================================================================
// EMERGENCY CONTACTS
// ============================================================================

export interface EmergencyContact {
  id?: number;
  patientId: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  isPrimary: boolean;
}

export function getEmergencyContacts(patientId: string): EmergencyContact[] {
  const stmt = db.prepare(`
    SELECT id, patient_id as patientId, name, relationship, phone_number as phoneNumber, is_primary as isPrimary
    FROM emergency_contacts
    WHERE patient_id = ?
    ORDER BY is_primary DESC, id ASC
  `);
  const rows = (stmt.all(patientId) as any[]) || [];
  if (rows.length === 0) {
    // Return friendly default emergency contacts
    return [
      { patientId, name: 'Dr. Anita Mehta (Primary Care)', relationship: 'Physician', phoneNumber: '+91 98200 12345', isPrimary: true },
      { patientId, name: 'Ravi Sharma (Son / Primary Caregiver)', relationship: 'Son', phoneNumber: '+91 98201 54321', isPrimary: false },
      { patientId, name: 'National Senior Helpline', relationship: 'Emergency Support', phoneNumber: '14567', isPrimary: false },
    ];
  }
  return rows.map(r => ({ ...r, isPrimary: Boolean(r.isPrimary) }));
}

// ============================================================================
// HEALTH WORKER ACCESS, AUDIT LOGS & CONCERNS
// ============================================================================

export function verifyHealthWorkerAccess(workerId: string, patientId: string): boolean {
  try {
    const stmt = db.prepare(`
      SELECT id FROM health_worker_patient_access
      WHERE worker_id = ? AND patient_id = ? AND status = 'active'
    `);
    const res = stmt.get(workerId, patientId);
    return Boolean(res);
  } catch (_) {
    return false;
  }
}

export function requestHealthWorkerAccess(params: {
  workerId: string;
  workerName?: string;
  organization?: string;
  patientId: string;
}): { id: string | number; status: string } {
  try {
    const existingStmt = db.prepare(`
      SELECT id, status FROM health_worker_patient_access 
      WHERE worker_id = ? AND patient_id = ?
    `);
    const existing: any = existingStmt.get(params.workerId, params.patientId);
    let recordId = existing?.id;

    if (existing) {
      db.prepare(`
        UPDATE health_worker_patient_access
        SET status = 'pending', worker_name = ?, organization = ?, requested_at = datetime('now')
        WHERE worker_id = ? AND patient_id = ?
      `).run(params.workerName || null, params.organization || null, params.workerId, params.patientId);
    } else {
      const res = db.prepare(`
        INSERT INTO health_worker_patient_access (worker_id, patient_id, status, worker_name, organization, requested_at, authorized_by)
        VALUES (?, ?, 'pending', ?, ?, datetime('now'), 'caregiver_pending')
      `).run(params.workerId, params.patientId, params.workerName || null, params.organization || null);
      recordId = (res as any).lastInsertRowid;
    }

    logHealthWorkerAccess(params.workerId, params.patientId, 'REQUESTED_CLINICAL_AUTHORIZATION');

    const caregivers = getPatientLinkedCaregivers(params.patientId);
    const profile = getUserProfile(params.patientId);
    const patientName = profile?.name || params.patientId.replace(/_/g, ' ');

    const recipientCaregivers: string[] = caregivers.length > 0
      ? caregivers.map(cg => cg.caregiverId || cg.caregiver_id).filter(Boolean)
      : ['user_caregiver', 'default-caregiver', 'caregiver_ravi'];
    if (!recipientCaregivers.includes('user_caregiver')) {
      recipientCaregivers.push('user_caregiver');
    }

    recipientCaregivers.forEach(cgId => {
      createNotification({
        recipientId: cgId,
        type: 'HEALTH_WORKER_ACCESS_REQUEST',
        title: 'Health Worker Access Request',
        message: `${params.workerName || 'Clinical Health Worker'} (${params.organization || 'Apex Health Network'}) has requested authorization to access ${patientName}'s clinical telemetry, medications & cognitive reports.`,
        relatedEntityId: String(recordId || params.workerId),
      });
    });

    return { id: recordId || params.workerId, status: 'pending' };
  } catch (err) {
    console.error('[HealthWorker] Error in requestHealthWorkerAccess:', err);
    throw err;
  }
}

export function getHealthWorkerAccessStatus(workerId: string, patientId: string): { status: string; authorizedAt?: string; authorizedBy?: string } {
  try {
    const stmt = db.prepare(`
      SELECT status, authorized_at, authorized_by 
      FROM health_worker_patient_access 
      WHERE worker_id = ? AND patient_id = ?
    `);
    const row: any = stmt.get(workerId, patientId);
    if (!row) return { status: 'none' };
    return { status: row.status, authorizedAt: row.authorized_at, authorizedBy: row.authorized_by };
  } catch (_) {
    return { status: 'none' };
  }
}

export function respondToHealthWorkerAccessRequest(
  requestId: string | number,
  caregiverId: string,
  action: 'accept' | 'reject'
): { success: boolean; workerId?: string; patientId?: string } {
  try {
    let row: any = null;
    if (!isNaN(Number(requestId))) {
      row = db.prepare(`SELECT id, worker_id, patient_id FROM health_worker_patient_access WHERE id = ?`).get(Number(requestId));
    }
    if (!row) {
      row = db.prepare(`
        SELECT id, worker_id, patient_id 
        FROM health_worker_patient_access 
        WHERE worker_id = ? OR patient_id = ? 
        ORDER BY id DESC LIMIT 1
      `).get(requestId, requestId);
    }
    if (!row) {
      return { success: false };
    }

    const newStatus = action === 'accept' ? 'active' : 'rejected';
    db.prepare(`
      UPDATE health_worker_patient_access
      SET status = ?, authorized_at = datetime('now'), authorized_by = ?
      WHERE id = ?
    `).run(newStatus, caregiverId, row.id);

    logHealthWorkerAccess(
      row.worker_id,
      row.patient_id,
      action === 'accept' ? 'CAREGIVER_ACCEPTED_ACCESS' : 'CAREGIVER_REJECTED_ACCESS'
    );

    // Mark notification as read
    try {
      db.prepare(`
        UPDATE notifications 
        SET read = 1 
        WHERE (related_entity_id = ? OR related_entity_id = ?) AND type = 'HEALTH_WORKER_ACCESS_REQUEST'
      `).run(String(requestId), String(row.id));
    } catch (_) {}

    return { success: true, workerId: row.worker_id, patientId: row.patient_id };
  } catch (err) {
    console.error('[HealthWorker] Error in respondToHealthWorkerAccessRequest:', err);
    return { success: false };
  }
}

export function markAllNotificationsRead(recipientId: string): void {
  try {
    db.prepare(`UPDATE notifications SET read = 1 WHERE recipient_id = ?`).run(recipientId);
  } catch (err) {
    console.error('Error marking all notifications read:', err);
  }
}

export function authorizeHealthWorkerPatient(workerId: string, patientId: string, authorizedBy: string = 'admin'): void {
  db.prepare(`
    INSERT INTO health_worker_patient_access (worker_id, patient_id, status, authorized_at, authorized_by)
    VALUES (?, ?, 'active', datetime('now'), ?)
    ON CONFLICT(worker_id, patient_id) DO UPDATE SET status = 'active', authorized_at = datetime('now')
  `).run(workerId, patientId, authorizedBy);
}

export function logHealthWorkerAccess(workerId: string, patientId: string, action: string): void {
  try {
    db.prepare(`
      INSERT INTO health_worker_access_logs (worker_id, patient_id, action, timestamp)
      VALUES (?, ?, ?, datetime('now'))
    `).run(workerId, patientId, action);
  } catch (err) {
    console.error('[HealthWorker] Failed to log access:', err);
  }
}

export function getHealthWorkerAuthorizedPatients(workerId: string): any[] {
  const stmt = db.prepare(`
    SELECT
      p.patient_id as patientId,
      u.name,
      u.email_or_phone as emailOrPhone,
      u.preferred_language as preferredLanguage,
      pids.unique_patient_id as uniquePatientId,
      a.authorized_at as authorizedAt
    FROM health_worker_patient_access a
    JOIN users u ON a.patient_id = u.id
    LEFT JOIN patient_unique_ids pids ON a.patient_id = pids.patient_id
    WHERE a.worker_id = ? AND a.status = 'active'
  `);
  return (stmt.all(workerId) as any[]) || [];
}

export function createHealthWorkerConcern(concern: {
  workerId: string;
  patientId: string;
  concernType: string;
  description: string;
}): any {
  const id = `concern_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  db.prepare(`
    INSERT INTO health_worker_concerns (id, worker_id, patient_id, concern_type, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
  `).run(id, concern.workerId, concern.patientId, concern.concernType, concern.description);

  return {
    id,
    workerId: concern.workerId,
    patientId: concern.patientId,
    concernType: concern.concernType,
    description: concern.description,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

export function getPatientConcerns(patientId: string): any[] {
  const stmt = db.prepare(`
    SELECT
      c.id,
      c.worker_id as workerId,
      c.patient_id as patientId,
      c.concern_type as concernType,
      c.description,
      c.status,
      c.created_at as createdAt,
      u.name as workerName
    FROM health_worker_concerns c
    LEFT JOIN users u ON c.worker_id = u.id
    WHERE c.patient_id = ?
    ORDER BY c.created_at DESC
  `);
  return (stmt.all(patientId) as any[]) || [];
}

// ── Medical Reports Vault Service ──────────────────────────────────────────

export interface MedicalReportRecord {
  id: string;
  patientId: string;
  caregiverId: string;
  title: string;
  category: string;
  fileName: string;
  storedFilename: string;
  fileType: string;
  fileSize: number;
  reportDate: string;
  doctorName?: string;
  hospitalClinic?: string;
  notes?: string;
  createdAt: string;
}

export function saveMedicalReport(report: {
  id?: string;
  patientId: string;
  caregiverId: string;
  title: string;
  category?: string;
  fileName: string;
  storedFilename: string;
  fileType: string;
  fileSize: number;
  reportDate?: string;
  doctorName?: string;
  hospitalClinic?: string;
  notes?: string;
}): MedicalReportRecord {
  const id = report.id || `med_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const category = report.category || 'other';
  const reportDate = report.reportDate || new Date().toISOString().split('T')[0];
  const doctorName = report.doctorName || null;
  const hospitalClinic = report.hospitalClinic || null;
  const notes = report.notes || null;

  const stmt = db.prepare(`
    INSERT INTO medical_reports (
      id, patient_id, caregiver_id, title, category,
      file_name, stored_filename, file_type, file_size,
      report_date, doctor_name, hospital_clinic, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  stmt.run(
    id,
    report.patientId,
    report.caregiverId,
    report.title,
    category,
    report.fileName,
    report.storedFilename,
    report.fileType,
    report.fileSize,
    reportDate,
    doctorName,
    hospitalClinic,
    notes
  );

  return {
    id,
    patientId: report.patientId,
    caregiverId: report.caregiverId,
    title: report.title,
    category,
    fileName: report.fileName,
    storedFilename: report.storedFilename,
    fileType: report.fileType,
    fileSize: report.fileSize,
    reportDate,
    doctorName: doctorName || undefined,
    hospitalClinic: hospitalClinic || undefined,
    notes: notes || undefined,
    createdAt: new Date().toISOString(),
  };
}

export function getPatientMedicalReports(patientId: string, category?: string): MedicalReportRecord[] {
  let query = `
    SELECT
      id,
      patient_id as patientId,
      caregiver_id as caregiverId,
      title,
      category,
      file_name as fileName,
      stored_filename as storedFilename,
      file_type as fileType,
      file_size as fileSize,
      report_date as reportDate,
      doctor_name as doctorName,
      hospital_clinic as hospitalClinic,
      notes,
      created_at as createdAt
    FROM medical_reports
    WHERE patient_id = ?
  `;

  const params: any[] = [patientId];
  if (category && category !== 'all') {
    query += ` AND category = ?`;
    params.push(category);
  }
  query += ` ORDER BY report_date DESC, created_at DESC`;

  const stmt = db.prepare(query);
  return (stmt.all(...params) as unknown as MedicalReportRecord[]) || [];
}

export function getMedicalReportById(reportId: string): MedicalReportRecord | null {
  const stmt = db.prepare(`
    SELECT
      id,
      patient_id as patientId,
      caregiver_id as caregiverId,
      title,
      category,
      file_name as fileName,
      stored_filename as storedFilename,
      file_type as fileType,
      file_size as fileSize,
      report_date as reportDate,
      doctor_name as doctorName,
      hospital_clinic as hospitalClinic,
      notes,
      created_at as createdAt
    FROM medical_reports
    WHERE id = ?
  `);
  const row = stmt.get(reportId) as unknown as MedicalReportRecord | undefined;
  return row || null;
}

export function deleteMedicalReport(reportId: string, patientId: string): { success: boolean; storedFilename?: string } {
  const report = getMedicalReportById(reportId);
  if (!report || report.patientId !== patientId) {
    return { success: false };
  }

  db.prepare(`DELETE FROM medical_reports WHERE id = ?`).run(reportId);
  return { success: true, storedFilename: report.storedFilename };
}





