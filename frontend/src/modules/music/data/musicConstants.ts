import { MoodOption, MusicGenre, Track, FormativeEra } from '../types';

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'peaceful',
    label: 'Peaceful & Calm',
    sublabel: 'A gentle, steady heart',
    emoji: '🌸',
    colorBg: 'bg-forest-50',
    colorBorder: 'border-forest-300 hover:border-forest-600',
    colorText: 'text-forest-900',
  },
  {
    id: 'nostalgic',
    label: 'Warm & Reminiscent',
    sublabel: 'Fond memories of earlier times',
    emoji: '🌅',
    colorBg: 'bg-terracotta-50',
    colorBorder: 'border-terracotta-300 hover:border-terracotta-600',
    colorText: 'text-terracotta-900',
  },
  {
    id: 'reflective',
    label: 'Quiet & Thoughtful',
    sublabel: 'Reflective and contemplative',
    emoji: '🍃',
    colorBg: 'bg-muga-50',
    colorBorder: 'border-muga-300 hover:border-muga-600',
    colorText: 'text-muga-900',
  },
  {
    id: 'weary',
    label: 'A Little Tired',
    sublabel: 'Seeking soothing rest and ease',
    emoji: '☕',
    colorBg: 'bg-cream-100',
    colorBorder: 'border-cream-300 hover:border-cream-400',
    colorText: 'text-charcoal-900',
  },
];

export const GENRE_OPTIONS: MusicGenre[] = [
  {
    id: 'all',
    label: 'All Era Melodies',
    tagline: 'Balanced mix of golden songs & calming sitar',
  },
  {
    id: 'bollywood_golden',
    label: 'Golden Era Classics',
    tagline: 'Timeless melodies of Rafi, Kishore & Lata',
  },
  {
    id: 'sitar_instrumental',
    label: 'Sitar & Meditative Ragas',
    tagline: 'Peaceful acoustic strings and flute',
  },
  {
    id: 'regional_folk',
    label: 'Regional Folk & Nostalgia',
    tagline: 'Assamese, Bengali, and heartland folk tunes',
  },
  {
    id: 'devotional_hymns',
    label: 'Devotional Hymns & Bhajans',
    tagline: 'Soulful morning prayers and timeless chants',
  },
];

export const AGE_PRESETS = [65, 70, 75, 80, 85];

export function calculateFormativeEra(age: number, currentYear = 2026): FormativeEra {
  const safeAge = Math.max(50, Math.min(105, age || 74));
  const birthYear = currentYear - safeAge;
  const formativeStartYear = birthYear + 15;
  const formativeEndYear = birthYear + 22;
  const formativeMid = Math.round((formativeStartYear + formativeEndYear) / 2);
  const decadeYear = Math.floor(formativeMid / 10) * 10;
  const decade = `${decadeYear}s`;

  return {
    age: safeAge,
    birthYear,
    formativeStartYear,
    formativeEndYear,
    decade,
  };
}

