import React, { useState, useEffect } from 'react';
import { 
  MusicSessionState, 
  MoodType, 
  MusicGenreKey, 
  Track, 
  FormativeEra 
} from './types';
import { 
  calculateFormativeEra, 
  FALLBACK_TRACKS 
} from './data/musicConstants';
import { MoodCheckIn } from './components/MoodCheckIn';
import { FormativeEraSelector } from './components/FormativeEraSelector';
import { FrequencyBanner } from './components/FrequencyBanner';
import { SessionPlayer } from './components/SessionPlayer';
import { BACKEND_URL, HOMEPAGE_URL, performLogout } from './config/urls';
import { 
  ArrowLeft, 
  Music, 
  Heart, 
  CheckCircle2, 
  RotateCcw 
, LogOut } from 'lucide-react';

interface UserSession {
  userId: string;
  name: string;
  role: 'patient' | 'caregiver';
}

// Helper to fetch user session from URL or localStorage
const fetchUserSession = (): UserSession => {
  if (typeof window !== 'undefined' && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('userId') || params.get('uid');
    const queryName = params.get('name') || params.get('user');
    const roleParam = params.get('role');
    const role: 'patient' | 'caregiver' = roleParam === 'caregiver' ? 'caregiver' : 'patient';

    if (queryId || queryName) {
      const name = queryName ? queryName.trim() : 'Dada Anand';
      const userId = queryId || `user_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      try {
        localStorage.setItem('neuronova_auth_session', JSON.stringify({
          userId,
          name,
          role,
          signedInAt: new Date().toISOString(),
        }));
      } catch (_) {}
      return { userId, name, role };
    }
  }

  try {
    const raw = localStorage.getItem('neuronova_auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      const name = (parsed?.name || parsed?.displayName || 'Dada Anand').trim();
      const userId = parsed?.userId || parsed?.uid || `user_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const role = parsed?.role === 'caregiver' ? 'caregiver' : 'patient';
      return { userId, name, role };
    }
  } catch (_) {}

  return { userId: 'guest_user', name: 'Dada Anand', role: 'patient' };
};

