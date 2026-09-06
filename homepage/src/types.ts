export type FontSizePreference = 'normal' | 'large' | 'xlarge';

export interface UserPreferences {
  fontSize: FontSizePreference;
  highContrast: boolean;
}

export interface RoutineItem {
  id: string;
  time: string;
  displayTime: string;
  title: string;
  friendlyPrompt: string;
  category: 'wake' | 'medicine' | 'meal' | 'hydration' | 'activity' | 'game' | 'family';
  completed: boolean;
  delayedUntil?: string;
  notes?: string;
}

export interface HeroCardItem {
  id: string;
  title: string;
  description: string;
  iconName: 'games' | 'routine' | 'vault' | 'music';
  colorTheme: 'forest' | 'teal' | 'gold' | 'terracotta';
  targetSection: string;
}
