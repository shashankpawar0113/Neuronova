import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Track, FormativeEra } from '../types';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  ListMusic, 
  Music, 
  Tv, 
  Home, 
  Search, 
  Plus, 
  Heart, 
  Shuffle, 
  Repeat, 
  ArrowLeft, 
  X, 
  Loader2,
  FolderPlus,
  Trash2,
  Clock,
  RefreshCw,
  MoreVertical,
  ListPlus,
  ChevronRight
} from 'lucide-react';

/**
 * ============================================================================
 * ARCHITECTURAL & CLINICAL PLATFORM LIMITATION NOTE:
 * ============================================================================
 * YouTube ads cannot be blocked or skipped via the IFrame Player API — this is a firm
 * platform limitation, not a bug. There is no legitimate API parameter or player
 * configuration that disables advertisements on third-party monetized videos.
 *
 * Any attempt to manipulate the DOM, strip ad scripts, or intercept ad network
 * requests violates YouTube's Terms of Service and must NOT be implemented.
 *
 * NEURONOVA'S BEST-EFFORT MITIGATION ARCHITECTURE:
 * 1. Upstream Backend Curation (Neuronovai/src/youtubeClient.ts):
 *    - Deprioritizes commercial music labels and prioritizes peaceful archives.
 * 2. Runtime Heuristic Detection & Graceful Communication (SessionPlayer.tsx):
 *    - Detects suspected ads via duration drops (< 35s) during playback.
 *    - Calming reassurance banner and soft Web Speech API voice reminder.
 *    - Session time accumulator pauses during ad interludes.
 * 3. Endless Listening & Milestone Notifications:
 *    - User can listen indefinitely without automatic exit.
 *    - Milestone toast & soft voice alert at 30 min and 60 min.
 * 4. Universal YouTube Music Search:
 *    - Users can search any song, artist, or nostalgic tune via backend YouTube API.
 *    - Real-time search results grid with instant playback.
 * ============================================================================
 */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Senior-friendly HTML entity decoder
function decodeHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

// Format seconds into MM:SS or H:MM:SS
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function getDisplayDuration(item?: Partial<MusicifyItem>): string {
  if (!item) return '--:--';
  if (item.formattedDuration && item.formattedDuration.trim().length > 0) {
    return item.formattedDuration;
  }
  if (typeof item.durationSeconds === 'number' && item.durationSeconds > 0) {
    return formatTime(item.durationSeconds);
  }
  if (typeof item.durationMinutes === 'number' && item.durationMinutes > 0) {
    return formatTime(Math.round(item.durationMinutes * 60));
  }
  return '--:--';
}

export interface MusicifyItem {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  albumArt: string;
  durationMinutes?: number;
  durationSeconds?: number;
  formattedDuration?: string;
  genre: string;
  playedAt?: number; // Timestamp of when the song was played (for 30-day history)
  playCount?: number; // Patient play count for computing top tracks
}

// 30 Days Retention Window in Milliseconds (30 * 24 * 60 * 60 * 1000)
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Curated Heritage & Dementia-Care Nostalgia Gems
const NOSTALGIA_GEMS_CATALOG: MusicifyItem[] = [
  {
    id: 'Wvl_K8VC9C4',
    title: 'Peaceful Sitar & Tanpura Meditation',
    artist: 'Shanti Instrumentals',
    albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    durationMinutes: 34.85,
    durationSeconds: 2091,
    formattedDuration: '34:51',
    genre: 'nostalgia_sitar',
  },
  {
    id: 'c6x8eSUbsRQ',
    title: '70s Evergreen Nostalgic Duets',
    artist: 'Kishore Kumar & Lata Mangeshkar',
    albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
    durationMinutes: 123.82,
    durationSeconds: 7429,
    formattedDuration: '2:03:49',
    genre: 'nostalgia_bollywood',
  },
  {
    id: '6Jfq4s-gTzg',
    title: 'Morning Sitar & Flute Raga',
    artist: 'Indian Soul Meditation Music',
    albumArt: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=500&auto=format&fit=crop&q=80',
    durationMinutes: 70.03,
    durationSeconds: 4202,
    formattedDuration: '1:10:02',
    genre: 'nostalgia_sitar',
  },
  {
    id: 'TYbaOdqWMUQ',
    title: 'Golden 70s Bollywood Melodies',
    artist: 'Rafi, Kishore, Lata',
    albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=80',
    durationMinutes: 75.78,
    durationSeconds: 4547,
    formattedDuration: '1:15:47',
    genre: 'nostalgia_bollywood',
  },
  {
    id: '80HDZa7sELo',
    title: 'Spiritual Mornings With Bhakti Instrumentals',
    artist: 'Strumm Spiritual',
    albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    durationMinutes: 99.57,
    durationSeconds: 5974,
    formattedDuration: '1:39:34',
    genre: 'nostalgia_devotional',
  },
];

export interface UserPlaylist {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
  tracks: MusicifyItem[];
}

const INITIAL_LIKED_SONGS: MusicifyItem[] = [
  NOSTALGIA_GEMS_CATALOG[1], // 70s Evergreen Nostalgic Duets
  NOSTALGIA_GEMS_CATALOG[0], // Peaceful Sitar & Tanpura Meditation
  NOSTALGIA_GEMS_CATALOG[2], // Morning Sitar & Flute Raga
];

const INITIAL_PLAYLISTS: UserPlaylist[] = [
  {
    id: 'playlist-morning-calm',
    name: 'Morning Calming Ragas',
    description: 'Gentle, soothing sitar and morning raga melodies to start the day peacefully.',
    color: 'from-emerald-700 to-teal-900',
    createdAt: Date.now() - 86400000,
    tracks: [
      NOSTALGIA_GEMS_CATALOG[0],
      NOSTALGIA_GEMS_CATALOG[2],
    ],
  },
  {
    id: 'playlist-golden-classics',
    name: 'Golden 70s Duets',
    description: 'Heartwarming nostalgic duets by Kishore Kumar, Lata Mangeshkar, and Mohd. Rafi.',
    color: 'from-amber-700 to-orange-900',
    createdAt: Date.now() - 172800000,
    tracks: [
      NOSTALGIA_GEMS_CATALOG[1],
      NOSTALGIA_GEMS_CATALOG[3],
    ],
  },
];

interface SessionPlayerProps {
  tracks: Track[];
  currentTrackIndex: number;
  onSelectTrackIndex: (index: number) => void;
  onEndSession: () => void;
  onReturnHome?: () => void;
  targetDurationMinutes?: number;
  userId?: string;
  userName?: string;
  userRole?: 'patient' | 'caregiver';
  initialSearchQuery?: string; // Voice Companion deep-link: auto-search & play this song
  patientAge?: number;
  formativeEra?: FormativeEra;
}

