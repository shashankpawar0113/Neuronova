import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { computeCognitiveStats } from './statsEngine.js';
import { generateNarrativeSummary, generateVoiceCompanionResponse } from './openrouterClient.js';
import { getCacheKey, getCachedSummary, setCachedSummary } from './cache.js';
import { searchYouTubeMusic, fetchYouTubeVideoDetails } from './youtubeClient.js';
import { generateContextualQueue } from './contextualQueueService.js';
import { classifyVoiceIntent } from './intentClassifier.js';
import { dispatchPlayerCommand, getLatestPlayerCommand } from './playerCommandStore.js';
import { ProgressSummaryRequest } from './types.js';
import { initDatabase } from './db.js';
import {
  syncUserProfile,
  getUserProfile,
  getLikedSongs,
  toggleLikedSong,
  getUserPlaylists,
  saveUserPlaylist,
  recordMusicPlay,
  getTopTracks,
  getMusicListeningHistory,
  recordGameResult,
  getGameResults,
  getRoutineLogsForDate,
  toggleRoutineTask,
  getAllRoutineLogs,
  recordMoodCheckin,
  getMoodCheckins,
  getOrCreatePatientInviteCode,
  getPatientByInviteCode,
  linkPatientCaregiver,
  getCaregiverLinkedPatients,
  getPatientLinkedCaregivers,
  updateLinkStatus,
  verifyActiveLink,
  getPatientCaregiverOverview,
  recordVoiceAssistantLog,
  getVoiceAssistantLogs,
} from './userDataService.js';

dotenv.config();

// Initialize persistent SQLite store
initDatabase();

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for frontend applications
// ⚠️  In production: replace localhost origins with your real deployed domain(s).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// Always permit local development servers
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5177',
  'http://127.0.0.1:5178',
  'http://127.0.0.1:5179',
];

const CORS_ORIGINS = [...new Set([...DEV_ORIGINS, ...ALLOWED_ORIGINS])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, Postman) in development
    if (!origin) return callback(null, true);
    if (CORS_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

app.use(express.json());

const getParam = (val: string | string[] | undefined): string =>
  Array.isArray(val) ? val[0] : (val || '');

// 1. Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'NeuroNova AI Cognitive Progress Engine & User Data Service',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!(
      process.env.OPENROUTER_API_KEY &&
      !process.env.OPENROUTER_API_KEY.includes('your_') &&
      !process.env.OPENROUTER_API_KEY.includes('REPLACE_')
    ),
  });
});

// ============================================================================
// PER-USER PERSISTENCE ENDPOINTS (Multi-Account Scoped by userId)
// ============================================================================

// Sync or register user session
app.post('/api/user/sync-session', (req: Request, res: Response) => {
  try {
    const id = req.body.id || req.body.userId;
    const name = req.body.name || req.body.displayName || 'User';
    const emailOrPhone = req.body.emailOrPhone || req.body.email || req.body.phone;
    const role = req.body.role || 'patient';

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    syncUserProfile({ id, name, emailOrPhone, role });
    res.json({ success: true, user: getUserProfile(id) });
  } catch (err: any) {
    console.error('[User API] Error syncing profile:', err);
    res.status(500).json({ error: 'Failed to sync profile' });
  }
});

app.get('/api/user/:userId/profile', (req: Request, res: Response) => {
  try {
    const profile = getUserProfile(getParam(req.params.userId));
    res.json({ profile });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Music: Liked songs per user
app.get('/api/user/:userId/music/liked', (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const liked = getLikedSongs(userId);
    res.json({ songs: liked, likedSongs: liked });
  } catch (err: any) {
    console.error('[User API] Error getting liked songs:', err);
    res.status(500).json({ error: 'Failed to fetch liked songs', songs: [], likedSongs: [] });
  }
});

app.post('/api/user/:userId/music/liked/toggle', (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const song = req.body.song || req.body;
    if (!song || !song.id) {
      return res.status(400).json({ error: 'Song object with id is required' });
    }
    const result = toggleLikedSong(userId, song);
    const updated = getLikedSongs(userId);
    res.json({ ...result, songs: updated, likedSongs: updated });
  } catch (err: any) {
    console.error('[User API] Error toggling liked song:', err);
    res.status(500).json({ error: 'Failed to toggle liked song' });
  }
});

// Music: Custom Playlists per user
app.get('/api/user/:userId/music/playlists', (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const playlists = getUserPlaylists(userId);
    res.json({ playlists });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch playlists', playlists: [] });
  }
});

