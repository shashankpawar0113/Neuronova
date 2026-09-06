export type MoodType = 'peaceful' | 'nostalgic' | 'reflective' | 'weary';

export interface MoodOption {
  id: MoodType;
  label: string;
  sublabel: string;
  emoji: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
}

export interface FormativeEra {
  age: number;
  birthYear: number;
  formativeStartYear: number; // Age 15
  formativeEndYear: number;   // Age 22
  decade: string;            // e.g. "1970s"
}

export type MusicGenreKey = 
  | 'all'
  | 'bollywood_golden'
  | 'sitar_instrumental'
  | 'regional_folk'
  | 'devotional_hymns';

export interface MusicGenre {
  id: MusicGenreKey;
  label: string;
  tagline: string;
}

export interface Track {
  id: string; // YouTube Video ID
  title: string;
  artistOrChannel?: string;
  channelTitle?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  decade?: string;
  era?: string;
  genre: string;
  durationMinutes: number;
  durationSeconds?: number;
  formattedDuration?: string;
}


export interface MusicSessionState {
  step: 'pre_checkin' | 'era_select' | 'active_session' | 'post_checkin' | 'completed';
  preMood: MoodType | null;
  postMood: MoodType | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  elapsedSeconds: number;
  targetDurationMinutes: number; // Default 30 minutes
  sessionsCompletedThisWeek: number;
}