export const FALLBACK_TRACKS: Track[] = [
  {
    id: 'Wvl_K8VC9C4',
    title: 'Peaceful Sitar & Tanpura Meditation - Calming Mind & Soul',
    channelTitle: 'Shanti Instrumentals',
    artistOrChannel: 'Shanti Instrumentals',
    thumbnailUrl: 'https://i.ytimg.com/vi/Wvl_K8VC9C4/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/Wvl_K8VC9C4/hqdefault.jpg',
    decade: '1970s',
    era: '1970s',
    genre: 'sitar_instrumental',
    durationMinutes: 34.85,
    durationSeconds: 2091,
    formattedDuration: '34:51',
  },
  {
    id: 'IChON6RgY_s',
    title: 'Sitar for Overthinkers | Indian Classical Meditation Music for Mental Stillness',
    channelTitle: 'Shanti Instrumentals',
    artistOrChannel: 'Shanti Instrumentals',
    thumbnailUrl: 'https://i.ytimg.com/vi/IChON6RgY_s/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/IChON6RgY_s/hqdefault.jpg',
    decade: '1970s',
    era: '1970s',
    genre: 'sitar_instrumental',
    durationMinutes: 43.02,
    durationSeconds: 2581,
    formattedDuration: '43:01',
  },
  {
    id: 'c6x8eSUbsRQ',
    title: '70s Evergreen Nostalgic Classics - Kishore Kumar & Lata Mangeshkar',
    channelTitle: 'Old Hindi Songs',
    artistOrChannel: 'Old Hindi Songs',
    thumbnailUrl: 'https://i.ytimg.com/vi/c6x8eSUbsRQ/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/c6x8eSUbsRQ/hqdefault.jpg',
    decade: '1970s',
    era: '1970s',
    genre: 'bollywood_golden',
    durationMinutes: 123.82,
    durationSeconds: 7429,
    formattedDuration: '2:03:49',
  },
  {
    id: 'TYbaOdqWMUQ',
    title: 'Golden 70s Bollywood Melodies - Rafi, Kishore, Lata',
    channelTitle: 'Gaane 70s 80s',
    artistOrChannel: 'Gaane 70s 80s',
    thumbnailUrl: 'https://i.ytimg.com/vi/TYbaOdqWMUQ/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/TYbaOdqWMUQ/hqdefault.jpg',
    decade: '1970s',
    era: '1970s',
    genre: 'bollywood_golden',
    durationMinutes: 75.78,
    durationSeconds: 4547,
    formattedDuration: '1:15:47',
  },
  {
    id: '6Jfq4s-gTzg',
    title: 'Morning Sitar & Flute Raga - Peaceful Awakening',
    channelTitle: 'Indian Soul Meditation Music',
    artistOrChannel: 'Indian Soul Meditation Music',
    thumbnailUrl: 'https://i.ytimg.com/vi/6Jfq4s-gTzg/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/6Jfq4s-gTzg/hqdefault.jpg',
    decade: '1960s',
    era: '1960s',
    genre: 'sitar_instrumental',
    durationMinutes: 70.03,
    durationSeconds: 4202,
    formattedDuration: '1:10:02',
  },
  {
    id: '80HDZa7sELo',
    title: 'Spiritual Mornings With Bhakti Instrumentals (Flute & Sitar)',
    channelTitle: 'Strumm Spiritual',
    artistOrChannel: 'Strumm Spiritual',
    thumbnailUrl: 'https://i.ytimg.com/vi/80HDZa7sELo/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/80HDZa7sELo/hqdefault.jpg',
    decade: '1970s',
    era: '1970s',
    genre: 'devotional_hymns',
    durationMinutes: 99.57,
    durationSeconds: 5974,
    formattedDuration: '1:39:34',
  },
  {
    id: '1ghGNd5U3jM',
    title: 'Tu Pyar Ka Sagar Hai - Sitar, Flute & Santoor Meditative Ensemble',
    channelTitle: 'Dr. Kumar Amit Spiritual',
    artistOrChannel: 'Dr. Kumar Amit Spiritual',
    thumbnailUrl: 'https://i.ytimg.com/vi/1ghGNd5U3jM/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/1ghGNd5U3jM/hqdefault.jpg',
    decade: '1970s',
    era: '1970s',
    genre: 'regional_folk',
    durationMinutes: 4.48,
    durationSeconds: 269,
    formattedDuration: '4:29',
  },
  {
    id: 'gF0T4GQWc5g',
    title: 'Govind Bolo Hari Gopal Bolo - Peaceful Instrumental Rhythms',
    channelTitle: 'Dr. Kumar Amit Spiritual',
    artistOrChannel: 'Dr. Kumar Amit Spiritual',
    thumbnailUrl: 'https://i.ytimg.com/vi/gF0T4GQWc5g/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/gF0T4GQWc5g/hqdefault.jpg',
    decade: '1960s',
    era: '1960s',
    genre: 'devotional_hymns',
    durationMinutes: 21.0,
    durationSeconds: 1260,
    formattedDuration: '21:00',
  },
  {
    id: 'oSkbkxlMurA',
    title: 'Lata Mangeshkar & Kishore Kumar - Gentle Heartwarming Duets',
    channelTitle: 'Old Hindi Songs Archive',
    artistOrChannel: 'Old Hindi Songs Archive',
    thumbnailUrl: 'https://i.ytimg.com/vi/oSkbkxlMurA/hqdefault.jpg',
    thumbnail: 'https://i.ytimg.com/vi/oSkbkxlMurA/hqdefault.jpg',
    decade: '1980s',
    era: '1980s',
    genre: 'bollywood_golden',
    durationMinutes: 76.8,
    durationSeconds: 4608,
    formattedDuration: '1:16:48',
  },
];