app.post('/api/user/:userId/music/playlists', (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const playlist = req.body;
    if (!playlist || !playlist.id || !playlist.name) {
      return res.status(400).json({ error: 'Playlist id and name are required' });
    }
    saveUserPlaylist(userId, playlist);
    const playlists = getUserPlaylists(userId);
    res.json({ success: true, playlists });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save playlist' });
  }
});

// Music: Record track play per user
app.post('/api/user/:userId/music/record-play', (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const track = req.body.track || req.body;
    if (!track || !track.id) {
      return res.status(400).json({ error: 'Track object with id is required' });
    }
    recordMusicPlay(userId, track);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[User API] Error recording music play:', err);
    res.status(500).json({ error: 'Failed to record music play' });
  }
});

// Music: Patient Top Tracks (ordered by play count)
app.get('/api/user/:userId/music/top-tracks', (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const topTracks = getTopTracks(userId, limit);
    res.json({ tracks: topTracks, topTracks });
  } catch (err: any) {
    console.error('[User API] Error fetching top tracks:', err);
    res.status(500).json({ error: 'Failed to fetch top tracks', tracks: [], topTracks: [] });
  }
});

// Music: Patient Listening History
app.get('/api/user/:userId/music/history', (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const history = getMusicListeningHistory(userId, limit);
    res.json({ tracks: history, history });
  } catch (err: any) {
    console.error('[User API] Error fetching music history:', err);
    res.status(500).json({ error: 'Failed to fetch music history', tracks: [], history: [] });
  }
});

// Games: Results & history per user
app.get('/api/user/:userId/games/results', (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const results = getGameResults(userId, limit);
    res.json({ results });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch game results', results: [] });
  }
});

app.post('/api/user/:userId/games/results', (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const result = req.body;
    if (!result || !result.gameType) {
      return res.status(400).json({ error: 'Game result is required' });
    }
    recordGameResult(userId, result);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[User API] Error recording game result:', err);
    res.status(500).json({ error: 'Failed to save game result' });
  }
});

// Routine: Daily task completions per user
app.get('/api/user/:userId/routine', (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const logs = getRoutineLogsForDate(userId, dateStr);
    res.json({ date: dateStr, logs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch routine logs', logs: [] });
  }
});

app.post('/api/user/:userId/routine/toggle', (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const task = req.body;
    const rId = task?.routineId || task?.taskId;
    if (!task || !rId) {
      return res.status(400).json({ error: 'routineId or taskId is required' });
    }
    toggleRoutineTask(userId, task);
    const dateStr = task.date || new Date().toISOString().split('T')[0];
    const logs = getRoutineLogsForDate(userId, dateStr);
    res.json({ success: true, logs, routineLogs: logs });
  } catch (err: any) {
    console.error('[User API] Error toggling routine task:', err);
    res.status(500).json({ error: 'Failed to toggle routine task' });
  }
});

// Mood Check-in per user
app.get('/api/user/:userId/mood', (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const moods = getMoodCheckins(userId);
    res.json({ moods });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch mood history', moods: [] });
  }
});

app.post('/api/user/:userId/mood', (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId);
    const moodData = req.body;
    if (!moodData || !moodData.mood) {
      return res.status(400).json({ error: 'mood is required' });
    }
    recordMoodCheckin(userId, moodData);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save mood' });
  }
});

// ============================================================================
// PATIENT-CAREGIVER LINKING & ACCESS CONTROL ENDPOINTS
// ============================================================================

// 1. Patient Invite Code (retrieval / creation)
app.get('/api/patient/:patientId/invite-code', (req: Request, res: Response) => {
  try {
    const patientId = getParam(req.params.patientId);
    const patientName = getParam(req.query.name as string);
    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required' });
    }
    if (patientName) {
      syncUserProfile({ id: patientId, name: patientName, role: 'patient' });
    }
    const inviteCode = getOrCreatePatientInviteCode(patientId);
    res.json({ patientId, inviteCode });
  } catch (err: any) {
    console.error('[Linking API] Error retrieving invite code:', err);
    res.status(500).json({ error: 'Failed to generate or retrieve invite code' });
  }
});

// 2. Caregiver connects to patient via invite code
app.post('/api/caregiver/link', (req: Request, res: Response) => {
  try {
    const { caregiverId, inviteCode, relationship } = req.body;
    if (!caregiverId || !inviteCode) {
      return res.status(400).json({ error: 'caregiverId and inviteCode are required' });
    }

    const patient = getPatientByInviteCode(inviteCode);
    if (!patient) {
      return res.status(404).json({
        error: 'Invalid invite code. Please check the code provided by the patient or family member.',
        code: 'INVALID_INVITE_CODE',
      });
    }

    const rel = relationship || 'Family Caregiver';
    const linkResult = linkPatientCaregiver(patient.patientId, caregiverId, rel, caregiverId);

    res.json({
      success: true,
      message: `Successfully connected to ${patient.name || 'Patient'}`,
      patient,
      link: linkResult,
    });
  } catch (err: any) {
    console.error('[Linking API] Error linking caregiver and patient:', err);
    res.status(500).json({ error: 'Failed to link caregiver to patient' });
  }
});

