import React, { useState, useEffect } from 'react';
import { UserPreferences, RoutineItem } from './types';
import { INITIAL_ROUTINE_SCHEDULE } from './data/mockRoutine';
import { GreetingHeader } from './components/GreetingHeader';
import { StreakCard } from './components/StreakCard';
import { RoutinePreview } from './components/RoutinePreview';
import { HeroActionCards } from './components/HeroActionCards';
import { VoiceAssistant } from './components/VoiceAssistant';
import { AccessibilityModal } from './components/AccessibilityModal';
import { ActionPlaceholderModal } from './components/ActionPlaceholderModal';
import { OrganicUnblurBackground } from './components/OrganicUnblurBackground';
import { BACKEND_URL, NEUROMUSIC_URL, NEUROGAMES_URL } from './config/urls';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { getSocket } from './services/socketService';

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

const formatTimeToDisplay = (timeStr: string): string => {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  } catch {
    return timeStr;
  }
};

const mapTaskTypeToCategory = (type: string): RoutineItem['category'] => {
  switch (type) {
    case 'medication': return 'medicine';
    case 'meal': return 'meal';
    case 'water':
    case 'hydration': return 'hydration';
    case 'exercise':
    case 'cognitive': return 'activity';
    case 'game': return 'game';
    case 'family': return 'family';
    default: return 'activity';
  }
};

