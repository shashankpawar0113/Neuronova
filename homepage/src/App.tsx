import React, { useState, useEffect } from 'react';
import { UserPreferences } from './types';
import { INITIAL_ROUTINE_SCHEDULE } from './data/mockRoutine';
import { GreetingHeader } from './components/GreetingHeader';
import { StreakCard } from './components/StreakCard';
import { RoutinePreview } from './components/RoutinePreview';
import { HeroActionCards } from './components/HeroActionCards';
import { VoiceAssistant } from './components/VoiceAssistant';
import { AccessibilityModal } from './components/AccessibilityModal';
import { ActionPlaceholderModal } from './components/ActionPlaceholderModal';

interface UserSession {
  userId: string;
  name: string;
  role: string;
}

// Helper to fetch the logged-in user's session from account storage & URL
const fetchLoggedInUserSession = (): UserSession => {
  try {
    // 0. Check URL query parameters (e.g. ?userId=...&name=...) when transferred from auth
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get('userId') || params.get('uid');
      const queryName = params.get('name') || params.get('user') || params.get('displayName');
      const queryRole = params.get('role') || 'patient';
      
      if (queryId || queryName) {
        const userId = queryId || `user_${(queryName || 'friend').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        const name = queryName ? queryName.trim() : 'Friend';
        const session: UserSession = { userId, name, role: queryRole };
        try {
          localStorage.setItem('neuronova_auth_session', JSON.stringify({
            ...session,
            signedInAt: new Date().toISOString(),
          }));
        } catch (_) {}
        return session;
      }
    }

    // 1. Check standard NeuroNova session storage key
    const rawSession = localStorage.getItem('neuronova_auth_session');
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      const name = (parsed?.name || parsed?.displayName || parsed?.emailOrPhone?.split('@')[0] || 'Friend').trim();
      const userId = parsed?.userId || parsed?.uid || `user_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const role = parsed?.role || 'patient';
      return { userId, name, role };
    }

    // 2. Check for Firebase Auth cached session keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('firebase:authUser:')) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          const name = (parsed?.displayName || parsed?.email?.split('@')[0] || 'Friend').trim();
          const userId = parsed?.uid || `user_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          return { userId, name, role: 'patient' };
        }
      }
    }
  } catch (err) {
    console.warn('Could not read account login session:', err);
  }

  return { userId: 'guest_user', name: 'Friend', role: 'patient' };
};

export const App: React.FC = () => {
  // Fetch session dynamically from account login
  const [session, setSession] = useState<UserSession>(() => fetchLoggedInUserSession());
  const userName = session.name;
  const userId = session.userId;

  // Listen for storage events in case login happens in another tab/window
  useEffect(() => {
    const handleStorage = () => {
      setSession(fetchLoggedInUserSession());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Display preferences (fontSize and highContrast only)
  const [preferences, setPreferences] = useState<UserPreferences>({
    fontSize: 'large', // Senior-friendly default
    highContrast: false,
  });

  const [routineSchedule, setRoutineSchedule] = useState(INITIAL_ROUTINE_SCHEDULE);

  // Load user's persisted routine logs from backend
  useEffect(() => {
    if (!userId) return;
    let isSubscribed = true;

    fetch(`http://localhost:5001/api/user/${userId}/routine`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!isSubscribed || !data || !Array.isArray(data.logs)) return;
        const completedMap = new Map<string, boolean>();
        data.logs.forEach((log: { task_id: string; completed: number | boolean }) => {
          completedMap.set(log.task_id, Boolean(log.completed));
        });

        setRoutineSchedule(prev => prev.map(item => {
          if (completedMap.has(item.id)) {
            return { ...item, completed: Boolean(completedMap.get(item.id)) };
          }
          // Default uncompleted for real account if not in log
          return { ...item, completed: false };
        }));
      })
      .catch(err => {
        console.warn('Failed to load routine logs from backend:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [userId]);

  const handleToggleRoutine = async (taskId: string, title: string) => {
    // Find current item
    const currentItem = routineSchedule.find(item => item.id === taskId);
    const nextCompleted = !currentItem?.completed;

    // Optimistic UI update
    setRoutineSchedule(prev => prev.map(item => 
      item.id === taskId ? { ...item, completed: nextCompleted } : item
    ));

    // Persist to backend
    try {
      await fetch(`http://localhost:5001/api/user/${userId}/routine/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          taskTitle: title,
          completed: nextCompleted,
        }),
      });
    } catch (err) {
      console.error('Failed to persist routine toggle:', err);
    }
  };

  // Modals state
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<{
    id: string;
    title: string;
    description: string;
  } | null>(null);

  const handleUpdatePreferences = (updated: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updated }));
  };

  const handleSelectCard = (cardId: string, title: string, description: string) => {
    const nameParam = encodeURIComponent(userName);
    const userParam = encodeURIComponent(userId);
    const roleParam = encodeURIComponent(session.role);

    if (cardId === 'music') {
      window.location.href = `http://localhost:5177/?userId=${userParam}&name=${nameParam}&role=${roleParam}`;
      return;
    }
    if (cardId === 'games') {
      window.location.href = `http://localhost:5178/?userId=${userParam}&name=${nameParam}&role=${roleParam}`;
      return;
    }
    if (cardId === 'vault') {
      window.location.href = `http://localhost:5178/?game=vault&userId=${userParam}&name=${nameParam}&role=${roleParam}`;
      return;
    }
    setSelectedCard({ id: cardId, title, description });
  };

  // Font scaling class
  const getFontSizeClass = () => {
    if (preferences.fontSize === 'xlarge') return 'text-[115%]';
    if (preferences.fontSize === 'large') return 'text-[105%]';
    return 'text-[100%]';
  };

  // Gentle entrance fade-in transition
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 40);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div 
        className={`min-h-screen w-full bg-[#FAF7F2] text-[#1A202C] flex flex-col justify-between font-brand-body transition-opacity duration-700 ease-out ${
          isMounted ? 'opacity-100' : 'opacity-0'
        } ${getFontSizeClass()} ${
          preferences.highContrast ? 'contrast-125 font-medium' : ''
        }`}
      >
        {/* 1. Header with Time Greeting, Temporal Date, and Settings */}
        <GreetingHeader
          userName={userName}
          onOpenSettings={() => setIsAccessibilityOpen(true)}
        />

        {/* 2. Main Content Container */}
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 md:px-12 py-6 sm:py-8 flex-grow flex flex-col gap-6 sm:gap-8">
          
          {/* Gentle Encouragement & Streak Card with AI Cognitive Reflection */}
          <StreakCard streakDays={3} improvementPercentage={12} userName={userName} userId={userId} />

          {/* Today's Routine Preview Strip (Next 1-2 Items with DONE & REMIND ME LATER) */}
          <RoutinePreview 
            schedule={routineSchedule}
            onMarkDone={handleToggleRoutine}
            onOpenFullSchedule={() => setSelectedCard({
              id: 'routine-full',
              title: "Today's Routine & Medicine",
              description: "View all 7 scheduled steps for your day.",
            })}
          />

          {/* Four Large Hero Action Cards */}
          <HeroActionCards onSelectCard={handleSelectCard} />

        </main>

        {/* 3. Subtle, Warm Footer */}
        <footer className="w-full border-t border-[#E8DFD1] py-6 px-4 text-center text-xs sm:text-sm text-[#1A202C]/60">
          <p>NeuroNova Daily Companion • Designed with dignity, patience, and love for our elders.</p>
        </footer>
      </div>

      {/* 4. Persistent Viewport-Fixed Voice Assistant (Always accessible on screen without scrolling) */}
      <VoiceAssistant
        userName={userName}
        userId={userId}
        routine={routineSchedule}
      />

      {/* 5. Accessibility & Preferences Modal */}
      <AccessibilityModal
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
        userId={userId}
        userName={userName}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />

      {/* 6. Action & Activity Details Modal (Max 2-tap depth) */}
      <ActionPlaceholderModal
        isOpen={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        cardId={selectedCard?.id || null}
        cardTitle={selectedCard?.title || ''}
        cardDescription={selectedCard?.description || ''}
        routineSchedule={routineSchedule}
      />
    </>
  );
};

export default App;