// 3. List active linked patients for caregiver
app.get('/api/caregiver/:caregiverId/patients', (req: Request, res: Response) => {
  try {
    const caregiverId = getParam(req.params.caregiverId);
    const patients = getCaregiverLinkedPatients(caregiverId);
    res.json({ caregiverId, patients });
  } catch (err: any) {
    console.error('[Linking API] Error fetching caregiver patients:', err);
    res.status(500).json({ error: 'Failed to fetch linked patients', patients: [] });
  }
});

// 4. List linked caregivers for patient
app.get('/api/patient/:patientId/caregivers', (req: Request, res: Response) => {
  try {
    const patientId = getParam(req.params.patientId);
    const caregivers = getPatientLinkedCaregivers(patientId);
    res.json({ patientId, caregivers });
  } catch (err: any) {
    console.error('[Linking API] Error fetching patient caregivers:', err);
    res.status(500).json({ error: 'Failed to fetch caregivers', caregivers: [] });
  }
});

// 5. Update link status (active or revoked)
app.post('/api/caregiver/link/status', (req: Request, res: Response) => {
  try {
    const { patientId, caregiverId, status } = req.body;
    if (!patientId || !caregiverId || !status) {
      return res.status(400).json({ error: 'patientId, caregiverId, and status are required' });
    }
    if (status !== 'active' && status !== 'revoked') {
      return res.status(400).json({ error: 'Status must be either "active" or "revoked"' });
    }
    const updated = updateLinkStatus(patientId, caregiverId, status);
    res.json({ success: updated, patientId, caregiverId, status });
  } catch (err: any) {
    console.error('[Linking API] Error updating link status:', err);
    res.status(500).json({ error: 'Failed to update link status' });
  }
});

// 6. Caregiver Patient Overview — SECURED WITH STRICT LINK AUTHORIZATION
app.get('/api/caregiver/:caregiverId/patient/:patientId/overview', (req: Request, res: Response) => {
  try {
    const caregiverId = getParam(req.params.caregiverId);
    const patientId = getParam(req.params.patientId);

    if (!caregiverId || !patientId) {
      return res.status(400).json({ error: 'caregiverId and patientId are required' });
    }

    // STRICT ACCESS CONTROL: Must have an active link in SQLite
    const hasAccess = verifyActiveLink(caregiverId, patientId);
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden: You do not have an active link to view this patient’s private health data.',
        code: 'FORBIDDEN_LINK_REQUIRED',
      });
    }

    const overview = getPatientCaregiverOverview(caregiverId, patientId);
    res.json({ success: true, overview });
  } catch (err: any) {
    console.error('[Linking API] Error fetching caregiver patient overview:', err);
    res.status(500).json({ error: 'Failed to load patient overview' });
  }
});

// ============================================================================
// COGNITIVE EVALUATION & PROGRESS SUMMARY (Backed by real database records)
// ============================================================================

app.post('/api/progress-summary', async (req: Request, res: Response) => {
  try {
    const body = req.body as ProgressSummaryRequest & { forceRefresh?: boolean };
    const patientId = body.patientId || 'default-patient';
    const patientName = body.patientName || 'Friend';
    const audience = body.audience === 'caregiver' ? 'caregiver' : 'patient';
    const windowDays = body.windowDays || 7;
    const forceRefresh = !!body.forceRefresh;

    // Check cache
    const cacheKey = getCacheKey(patientId, audience);
    if (!forceRefresh) {
      const cached = getCachedSummary(cacheKey);
      if (cached) {
        return res.json({
          ...cached,
          cached: true,
        });
      }
    }

    // Pull real database records if not supplied explicitly in request body
    const realGameResults = (body.gameResults && body.gameResults.length > 0)
      ? body.gameResults
      : getGameResults(patientId, 100);

    const realRoutineLogs = (body.routineLogs && body.routineLogs.length > 0)
      ? body.routineLogs
      : getAllRoutineLogs(patientId, windowDays);

    // Step 1: Deterministic stats computation in TypeScript
    const computedStats = computeCognitiveStats(
      patientId,
      patientName,
      realGameResults,
      realRoutineLogs,
      windowDays
    );

    // Step 2: Synthesize structured narrative via OpenRouter (with automatic fallback)
    const summaryResponse = await generateNarrativeSummary(computedStats, audience);

    // Cache result
    setCachedSummary(cacheKey, summaryResponse);

    return res.json({
      ...summaryResponse,
      cached: false,
    });
  } catch (err: any) {
    console.error('[NeuroNova AI] Unexpected error handling progress summary:', err);
    res.status(500).json({
      error: 'Unable to evaluate progress at this moment.',
      timestamp: new Date().toISOString(),
    });
  }
});

