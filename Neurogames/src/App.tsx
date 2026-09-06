import React, { useState } from 'react';
import { GamesHub } from './games/GamesHub';
import { MemoryMatchGame } from './games/MemoryMatchGame';
import { AttentionGame } from './games/AttentionGame';
import { SequenceRecallGame } from './games/SequenceRecallGame';
import { CulturalGame } from './games/CulturalGame';
import { DailyRoutineRecallGame } from './games/DailyRoutineRecallGame';
import { MemoryVaultHub } from './games/MemoryVaultHub';
import { GameType } from './types';

// Determine initial view from URL path / query param
// e.g. localhost:5178/ → hub, localhost:5178/?game=vault → vault
function getInitialView(): GameType | 'hub' {
  const params = new URLSearchParams(window.location.search);
  const game = params.get('game');
  if (game === 'vault') return 'vault';
  const path = window.location.pathname.replace('/', '').toLowerCase();
  if (path === 'vault') return 'vault';
  return 'hub';
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<GameType | 'hub'>(getInitialView);

  const goHub = () => {
    setCurrentView('hub');
    window.history.replaceState({}, '', '/');
  };

  const selectGame = (id: GameType) => {
    setCurrentView(id);
    window.history.replaceState({}, '', `/?game=${id}`);
  };

  return (
    <div className="font-[Plus_Jakarta_Sans]">
      {currentView === 'hub' && <GamesHub onSelectGame={selectGame} />}
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
