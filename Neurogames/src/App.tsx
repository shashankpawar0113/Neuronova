import React, { useState } from 'react';
import { GamesHub } from './games/GamesHub';
import { MemoryMatchGame } from './games/MemoryMatchGame';
import { AttentionGame } from './games/AttentionGame';
import { SequenceRecallGame } from './games/SequenceRecallGame';
import { CulturalGame } from './games/CulturalGame';
import { DailyRoutineRecallGame } from './games/DailyRoutineRecallGame';
import { MemoryVaultHub } from './games/MemoryVaultHub';
import { SequentialGameSessionController } from './components/SequentialGameSessionController';
import { GameType } from './types';

// Determine initial view from URL path / query param
// e.g. / → hub, /?game=vault → vault, /?mode=sequential → sequential
function getInitialView(): GameType | 'hub' | 'sequential' {
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'sequential' || params.get('sequential') === 'true') {
    return 'sequential';
  }
  const game = params.get('game');
  if (game === 'vault') return 'vault';
  if (game === 'sequential') return 'sequential';
  const path = window.location.pathname.replace('/', '').toLowerCase();
  if (path === 'vault') return 'vault';
  if (path === 'sequential') return 'sequential';
  return 'hub';
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<GameType | 'hub' | 'sequential'>(getInitialView);

  const goHub = () => {
    setCurrentView('hub');
    window.history.replaceState({}, '', '/');
  };

  const selectGame = (id: GameType | 'sequential') => {
    setCurrentView(id as any);
    if (id === 'sequential') {
      window.history.replaceState({}, '', `/?mode=sequential`);
    } else {
      window.history.replaceState({}, '', `/?game=${id}`);
    }
  };

  return (
    <div className="font-[Plus_Jakarta_Sans]">
      {currentView === 'hub' && <GamesHub onSelectGame={selectGame} />}
      {currentView === 'sequential' && <SequentialGameSessionController onExitToHub={goHub} />}
      {currentView === 'memoryMatch' && <MemoryMatchGame onBack={goHub} />}
      {currentView === 'attentionGame' && <AttentionGame onBack={goHub} />}
      {currentView === 'sequenceRecall' && <SequenceRecallGame onBack={goHub} />}
      {currentView === 'culturalGame' && <CulturalGame onBack={goHub} />}
      {currentView === 'dailyRoutineRecall' && <DailyRoutineRecallGame onBack={goHub} />}
      {currentView === 'vault' && <MemoryVaultHub onBack={goHub} />}
    </div>
  );
};

export default App;