// Stats-only endpoint (deterministic calculation without LLM call)
app.post('/api/compute-stats', (req: Request, res: Response) => {
  try {
    const body = req.body as ProgressSummaryRequest;
    const patientId = body.patientId || 'default-patient';
    const realGames = (body.gameResults && body.gameResults.length > 0)
      ? body.gameResults
      : getGameResults(patientId, 100);
    const realRoutines = (body.routineLogs && body.routineLogs.length > 0)
      ? body.routineLogs
      : getAllRoutineLogs(patientId, body.windowDays || 7);

    const stats = computeCognitiveStats(
      patientId,
      body.patientName || 'Friend',
      realGames,
      realRoutines,
      body.windowDays || 7
    );
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

// ============================================================================
// MUSIC THERAPY SEARCH & DURATION LOOKUP
// ============================================================================

const handleMusicSearch = async (req: Request, res: Response) => {
  try {
    const era = (req.query.era as string) || (req.query.decade as string) || '1970s';
    const genre = (req.query.genre as string) || 'all';
    const region = (req.query.region as string) || undefined;
    const query = (req.query.q as string) || (req.query.query as string) || undefined;

    const result = await searchYouTubeMusic(era, genre, region, query);
    res.json(result);
  } catch (err: any) {
    console.error('[NeuroNova YouTube] Error handling search request:', err);
    res.status(500).json({
      error: 'Unable to retrieve nostalgia tracks at this time.',
      tracks: [],
    });
  }
};

app.get('/api/music/search', handleMusicSearch);
app.get('/api/youtube/search', handleMusicSearch);

app.get('/api/youtube/details', async (req: Request, res: Response) => {
  try {
    const idsParam = (req.query.ids as string) || (req.query.id as string) || '';
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      return res.json({ durations: {} });
    }
    const apiKey = process.env.YOUTUBE_API_KEY || '';
    const durationMap = await fetchYouTubeVideoDetails(ids, apiKey);
    const durations: Record<string, any> = {};
    for (const [id, info] of durationMap.entries()) {
      durations[id] = info;
    }
    res.json({ durations });
  } catch (err: any) {
    console.error('[NeuroNova YouTube] Error fetching details:', err);
    res.status(500).json({ error: 'Failed to fetch video details', durations: {} });
  }
});

// Contextual AI dynamic queue generator: adapts Up Next to mood, genre, and era of current track
app.get('/api/music/contextual-queue', async (req: Request, res: Response) => {
  try {
    const title = (req.query.title as string) || (req.query.song as string) || '';
    const artist = (req.query.artist as string) || '';
    console.log(`[Contextual Queue API] Generating queue for: "${title}" by "${artist}"`);
    const result = await generateContextualQueue(title, artist);
    res.json(result);
  } catch (err: any) {
    console.error('[Contextual Queue API] Error:', err);
    res.status(500).json({
      vibeLabel: 'Similar Melodies',
      genre: 'general',
      mood: 'peaceful',
      recommendedQueries: [],
      tracks: [],
      source: 'heuristic_engine',
    });
  }
});

// ============================================================================
// NEUROMUSIC REAL-TIME PLAYBACK COMMAND QUEUE
// ============================================================================

app.post('/api/player/command', (req: Request, res: Response) => {
  try {
    const { patientId, type, track, query } = req.body;
    if (!type) {
      return res.status(400).json({ error: 'type is required' });
    }
    const cmd = dispatchPlayerCommand(patientId, type, track, query);
    res.json({ success: true, command: cmd });
  } catch (err: any) {
    console.error('[Player Command API] Error dispatching command:', err);
    res.status(500).json({ error: 'Failed to dispatch player command' });
  }
});

app.get('/api/player/command', (req: Request, res: Response) => {
  try {
    const patientId = (req.query.patientId as string) || (req.query.userId as string) || 'default-patient';
    const since = req.query.since ? parseInt(req.query.since as string, 10) : undefined;
    const command = getLatestPlayerCommand(patientId, since);
    res.json({ command });
  } catch (err: any) {
    console.error('[Player Command API] Error retrieving command:', err);
    res.status(500).json({ error: 'Failed to retrieve player command' });
  }
});

// ============================================================================
// VOICE COMPANION AI & ACTION EXECUTION ENDPOINT
// ============================================================================

app.post('/api/voice-assistant', async (req: Request, res: Response) => {
  try {
    const { userId, question, userName, language } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({ error: 'question is required' });
    }

    const uid = userId || 'default-patient';
    const qTrimmed = question.trim();
    const effectiveUserName = userName || 'Friend';

    // 1. First classify the user's intent into an ACTION TYPE (supports English & Hindi)
    const classifiedIntent = classifyVoiceIntent(qTrimmed, language);
    const isHindi = Boolean(classifiedIntent.isHindi);

    // 2. Action: PLAY SPECIFIC SONG
    if (classifiedIntent.type === 'play_specific_song' && classifiedIntent.query) {
      const rawQuery = classifiedIntent.query;
      const songQuery = rawQuery.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
      console.log(`[Voice Assistant] Intent: play_specific_song | Query: "${songQuery}" | Lang: ${isHindi ? 'hi' : 'en'}`);

      // Search real YouTube music pipeline with query targeting individual songs
      const effectiveSearchQuery = /\b(song|songs|gaana|geet|music|track|audio|bhajan|aarti|dhun)\b/i.test(songQuery)
        ? songQuery
        : `${songQuery} song`;
      let searchResult = await searchYouTubeMusic('1970s', 'all', undefined, effectiveSearchQuery);
      if (!searchResult.tracks || searchResult.tracks.length === 0) {
        searchResult = await searchYouTubeMusic('1970s', 'all', undefined, songQuery);
      }

      if (searchResult.tracks && searchResult.tracks.length > 0) {
        const topTrack = searchResult.tracks[0];
        // Clean title & channel for natural speech
        let cleanTitle = (topTrack.title || songQuery)
          .replace(/\(.*?\)/g, '')
          .replace(/\[.*?\]/g, '')
          .replace(/official\s+(?:music\s+)?video/i, '')
          .replace(/lyric\s+video/i, '')
          .replace(/audio/i, '')
          .trim();

        if (cleanTitle.includes('|')) {
          cleanTitle = cleanTitle.split('|')[0].trim();
        }

        let spokenTrackName = cleanTitle;
        let spokenArtist = topTrack.channelTitle || 'YouTube Artist';

        if (cleanTitle.includes(' - ')) {
          const [art, tit] = cleanTitle.split(' - ');
          if (art && tit) {
            spokenArtist = art.trim();
            spokenTrackName = tit.trim();
          }
        }

        // Dispatch real playback command to Neuromusic
        const command = dispatchPlayerCommand(uid, 'PLAY_TRACK', topTrack, songQuery);

        const englishReply = `Playing "${spokenTrackName}" by ${spokenArtist} for you now.`;
        const hindiReply = `आपके लिए ${spokenArtist} का गाना "${spokenTrackName}" बजा रहे हैं।`;
        const spokenReplyFinal = isHindi ? hindiReply : englishReply;

        recordVoiceAssistantLog({
          userId: uid, userName: effectiveUserName, rawQuestion: qTrimmed,
          translatedQuestion: `Play ${songQuery}`, detectedLanguage: isHindi ? 'hi' : 'en',
          intent: 'play_specific_song', replyText: englishReply, spokenReply: spokenReplyFinal,
          actionLabel: `Play: ${spokenTrackName}`, actionUrl: `http://localhost:5177/?play=${encodeURIComponent(cleanTitle)}`,
          actionIcon: 'music', songName: spokenTrackName, source: 'action_execution',
        });

        return res.json({
          reply: englishReply,
          displayReply: englishReply,
          spokenReply: spokenReplyFinal,
          translatedQuestion: `Play ${songQuery}`,
          source: 'action_execution',
          intent: 'play_specific_song',
          autoRedirect: true,
          isHindi,
          track: topTrack,
          suggestedAction: {
            label: `Play: ${spokenTrackName}`,
            url: `http://localhost:5177/?play=${encodeURIComponent(cleanTitle)}`,
            icon: 'music',
          },
          command,
        });
      } else {
        // Fallback if genuinely not found: start peaceful automated music
        const command = dispatchPlayerCommand(uid, 'PLAY_GENERAL', undefined, songQuery);
        const englishReply = `I couldn't find "${songQuery}", but I am starting some peaceful morning melodies for you instead.`;
        const hindiReply = `मुझे "${songQuery}" नहीं मिला, लेकिन आपके लिए शांत और मधुर संगीत शुरू कर रहे हैं।`;
        const spokenReplyFinal = isHindi ? hindiReply : englishReply;

        recordVoiceAssistantLog({
          userId: uid, userName: effectiveUserName, rawQuestion: qTrimmed,
          translatedQuestion: `Play ${songQuery}`, detectedLanguage: isHindi ? 'hi' : 'en',
          intent: 'play_specific_song', replyText: englishReply, spokenReply: spokenReplyFinal,
          actionLabel: 'Open Neuromusic', actionUrl: 'http://localhost:5177/',
          actionIcon: 'music', songName: songQuery, source: 'action_execution_fallback',
        });

        return res.json({
          reply: englishReply,
          displayReply: englishReply,
          spokenReply: spokenReplyFinal,
          translatedQuestion: `Play ${songQuery}`,
          source: 'action_execution_fallback',
          intent: 'play_specific_song',
          autoRedirect: true,
          isHindi,
          suggestedAction: {
            label: 'Open Neuromusic',
            url: 'http://localhost:5177/',
            icon: 'music',
          },
          command,
        });
      }
    }

    // 3. Action: PLAY GENERAL MUSIC (no specific song named)
    if (classifiedIntent.type === 'play_general_music') {
      console.log(`[Voice Assistant] Intent: play_general_music | Lang: ${isHindi ? 'hi' : 'en'}`);
      const command = dispatchPlayerCommand(uid, 'PLAY_GENERAL');
      const englishReply = `Opening peaceful morning melodies for you now, ${effectiveUserName}. Settle back, relax, and let the music ease your mind.`;
      const hindiReply = `${effectiveUserName}, आपके लिए शांत और सुखद संगीत शुरू कर रहे हैं। आराम से बैठिए और आनंद लीजिए।`;
      const spokenReplyFinal = isHindi ? hindiReply : englishReply;

      recordVoiceAssistantLog({
        userId: uid, userName: effectiveUserName, rawQuestion: qTrimmed,
        translatedQuestion: 'Play peaceful music', detectedLanguage: isHindi ? 'hi' : 'en',
        intent: 'play_general_music', replyText: englishReply, spokenReply: spokenReplyFinal,
        actionLabel: 'Open Neuromusic', actionUrl: 'http://localhost:5177/', actionIcon: 'music',
        source: 'action_execution',
      });

      return res.json({
        reply: englishReply,
        displayReply: englishReply,
        spokenReply: spokenReplyFinal,
        translatedQuestion: 'Play peaceful music',
        source: 'action_execution',
        intent: 'play_general_music',
        autoRedirect: true,
        isHindi,
        suggestedAction: {
          label: 'Open Neuromusic',
          url: 'http://localhost:5177/',
          icon: 'music',
        },
        command,
      });
    }

    // 4. Action: PAUSE MUSIC
    if (classifiedIntent.type === 'pause_music') {
      console.log(`[Voice Assistant] Intent: pause_music | Lang: ${isHindi ? 'hi' : 'en'}`);
      const command = dispatchPlayerCommand(uid, 'PAUSE');
      const englishReply = `Music paused for you, ${effectiveUserName}.`;
      const hindiReply = `${effectiveUserName}, आपका संगीत रोक दिया गया है।`;
      const spokenReplyFinal = isHindi ? hindiReply : englishReply;

      recordVoiceAssistantLog({
        userId: uid, userName: effectiveUserName, rawQuestion: qTrimmed,
        detectedLanguage: isHindi ? 'hi' : 'en', intent: 'pause_music',
        replyText: englishReply, spokenReply: spokenReplyFinal, source: 'action_execution',
      });

      return res.json({
        reply: englishReply,
        displayReply: englishReply,
        spokenReply: spokenReplyFinal,
        translatedQuestion: 'Pause music',
        source: 'action_execution',
        intent: 'pause_music',
        isHindi,
        suggestedAction: null,
        command,
      });
    }

    // 5. Action: RESUME MUSIC
    if (classifiedIntent.type === 'resume_music') {
      console.log(`[Voice Assistant] Intent: resume_music | Lang: ${isHindi ? 'hi' : 'en'}`);
      const command = dispatchPlayerCommand(uid, 'RESUME');
      const englishReply = `Resuming your peaceful melodies now, ${effectiveUserName}.`;
      const hindiReply = `${effectiveUserName}, आपका संगीत फिर से शुरू किया जा रहा है।`;
      const spokenReplyFinal = isHindi ? hindiReply : englishReply;

      recordVoiceAssistantLog({
        userId: uid, userName: effectiveUserName, rawQuestion: qTrimmed,
        detectedLanguage: isHindi ? 'hi' : 'en', intent: 'resume_music',
        replyText: englishReply, spokenReply: spokenReplyFinal, source: 'action_execution',
      });

      return res.json({
        reply: englishReply,
        displayReply: englishReply,
        spokenReply: spokenReplyFinal,
        translatedQuestion: 'Resume music',
        source: 'action_execution',
        intent: 'resume_music',
        isHindi,
        suggestedAction: null,
        command,
      });
    }

    // Fetch real patient context from SQLite for grounding routine/game/open-ended queries
    const todayStr = new Date().toISOString().split('T')[0];
    const routineLogs = getRoutineLogsForDate(uid, todayStr);
    const recentGames = getGameResults(uid, 5);
    const likedSongs = getLikedSongs(uid).slice(0, 5);
    const profile = getUserProfile(uid);

    const now = new Date();
    const currentTimeEn = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const currentDateEn = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const currentTimeHi = now.toLocaleTimeString('hi-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    const currentDateHi = now.toLocaleDateString('hi-IN', { weekday: 'long', month: 'long', day: 'numeric' });

    // 6. Action: DATE / TIME INQUIRY
    if (classifiedIntent.type === 'date_time_inquiry') {
      const englishReply = `Today is ${currentDateEn}. The time is currently ${currentTimeEn}. The day is calm and peaceful.`;
      const hindiReply = `आज ${currentDateHi} है। समय लगभग ${currentTimeHi} हो रहा है। आपका दिन सुखद और शांत रहे।`;
      const spokenReplyFinal = isHindi ? hindiReply : englishReply;

      recordVoiceAssistantLog({
        userId: uid, userName: effectiveUserName, rawQuestion: qTrimmed,
        translatedQuestion: 'What day and time is it?', detectedLanguage: isHindi ? 'hi' : 'en',
        intent: 'date_time_inquiry', replyText: englishReply, spokenReply: spokenReplyFinal,
        source: 'action_execution',
      });

      return res.json({
        reply: englishReply,
        displayReply: englishReply,
        spokenReply: spokenReplyFinal,
        translatedQuestion: 'What day and time is it?',
        source: 'action_execution',
        intent: 'date_time_inquiry',
        isHindi,
        suggestedAction: null,
      });
    }

    // 7. Action: ROUTINE / SCHEDULE INQUIRY
    if (classifiedIntent.type === 'routine_inquiry') {
      const pending = routineLogs.filter((r: any) => !(r.completed || r.completedAt));
      let englishReply = '';
      let hindiReply = '';
      if (pending.length > 0) {
        const nextItem = pending[0];
        const timeStr = nextItem.displayTime || nextItem.time || 'soon';
        englishReply = `Up next at ${timeStr} is "${nextItem.title}". ${nextItem.friendlyPrompt || ''} You are doing wonderful today!`;
        hindiReply = `आपकी अगली गतिविधि ${timeStr} पर "${nextItem.title}" है। ${nextItem.friendlyPrompt || ''} आप बहुत अच्छा कर रहे हैं!`;
      } else {
        englishReply = `You have completed all your planned activities for today, ${effectiveUserName}! It is a wonderful time to listen to peaceful music or rest.`;
        hindiReply = `आज के लिए आपकी सभी तय गतिविधियां पूरी हो चुकी हैं, ${effectiveUserName}! अब आप आराम कर सकते हैं या मधुर संगीत सुन सकते हैं।`;
      }
      const spokenReplyFinal = isHindi ? hindiReply : englishReply;

      recordVoiceAssistantLog({
        userId: uid, userName: effectiveUserName, rawQuestion: qTrimmed,
        translatedQuestion: 'What is my schedule today?', detectedLanguage: isHindi ? 'hi' : 'en',
        intent: 'routine_inquiry', replyText: englishReply, spokenReply: spokenReplyFinal,
        source: 'action_execution',
      });

      return res.json({
        reply: englishReply,
        displayReply: englishReply,
        spokenReply: spokenReplyFinal,
        translatedQuestion: 'What is my schedule today?',
        source: 'action_execution',
        intent: 'routine_inquiry',
        isHindi,
        suggestedAction: null,
      });
    }

    // 8. Action: GAME INQUIRY
    if (classifiedIntent.type === 'game_inquiry') {
      const englishReply = `Exercising your brain keeps your mind vibrant and happy, ${effectiveUserName}! Would you like to play some gentle Neurogames?`;
      const hindiReply = `दिमागी खेल आपके मन को सक्रिय और खुश रखते हैं, ${effectiveUserName}! क्या आप एक मेमोरी मैच गेम खेलना चाहेंगे?`;
      const spokenReplyFinal = isHindi ? hindiReply : englishReply;

      recordVoiceAssistantLog({
        userId: uid, userName: effectiveUserName, rawQuestion: qTrimmed,
        translatedQuestion: 'Play gentle games', detectedLanguage: isHindi ? 'hi' : 'en',
        intent: 'game_inquiry', replyText: englishReply, spokenReply: spokenReplyFinal,
        actionLabel: 'Play Neurogames', actionUrl: 'http://localhost:5178/', actionIcon: 'game',
        source: 'action_execution',
      });

      return res.json({
        reply: englishReply,
        displayReply: englishReply,
        spokenReply: spokenReplyFinal,
        translatedQuestion: 'Play gentle games',
        source: 'action_execution',
        intent: 'game_inquiry',
        isHindi,
        suggestedAction: {
          label: 'Play Neurogames',
          url: 'http://localhost:5178/',
          icon: 'game',
        },
      });
    }

    // 9. OPEN-ENDED: Route through OpenRouter LLM with rich grounding
    const context = {
      question: qTrimmed,
      userName: effectiveUserName || profile?.name || 'Friend',
      userId: uid,
      currentTime: currentTimeEn,
      currentDate: currentDateEn,
      isHindi,
      routine: routineLogs.map((r: any) => ({
        title: r.title || r.taskId,
        displayTime: r.displayTime || r.time,
        completed: !!(r.completed || r.completedAt),
        category: r.category,
        friendlyPrompt: r.friendlyPrompt,
      })),
      recentGames: recentGames.map((g: any) => ({
        gameType: g.gameType,
        score: g.score,
        accuracy: g.accuracy,
      })),
      recentMusic: likedSongs.map((s: any) => ({
        title: s.title,
        artist: s.artist,
      })),
    };

    const response = await generateVoiceCompanionResponse(context);

    // Log LLM open-ended response to history
    const llmEnglishReply = response.displayReply || response.reply || '';
    const llmSpokenReply = response.spokenReply || llmEnglishReply;
    const llmAction = response.suggestedAction as any;
    recordVoiceAssistantLog({
      userId: uid, userName: effectiveUserName, rawQuestion: qTrimmed,
      translatedQuestion: response.translatedQuestion,
      detectedLanguage: isHindi ? 'hi' : 'en',
      intent: (response as any).intent || 'open_ended',
      replyText: llmEnglishReply,
      spokenReply: llmSpokenReply,
      actionLabel: llmAction?.label || undefined,
      actionUrl: llmAction?.url || undefined,
      actionIcon: llmAction?.icon || undefined,
      songName: llmAction?.icon === 'music' ? (response.translatedQuestion || undefined) : undefined,
      source: response.source || 'llm',
    });

    return res.json({
      ...response,
      isHindi,
      language: isHindi ? 'hi' : 'en',
    });
  } catch (err: any) {
    console.error('[Voice Companion API] Unexpected error:', err);
    res.status(500).json({
      reply: 'I am right here with you. There was a small hiccup reaching my thoughts. Please try asking me again.',
      source: 'fallback',
      suggestedAction: null,
    });
  }
});

// ============================================================================
// CAREGIVER: PATIENT VOICE ASSISTANT HISTORY
// ============================================================================

app.get('/api/caregiver/:caregiverId/patient/:patientId/voice-history', (req: Request, res: Response) => {
  try {
    const caregiverId = getParam(req.params.caregiverId);
    const patientId = getParam(req.params.patientId);
    const limit = parseInt(req.query.limit as string, 10) || 50;

    if (!caregiverId || !patientId) {
      return res.status(400).json({ error: 'caregiverId and patientId are required' });
    }

    // STRICT ACCESS CONTROL: Must have an active link
    const hasAccess = verifyActiveLink(caregiverId, patientId);
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden: You do not have an active link to view this patient data.',
        code: 'FORBIDDEN_LINK_REQUIRED',
      });
    }

    const logs = getVoiceAssistantLogs(patientId, limit);
    res.json({ success: true, logs, total: logs.length });
  } catch (err: any) {
    console.error('[Voice History API] Error:', err);
    res.status(500).json({ error: 'Failed to load voice history' });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🧠 NeuroNova AI Evaluation & User Data Service on port ${PORT}`);
  console.log(`- Health: http://localhost:${PORT}/health`);
  console.log(`- Summary endpoint: POST http://localhost:${PORT}/api/progress-summary`);
  console.log(`====================================================`);
});