export const App: React.FC = () => {
  const [session] = useState<UserSession>(() => fetchUserSession());
  const userName = session.name;
  const userRole = session.role;
  const userId = session.userId;

  // Voice Companion deep-link: ?play=<song name> auto-searches and plays that song
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return decodeURIComponent(params.get('play') || '');
    } catch (_) { return ''; }
  });

  useEffect(() => {
    const handleUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const play = decodeURIComponent(params.get('play') || '');
        if (play) setInitialSearchQuery(play);
      } catch (_) {}
    };
    window.addEventListener('popstate', handleUrl);
    window.addEventListener('hashchange', handleUrl);
    return () => {
      window.removeEventListener('popstate', handleUrl);
      window.removeEventListener('hashchange', handleUrl);
    };
  }, []);

  // Patient age for formative decade targeting
  const [patientAge, setPatientAge] = useState<number>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ageParam = params.get('age');
      if (ageParam && !isNaN(parseInt(ageParam, 10))) return parseInt(ageParam, 10);
      const raw = localStorage.getItem('neuronova_auth_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.age && !isNaN(Number(parsed.age))) return Number(parsed.age);
      }
    } catch (_) {}
    return 74;
  });

  const [formativeEra, setFormativeEra] = useState<FormativeEra>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const eraParam = params.get('era') || params.get('decade');
      if (eraParam && eraParam.endsWith('s')) {
        const year = parseInt(eraParam.replace('s', ''), 10);
        if (!isNaN(year)) {
          const approxAge = 2026 - (year - 18);
          return {
            age: approxAge,
            birthYear: year - 18,
            formativeStartYear: year - 3,
            formativeEndYear: year + 4,
            decade: eraParam,
          };
        }
      }
    } catch (_) {}
    return calculateFormativeEra(74);
  });

  const [selectedGenre, setSelectedGenre] = useState<MusicGenreKey>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const genreParam = params.get('genre') as MusicGenreKey;
      if (genreParam) return genreParam;
    } catch (_) {}
    return 'all';
  });

  // Default to active_session with AI-curated autoplay; or pre_checkin if requested via query param
  const [sessionState, setSessionState] = useState<MusicSessionState>(() => {
    const isMoodFirst = typeof window !== 'undefined' && (
      window.location.search.includes('checkin=1') || 
      window.location.search.includes('mood=1')
    );
    return {
      step: isMoodFirst ? 'pre_checkin' : 'active_session',
      preMood: 'peaceful',
      postMood: null,
      currentTrackIndex: 0,
      isPlaying: true,
      elapsedSeconds: 0,
      targetDurationMinutes: 30,
      sessionsCompletedThisWeek: 1,
    };
  });

  // Queued playlist
  const [tracks, setTracks] = useState<Track[]>(FALLBACK_TRACKS);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);

  // Update formative era when age changes
  const handleAgeChange = (newAge: number) => {
    setPatientAge(newAge);
    const era = calculateFormativeEra(newAge);
    setFormativeEra(era);
  };

  // Fetch era-appropriate tracks from Neuronovai backend (with fallback)
  useEffect(() => {
    let isCancelled = false;

    async function loadTracks() {
      try {
        setIsLoadingTracks(true);
        const baseOrigin = BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001');
        const url = new URL(`${BACKEND_URL || ''}/api/youtube/search`, baseOrigin);
        url.searchParams.set('decade', formativeEra.decade);
        url.searchParams.set('genre', selectedGenre);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!isCancelled && data.tracks && Array.isArray(data.tracks) && data.tracks.length > 0) {
          setTracks(data.tracks);
        }
      } catch (err) {
        if (!isCancelled) {
          let filtered = FALLBACK_TRACKS;
          if (selectedGenre !== 'all') {
            filtered = filtered.filter(t => t.genre === selectedGenre);
          }
          setTracks(filtered.length > 0 ? filtered : FALLBACK_TRACKS);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingTracks(false);
        }
      }
    }

    loadTracks();

    return () => {
      isCancelled = true;
    };
  }, [formativeEra.decade, selectedGenre]);

  // Back to Main Home Screen
  const handleReturnHome = () => {
    const nameParam = encodeURIComponent(userName);
    const userParam = encodeURIComponent(userId);
    const roleParam = encodeURIComponent(userRole);
    window.location.href = `${HOMEPAGE_URL}/?userId=${userParam}&name=${nameParam}&role=${roleParam}`;
  };

  // 1. FULL-SCREEN MUSICIFY PLAYER VIEW
  if (sessionState.step === 'active_session') {
    return (
      <SessionPlayer
        tracks={tracks}
        currentTrackIndex={sessionState.currentTrackIndex}
        onSelectTrackIndex={(idx) => setSessionState(prev => ({ ...prev, currentTrackIndex: idx }))}
        onEndSession={() => setSessionState(prev => ({ ...prev, step: 'post_checkin' }))}
        onReturnHome={handleReturnHome}
        targetDurationMinutes={sessionState.targetDurationMinutes}
        userId={userId}
        userName={userName}
        userRole={userRole}
        initialSearchQuery={initialSearchQuery}
        patientAge={patientAge}
        formativeEra={formativeEra}
      />
    );
  }

  // 2. REFLECTION & POST-SESSION FLOWS
  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] text-[#1A202C] flex flex-col justify-between font-brand-body">
      
      {/* Senior-Accessible Top Navigation Bar */}
      <header className="w-full bg-white/85 backdrop-blur-md border-b border-[#E8DFD1] sticky top-0 z-40 px-4 sm:px-8 py-4 shadow-warm-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          <button
            type="button"
            onClick={handleReturnHome}
            className="min-h-[48px] px-4 py-2 rounded-2xl bg-cream-100 hover:bg-cream-200 border border-[#E8DFD1] text-[#1A202C] font-extrabold text-sm sm:text-base flex items-center space-x-2 transition-all cursor-pointer shadow-warm-xs active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-terracotta-700" />
            <span>Back to Main Home Screen</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-terracotta-100 border border-terracotta-300 flex items-center justify-center text-terracotta-700 shadow-inner">
              <Music className="w-5 h-5 text-terracotta-600" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-[#1A202C] font-brand-heading leading-tight">
                NeuroNova Music Therapy
              </h1>
              <p className="text-xs text-[#1A202C]/65 hidden sm:block">
                Long-Term Memory & Emotional Well-Being
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs sm:text-sm font-bold">
            <Heart className="w-3.5 h-3.5 text-forest-600 fill-forest-200" />
            <span>{userName}</span>
          </div>
          <button
            type="button"
            onClick={() => performLogout()}
            className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sign out of NeuroNova"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-grow flex flex-col gap-6 sm:gap-8">
        
        {/* Weekly Clinical Frequency Banner */}
        <FrequencyBanner
          completedThisWeek={sessionState.sessionsCompletedThisWeek}
          targetWeekly={2}
        />

        {/* STEP A: Pre-Session Mood Check-In */}
        {sessionState.step === 'pre_checkin' && (
          <MoodCheckIn
            phase="pre"
            userName={userName}
            selectedMood={sessionState.preMood}
            onSelectMood={(mood) => setSessionState(prev => ({ ...prev, preMood: mood }))}
            onConfirm={() => setSessionState(prev => ({ ...prev, step: 'active_session', isPlaying: true }))}
          />
        )}

        {/* STEP C: Post-Session Mood Check-In */}
        {sessionState.step === 'post_checkin' && (
          <MoodCheckIn
            phase="post"
            userName={userName}
            selectedMood={sessionState.postMood}
            onSelectMood={(mood) => setSessionState(prev => ({ ...prev, postMood: mood }))}
            onConfirm={() => setSessionState(prev => ({ 
              ...prev, 
              step: 'completed',
              sessionsCompletedThisWeek: prev.sessionsCompletedThisWeek + 1,
            }))}
          />
        )}

        {/* STEP D: Session Complete Celebration */}
        {sessionState.step === 'completed' && (
          <div className="w-full max-w-2xl mx-auto bg-white/95 backdrop-blur-sm rounded-3xl border-2 border-forest-200 p-8 sm:p-10 shadow-warm-lg text-center flex flex-col items-center gap-5">
            <div className="w-18 h-18 rounded-3xl bg-forest-100 border border-forest-300 flex items-center justify-center text-forest-700 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-forest-600" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-forest-100 text-forest-800 border border-forest-200 mb-2">
                Session Completed With Love
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A202C] font-brand-heading">
                Peaceful Moments, {userName}
              </h2>
              <p className="text-base sm:text-lg text-[#1A202C]/75 font-brand-body max-w-md mx-auto mt-1">
                You've completed your gentle music therapy for today, nourishing your mind with comforting melodies.
              </p>
            </div>

            {/* Before vs After summary card */}
            <div className="w-full bg-[#FAF7F2] rounded-2xl p-4 border border-[#E8DFD1] flex items-center justify-around">
              <div>
                <span className="text-xs font-bold text-[#1A202C]/60 uppercase">Before Session</span>
                <p className="text-sm sm:text-base font-extrabold text-terracotta-900 capitalize">
                  {sessionState.preMood || 'Calm'}
                </p>
              </div>
              <div className="text-xl text-[#1A202C]/40">→</div>
              <div>
                <span className="text-xs font-bold text-[#1A202C]/60 uppercase">After Session</span>
                <p className="text-sm sm:text-base font-extrabold text-forest-900 capitalize">
                  {sessionState.postMood || 'Peaceful'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col sm:flex-row items-center gap-3 mt-2">
              <button
                type="button"
                onClick={handleReturnHome}
                className="w-full min-h-[56px] py-3.5 px-6 rounded-2xl bg-forest-600 hover:bg-forest-700 text-white font-extrabold text-lg shadow-warm-md transition-all cursor-pointer"
              >
                Back to Main Home Screen
              </button>

              <button
                type="button"
                onClick={() => setSessionState({
                  step: 'pre_checkin',
                  preMood: null,
                  postMood: null,
                  currentTrackIndex: 0,
                  isPlaying: false,
                  elapsedSeconds: 0,
                  targetDurationMinutes: 30,
                  sessionsCompletedThisWeek: sessionState.sessionsCompletedThisWeek,
                })}
                className="w-full sm:w-auto min-h-[56px] py-3.5 px-6 rounded-2xl bg-cream-100 hover:bg-cream-200 border border-[#E8DFD1] text-[#1A202C] font-extrabold text-base flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Listen Again</span>
              </button>
            </div>

          </div>
        )}

      </main>

      {/* 3. Dignified Footer */}
      <footer className="w-full border-t border-[#E8DFD1] py-6 px-4 text-center text-xs sm:text-sm text-[#1A202C]/60">
        <p>NeuroNova Music Therapy • Restoring familiar joy and soothing memories for our elders.</p>
      </footer>

    </div>
  );
};

export default App;
