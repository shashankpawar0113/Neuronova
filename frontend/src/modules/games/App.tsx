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
function getInitialView(): GameType | 'hub' | 'sequential' {
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'sequential' || params.get('sequential') === 'true') {
    return 'sequential';
  }
  const game = params.get('game');
  if (game === 'vault') return 'vault';
  if (game === 'sequential') return 'sequential';
  if (game && ['memoryMatch', 'attentionGame', 'sequenceRecall', 'culturalGame', 'dailyRoutineRecall'].includes(game)) {
    return game as GameType;
  }
  if (window.location.pathname.includes('/vault')) return 'vault';
  return 'hub';
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<GameType | 'hub' | 'sequential'>(getInitialView);

  const goHub = () => {
    setCurrentView('hub');
    const params = new URLSearchParams(window.location.search);
    params.delete('game');
    params.delete('mode');
    params.delete('sequential');
    const qs = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState({}, '', `/games${qs}`);
  };

  const selectGame = (id: GameType | 'sequential') => {
    setCurrentView(id as any);
    const params = new URLSearchParams(window.location.search);
    if (id === 'sequential') {
      params.set('mode', 'sequential');
      params.delete('game');
    } else {
      params.set('game', id);
      params.delete('mode');
    }
    const qs = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState({}, '', `/games${qs}`);
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