const PatientHomeContent: React.FC<{ session: UserSession }> = ({ session }) => {
  const { t } = useLanguage();
  const userName = session.name;
  const userId = session.userId;

  // Display preferences (fontSize and highContrast only, persisted in localStorage)
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('neuronova_display_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          fontSize: parsed.fontSize || 'large',
          highContrast: Boolean(parsed.highContrast),
        };
      }
    } catch (_) {}
    return {
      fontSize: 'large', // Senior-friendly default
      highContrast: false,
    };
  });

  // Sync high-contrast class to root documentElement
  useEffect(() => {
    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    return () => {
      document.documentElement.classList.remove('high-contrast');
    };
  }, [preferences.highContrast]);

  const [routineSchedule, setRoutineSchedule] = useState<RoutineItem[]>(INITIAL_ROUTINE_SCHEDULE);

  const targetPatientId = (userId && userId !== 'guest_user') ? userId : 'user_kamla_sharma_family_care';

  const loadRoutineAndTasks = async () => {
    try {
      // 1. Fetch routine completion logs
      let completedMap = new Map<string, boolean>();
      try {
        const routineRes = await fetch(`${BACKEND_URL}/api/user/${userId}/routine`);
        if (routineRes.ok) {
          const data = await routineRes.json();
          if (Array.isArray(data.logs)) {
            data.logs.forEach((log: { task_id: string; completed: number | boolean }) => {
              completedMap.set(log.task_id, Boolean(log.completed));
            });
          }
        }
      } catch (_) {}

      // 2. Fetch scheduled tasks from caregiver
      let serverTasks: any[] = [];
      try {
        const tasksRes = await fetch(`${BACKEND_URL}/api/tasks/${targetPatientId}`);
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          if (Array.isArray(tasksData.tasks)) {
            serverTasks = tasksData.tasks;
          }
        }
      } catch (_) {}

      if (serverTasks.length > 0) {
        const mappedTasks: RoutineItem[] = serverTasks.map(t => {
          const time = t.scheduled_time || t.scheduledTime || '08:00';
          const isDone = completedMap.has(t.id) ? Boolean(completedMap.get(t.id)) : Boolean(t.is_completed_today);
          return {
            id: t.id,
            time,
            displayTime: formatTimeToDisplay(time),
            title: t.title,
            friendlyPrompt: t.description ? `${t.title} — ${t.description}` : t.title,
            category: mapTaskTypeToCategory(t.type),
            completed: isDone,
            notes: t.description || '',
          };
        });

        // Also merge baseline items that don't collide
        const existingTitles = new Set(mappedTasks.map(m => m.title.toLowerCase()));
        const extraBaseline = INITIAL_ROUTINE_SCHEDULE
          .filter(item => !existingTitles.has(item.title.toLowerCase()))
          .map(item => ({
            ...item,
            completed: completedMap.has(item.id) ? Boolean(completedMap.get(item.id)) : false,
          }));

        const merged = [...mappedTasks, ...extraBaseline].sort((a, b) => {
          const [ha, ma] = (a.time || '08:00').split(':').map(Number);
          const [hb, mb] = (b.time || '08:00').split(':').map(Number);
          return (ha * 60 + ma) - (hb * 60 + mb);
        });

        setRoutineSchedule(merged);
      } else {
        setRoutineSchedule(INITIAL_ROUTINE_SCHEDULE.map(item => ({
          ...item,
          completed: completedMap.has(item.id) ? Boolean(completedMap.get(item.id)) : false,
        })));
      }
    } catch (err) {
      console.warn('Failed to load routine schedule:', err);
    }
  };

  useEffect(() => {
    loadRoutineAndTasks();

    const socket = getSocket(userId, 'patient', userName);
    const handleTaskUpdate = () => {
      loadRoutineAndTasks();
    };

    socket.on('patient:tasks:updated', handleTaskUpdate);
    socket.on('patient:task:completed', handleTaskUpdate);

    return () => {
      socket.off('patient:tasks:updated', handleTaskUpdate);
      socket.off('patient:task:completed', handleTaskUpdate);
    };
  }, [userId, targetPatientId]);

  const handleToggleRoutine = async (taskId: string, title: string) => {
    const currentItem = routineSchedule.find(item => item.id === taskId);
    const nextCompleted = !currentItem?.completed;

    // Optimistic UI update
    setRoutineSchedule(prev => prev.map(item => 
      item.id === taskId ? { ...item, completed: nextCompleted } : item
    ));

    try {
      // 1. If it's a scheduled caregiver task (starts with task_), sync completion
      if (nextCompleted && taskId.startsWith('task_')) {
        await fetch(`${BACKEND_URL}/api/tasks/${encodeURIComponent(taskId)}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: targetPatientId,
            completedBy: 'patient',
            notes: 'Completed from daily routine',
          }),
        }).catch(() => {});
      }

      // 2. Persist to /api/user/:userId/routine/toggle and notify caregivers
      await fetch(`${BACKEND_URL}/api/user/${userId}/routine/toggle`, {
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
    setPreferences(prev => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem('neuronova_display_preferences', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const handleSelectCard = (cardId: string, title: string, description: string) => {
    const nameParam = encodeURIComponent(userName);
    const userParam = encodeURIComponent(userId);
    const roleParam = encodeURIComponent(session.role);

    if (cardId === 'music') {
      window.location.href = `${NEUROMUSIC_URL}/?userId=${userParam}&name=${nameParam}&role=${roleParam}`;
      return;
    }
    if (cardId === 'games') {
      window.location.href = `${NEUROGAMES_URL}/?userId=${userParam}&name=${nameParam}&role=${roleParam}`;
      return;
    }
    if (cardId === 'vault') {
      window.location.href = `${NEUROGAMES_URL}/?game=vault&userId=${userParam}&name=${nameParam}&role=${roleParam}`;
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
        className={`min-h-screen w-full relative text-[#1A202C] flex flex-col justify-between font-brand-body transition-opacity duration-700 ease-out ${
          isMounted ? 'opacity-100' : 'opacity-0'
        } ${getFontSizeClass()} ${
          preferences.highContrast ? 'high-contrast' : ''
        }`}
      >
        {/* Living Organic Unblur Background: White blur with dynamic stretching unblur droplet following cursor */}
        <OrganicUnblurBackground imageSrc="/meadow-bg.png" />

        {/* 1. Header with Time Greeting, Temporal Date, and Settings */}
        <div className="relative z-30">
          <GreetingHeader
            userName={userName}
            onOpenSettings={() => setIsAccessibilityOpen(true)}
            onOpenLanguage={() => window.dispatchEvent(new CustomEvent('neuronova:open-language-modal'))}
          />
        </div>

        {/* 2. Main Content Container */}
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 md:px-12 py-6 sm:py-8 flex-grow flex flex-col gap-6 sm:gap-8 relative z-10">
          
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

        {/* 3. Subtle, Compact Warm Glass Footer */}
        <footer className="w-full border-t border-[#E8DFD1]/50 bg-[#FAF7F2]/60 backdrop-blur-sm py-2.5 sm:py-3 pb-14 sm:pb-16 px-4 text-center text-[#1A202C]/50 shadow-2xs">
          <p className="text-[11px] sm:text-xs font-normal tracking-wide">
            {t.footer.companionNote}
          </p>
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

export const App: React.FC = () => {
  const [session, setSession] = useState<UserSession>(() => fetchLoggedInUserSession());

  useEffect(() => {
    const handleStorage = () => {
      setSession(fetchLoggedInUserSession());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <LanguageProvider userId={session.userId}>
      <PatientHomeContent session={session} />
    </LanguageProvider>
  );
};

export default App;