export const SessionPlayer: React.FC<SessionPlayerProps> = ({
  tracks,
  currentTrackIndex,
  onSelectTrackIndex,
  onEndSession,
  onReturnHome,
  targetDurationMinutes = 30,
  userId = 'guest_user',
  userName = 'Dada Anand',
  userRole = 'patient',
  initialSearchQuery = '',
  patientAge,
  formativeEra,
}) => {
  // Navigation Sidebar State
  const [navTab, setNavTab] = useState<'home' | 'search' | 'library'>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<MusicifyItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Liked Songs State (Persisted per user in backend + scoped localStorage cache)
  const isGuest = !userId || userId === 'guest_user';
  const [likedSongs, setLikedSongs] = useState<MusicifyItem[]>(() => {
    try {
      const localKey = isGuest ? 'neuromusic_liked_songs' : `neuromusic_liked_songs_${userId}`;
      const saved = localStorage.getItem(localKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return isGuest ? INITIAL_LIKED_SONGS : [];
  });

  // User Playlists State (Persisted per user in backend + scoped localStorage cache)
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>(() => {
    try {
      const localKey = isGuest ? 'neuromusic_user_playlists' : `neuromusic_user_playlists_${userId}`;
      const saved = localStorage.getItem(localKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return isGuest ? INITIAL_PLAYLISTS : [];
  });

  // Patient Top Tracks State (Derived from actual personal play-count history, scoped per patient)
  const topTracksLocalKey = isGuest ? 'neuromusic_top_tracks' : `neuromusic_top_tracks_${userId}`;
  const [topTracks, setTopTracks] = useState<MusicifyItem[]>(() => {
    try {
      const saved = localStorage.getItem(topTracksLocalKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [];
  });

  // Fetch real user liked songs, playlists & top tracks from central backend
  useEffect(() => {
    if (isGuest) return;
    let active = true;

    // Liked songs
    fetch(`http://localhost:5001/api/user/${encodeURIComponent(userId)}/music/liked`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!active || !data) return;
        if (Array.isArray(data.likedSongs)) {
          setLikedSongs(data.likedSongs);
          try {
            localStorage.setItem(`neuromusic_liked_songs_${userId}`, JSON.stringify(data.likedSongs));
          } catch (_) {}
        }
      })
      .catch(err => {
        console.warn('Failed to load user liked songs from backend:', err);
      });

    // Playlists
    fetch(`http://localhost:5001/api/user/${encodeURIComponent(userId)}/music/playlists`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!active || !data) return;
        if (Array.isArray(data.playlists)) {
          setUserPlaylists(data.playlists);
          try {
            localStorage.setItem(`neuromusic_user_playlists_${userId}`, JSON.stringify(data.playlists));
          } catch (_) {}
        }
      })
      .catch(err => {
        console.warn('Failed to load user playlists from backend:', err);
      });

    // Top Tracks (Patient's actual most-played songs from database)
    fetch(`http://localhost:5001/api/user/${encodeURIComponent(userId)}/music/top-tracks?limit=10`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!active || !data) return;
        if (Array.isArray(data.tracks)) {
          setTopTracks(data.tracks);
          try {
            localStorage.setItem(topTracksLocalKey, JSON.stringify(data.tracks));
          } catch (_) {}
        }
      })
      .catch(err => {
        console.warn('Failed to load user top tracks from backend:', err);
      });

    return () => { active = false; };
  }, [userId, isGuest, topTracksLocalKey]);

  // Active playlist detail view: null (shows standard grid), 'liked' (Liked Songs view), 'last_played' (History), or string (playlist ID)
  const [activePlaylistView, setActivePlaylistView] = useState<'liked' | 'last_played' | string | null>(null);

  // Last Played Songs State (Persisted in localStorage with 30-day retention window, scoped per patient)
  const historyLocalKey = isGuest ? 'neuromusic_last_played' : `neuromusic_last_played_${userId}`;
  const [lastPlayedSongs, setLastPlayedSongs] = useState<MusicifyItem[]>(() => {
    try {
      const saved = localStorage.getItem(historyLocalKey) || localStorage.getItem('neuromusic_last_played');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const now = Date.now();
          // Retain only entries within the 30-day window
          const valid = parsed
            .map((item: any) => ({
              ...item,
              playedAt: typeof item.playedAt === 'number' ? item.playedAt : now,
            }))
            .filter((item: MusicifyItem) => now - (item.playedAt || 0) <= THIRTY_DAYS_MS);
          return valid;
        }
      }
    } catch (_) {}
    return [];
  });

  // Create Playlist Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState<string>('');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(true); // True for endless looping!

  // Session Goal: 30, 60, or 0 (Endless)
  const [sessionGoalMinutes, setSessionGoalMinutes] = useState<number>(targetDurationMinutes);

  // Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(85); // 0 to 100
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState<number>(0);

  // Session Goal Completed: true when listening duration reaches chosen target
  const isSessionGoalCompleted = useMemo(() => {
    if (sessionGoalMinutes > 0) {
      return sessionElapsedSeconds >= sessionGoalMinutes * 60;
    }
    return sessionElapsedSeconds >= 1800;
  }, [sessionGoalMinutes, sessionElapsedSeconds]);

  const [trackElapsedSeconds, setTrackElapsedSeconds] = useState<number>(0);
  const [trackTotalDuration, setTrackTotalDuration] = useState<number>(240);
  const [viewVideo, setViewVideo] = useState<boolean>(false);

  // Player View Mode: 'now_playing' (default) vs 'queue' (Up Next)
  const [playerViewMode, setPlayerViewMode] = useState<'now_playing' | 'queue'>('now_playing');

  // Queue Refresh & Shuffle States
  const [isRefreshingQueue, setIsRefreshingQueue] = useState<boolean>(false);
  const [queueFeedbackToast, setQueueFeedbackToast] = useState<string | null>(null);

  // Contextual AI Queue & Mood/Genre Vibe State
  const [aiVibeLabel, setAiVibeLabel] = useState<string | null>(null);
  const [isFetchingContextualQueue, setIsFetchingContextualQueue] = useState<boolean>(false);
  const contextualFetchAbortRef = useRef<AbortController | null>(null);
  const lastAnalyzedTrackKeyRef = useRef<string>('');

  // Card Context Menu State ('Play Next', 'Add to Queue', 'Add to Playlist')
  const [openMenuTrackId, setOpenMenuTrackId] = useState<string | null>(null);
  const [menuStep, setMenuStep] = useState<'main' | 'choose_playlist'>('main');

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenMenuTrackId(null);
      setMenuStep('main');
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Milestone Notification State (30m, 60m)
  const [activeNotification, setActiveNotification] = useState<{
    title: string;
    message: string;
    type: '30m' | '60m';
  } | null>(null);
  const hasNotified30Ref = useRef<boolean>(false);
  const hasNotified60Ref = useRef<boolean>(false);

  // Audio Ducking State & Refs (Lowers song volume during soothing voice announcements)
  const isDuckedRef = useRef<boolean>(false);
  const preDuckingVolumeRef = useRef<number | null>(null);
  const duckFadeTimerRef = useRef<any>(null);
  const duckSafetyTimeoutRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Heuristic Ad Interruption State
  const [isAdInterrupted, setIsAdInterrupted] = useState<boolean>(false);
  const hasAnnouncedAdRef = useRef<boolean>(false);

  const playerRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef<boolean>(true);
  const handleNextTrackRef = useRef<() => void>(() => {});
  const lastKnownTimeRef = useRef<number>(0);
  const lastTickWallTimeRef = useRef<number>(performance.now());
  const hasUserSelectedTrackRef = useRef<boolean>(Boolean(initialSearchQuery && initialSearchQuery.trim() !== ''));
  const pendingAutoPlayQueryRef = useRef<string>(initialSearchQuery ? initialSearchQuery.trim() : '');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (duckFadeTimerRef.current) clearInterval(duckFadeTimerRef.current);
      if (duckSafetyTimeoutRef.current) clearTimeout(duckSafetyTimeoutRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }
    };
  }, []);

  // Map incoming AI-curated formative-era tracks to MusicifyItem format
  const aiCuratedQueue: MusicifyItem[] = useMemo(() => {
    if (!tracks || tracks.length === 0) return NOSTALGIA_GEMS_CATALOG;
    return tracks.map((t) => ({
      id: t.id,
      title: decodeHtml(t.title),
      artist: decodeHtml(t.channelTitle || t.artistOrChannel || 'Indian Classical & Nostalgia Archive'),
      albumArt: t.thumbnailUrl || t.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
      durationMinutes: t.durationMinutes,
      durationSeconds: t.durationSeconds,
      formattedDuration: t.formattedDuration,
      genre: t.genre || 'nostalgia',
    }));
  }, [tracks]);

  // Saved active session (preserves state across homepage navigation)
  const savedActiveSession = useMemo(() => {
    try {
      // If user arrives via deep-link to play a specific song, do not resume previously saved track
      if (initialSearchQuery && initialSearchQuery.trim() !== '') {
        return null;
      }
      const raw = localStorage.getItem('neuromusic_active_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.currentSong && (Date.now() - (parsed.savedAt || 0) < 24 * 60 * 60 * 1000)) {
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  }, [initialSearchQuery]);

  // Master Unified Playlist (defaults to AI-curated queue for true zero-effort autoplay)
  const [customPlaylist, setCustomPlaylist] = useState<MusicifyItem[]>(() => {
    if (savedActiveSession?.customPlaylist && Array.isArray(savedActiveSession.customPlaylist) && savedActiveSession.customPlaylist.length > 0) {
      return savedActiveSession.customPlaylist;
    }
    const initialAi = tracks && tracks.length > 0
      ? tracks.map((t) => ({
          id: t.id,
          title: decodeHtml(t.title),
          artist: decodeHtml(t.channelTitle || t.artistOrChannel || 'Indian Classical & Nostalgia Archive'),
          albumArt: t.thumbnailUrl || t.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
          durationMinutes: t.durationMinutes,
          durationSeconds: t.durationSeconds,
          formattedDuration: t.formattedDuration,
          genre: t.genre || 'nostalgia',
        }))
      : NOSTALGIA_GEMS_CATALOG;
    return initialAi;
  });

  // Current active song in player: automatically begins playing #1 track in AI-curated queue
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);
  const [currentSong, setCurrentSong] = useState<MusicifyItem>(() => {
    if (initialSearchQuery && initialSearchQuery.trim() !== '') {
      return {
        id: '',
        title: initialSearchQuery.trim(),
        artist: 'Playing requested song...',
        albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
        durationMinutes: 3,
        durationSeconds: 180,
        formattedDuration: '3:00',
        genre: 'search_result',
      };
    }
    if (savedActiveSession?.currentSong) {
      return savedActiveSession.currentSong;
    }
    if (tracks && tracks.length > 0) {
      const first = tracks[0];
      return {
        id: first.id,
        title: decodeHtml(first.title),
        artist: decodeHtml(first.channelTitle || first.artistOrChannel || 'Indian Classical & Nostalgia Archive'),
        albumArt: first.thumbnailUrl || first.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
        durationMinutes: first.durationMinutes,
        durationSeconds: first.durationSeconds,
        formattedDuration: first.formattedDuration,
        genre: first.genre || 'nostalgia',
      };
    }
    return NOSTALGIA_GEMS_CATALOG[0];
  });

  // Restore track elapsed position if returning to active session
  useEffect(() => {
    if (savedActiveSession) {
      hasUserSelectedTrackRef.current = true;
      if (typeof savedActiveSession.trackElapsedSeconds === 'number' && savedActiveSession.trackElapsedSeconds > 0) {
        setTrackElapsedSeconds(savedActiveSession.trackElapsedSeconds);
      }
    }
  }, [savedActiveSession]);

  // Keep playlist synchronized with backend AI-curated queue unless user has active session or requested song
  useEffect(() => {
    if (initialSearchQuery && initialSearchQuery.trim() !== '') return;
    if (aiCuratedQueue.length > 0 && !hasUserSelectedTrackRef.current && !savedActiveSession) {
      setCustomPlaylist(aiCuratedQueue);
      setCurrentSong(aiCuratedQueue[0]);
    }
  }, [aiCuratedQueue, savedActiveSession, initialSearchQuery]);

  // Resolve actual durations for any tracks in playlist that are missing exact duration
  const hasFetchedDurationsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const missing = customPlaylist.filter(
      (t) => t.id && (!t.durationSeconds || !t.formattedDuration) && !hasFetchedDurationsRef.current.has(t.id)
    );
    if (missing.length === 0) return;

    const idsToFetch = Array.from(new Set(missing.map((t) => t.id))).slice(0, 25);
    if (idsToFetch.length === 0) return;

    idsToFetch.forEach((id) => hasFetchedDurationsRef.current.add(id));

    fetch(`http://localhost:5001/api/youtube/details?ids=${idsToFetch.join(',')}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.durations) {
          setCustomPlaylist((prev) =>
            prev.map((item) => {
              const info = data.durations[item.id];
              if (info) {
                return {
                  ...item,
                  durationSeconds: info.durationSeconds,
                  durationMinutes: info.durationMinutes,
                  formattedDuration: info.formattedDuration,
                };
              }
              return item;
            })
          );
        }
      })
      .catch(() => {});
  }, [customPlaylist.length]);

  // Persist active session state to localStorage across navigation
  useEffect(() => {
    try {
      if (currentSong && currentSong.id) {
        localStorage.setItem(
          'neuromusic_active_session',
          JSON.stringify({
            currentSong,
            customPlaylist,
            trackElapsedSeconds: Math.floor(trackElapsedSeconds),
            savedAt: Date.now(),
          })
        );
      }
    } catch (_) {}
  }, [currentSong, customPlaylist, Math.floor(trackElapsedSeconds / 3)]);

  // Track last played song in persistent 30-day history and record play count
  useEffect(() => {
    if (!currentSong || !currentSong.id) return;
    const now = Date.now();

    // 1. Record play in central backend for this patient
    if (!isGuest) {
      fetch(`http://localhost:5001/api/user/${encodeURIComponent(userId)}/music/record-play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track: currentSong }),
      }).catch((err) => {
        console.warn('Failed to record music play to backend:', err);
      });
    }

    // 2. Update patient Top Tracks in client state & scoped localStorage
    setTopTracks((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === currentSong.id && s.title === currentSong.title);
      let updated: MusicifyItem[];
      if (existingIdx !== -1) {
        const existing = prev[existingIdx];
        const newCount = (existing.playCount || 1) + 1;
        updated = [
          ...prev.slice(0, existingIdx),
          { ...existing, ...currentSong, playCount: newCount, playedAt: now },
          ...prev.slice(existingIdx + 1),
        ];
      } else {
        updated = [{ ...currentSong, playCount: 1, playedAt: now }, ...prev];
      }
      updated.sort((a, b) => (b.playCount || 1) - (a.playCount || 1));
      const top10 = updated.slice(0, 10);
      try {
        localStorage.setItem(topTracksLocalKey, JSON.stringify(top10));
      } catch (_) {}
      return top10;
    });

    // 3. Update scoped 30-day history
    setLastPlayedSongs((prev) => {
      const filtered = prev.filter(
        (s) => !(s.id === currentSong.id && s.title === currentSong.title)
      );
      const entry: MusicifyItem = {
        ...currentSong,
        playedAt: now,
      };
      // Keep all tracks played within the 30-day retention window
      const updated = [entry, ...filtered].filter(
        (item) => now - (item.playedAt || 0) <= THIRTY_DAYS_MS
      );
      try {
        localStorage.setItem(historyLocalKey, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  }, [currentSong.id, currentSong.title, isGuest, userId, topTracksLocalKey, historyLocalKey]);

  // Compute upcoming queue tracks in circular play order
  const upcomingTracks = useMemo(() => {
    const currIdx = customPlaylist.findIndex(
      (s) => s.id === currentSong.id && s.title === currentSong.title
    );
    if (currIdx === -1) return customPlaylist.slice(1);
    const after = customPlaylist.slice(currIdx + 1);
    const before = customPlaylist.slice(0, currIdx);
    return [...after, ...before];
  }, [customPlaylist, currentSong]);

  // Focus search input when clicking Search in sidebar
  const handleNavToSearch = () => {
    setNavTab('search');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  // Smoothly ramp YouTube player volume
  const rampPlayerVolume = (fromVol: number, toVol: number, durationMs: number, onComplete?: () => void) => {
    if (duckFadeTimerRef.current) {
      clearInterval(duckFadeTimerRef.current);
      duckFadeTimerRef.current = null;
    }

    if (!playerRef.current?.setVolume) {
      if (onComplete) onComplete();
      return;
    }

    const intervalMs = 25;
    const totalSteps = Math.max(1, Math.floor(durationMs / intervalMs));
    let step = 0;

    duckFadeTimerRef.current = setInterval(() => {
      step++;
      const progress = Math.min(1, step / totalSteps);
      const curr = Math.round(fromVol + (toVol - fromVol) * progress);
      try {
        playerRef.current?.setVolume(curr);
      } catch (_) {}

      if (step >= totalSteps) {
        clearInterval(duckFadeTimerRef.current);
        duckFadeTimerRef.current = null;
        try {
          playerRef.current?.setVolume(toVol);
        } catch (_) {}
        if (onComplete) onComplete();
      }
    }, intervalMs);
  };

  // Duck audio: lowers song volume so voice announcement is clearly audible
  const duckAudio = () => {
    if (isMuted) return;

    if (!isDuckedRef.current) {
      preDuckingVolumeRef.current = volume;
      isDuckedRef.current = true;
    }

    const baseVol = preDuckingVolumeRef.current ?? volume;
    // Lower down to ~20% of base volume (between 10% and 22%)
    const duckedVol = Math.max(10, Math.min(22, Math.round(baseVol * 0.22)));

    let currentVol = baseVol;
    try {
      if (typeof playerRef.current?.getVolume === 'function') {
        const v = playerRef.current.getVolume();
        if (typeof v === 'number' && !isNaN(v)) currentVol = v;
      }
    } catch (_) {}

    rampPlayerVolume(currentVol, duckedVol, 200);
  };

  // Restore audio: gently fades song volume back to normal
  const restoreAudio = () => {
    if (duckSafetyTimeoutRef.current) {
      clearTimeout(duckSafetyTimeoutRef.current);
      duckSafetyTimeoutRef.current = null;
    }

    if (!isDuckedRef.current) return;
    isDuckedRef.current = false;

    const targetVol = isMuted ? 0 : (preDuckingVolumeRef.current ?? volume);

    let currentVol = 18;
    try {
      if (typeof playerRef.current?.getVolume === 'function') {
        const v = playerRef.current.getVolume();
        if (typeof v === 'number' && !isNaN(v)) currentVol = v;
      }
    } catch (_) {}

    rampPlayerVolume(currentVol, targetVol, 350, () => {
      preDuckingVolumeRef.current = null;
    });
  };

  // Voice Announcement Helper with Automatic Audio Ducking
  const speakSoothingNotice = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();

        // Duck song volume so voice is front-and-center
        duckAudio();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.88;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
          duckAudio();
        };

        utterance.onend = () => {
          restoreAudio();
        };

        utterance.onerror = () => {
          restoreAudio();
        };

        // Safety fallback if browser speech synthesis onend stalls
        if (duckSafetyTimeoutRef.current) clearTimeout(duckSafetyTimeoutRef.current);
        duckSafetyTimeoutRef.current = setTimeout(() => {
          restoreAudio();
        }, 12000);

        currentUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (_) {
        restoreAudio();
      }
    }
  };

  // Notification Dismissal with Audio Restoration
  const handleDismissNotification = () => {
    setActiveNotification(null);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    restoreAudio();
  };

  const handleFinishAndReflect = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    restoreAudio();
    onEndSession();
  };

  // Save likedSongs to scoped localStorage
  useEffect(() => {
    try {
      const localKey = isGuest ? 'neuromusic_liked_songs' : `neuromusic_liked_songs_${userId}`;
      localStorage.setItem(localKey, JSON.stringify(likedSongs));
    } catch (_) {}
  }, [likedSongs, userId, isGuest]);

  // Save userPlaylists to scoped localStorage
  useEffect(() => {
    try {
      const localKey = isGuest ? 'neuromusic_user_playlists' : `neuromusic_user_playlists_${userId}`;
      localStorage.setItem(localKey, JSON.stringify(userPlaylists));
    } catch (_) {}
  }, [userPlaylists, userId, isGuest]);

  // Helper: check if song is liked
  const isSongLiked = (songId: string) => {
    return likedSongs.some((s) => s.id === songId);
  };

  // Helper: toggle like
  const toggleLikeSong = (song: MusicifyItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const exists = likedSongs.some((s) => s.id === song.id);
    setLikedSongs((prev) => {
      if (exists) {
        return prev.filter((s) => s.id !== song.id);
      } else {
        return [song, ...prev];
      }
    });

    // Central backend persistence
    if (!isGuest) {
      fetch(`http://localhost:5001/api/user/${encodeURIComponent(userId)}/music/liked/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song }),
      }).catch(err => {
        console.error('Failed to sync liked song toggle to backend:', err);
      });
    }
  };

  // Helper: play entire playlist
  const playEntirePlaylist = (trackList: MusicifyItem[], startTrack?: MusicifyItem) => {
    if (!trackList || trackList.length === 0) return;
    setCustomPlaylist(trackList);
    const chosen = startTrack || trackList[0];
    selectSongDirectly(chosen);
  };

  // Helper: create new playlist
  const handleCreatePlaylist = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newPlaylistName.trim() || `My Playlist #${userPlaylists.length + 1}`;
    const colors = [
      'from-purple-700 to-indigo-900',
      'from-blue-700 to-cyan-900',
      'from-emerald-700 to-teal-900',
      'from-rose-700 to-pink-900',
      'from-amber-700 to-orange-900',
    ];
    const chosenColor = colors[userPlaylists.length % colors.length];
    const newPl: UserPlaylist = {
      id: `playlist-${Date.now()}`,
      name: trimmed,
      description: newPlaylistDesc.trim() || 'Created with care for calming music therapy.',
      color: chosenColor,
      createdAt: Date.now(),
      tracks: [currentSong],
    };
    setUserPlaylists((prev) => [newPl, ...prev]);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setIsCreateModalOpen(false);

    if (!isGuest) {
      fetch(`http://localhost:5001/api/user/${encodeURIComponent(userId)}/music/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPl),
      }).catch(err => {
        console.error('Failed to sync playlist to backend:', err);
      });
    }
    setNavTab('library');
    setActivePlaylistView(newPl.id);
  };

  // Helper: delete playlist
  const handleDeletePlaylist = (playlistId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUserPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    if (activePlaylistView === playlistId) {
      setActivePlaylistView(null);
    }
  };

  const customPlaylistRef = useRef(customPlaylist);
  useEffect(() => {
    customPlaylistRef.current = customPlaylist;
  }, [customPlaylist]);

  // Auto-search from Voice Companion deep-link (?play=<song name>)
  useEffect(() => {
    const q = initialSearchQuery.trim();
    if (!q) return;
    hasUserSelectedTrackRef.current = true;
    pendingAutoPlayQueryRef.current = q;

    // Switch to search tab immediately so user sees feedback
    setNavTab('search');
    setSearchQuery(q);
  }, [initialSearchQuery]);

  // Live Debounced YouTube Search Engine (Debounced strictly on searchQuery)
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // 1. Instant local matching
    const pool = customPlaylistRef.current || [];
    const localMatches = pool.filter(
      (t) =>
        t.title.toLowerCase().includes(q.toLowerCase()) ||
        t.artist.toLowerCase().includes(q.toLowerCase())
    );
    if (localMatches.length > 0) {
      setSearchResults(localMatches);
    }

    // 2. Debounced query to YouTube API
    const timer = setTimeout(async () => {
      try {
        const url = new URL('http://localhost:5001/api/youtube/search');
        url.searchParams.set('q', q);
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          let rawTracks = data.tracks && Array.isArray(data.tracks) ? data.tracks : [];

          // Retry with song keyword if query had 0 matches
          if (rawTracks.length === 0 && !/\b(song|songs|gaana|music|audio)\b/i.test(q)) {
            try {
              const retryUrl = new URL('http://localhost:5001/api/youtube/search');
              retryUrl.searchParams.set('q', `${q} song`);
              const retryRes = await fetch(retryUrl.toString());
              if (retryRes.ok) {
                const retryData = await retryRes.json();
                if (retryData.tracks && Array.isArray(retryData.tracks)) {
                  rawTracks = retryData.tracks;
                }
              }
            } catch (_) {}
          }

          if (rawTracks.length > 0) {
            const remoteItems: MusicifyItem[] = rawTracks.map((t: any) => ({
              id: t.id,
              title: decodeHtml(t.title),
              artist: decodeHtml(t.channelTitle || t.artistOrChannel || 'YouTube Artist'),
              albumArt:
                t.thumbnailUrl ||
                t.thumbnail ||
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
              durationMinutes: t.durationMinutes,
              durationSeconds: t.durationSeconds,
              formattedDuration: t.formattedDuration,
              genre: 'search_result',
            }));

            // Merge: remote items first, then any local matches not already present
            const seen = new Set<string>();
            const merged: MusicifyItem[] = [];

            remoteItems.forEach((item) => {
              if (!seen.has(item.id)) {
                seen.add(item.id);
                merged.push(item);
              }
            });

            const currentLocal = (customPlaylistRef.current || []).filter(
              (t) =>
                t.title.toLowerCase().includes(q.toLowerCase()) ||
                t.artist.toLowerCase().includes(q.toLowerCase())
            );

            currentLocal.forEach((item) => {
              if (!seen.has(item.id)) {
                seen.add(item.id);
                merged.push(item);
              }
            });

            setSearchResults(merged);

            // If this search was triggered by a voice deep-link, immediately auto-play the top result!
            if (pendingAutoPlayQueryRef.current && merged.length > 0) {
              pendingAutoPlayQueryRef.current = '';
              selectSongDirectly(merged[0]);
              hasUserSelectedTrackRef.current = true;
            }
          }
        }
      } catch (err) {
        console.warn('[Musicify Search] Query error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 1. Session Running Timer (Freezes during ad interruptions)
  useEffect(() => {
    if (!isPlaying || isAdInterrupted) return;
    const interval = setInterval(() => {
      setSessionElapsedSeconds((prev) => {
        const next = prev + 1;

        // Check 30-minute milestone (1800 seconds)
        if (next >= 1800 && !hasNotified30Ref.current) {
          hasNotified30Ref.current = true;
          setActiveNotification({
            title: '🎉 30-Minute Therapy Goal Completed!',
            message: 'Comforting milestone reached! You can continue listening endlessly as long as you wish.',
            type: '30m',
          });
          speakSoothingNotice('30 minutes reached. Feel free to keep enjoying your music.');
        }

        // Check 60-minute milestone (3600 seconds)
        if (next >= 3600 && !hasNotified60Ref.current) {
          hasNotified60Ref.current = true;
          setActiveNotification({
            title: '🌟 60-Minute Deep Relaxation Milestone!',
            message: 'One full hour of peaceful music therapy completed. Continue listening seamlessly without interruption.',
            type: '60m',
          });
          speakSoothingNotice('One hour reached. Feel free to keep enjoying the music.');
        }

        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isAdInterrupted]);

  // 2. Track Playback Progress Poller & Heuristic Ad Detection
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isMountedRef.current) return;
      const now = performance.now();
      const dt = Math.max(0, Math.min(1.0, (now - lastTickWallTimeRef.current) / 1000));
      lastTickWallTimeRef.current = now;

      try {
        if (playerRef.current) {
          let pState = -1;
          if (typeof playerRef.current.getPlayerState === 'function') {
            try {
              pState = playerRef.current.getPlayerState();
            } catch (_) {}
          }

          // Sync play/pause state if YouTube reported playing (1) or paused (2)
          if (pState === 1 && !isPlaying) {
            setIsPlaying(true);
          } else if (pState === 2 && isPlaying) {
            setIsPlaying(false);
          }

          let ytCurrentTime: number | null = null;
          if (typeof playerRef.current.getCurrentTime === 'function') {
            try {
              const ct = playerRef.current.getCurrentTime();
              if (typeof ct === 'number' && !isNaN(ct) && ct >= 0) {
                ytCurrentTime = ct;
              }
            } catch (_) {}
          }

          let ytDuration: number | null = null;
          if (typeof playerRef.current.getDuration === 'function') {
            try {
              const dur = playerRef.current.getDuration();
              if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
                ytDuration = dur;
              }
            } catch (_) {}
          }

          if (ytDuration !== null) {
            const expectedSec = (currentSong.durationMinutes || 4) * 60;
            const looksLikeAd = ytDuration <= 35 && expectedSec > 60;
            if (looksLikeAd) {
              if (!isAdInterrupted) {
                setIsAdInterrupted(true);
                if (!hasAnnouncedAdRef.current) {
                  hasAnnouncedAdRef.current = true;
                  speakSoothingNotice('Just a brief pause, your gentle melody will resume in a moment.');
                }
              }
            } else {
              setTrackTotalDuration(ytDuration);
              setCurrentSong((prev) => {
                if (prev && !prev.durationSeconds) {
                  return {
                    ...prev,
                    durationSeconds: Math.round(ytDuration),
                    durationMinutes: Number((ytDuration / 60).toFixed(2)),
                    formattedDuration: formatTime(ytDuration),
                  };
                }
                return prev;
              });
              setCustomPlaylist((prev) => {
                const target = prev.find((item) => item.id === currentSong.id);
                if (target && !target.durationSeconds) {
                  return prev.map((item) =>
                    item.id === currentSong.id
                      ? {
                          ...item,
                          durationSeconds: Math.round(ytDuration),
                          durationMinutes: Number((ytDuration / 60).toFixed(2)),
                          formattedDuration: formatTime(ytDuration),
                        }
                      : item
                  );
                }
                return prev;
              });
              if (isAdInterrupted) {
                setIsAdInterrupted(false);
                hasAnnouncedAdRef.current = false;
              }
            }
          }

          // Advance elapsed time:
          // If YouTube gives an updated time > 0, use it.
          // Otherwise, if playing (pState === 1 or isPlaying is true), advance smoothly with real dt
          if (pState === 1 || isPlaying) {
            if (ytCurrentTime !== null && ytCurrentTime > 0) {
              lastKnownTimeRef.current = ytCurrentTime;
              setTrackElapsedSeconds(ytCurrentTime);
            } else {
              setTrackElapsedSeconds((prev) => {
                const updated = prev + dt;
                lastKnownTimeRef.current = updated;
                return updated;
              });
            }
          }
        } else if (isPlaying) {
          // If playerRef not initialized yet but playing is true, advance smoothly
          setTrackElapsedSeconds((prev) => prev + dt);
        }
      } catch (_) {}
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying, isAdInterrupted, currentSong]);

  // 3. Track Advancing Logic (Endless Loop: Never exits automatically)
  const handleNextTrack = () => {
    setTrackElapsedSeconds(0);
    lastKnownTimeRef.current = 0;
    lastTickWallTimeRef.current = performance.now();
    const currIdx = customPlaylist.findIndex(s => s.id === currentSong.id && s.title === currentSong.title);
    let nextIdx = currIdx >= 0 ? (currIdx + 1) % customPlaylist.length : 0;
    if (isShuffle && customPlaylist.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * customPlaylist.length);
      } while (nextIdx === currIdx && customPlaylist.length > 1);
    }
    const nextSong = customPlaylist[nextIdx] || customPlaylist[0];
    if (nextSong) {
      setCurrentSong(nextSong);
      setActiveTrackIndex(nextIdx);
      onSelectTrackIndex(nextIdx);
    }
  };
  handleNextTrackRef.current = handleNextTrack;

  // Shuffle Upcoming Queue
  const handleShuffleQueue = () => {
    setCustomPlaylist((prev) => {
      const current = currentSong;
      const remaining = prev.filter(
        (s) => !(s.id === currentSong.id && s.title === currentSong.title)
      );
      if (remaining.length <= 1) return prev;

      // Fisher-Yates shuffle
      const shuffled = [...remaining];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return [current, ...shuffled];
    });

    setQueueFeedbackToast('🔀 Next played songs shuffled!');
    setTimeout(() => {
      setQueueFeedbackToast((prev) => (prev?.includes('shuffled') ? null : prev));
    }, 2500);
  };

  // Contextual Queue Fetcher: Asynchronously queries AI backend to align Up Next queue with current song's genre/mood
  const fetchContextualQueue = useCallback(async (track: MusicifyItem, forceToast: boolean = false) => {
    if (!track || !track.title) return;
    const trackKey = `${track.id || ''}:${track.title}`.toLowerCase();
    if (!forceToast && lastAnalyzedTrackKeyRef.current === trackKey) {
      return;
    }
    lastAnalyzedTrackKeyRef.current = trackKey;

    if (contextualFetchAbortRef.current) {
      contextualFetchAbortRef.current.abort();
    }
    const controller = new AbortController();
    contextualFetchAbortRef.current = controller;

    try {
      setIsFetchingContextualQueue(true);
      const url = new URL('http://localhost:5001/api/music/contextual-queue');
      url.searchParams.set('title', track.title);
      if (track.artist && !track.artist.toLowerCase().includes('youtube') && !track.artist.toLowerCase().includes('nostalgia')) {
        url.searchParams.set('artist', track.artist);
      }

      const res = await fetch(url.toString(), { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (controller.signal.aborted) return;

      if (data && Array.isArray(data.tracks) && data.tracks.length > 0) {
        const mappedTracks: MusicifyItem[] = data.tracks
          .filter((t: any) => t.id !== track.id)
          .map((t: any) => ({
            id: t.id,
            title: decodeHtml(t.title),
            artist: decodeHtml(t.channelTitle || t.artistOrChannel || 'Recommended Artist'),
            albumArt: t.thumbnailUrl || t.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
            durationMinutes: t.durationMinutes || 3,
            durationSeconds: t.durationSeconds || 180,
            formattedDuration: t.formattedDuration || '3:00',
            genre: data.genre || 'contextual_ai',
          }));

        if (mappedTracks.length > 0) {
          setAiVibeLabel(data.vibeLabel || null);
          setCustomPlaylist([track, ...mappedTracks]);
          setQueueFeedbackToast(`✨ AI Queue: ${data.vibeLabel || 'Adjusted for ' + track.title}`);
          setTimeout(() => {
            setQueueFeedbackToast((p) => (p?.includes('AI Queue') ? null : p));
          }, 3500);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('[Contextual Queue] Could not fetch contextual recommendations:', err);
    } finally {
      if (!controller.signal.aborted) {
        setIsFetchingContextualQueue(false);
      }
    }
  }, []);

  // Refresh Upcoming Queue with Fresh Contextual Recommendations
  const handleRefreshQueue = async () => {
    try {
      setIsRefreshingQueue(true);
      await fetchContextualQueue(currentSong, true);
    } catch (err) {
      console.warn('Refresh queue error:', err);
    } finally {
      setIsRefreshingQueue(false);
    }
  };

  // Play Next: Places track immediately after currently playing song in the queue
  const handlePlayNext = (track: MusicifyItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuTrackId(null);
    setCustomPlaylist((prev) => {
      const currIdx = prev.findIndex(
        (s) => s.id === currentSong.id && s.title === currentSong.title
      );
      const remaining = prev.filter(
        (s) => !(s.id === track.id && s.title === track.title)
      );
      if (currIdx === -1) {
        return [currentSong, track, ...remaining];
      }
      const before = remaining.slice(0, currIdx + 1);
      const after = remaining.slice(currIdx + 1);
      return [...before, track, ...after];
    });

    setQueueFeedbackToast(`▶️ "${track.title}" will play next!`);
    setTimeout(() => {
      setQueueFeedbackToast((prev) => (prev?.includes('will play next') ? null : prev));
    }, 3000);
  };

  // Add to Queue: Appends track to the end of customPlaylist
  const handleAddToQueue = (track: MusicifyItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuTrackId(null);
    setCustomPlaylist((prev) => {
      const remaining = prev.filter(
        (s) => !(s.id === track.id && s.title === track.title)
      );
      return [...remaining, track];
    });

    setQueueFeedbackToast(`📑 Added "${track.title}" to queue!`);
    setTimeout(() => {
      setQueueFeedbackToast((prev) => (prev?.includes('to queue') ? null : prev));
    }, 3000);
  };

  // Add to Playlist: Adds track to specified playlist
  const handleAddTrackToPlaylist = (playlistId: string, track: MusicifyItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuTrackId(null);
    setMenuStep('main');

    let targetPlName = 'Playlist';
    setUserPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          targetPlName = pl.name;
          const exists = pl.tracks.some((t) => t.id === track.id && t.title === track.title);
          if (exists) return pl;
          return {
            ...pl,
            tracks: [track, ...pl.tracks],
          };
        }
        return pl;
      })
    );

    setQueueFeedbackToast(`🎵 Added "${track.title}" to ${targetPlName}!`);
    setTimeout(() => {
      setQueueFeedbackToast((prev) => (prev?.includes('Added') ? null : prev));
    }, 3000);
  };

  // Create Playlist with Track: Prompts user and creates new playlist
  const handleCreatePlaylistWithTrack = (track: MusicifyItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenMenuTrackId(null);
    setMenuStep('main');
    const defaultName = `My Playlist #${userPlaylists.length + 1}`;
    const name = window.prompt('Enter new playlist name:', defaultName);
    if (!name || !name.trim()) return;

    const colors = [
      'from-purple-700 to-indigo-900',
      'from-blue-700 to-cyan-900',
      'from-emerald-700 to-teal-900',
      'from-rose-700 to-pink-900',
      'from-amber-700 to-orange-900',
    ];
    const chosenColor = colors[userPlaylists.length % colors.length];
    const newPl: UserPlaylist = {
      id: `playlist-${Date.now()}`,
      name: name.trim(),
      description: 'Created with care for calming music therapy.',
      color: chosenColor,
      createdAt: Date.now(),
      tracks: [track],
    };
    setUserPlaylists((prev) => [newPl, ...prev]);
    setQueueFeedbackToast(`🎉 Created "${newPl.name}" and added "${track.title}"!`);
    setTimeout(() => {
      setQueueFeedbackToast((prev) => (prev?.includes('Created') ? null : prev));
    }, 3000);
  };

  const handlePrevTrack = () => {
    setTrackElapsedSeconds(0);
    lastKnownTimeRef.current = 0;
    lastTickWallTimeRef.current = performance.now();
    const currIdx = customPlaylist.findIndex(s => s.id === currentSong.id && s.title === currentSong.title);
    const prevIdx = currIdx > 0 ? currIdx - 1 : customPlaylist.length - 1;
    const prevSong = customPlaylist[prevIdx] || customPlaylist[0];
    if (prevSong) {
      setCurrentSong(prevSong);
      setActiveTrackIndex(prevIdx);
      onSelectTrackIndex(prevIdx);
    }
  };

  const selectSongDirectly = (song: MusicifyItem) => {
    hasUserSelectedTrackRef.current = true;
    // Immediately set active song so bottom player updates with zero lag
    setCurrentSong(song);
    setCustomPlaylist((prev) => {
      // Put selected song first, followed by the remaining playlist (so upcoming queue resumes after it)
      const remaining = prev.filter((s) => !(s.id === song.id && s.title === song.title));
      return [song, ...remaining];
    });
    setTrackElapsedSeconds(0);
    lastKnownTimeRef.current = 0;
    lastTickWallTimeRef.current = performance.now();
    setIsPlaying(true);
    if (playerRef.current?.loadVideoById) {
      try {
        playerRef.current.loadVideoById(song.id);
        playerRef.current.playVideo();
      } catch (_) {}
    }
    // Automatically trigger AI contextual queue alignment
    fetchContextualQueue(song);
  };

  // 3b. Real-time backend player command synchronization (executes commands from Voice Companion)
  const lastProcessedCmdTimestampRef = useRef<number>(Date.now() - 5000);

  useEffect(() => {
    let isCancelled = false;

    const pollPlayerCommands = async () => {
      try {
        const uid = userId || 'default-patient';
        const since = lastProcessedCmdTimestampRef.current;
        const res = await fetch(`http://localhost:5001/api/player/command?patientId=${encodeURIComponent(uid)}&since=${since}`);
        if (!res.ok || isCancelled) return;
        const data = await res.json();
        const cmd = data?.command;

        if (cmd && typeof cmd.timestamp === 'number' && cmd.timestamp > lastProcessedCmdTimestampRef.current) {
          lastProcessedCmdTimestampRef.current = cmd.timestamp;

          if (cmd.type === 'PLAY_TRACK' && cmd.track) {
            const track = cmd.track;
            const song: MusicifyItem = {
              id: track.id,
              title: decodeHtml(track.title),
              artist: decodeHtml(track.channelTitle || 'YouTube Artist'),
              albumArt: track.thumbnailUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
              durationMinutes: track.durationMinutes || 3,
              durationSeconds: track.durationSeconds,
              formattedDuration: track.formattedDuration,
              genre: 'search_result',
            };
            selectSongDirectly(song);
            if (cmd.query) {
              setSearchQuery(cmd.query);
            }
          } else if (cmd.type === 'PLAY_GENERAL') {
            setIsPlaying(true);
            if (playerRef.current?.playVideo) {
              try { playerRef.current.playVideo(); } catch (_) {}
            }
          } else if (cmd.type === 'PAUSE') {
            setIsPlaying(false);
            if (playerRef.current?.pauseVideo) {
              try { playerRef.current.pauseVideo(); } catch (_) {}
            }
          } else if (cmd.type === 'RESUME') {
            setIsPlaying(true);
            if (playerRef.current?.playVideo) {
              try { playerRef.current.playVideo(); } catch (_) {}
            }
          }
        }
      } catch (err) {
        // Silently catch transient network polling errors
      }
    };

    // Initial check on mount
    pollPlayerCommands();

    const interval = setInterval(pollPlayerCommands, 1200);
    const handleSync = () => { pollPlayerCommands(); };
    window.addEventListener('focus', handleSync);
    window.addEventListener('visibilitychange', handleSync);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('visibilitychange', handleSync);
    };
  }, [userId]);

  // 4. Initialize & Update YouTube IFrame API
  useEffect(() => {
    setIsAdInterrupted(false);
    hasAnnouncedAdRef.current = false;

    function initPlayer() {
      if (!isMountedRef.current) return;
      if (!window.YT || !window.YT.Player) return;

      if (playerRef.current) {
        try {
          if (typeof playerRef.current.loadVideoById === 'function') {
            playerRef.current.loadVideoById(currentSong.id);
            playerRef.current.playVideo();
            playerRef.current.setVolume(volume);
            return;
          }
        } catch (_) {}
      }

      try {
        playerRef.current = new window.YT.Player('musicify-yt-player', {
          height: '100%',
          width: '100%',
          videoId: currentSong.id,
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (!isMountedRef.current) return;
              try {
                event.target.playVideo();
                event.target.setVolume(volume);
                setIsPlaying(true);
                const dur = event.target.getDuration();
                if (dur > 35) setTrackTotalDuration(dur);
              } catch (_) {}
            },
            onStateChange: (event: any) => {
              if (!isMountedRef.current) return;
              // 0 = ENDED: Auto-advance to next queued track (Endless listening loop)
              if (event.data === 0) {
                handleNextTrackRef.current();
              } else if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2) {
                setIsPlaying(false);
              }
            },
          },
        });
      } catch (_) {}
    }

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }
  }, [currentSong.id, currentSong.title]);

  // Play / Pause Toggle
  const togglePlayPause = () => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (_) {
      setIsPlaying(!isPlaying);
    }
  };

  // Mute / Unmute Toggle
  const toggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
        if (!isDuckedRef.current && playerRef.current.setVolume) {
          playerRef.current.setVolume(volume);
        }
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (_) {
      setIsMuted(!isMuted);
    }
  };

  // Volume Slider Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (isDuckedRef.current) {
      preDuckingVolumeRef.current = val;
    } else if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(val);
      if (val > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  // Seek Scrubber
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setTrackElapsedSeconds(targetTime);
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(targetTime, true);
    }
  };

  const cleanCurrentTitle = decodeHtml(currentSong.title);
  const cleanCurrentArtist = decodeHtml(currentSong.artist);
  const progressPercent = (trackTotalDuration && trackTotalDuration > 0)
    ? Math.min(100, Math.max(0, (trackElapsedSeconds / trackTotalDuration) * 100))
    : 0;
  const currentVolumeVal = isMuted ? 0 : volume;

  const currentPlaylistObj = useMemo(() => {
    if (!activePlaylistView || activePlaylistView === 'liked' || activePlaylistView === 'last_played') return null;
    return userPlaylists.find((p) => p.id === activePlaylistView) || null;
  }, [activePlaylistView, userPlaylists]);

  const activePlaylistTracks = useMemo(() => {
    if (activePlaylistView === 'liked') return likedSongs;
    if (activePlaylistView === 'last_played') return lastPlayedSongs;
    if (currentPlaylistObj) return currentPlaylistObj.tracks;
    return [];
  }, [activePlaylistView, likedSongs, lastPlayedSongs, currentPlaylistObj]);

  return (
    <div className="min-h-screen w-full bg-[#121212] text-white flex flex-col font-sans select-none overflow-x-hidden relative">
      
      {/* 1. Milestone Notification Toast (30m / 60m Milestone Reached) */}
      {activeNotification && (
        <div className="fixed top-6 right-6 z-50 max-w-md bg-[#181818] border-2 border-[#1DB954] text-white p-5 rounded-3xl shadow-2xl flex items-start space-x-3.5 animate-bounce-short">
          <div className="w-11 h-11 rounded-2xl bg-[#1DB954]/20 border border-[#1DB954]/40 text-[#1DB954] flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-[#1DB954]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-extrabold text-white">
                {activeNotification.title}
              </h4>
              <button 
                type="button" 
                onClick={handleDismissNotification}
                className="text-[#b3b3b3] hover:text-white p-1 cursor-pointer"
                aria-label="Dismiss Notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#b3b3b3] mt-1 leading-relaxed">
              {activeNotification.message}
            </p>
            <div className="flex items-center space-x-2.5 mt-3.5">
              <button
                type="button"
                onClick={handleDismissNotification}
                className="px-4 py-1.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-extrabold transition-all cursor-pointer shadow-md hover:scale-105"
              >
                Keep Listening Endlessly
              </button>
              <button
                type="button"
                onClick={handleFinishAndReflect}
                className="px-3.5 py-1.5 rounded-full bg-[#282828] hover:bg-[#333333] text-white text-xs font-bold transition-all cursor-pointer"
              >
                Finish & Reflect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Screen Layout (Sidebar + Main Content) */}
      <div className="flex flex-1 overflow-hidden pb-24 sm:pb-24">
        
        {/* ==================================================================== */}
        {/* LEFT SIDEBAR (Matching Musicify Screenshot)                           */}
        {/* ==================================================================== */}
        <aside className="w-64 bg-black flex flex-col justify-between p-6 shrink-0 border-r border-[#181818] hidden md:flex">
          
          <div className="flex flex-col gap-6">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-extrabold">
                <Music className="w-4 h-4 text-black fill-black" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white font-brand-heading">
                Neuromusic
              </span>
            </div>

            {/* Navigation Menu (Home, Search, Library) */}
            <nav className="flex flex-col gap-2 text-sm font-bold">
              <button
                type="button"
                onClick={() => {
                  setNavTab('home');
                  setActivePlaylistView(null);
                  setPlayerViewMode('now_playing');
                  setSearchQuery('');
                }}
                className={`flex items-center space-x-4 py-2.5 px-3 rounded-xl transition-all text-left cursor-pointer ${
                  navTab === 'home' && !searchQuery && !activePlaylistView
                    ? 'text-white bg-[#282828] shadow-sm' 
                    : 'text-[#b3b3b3] hover:text-white'
                }`}
              >
                <Home className="w-5 h-5 text-current" />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={handleNavToSearch}
                className={`flex items-center space-x-4 py-2.5 px-3 rounded-xl transition-all text-left cursor-pointer ${
                  navTab === 'search' || searchQuery
                    ? 'text-white bg-[#282828] shadow-sm' 
                    : 'text-[#b3b3b3] hover:text-white'
                }`}
              >
                <Search className="w-5 h-5 text-current" />
                <span>Search</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNavTab('library');
                  setActivePlaylistView(null);
                  setSearchQuery('');
                }}
                className={`flex items-center space-x-4 py-2.5 px-3 rounded-xl transition-all text-left cursor-pointer ${
                  navTab === 'library' && !searchQuery && !activePlaylistView
                    ? 'text-white bg-[#282828] shadow-sm' 
                    : 'text-[#b3b3b3] hover:text-white'
                }`}
              >
                <ListMusic className="w-5 h-5 text-current" />
                <span>Library</span>
              </button>

              {/* Last Played Songs Nav Option */}
              <button
                type="button"
                onClick={() => {
                  setNavTab('home');
                  setActivePlaylistView('last_played');
                  setPlayerViewMode('now_playing');
                  setSearchQuery('');
                }}
                className={`flex items-center space-x-4 py-2.5 px-3 rounded-xl transition-all text-left cursor-pointer ${
                  activePlaylistView === 'last_played' && !searchQuery
                    ? 'text-white bg-[#282828] shadow-sm' 
                    : 'text-[#b3b3b3] hover:text-white'
                }`}
              >
                <Clock className="w-5 h-5 text-current" />
                <span>Last Played</span>
              </button>
            </nav>

            {/* Create Playlist Action */}
            <div className="pt-3 border-t border-[#181818]">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center space-x-3 text-sm font-semibold text-[#b3b3b3] hover:text-white transition-colors cursor-pointer group w-full text-left"
              >
                <div className="w-6 h-6 rounded bg-[#282828] group-hover:bg-[#1DB954] group-hover:text-black flex items-center justify-center text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span>Create Playlist</span>
              </button>
            </div>

            {/* Therapeutic Session Goal & Endless Listening Control */}
            <div className="p-4 rounded-2xl bg-[#181818] border border-[#282828] flex flex-col gap-2.5 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#b3b3b3] uppercase tracking-wider">
                  Session Goal
                </span>
                <span className="text-[11px] font-bold text-[#1DB954] flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Endless Mode</span>
                </span>
              </div>

              {/* Goal Selector Buttons */}
              <div className="grid grid-cols-3 gap-1 bg-black p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSessionGoalMinutes(30)}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    sessionGoalMinutes === 30
                      ? 'bg-[#1DB954] text-black shadow-sm'
                      : 'text-[#b3b3b3] hover:text-white'
                  }`}
                >
                  30m
                </button>
                <button
                  type="button"
                  onClick={() => setSessionGoalMinutes(60)}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    sessionGoalMinutes === 60
                      ? 'bg-[#1DB954] text-black shadow-sm'
                      : 'text-[#b3b3b3] hover:text-white'
                  }`}
                >
                  60m
                </button>
                <button
                  type="button"
                  onClick={() => setSessionGoalMinutes(0)}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    sessionGoalMinutes === 0
                      ? 'bg-[#1DB954] text-black shadow-sm'
                      : 'text-[#b3b3b3] hover:text-white'
                  }`}
                >
                  ∞ Free
                </button>
              </div>

              {/* Elapsed Time Display */}
              <div className="flex items-center justify-between text-xs text-[#b3b3b3] font-mono mt-0.5">
                <span>Elapsed: {formatTime(sessionElapsedSeconds)}</span>
                <span className="text-[#1DB954] font-bold flex items-center space-x-1">
                  <span>
                    {sessionGoalMinutes > 0 
                      ? `${Math.floor(sessionElapsedSeconds / 60)}/${sessionGoalMinutes}m` 
                      : 'Endless'}
                  </span>
                  {isSessionGoalCompleted && <span className="ml-1 text-[#1DB954]">✓</span>}
                </span>
              </div>

              {/* Instant "Finish & Reflect" button inside sidebar card when completed */}
              {isSessionGoalCompleted && (
                <button
                  type="button"
                  onClick={handleFinishAndReflect}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-[#1DB954]/20 hover:bg-[#1DB954]/30 border border-[#1DB954]/50 text-[#1DB954] text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                  title="Session goal reached! Complete and check in with your mood"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Goal Met • Finish & Reflect</span>
                </button>
              )}

              {/* Pitch Demo Helper: Instant Milestone Test */}
              <button
                type="button"
                onClick={() => {
                  hasNotified30Ref.current = true;
                  setSessionElapsedSeconds((prev) => Math.max(prev, (sessionGoalMinutes > 0 ? sessionGoalMinutes : 30) * 60));
                  setActiveNotification({
                    title: '🎉 30-Minute Therapy Milestone Completed!',
                    message: 'Milestone reached! You can continue listening endlessly as long as you wish.',
                    type: '30m',
                  });
                  speakSoothingNotice('30 minutes reached. Feel free to keep enjoying the music.');
                }}
                className="text-[11px] text-[#b3b3b3]/60 hover:text-[#1DB954] underline transition-colors cursor-pointer text-left pt-1"
                title="Demo: Trigger 30m milestone notification & complete goal"
              >
                🔔 Test 30m Notification
              </button>
            </div>

          </div>



        </aside>

        {/* ==================================================================== */}
        {/* MAIN SCROLLABLE CONTENT PANE (Matching Musicify Screenshot)          */}
        {/* ==================================================================== */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#202020] via-[#121212] to-[#121212] p-6 sm:p-8">
          
          {/* Top Bar with Live Search Input, Category Chips, and Top Right Profile & Home Button */}
          <div className="flex flex-col gap-4 pb-6 border-b border-[#242424] mb-6">
            
            {/* Upper Row: Search Input & Right Top Corner Profile + Return Home */}
            <div className="flex items-center justify-between gap-4">
              
              {/* Search Input Bar (Supports any song like "laugh now cry later") */}
              <div className="relative flex-1 max-w-lg">
                <Search className="w-4 h-4 text-[#b3b3b3] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim().length > 0 && playerViewMode === 'queue') {
                      setPlayerViewMode('now_playing');
                    }
                  }}
                  placeholder="What do you want to play?"
                  className="w-full pl-11 pr-10 py-2.5 bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#333333] text-white text-xs sm:text-sm rounded-full border border-transparent focus:border-[#1DB954] outline-none transition-all placeholder-[#b3b3b3] shadow-inner"
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-[#1DB954] animate-spin absolute right-10 top-1/2 -translate-y-1/2" />
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white text-xs cursor-pointer p-1"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Right Top Corner: Return to Daily Home OR Finish & Reflect + User Profile Badge */}
              <div className="flex items-center space-x-3 shrink-0">
                {isSessionGoalCompleted ? (
                  <button
                    type="button"
                    onClick={handleFinishAndReflect}
                    className="flex items-center space-x-2 text-xs sm:text-sm font-extrabold text-black bg-[#1DB954] hover:bg-[#1ed760] px-4 py-2 rounded-full transition-all cursor-pointer shadow-lg shadow-[#1DB954]/25 hover:scale-105 active:scale-95 animate-pulse"
                    title="Session goal completed! Finish and reflect on your mood"
                  >
                    <Sparkles className="w-4 h-4 fill-black text-black" />
                    <span>Finish & Reflect</span>
                  </button>
                ) : onReturnHome ? (
                  <button
                    type="button"
                    onClick={onReturnHome}
                    className="flex items-center space-x-2 text-xs sm:text-sm font-bold text-white hover:text-[#1DB954] bg-[#242424] hover:bg-[#2e2e2e] border border-[#333] px-3.5 py-2 rounded-full transition-colors cursor-pointer shadow-sm active:scale-95"
                    title="Back to Main Home Screen"
                  >
                    <ArrowLeft className="w-4 h-4 text-terracotta-500" />
                    <span className="hidden sm:inline">Back to Main Home Screen</span>
                    <span className="sm:hidden">Home</span>
                  </button>
                ) : null}

                <div className="flex items-center space-x-2.5 bg-[#181818] border border-[#282828] py-1.5 px-3 rounded-full shadow-sm hover:border-[#383838] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#282828] border border-[#333] flex items-center justify-center text-xs font-extrabold text-[#1DB954] shrink-0">
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 hidden md:block text-left">
                    <p className="text-xs font-bold text-white truncate leading-tight">{userName}</p>
                    <p className="text-[10px] text-[#b3b3b3] truncate leading-tight">Therapy Patient</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Lower Row: Quick Category Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-bold">
              {['all', 'top_hits', 'new_release', 'nostalgia_bollywood', 'nostalgia_sitar'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat);
                    setSearchQuery('');
                  }}
                  className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === cat && !searchQuery
                      ? 'bg-white text-black font-extrabold'
                      : 'bg-[#242424] text-[#b3b3b3] hover:text-white'
                  }`}
                >
                  {cat === 'all' && 'All'}
                  {cat === 'top_hits' && 'Top Hits'}
                  {cat === 'new_release' && 'New Releases'}
                  {cat === 'nostalgia_bollywood' && 'Golden 70s'}
                  {cat === 'nostalgia_sitar' && 'Sitar & Ragas'}
                </button>
              ))}
            </div>

          </div>

          {/* Gentle Ad Interruption Reassurance Banner (Sleek Dark Theme) */}
          {isAdInterrupted && (
            <div className="w-full mb-6 p-4 rounded-2xl bg-[#242424] border-2 border-amber-400 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-extrabold text-amber-300">
                    A short pause — your music will continue in a moment
                  </p>
                  <p className="text-xs text-[#b3b3b3] mt-0.5">
                    Take a slow, gentle breath. Your therapeutic melody will resume shortly.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNextTrack}
                className="px-4 py-1.5 rounded-full bg-white hover:bg-amber-100 text-black text-xs font-extrabold flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 self-end sm:self-auto"
              >
                <span>Skip Ahead</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Hidden YouTube IFrame Audio Engine (or Visible in Video Mode) */}
          <div 
            className={
              viewVideo
                ? 'relative w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl mb-8 border border-[#333]'
                : 'fixed bottom-2 right-2 w-48 h-32 opacity-0 pointer-events-none z-[-10]'
            }
          >
            <div id="musicify-yt-player" className="w-full h-full" />
          </div>

          {/* ================================================================ */}
          {/* SEARCH RESULTS SECTION (Visible whenever user types in search)    */}
          {/* ================================================================ */}
          {playerViewMode === 'queue' ? (
            /* ================================================================ */
            /* UP NEXT / QUEUE VIEW (Patient & Caregiver Inspection)            */
            /* ================================================================ */
            <section className="mb-12 animate-fade-in">
              {/* Queue Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#282828]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center text-[#1DB954]">
                    <ListMusic className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Queue & Up Next
                    </h1>
                    <p className="text-xs sm:text-sm text-[#b3b3b3] mt-0.5">
                      Continuous listening queue • Auto-advances through personalized nostalgia
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI-Curated Autoplay Active</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPlayerViewMode('now_playing')}
                    className="px-4 py-2 rounded-full bg-[#282828] hover:bg-[#383838] text-white text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 border border-white/10"
                  >
                    <Tv className="w-3.5 h-3.5 text-[#1DB954]" />
                    <span>Back to Now Playing</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Currently Playing Hero Row */}
              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#b3b3b3] mb-3">
                  Now Playing
                </h3>
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#181818] to-[#181818] border border-emerald-500/30 shadow-xl flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-4 min-w-0 flex-1">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/10 bg-[#282828]">
                      <img src={currentSong.albumArt} alt={currentSong.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        {isPlaying ? (
                          <div className="flex items-end space-x-1 h-5">
                            <div className="w-1 bg-[#1DB954] animate-bounce h-5 rounded-full" style={{ animationDelay: '0ms' }} />
                            <div className="w-1 bg-[#1DB954] animate-bounce h-3 rounded-full" style={{ animationDelay: '150ms' }} />
                            <div className="w-1 bg-[#1DB954] animate-bounce h-4 rounded-full" style={{ animationDelay: '300ms' }} />
                          </div>
                        ) : (
                          <Play className="w-6 h-6 text-white fill-white" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#1DB954] text-black mb-1">
                        Active Track
                      </span>
                      <h2 className="text-base sm:text-xl font-extrabold text-white truncate">
                        {currentSong.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#b3b3b3] truncate mt-0.5">
                        {currentSong.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-xs font-mono text-[#1DB954] hidden sm:inline-block">
                      {formatTime(trackElapsedSeconds)} / {formatTime(trackTotalDuration)}
                    </span>
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="w-12 h-12 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-black" />
                      ) : (
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Next in Queue List */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#b3b3b3]">
                        Next In Queue ({upcomingTracks.length} tracks)
                      </h3>
                      {aiVibeLabel && (
                        <span className="text-[11px] font-semibold text-[#1DB954] bg-[#1DB954]/10 border border-[#1DB954]/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-fade-in shadow-sm">
                          <Sparkles className="w-3 h-3 text-[#1DB954]" />
                          ✨ {aiVibeLabel}
                        </span>
                      )}
                      {isFetchingContextualQueue && (
                        <span className="text-[10px] text-emerald-400/80 animate-pulse flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Adapting queue...
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#b3b3b3]/70 mt-0.5">
                      Click any song to jump directly
                    </p>
                  </div>

                  {/* Shuffle and Refresh Actions for Next Played Songs */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleShuffleQueue}
                      className="px-3.5 py-1.5 rounded-full bg-[#242424] hover:bg-[#303030] text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border border-white/10 hover:border-[#1DB954]/50 active:scale-95 shadow-sm"
                      title="Shuffle the order of next played songs"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-[#1DB954]" />
                      <span>Shuffle Queue</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRefreshQueue}
                      disabled={isRefreshingQueue}
                      className="px-3.5 py-1.5 rounded-full bg-[#242424] hover:bg-[#303030] text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 border border-white/10 hover:border-[#1DB954]/50 active:scale-95 shadow-sm disabled:opacity-50"
                      title="Fetch fresh therapeutic song recommendations"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#1DB954] ${isRefreshingQueue ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingQueue ? 'Refreshing...' : 'Refresh Queue'}</span>
                    </button>
                  </div>
                </div>

                {/* Feedback Toast */}
                {queueFeedbackToast && (
                  <div className="mb-3 px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-fade-in shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{queueFeedbackToast}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  {upcomingTracks.map((item, idx) => (
                    <div
                      key={`upcoming-${item.id}-${idx}`}
                      onClick={() => selectSongDirectly(item)}
                      className="group flex items-center justify-between p-3 sm:p-3.5 rounded-xl hover:bg-[#282828] bg-[#181818]/60 border border-transparent hover:border-white/5 transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <span className="w-6 text-center text-xs font-mono text-[#b3b3b3] group-hover:hidden">
                          #{idx + 1}
                        </span>
                        <span className="w-6 text-center hidden group-hover:inline-block">
                          <Play className="w-4 h-4 text-[#1DB954] fill-[#1DB954] inline-block" />
                        </span>

                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#333] shrink-0 border border-white/5">
                          <img src={item.albumArt} alt={item.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white group-hover:text-[#1DB954] transition-colors truncate">
                            {item.title}
                          </h4>
                          <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                            {item.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0 pl-3">
                        <span className="text-xs font-mono text-[#b3b3b3]">
                          {getDisplayDuration(item)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : searchQuery.trim().length > 0 ? (
            /* ================================================================ */
            /* SEARCH RESULTS SECTION (Visible whenever user types in search)    */
            /* ================================================================ */
            <section className="mb-12 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Search Results for "{searchQuery}"
                </h2>
                <span className="text-xs font-bold text-[#b3b3b3]">
                  {searchResults.length} tracks found
                </span>
              </div>

              {isSearching && searchResults.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={`search-skeleton-${i}`} className="bg-[#181818] p-4 rounded-xl flex flex-col justify-between border border-white/5">
                      <div className="w-full aspect-square rounded-lg bg-[#282828] mb-3" />
                      <div className="h-4 bg-[#282828] rounded w-3/4 mb-2" />
                      <div className="h-3 bg-[#202020] rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {searchResults.map((track) => {
                    const isSelected = currentSong.id === track.id && currentSong.title === track.title;
                    const isMenuOpen = openMenuTrackId === track.id;
                    return (
                      <div
                        key={`${track.id}-${track.title}`}
                        onClick={() => selectSongDirectly(track)}
                        className="group bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative shadow-md"
                      >
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 bg-[#282828]">
                          <img
                            src={track.albumArt}
                            alt={track.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Three-Dot Options Button (Play Next / Add to Queue) */}
                          <div className="absolute top-2 right-2 z-20">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuTrackId(isMenuOpen ? null : track.id);
                                setMenuStep('main');
                              }}
                              className={`w-8 h-8 rounded-full bg-black/75 hover:bg-[#1DB954] hover:text-black text-white flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-sm ${
                                isMenuOpen ? 'opacity-100 scale-100 bg-[#1DB954] text-black' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              title="Song options"
                              aria-label="Song options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu (Play Next, Add to Queue, Add to Playlist) */}
                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-10 w-48 bg-[#282828] border border-white/10 rounded-xl shadow-2xl p-1.5 z-30 animate-fade-in"
                              >
                                {menuStep === 'main' ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handlePlayNext(track)}
                                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                                    >
                                      <Play className="w-3.5 h-3.5 text-[#1DB954]" />
                                      <span>Play Next</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAddToQueue(track)}
                                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                                    >
                                      <ListPlus className="w-3.5 h-3.5 text-[#1DB954]" />
                                      <span>Add to Queue</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setMenuStep('choose_playlist')}
                                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer text-left border-t border-white/5 mt-1 pt-2"
                                    >
                                      <FolderPlus className="w-3.5 h-3.5 text-[#1DB954]" />
                                      <span>Add to Playlist...</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-white/10">
                                      <span className="text-[10px] uppercase font-bold text-[#b3b3b3]">
                                        Choose Playlist
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setMenuStep('main')}
                                        className="text-[10px] text-[#1DB954] hover:underline cursor-pointer"
                                      >
                                        Back
                                      </button>
                                    </div>

                                    <div className="max-h-40 overflow-y-auto">
                                      {userPlaylists.map((pl) => (
                                        <button
                                          key={pl.id}
                                          type="button"
                                          onClick={(e) => handleAddTrackToPlaylist(pl.id, track, e)}
                                          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-[#1DB954] hover:text-black transition-colors cursor-pointer text-left truncate"
                                        >
                                          <ListMusic className="w-3 h-3 shrink-0" />
                                          <span className="truncate">{pl.name}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          <div className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-xl transition-all duration-200 ${
                            isSelected && isPlaying 
                              ? 'opacity-100 scale-100' 
                              : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
                          }`}>
                            {isSelected && isPlaying ? (
                              <Pause className="w-5 h-5 fill-black" />
                            ) : (
                              <Play className="w-5 h-5 fill-black ml-0.5" />
                            )}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-[#1DB954]' : 'text-white'}`}>
                            {track.title}
                          </h3>
                          <p className="text-xs text-[#b3b3b3] truncate mt-1">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !isSearching ? (
                <div className="p-8 rounded-2xl bg-[#181818] text-center max-w-md mx-auto my-6 border border-[#282828]">
                  <p className="text-sm font-bold text-white mb-1">
                    No results found for "{searchQuery}"
                  </p>
                  <p className="text-xs text-[#b3b3b3]">
                    Please check spelling or search by another artist or song title.
                  </p>
                </div>
              ) : null}
            </section>
          ) : activePlaylistView !== null ? (
            /* ================================================================ */
            /* PLAYLIST DETAIL VIEW (Liked Songs or User Created Playlist)      */
            /* ================================================================ */
            <section className="mb-12 animate-fade-in">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => setActivePlaylistView(null)}
                className="flex items-center space-x-2 text-xs font-bold text-[#b3b3b3] hover:text-white transition-colors mb-6 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to {navTab === 'library' ? 'Library' : 'Home'}</span>
              </button>

              {/* Header Hero */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8">
                <div className={`w-40 h-40 sm:w-52 sm:h-52 rounded-2xl shadow-2xl shrink-0 flex items-center justify-center ${
                  activePlaylistView === 'liked'
                    ? 'bg-gradient-to-br from-[#450af5] via-[#8e8ee5] to-[#c4efd9]'
                    : activePlaylistView === 'last_played'
                    ? 'bg-gradient-to-br from-indigo-700 via-purple-700 to-slate-900'
                    : `bg-gradient-to-br ${currentPlaylistObj?.color || 'from-emerald-700 to-teal-900'}`
                }`}>
                  {activePlaylistView === 'liked' ? (
                    <Heart className="w-20 h-20 text-white fill-white drop-shadow-lg" />
                  ) : activePlaylistView === 'last_played' ? (
                    <Clock className="w-20 h-20 text-white drop-shadow-lg" />
                  ) : (
                    <ListMusic className="w-20 h-20 text-white drop-shadow-lg" />
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#b3b3b3]">
                    {activePlaylistView === 'last_played' ? 'Listening History' : 'Playlist'}
                  </span>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-1 tracking-tight truncate">
                    {activePlaylistView === 'liked'
                      ? 'Liked Songs'
                      : activePlaylistView === 'last_played'
                      ? 'Last Played Songs'
                      : currentPlaylistObj?.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#b3b3b3] mt-2 max-w-xl">
                    {activePlaylistView === 'liked'
                      ? 'All the comfort tracks and songs you have loved and saved during your therapy.'
                      : activePlaylistView === 'last_played'
                      ? 'Automatically retained for 30 days. Click any song to jump right back in.'
                      : currentPlaylistObj?.description}
                  </p>
                  <p className="text-xs text-[#b3b3b3] mt-3 font-semibold">
                    {userName} • {activePlaylistTracks.length} songs {activePlaylistView === 'last_played' ? '• 30-Day History' : ''}
                  </p>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="flex items-center justify-between py-4 mb-6 border-b border-[#242424]">
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => playEntirePlaylist(activePlaylistTracks)}
                    disabled={activePlaylistTracks.length === 0}
                    className="w-14 h-14 rounded-full bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-gray-700 text-black flex items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                    title="Play All"
                  >
                    <Play className="w-7 h-7 fill-black ml-0.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsShuffle(true);
                      const shuffled = [...activePlaylistTracks].sort(() => Math.random() - 0.5);
                      playEntirePlaylist(shuffled);
                    }}
                    disabled={activePlaylistTracks.length === 0}
                    className="p-2 text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
                    title="Shuffle Play"
                  >
                    <Shuffle className="w-6 h-6" />
                  </button>
                </div>

                {activePlaylistView !== 'liked' && activePlaylistView !== 'last_played' && currentPlaylistObj && (
                  <button
                    type="button"
                    onClick={() => handleDeletePlaylist(currentPlaylistObj.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1.5 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Playlist</span>
                  </button>
                )}
              </div>

              {/* Tracks List */}
              {activePlaylistTracks.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {activePlaylistTracks.map((track, idx) => {
                    const isPlayingThis = currentSong.id === track.id && currentSong.title === track.title;
                    const isThisLiked = isSongLiked(track.id);
                    return (
                      <div
                        key={`${track.id}-${idx}`}
                        onClick={() => selectSongDirectly(track)}
                        className={`group flex items-center justify-between p-3 rounded-xl hover:bg-[#282828] transition-colors cursor-pointer ${
                          isPlayingThis ? 'bg-[#242424]' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <span className="w-6 text-center text-xs font-mono text-[#b3b3b3] group-hover:hidden">
                            {idx + 1}
                          </span>
                          <span className="w-6 text-center hidden group-hover:inline-block">
                            <Play className="w-4 h-4 text-[#1DB954] fill-[#1DB954] inline-block" />
                          </span>

                          <div className="w-11 h-11 rounded-md overflow-hidden bg-[#333] shrink-0">
                            <img src={track.albumArt} alt={track.title} className="w-full h-full object-cover" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className={`text-sm font-bold truncate ${isPlayingThis ? 'text-[#1DB954]' : 'text-white'}`}>
                              {track.title}
                            </h4>
                            <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                              {track.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 shrink-0 pl-4">
                          <button
                            type="button"
                            onClick={(e) => toggleLikeSong(track, e)}
                            className="p-1 cursor-pointer transition-colors"
                            aria-label={isThisLiked ? 'Unlike' : 'Like'}
                          >
                            <Heart className={`w-4 h-4 ${isThisLiked ? 'text-[#1DB954] fill-[#1DB954]' : 'text-[#b3b3b3] hover:text-white'}`} />
                          </button>
                          <span className="text-xs font-mono text-[#b3b3b3] w-12 text-right">
                            {getDisplayDuration(track)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center bg-[#181818] rounded-3xl border border-[#282828] my-6">
                  {activePlaylistView === 'last_played' ? (
                    <Clock className="w-12 h-12 text-[#b3b3b3]/40 mx-auto mb-3" />
                  ) : (
                    <Heart className="w-12 h-12 text-[#b3b3b3]/40 mx-auto mb-3" />
                  )}
                  <h3 className="text-lg font-bold text-white mb-1">
                    {activePlaylistView === 'last_played'
                      ? 'No recently played songs yet'
                      : 'No songs in this playlist yet'}
                  </h3>
                  <p className="text-xs text-[#b3b3b3] max-w-sm mx-auto mb-4">
                    {activePlaylistView === 'last_played'
                      ? 'Songs you play during your therapy session will appear here automatically.'
                      : 'Heart any track while listening or browsing, or search songs to add them!'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePlaylistView(null);
                      setNavTab('home');
                    }}
                    className="px-5 py-2 rounded-full bg-white hover:bg-gray-200 text-black text-xs font-extrabold transition-all cursor-pointer"
                  >
                    Browse Songs
                  </button>
                </div>
              )}
            </section>
          ) : navTab === 'library' ? (
            /* ================================================================ */
            /* LIBRARY VIEW (Playlists & Liked Songs)                            */
            /* ================================================================ */
            <section className="mb-12 animate-fade-in">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#242424]">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Your Library
                  </h2>
                  <p className="text-xs sm:text-sm text-[#b3b3b3] mt-1">
                    Playlists and favorite soothing tracks curated for relaxation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs sm:text-sm font-extrabold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Playlist</span>
                </button>
              </div>

              {/* Grid of Playlists */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                
                {/* LIKED SONGS CARD IN LIBRARY */}
                <div
                  onClick={() => setActivePlaylistView('liked')}
                  className="col-span-2 sm:col-span-2 group bg-gradient-to-br from-[#450af5] via-[#8e8ee5] to-[#715df2] p-5 rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative shadow-xl hover:shadow-2xl hover:scale-[1.01]"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white fill-white" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playEntirePlaylist(likedSongs);
                      }}
                      className="w-12 h-12 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-xl transition-all duration-200 opacity-90 group-hover:opacity-100 group-hover:scale-105 cursor-pointer"
                      title="Play Liked Songs"
                    >
                      <Play className="w-6 h-6 fill-black ml-0.5" />
                    </button>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                      Liked Songs
                    </h3>
                    <p className="text-xs sm:text-sm text-white/80 font-medium mt-1">
                      {likedSongs.length} favorite songs
                    </p>
                  </div>
                </div>

                {/* USER CREATED PLAYLISTS */}
                {userPlaylists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => setActivePlaylistView(pl.id)}
                    className="group bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative shadow-md"
                  >
                    <div className={`relative w-full aspect-square rounded-lg overflow-hidden mb-3 bg-gradient-to-br ${pl.color} flex items-center justify-center`}>
                      <ListMusic className="w-12 h-12 text-white/70 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-xl transition-all duration-200 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">
                        {pl.name}
                      </h3>
                      <p className="text-xs text-[#b3b3b3] truncate mt-1">
                        Playlist • {pl.tracks.length} songs
                      </p>
                    </div>
                  </div>
                ))}

              </div>
            </section>
          ) : (
            /* DEFAULT HOME SECTIONS (When not searching & on Home) */
            <>
              {/* ================================================================ */}
              {/* QUICK ACCESS GRID (Spotify Home Style: Liked Songs & Playlists)  */}
              {/* ================================================================ */}
              <section className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  
                  {/* LIKED SONGS QUICK CARD ON STARTING PAGE */}
                  <div
                    onClick={() => setActivePlaylistView('liked')}
                    className="group flex items-center bg-[#282828]/60 hover:bg-[#383838] transition-all duration-200 rounded-lg overflow-hidden cursor-pointer shadow-md relative pr-4"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-gradient-to-br from-[#450af5] via-[#8e8ee5] to-[#c4efd9] flex items-center justify-center shadow-lg">
                      <Heart className="w-7 h-7 sm:w-9 sm:h-9 text-white fill-white drop-shadow-md" />
                    </div>
                    <div className="flex-1 min-w-0 px-3 sm:px-4">
                      <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                        Liked Songs
                      </h3>
                      <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                        {likedSongs.length} tracks • Ready to play
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playEntirePlaylist(likedSongs);
                      }}
                      className="w-10 h-10 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-xl transition-all duration-200 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 cursor-pointer shrink-0"
                      title="Play Liked Songs"
                    >
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </button>
                  </div>

                  {/* LAST PLAYED QUICK CARD ON STARTING PAGE */}
                  <div
                    onClick={() => setActivePlaylistView('last_played')}
                    className="group flex items-center bg-[#282828]/60 hover:bg-[#383838] transition-all duration-200 rounded-lg overflow-hidden cursor-pointer shadow-md relative pr-4"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-slate-900 flex items-center justify-center shadow-lg">
                      <Clock className="w-7 h-7 sm:w-9 sm:h-9 text-white drop-shadow-md" />
                    </div>
                    <div className="flex-1 min-w-0 px-3 sm:px-4">
                      <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                        Last Played
                      </h3>
                      <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                        {lastPlayedSongs.length > 0
                          ? `${lastPlayedSongs.length} tracks • Recently played`
                          : 'Recent history'}
                      </p>
                    </div>
                    {lastPlayedSongs.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playEntirePlaylist(lastPlayedSongs);
                        }}
                        className="w-10 h-10 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-xl transition-all duration-200 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 cursor-pointer shrink-0"
                        title="Play Last Played Songs"
                      >
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </button>
                    )}
                  </div>

                  {/* USER PLAYLISTS / PRESET QUICK ACCESS CARDS */}
                  {userPlaylists.slice(0, 5).map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => {
                        setNavTab('library');
                        setActivePlaylistView(pl.id);
                      }}
                      className="group flex items-center bg-[#282828]/60 hover:bg-[#383838] transition-all duration-200 rounded-lg overflow-hidden cursor-pointer shadow-md relative pr-4"
                    >
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-gradient-to-br ${pl.color} flex items-center justify-center shadow-lg`}>
                        <ListMusic className="w-7 h-7 sm:w-9 sm:h-9 text-white drop-shadow-md" />
                      </div>
                      <div className="flex-1 min-w-0 px-3 sm:px-4">
                        <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                          {pl.name}
                        </h3>
                        <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                          {pl.tracks.length} tracks • Playlist
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playEntirePlaylist(pl.tracks);
                        }}
                        className="w-10 h-10 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-xl transition-all duration-200 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 cursor-pointer shrink-0"
                        title={`Play ${pl.name}`}
                      >
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </button>
                    </div>
                  ))}

                </div>
              </section>

              {/* ================================================================ */}
              {/* SECTION 1: PATIENT TOP TRACKS (Personal Most-Played History)      */}
              {/* ================================================================ */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      Top Tracks
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40">
                      {topTracks.length > 0 ? `${userName}'s Most Played` : 'Personalized Suggestions'}
                    </span>
                  </div>
                  {topTracks.length > 0 && (
                    <span
                      onClick={() => setActivePlaylistView('last_played')}
                      className="text-xs font-bold text-[#b3b3b3] hover:underline cursor-pointer"
                    >
                      Show history
                    </span>
                  )}
                </div>

                {topTracks.length === 0 && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-forest-950/40 border border-forest-500/30 flex items-center justify-between text-xs text-forest-200">
                    <div className="flex items-center space-x-2.5">
                      <Sparkles className="w-4 h-4 text-[#1DB954] shrink-0" />
                      <span>
                        <strong>Welcome, {userName}!</strong> Start listening to see your most-played favorites appear here. In the meantime, here are recommended memories from your formative era ({formativeEra?.decade || '1970s'}):
                      </span>
                    </div>
                  </div>
                )}

                {/* 5-Card Horizontal Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {(topTracks.length > 0
                    ? topTracks.slice(0, 5)
                    : (aiCuratedQueue && aiCuratedQueue.length > 0
                        ? aiCuratedQueue.slice(0, 5)
                        : NOSTALGIA_GEMS_CATALOG.slice(0, 5))
                  ).map((track, idx) => {
                    const isSelected = currentSong.id === track.id && currentSong.title === track.title;
                    return (
                      <div
                        key={`${track.id}-${track.title}-${idx}`}
                        onClick={() => selectSongDirectly(track)}
                        className="group bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative shadow-md"
                      >
                        {/* Square Album Cover */}
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 bg-[#282828]">
                          <img
                            src={track.albumArt}
                            alt={track.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Play count badge if tracked */}
                          {track.playCount && track.playCount > 1 ? (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-[10px] font-extrabold text-[#1DB954] border border-[#1DB954]/30 shadow">
                              {track.playCount} plays
                            </div>
                          ) : null}

                          {/* Floating Green Play Button on Hover/Active */}
                          <div className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-xl transition-all duration-200 ${
                            isSelected && isPlaying 
                              ? 'opacity-100 scale-100' 
                              : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
                          }`}>
                            {isSelected && isPlaying ? (
                              <Pause className="w-5 h-5 fill-black" />
                            ) : (
                              <Play className="w-5 h-5 fill-black ml-0.5" />
                            )}
                          </div>
                        </div>

                        {/* Track Title & Artist */}
                        <div className="min-w-0">
                          <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-[#1DB954]' : 'text-white'}`}>
                            {track.title}
                          </h3>
                          <p className="text-xs text-[#b3b3b3] truncate mt-1">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ================================================================ */}
              {/* SECTION 3: HERITAGE NOSTALGIA & DEMENTIA-CARE RAGAS               */}
              {/* ================================================================ */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      Nostalgic Classics & Meditations
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40">
                      Caregiver Verified
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#b3b3b3] hover:underline cursor-pointer">
                    Show all
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {NOSTALGIA_GEMS_CATALOG.map((track) => {
                    const isSelected = currentSong.id === track.id && currentSong.title === track.title;
                    return (
                      <div
                        key={track.title}
                        onClick={() => selectSongDirectly(track)}
                        className="group bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative shadow-md"
                      >
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 bg-[#282828]">
                          <img
                            src={track.albumArt}
                            alt={track.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          <div className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-xl transition-all duration-200 ${
                            isSelected && isPlaying 
                              ? 'opacity-100 scale-100' 
                              : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
                          }`}>
                            {isSelected && isPlaying ? (
                              <Pause className="w-5 h-5 fill-black" />
                            ) : (
                              <Play className="w-5 h-5 fill-black ml-0.5" />
                            )}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-[#1DB954]' : 'text-white'}`}>
                            {track.title}
                          </h3>
                          <p className="text-xs text-[#b3b3b3] truncate mt-1">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}



        </main>
      </div>

      {/* ==================================================================== */}
      {/* CREATE PLAYLIST MODAL (When isCreateModalOpen === true)               */}
      {/* ==================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-[#333] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-fade-in text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#1DB954]/20 text-[#1DB954] flex items-center justify-center border border-[#1DB954]/30">
                  <FolderPlus className="w-5 h-5 text-[#1DB954]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">
                    Create New Playlist
                  </h3>
                  <p className="text-[11px] text-[#b3b3b3]">
                    Curate a soothing personal collection
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#b3b3b3] hover:text-white p-1 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="flex flex-col gap-4 mt-2">
              <div>
                <label className="block text-xs font-bold text-[#b3b3b3] uppercase tracking-wider mb-1.5">
                  Playlist Name
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder={`My Playlist #${userPlaylists.length + 1}`}
                  autoFocus
                  className="w-full px-4 py-3 bg-[#282828] text-white rounded-xl border border-transparent focus:border-[#1DB954] outline-none text-sm font-semibold transition-all placeholder-[#777]"
                />
              </div>

              {/* Quick suggestions */}
              <div>
                <span className="block text-[11px] font-bold text-[#b3b3b3] mb-2">
                  Quick suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["Dada's Favorites", 'Peaceful Evening', '70s Golden Duets', 'Sleep & Rest', 'Morning Sitar'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewPlaylistName(preset)}
                      className="px-3 py-1 rounded-full bg-[#282828] hover:bg-[#333] text-xs text-[#b3b3b3] hover:text-white transition-colors cursor-pointer border border-[#333]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#b3b3b3] uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  rows={2}
                  placeholder="Soothing tunes chosen with love..."
                  className="w-full px-4 py-2.5 bg-[#282828] text-white rounded-xl border border-transparent focus:border-[#1DB954] outline-none text-xs transition-all placeholder-[#777] resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 mt-1 border-t border-[#2a2a2a]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-[#b3b3b3] hover:text-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-extrabold cursor-pointer transition-all shadow-md hover:scale-105"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. BOTTOM PERSISTENT PLAYBACK BAR (Matching Musicify Screenshot)     */}
      {/* ==================================================================== */}
      <footer className="fixed bottom-0 left-0 right-0 h-24 bg-[#181818] border-t border-[#282828] z-50 px-4 sm:px-6 flex items-center justify-between select-none">
        
        {/* LEFT: Current Track Artwork, Title, Artist, & Like Button */}
        <div className="flex items-center space-x-3.5 min-w-0 w-1/4 max-w-[280px]">
          <div className="w-14 h-14 rounded-md overflow-hidden bg-[#282828] shrink-0 shadow-md">
            <img
              src={currentSong.albumArt}
              alt={cleanCurrentTitle}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate hover:underline cursor-pointer">
              {cleanCurrentTitle}
            </h4>
            <p className="text-xs text-[#b3b3b3] truncate mt-0.5 hover:underline cursor-pointer">
              {cleanCurrentArtist}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => toggleLikeSong(currentSong, e)}
            className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer hidden sm:block p-1"
            aria-label={isSongLiked(currentSong.id) ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
            title={isSongLiked(currentSong.id) ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
          >
            <Heart className={`w-4 h-4 ${isSongLiked(currentSong.id) ? 'text-[#1DB954] fill-[#1DB954]' : ''}`} />
          </button>
        </div>

        {/* CENTER: Playback Controls (Shuffle, Prev, Green Play/Pause, Next, Loop) & Scrubber */}
        <div className="flex flex-col items-center justify-center max-w-xl w-full sm:w-2/4 px-2">
          
          {/* Controls Buttons */}
          <div className="flex items-center space-x-4 sm:space-x-6 mb-1.5">
            {/* Shuffle */}
            <button
              type="button"
              onClick={() => setIsShuffle(!isShuffle)}
              className={`transition-colors cursor-pointer hidden sm:block ${
                isShuffle ? 'text-[#1DB954]' : 'text-[#b3b3b3] hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              type="button"
              onClick={handlePrevTrack}
              className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer active:scale-95"
              aria-label="Previous Track"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Big Round Green Play/Pause Button (Exact match from screenshot) */}
            <button
              type="button"
              onClick={togglePlayPause}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={handleNextTrack}
              className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer active:scale-95"
              aria-label="Next Track"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat / Endless Loop */}
            <button
              type="button"
              onClick={() => setIsRepeat(!isRepeat)}
              className={`transition-colors cursor-pointer hidden sm:block ${
                isRepeat ? 'text-[#1DB954]' : 'text-[#b3b3b3] hover:text-white'
              }`}
              title="Endless Repeat Active"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar & Timestamps (Matching 0:10 / 2:58 in screenshot) */}
          <div className="w-full flex items-center space-x-2 text-[11px] font-mono text-[#b3b3b3]">
            <span className="w-9 text-right">{formatTime(trackElapsedSeconds)}</span>
            
            <div className="relative flex-1 flex items-center group">
              <input
                type="range"
                min={0}
                max={trackTotalDuration || 240}
                value={trackElapsedSeconds}
                onChange={handleSeek}
                style={{
                  background: `linear-gradient(to right, #1DB954 ${progressPercent}%, #4d4d4d ${progressPercent}%)`,
                }}
                className="w-full h-1 group-hover:h-1.5 rounded-lg appearance-none cursor-pointer accent-[#1DB954] transition-all"
                aria-label="Playback Progress"
              />
            </div>

            <span className="w-9 text-left">{formatTime(trackTotalDuration)}</span>
          </div>

        </div>

        {/* RIGHT: Now Playing / Up Next Toggle, Volume Speaker & Green Volume Bar */}
        <div className="flex items-center justify-end space-x-2.5 sm:space-x-3 w-1/3 max-w-[300px]">
          
          {/* NOW PLAYING / UP NEXT QUEUE TOGGLE */}
          <div className="flex items-center bg-[#282828] rounded-lg p-0.5 border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setPlayerViewMode('now_playing')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                playerViewMode === 'now_playing'
                  ? 'bg-[#1DB954] text-black font-extrabold shadow-sm'
                  : 'text-[#b3b3b3] hover:text-white'
              }`}
              title="Now Playing View"
              aria-label="Now Playing View"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden md:inline">Playing</span>
            </button>
            <button
              type="button"
              onClick={() => setPlayerViewMode('queue')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                playerViewMode === 'queue'
                  ? 'bg-[#1DB954] text-black font-extrabold shadow-sm'
                  : 'text-[#b3b3b3] hover:text-white'
              }`}
              title="Up Next Queue View"
              aria-label="Up Next Queue View"
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden md:inline">Up Next</span>
            </button>
          </div>

          {/* Opt-in Video Toggle */}
          <button
            type="button"
            onClick={() => setViewVideo(!viewVideo)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewVideo ? 'text-[#1DB954] bg-[#282828]' : 'text-[#b3b3b3] hover:text-white'
            }`}
            title={viewVideo ? 'Hide Video' : 'Show Video View'}
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Speaker / Mute Button */}
          <button
            type="button"
            onClick={toggleMute}
            className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-terracotta-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Horizontal Green Volume Slider with circle thumb (Matches screenshot right side) */}
          <div className="w-20 sm:w-28 flex items-center">
            <input
              type="range"
              min={0}
              max={100}
              value={currentVolumeVal}
              onChange={handleVolumeChange}
              style={{
                background: `linear-gradient(to right, #1DB954 ${currentVolumeVal}%, #4d4d4d ${currentVolumeVal}%)`,
              }}
              className="w-full h-1 hover:h-1.5 rounded-lg appearance-none cursor-pointer accent-[#1DB954] transition-all"
              aria-label="Volume Slider"
            />
          </div>

        </div>

      </footer>

      {/* Global Floating Action Confirmation Toast */}
      {queueFeedbackToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#181818]/95 border border-[#1DB954] text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center space-x-2.5 text-xs sm:text-sm font-bold animate-fade-in backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-[#1DB954] shrink-0" />
          <span className="truncate max-w-xs sm:max-w-md">{queueFeedbackToast}</span>
        </div>
      )}

    </div>
  );
};

export default SessionPlayer;

