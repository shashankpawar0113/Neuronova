import dotenv from 'dotenv';
import { CleanTrack, searchYouTubeMusic } from './youtubeClient.js';

dotenv.config();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_CANDIDATES = [
  process.env.OPENROUTER_MODEL || 'z-ai/glm-5.2:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'minimax/minimax-m3:free',
  'liquid/lfm-2.5-2.6b:free',
];

export interface ContextualQueueResult {
  vibeLabel: string;
  genre: string;
  mood: string;
  recommendedQueries: string[];
  tracks: CleanTrack[];
  source: 'ai_llm' | 'heuristic_engine';
}

interface SongMoodProfile {
  vibeLabel: string;
  genre: string;
  mood: string;
  sampleQueries: string[];
}

// Built-in intelligent mood & genre cluster matrix for instant offline resilience
const CURATED_MOOD_PROFILES: Array<{
  matches: RegExp;
  profile: SongMoodProfile;
}> = [
  // 1. Sad / Melancholic / Heartbreak Hindi Ballads (e.g. "Tum" from Laila Majnu, "Kabira", "Agar Tum Saath Ho")
  {
    matches: /\b(tum|laila\s+majnu|ahista|agar\s+tum\s+saath\s+ho|channa\s+mereya|kabira|bekhayali|hamari\s+adhuri|phir\s+le\s+aya|tujhe\s+kitna|duaa|dard|judai|alvida|tadap|tanhai|bewafa|sad\s+song|breakup|heartbreak|melancholy|cry|pain)\b/i,
    profile: {
      vibeLabel: 'Sad & Melancholic Ballads',
      genre: 'bollywood_sad',
      mood: 'melancholic',
      sampleQueries: [
        'Ahista Laila Majnu song',
        'Agar Tum Saath Ho Tamasha song',
        'Channa Mereya Arijit Singh song',
        'Hafiz Hafiz Laila Majnu song',
        'Phir Le Aya Dil Barfi song',
        'Kabira Yeh Jawaani Hai Deewani song',
        'Hamari Adhuri Kahani title track',
        'Tujhe Kitna Chahne Lage Kabir Singh song',
        'Duaa Shanghai Arijit Singh song',
        'O Saathi Atif Aslam Baaghi 2 song',
      ],
    },
  },

  // 2. Kishore Kumar 70s Classics & Vintage Melodies (e.g. "Kiska Rasta Dekhe", "Pal Pal Dil Ke Paas")
  {
    matches: /\b(kishore\s+kumar|kiska\s+rasta|pal\s+pal\s+dil|chookar\s+mere\s+man|yeh\s+jeevan|o\s+mere\s+dil|aanewala\s+pal|mere\s+sapno\s+ki|musafir\s+hoon|zindagi\s+ka\s+safar|diye\s+jalte|70s|r\.?d\.?\s+burman|pancham)\b/i,
    profile: {
      vibeLabel: 'Kishore Kumar 70s Classics',
      genre: 'vintage_70s',
      mood: 'nostalgic',
      sampleQueries: [
        'Chhookar Mere Man Ko Kishore Kumar song',
        'Yeh Jeevan Hai Kishore Kumar Piya Ka Ghar song',
        'O Mere Dil Ke Chain Kishore Kumar song',
        'Pal Pal Dil Ke Paas Kishore Kumar song',
        'Aanewala Pal Janewala Hai Golmaal song',
        'Musafir Hoon Yaaron Kishore Kumar song',
        'Mere Sapno Ki Rani Kishore Kumar song',
        'Zindagi Ka Safar Kishore Kumar Safar song',
        'Diye Jalte Hai Kishore Kumar Namak Haraam song',
        'Tere Bina Zindagi Se Koi Kishore Lata song',
      ],
    },
  },

  // 3. Soulful Ghazals (Jagjit Singh, Pankaj Udhas, Mehdi Hassan)
  {
    matches: /\b(ghazal|jagjit\s+singh|pankaj\s+udhas|mehdi\s+hassan|chitti\s+aayi|hothon\s+se|woh\s+kagaz|jhuki\s+jhuki|hazaron\s+khwahishen|chandan\s+sa|gulzar|shayari)\b/i,
    profile: {
      vibeLabel: 'Soulful Ghazals & Poetry',
      genre: 'ghazals',
      mood: 'reflective',
      sampleQueries: [
        'Hothon Se Chhoo Lo Tum Jagjit Singh song',
        'Woh Kagaz Ki Kashti Jagjit Singh song',
        'Jhuki Jhuki Si Nazar Jagjit Singh song',
        'Chitthi Aayi Hai Pankaj Udhas song',
        'Tum Ko Dekha To Yeh Khayal Aaya Jagjit Singh song',
        'Hazaron Khwahishen Aisi Jagjit Singh song',
        'Chandan Sa Badan Mukesh song',
        'Ranjish Hi Sahi Mehdi Hassan song',
      ],
    },
  },

  // 4. 90s Bollywood Golden Romance (Kumar Sanu, Alka Yagnik, Udit Narayan, Sonu Nigam)
  {
    matches: /\b(90s|kumar\s+sanu|alka\s+yagnik|udit\s+narayan|sonu\s+nigam|tujhe\s+dekha|mera\s+dil\s+bhi|pehla\s+nasha|tip\s+tip|bahon\s+ke|dhadkan|aashiqui|saajan)\b/i,
    profile: {
      vibeLabel: 'Golden 90s Romantic Melodies',
      genre: 'bollywood_90s',
      mood: 'romantic',
      sampleQueries: [
        'Tujhe Dekha Toh Yeh Jaana Sanam song',
        'Mera Dil Bhi Kitna Pagal Hai Saajan song',
        'Pehla Nasha Jo Jeeta Wohi Sikandar song',
        'Bahon Ke Darmiyan Khamoshi song',
        'Dheere Dheere Se Meri Zindagi Aashiqui song',
        'Tumse Milne Ki Tamanna Hai Saajan song',
        'Ae Mere Humsafar Qayamat Se Qayamat Tak song',
        'Chura Ke Dil Mera Main Khiladi Tu Anari song',
      ],
    },
  },

  // 5. Devotional & Spiritual Peace (Bhajans, Mantras, Chants, Sufi)
  {
    matches: /\b(bhajan|aarti|kirtan|mantra|krishna|ram|shiva|devi|spiritual|sufi|kun\s+faya|khwaja\s+mere|arziyan|chaap\s+tilak|kailash\s+kher|nusrat)\b/i,
    profile: {
      vibeLabel: 'Devotional & Spiritual Serenity',
      genre: 'devotional_spiritual',
      mood: 'peaceful',
      sampleQueries: [
        'Kun Faya Kun Rockstar A.R. Rahman song',
        'Arziyan Delhi 6 Javed Ali song',
        'Khwaja Mere Khwaja Jodhaa Akbar song',
        'Teri Deewani Kailash Kher song',
        'Achyutam Keshavam Krishna Bhajan Vikram Hazra',
        'Om Jai Jagdish Hare peaceful prayer',
        'Payoji Maine Ram Ratan Dhan Payo Anuradha Paudwal',
        'Chaap Tilak Sab Cheeni Abida Parveen',
      ],
    },
  },

  // 6. Classical Sitar, Flute, Instrumental & Meditation
  {
    matches: /\b(sitar|flute|raga|raag|tanpura|instrumental|meditation|overthinker|peaceful\s+sitar|calm|zen|relaxation)\b/i,
    profile: {
      vibeLabel: 'Indian Classical & Meditation Sounds',
      genre: 'classical_instrumental',
      mood: 'calming',
      sampleQueries: [
        'Peaceful Sitar & Tanpura Meditation',
        'Morning Sitar & Flute Raga Peaceful Awakening',
        'Indian Classical Flute Raga Yaman Meditation',
        'Deep Relaxation Santoor Instrumental Soundscape',
        'Sitar for Overthinkers Indian Classical',
        'Serene Tabla & Sitar Duet Classical Morning',
      ],
    },
  },

  // 7. Global Acoustic & Gentle Pop (e.g. Dhruv, Ed Sheeran, The Weeknd)
  {
    matches: /\b(double\s+take|dhruv|ed\s+sheeran|weeknd|taylor\s+swift|coldplay|acoustic|pop|r&b|english|western)\b/i,
    profile: {
      vibeLabel: 'Soothing Acoustic & Indie Melodies',
      genre: 'indie_acoustic',
      mood: 'chill',
      sampleQueries: [
        'Dhruv Double Take acoustic song',
        'Ed Sheeran Perfect acoustic version',
        'Coldplay Yellow acoustic guitar song',
        'Stephen Sanchez Until I Found You song',
        'Lauv I Like Me Better acoustic song',
        'Leon Bridges Texas Sun song',
      ],
    },
  },
];

/**
 * Uses fast heuristic pattern matching to find a matching cluster profile.
 */
function findHeuristicProfile(queryText: string): SongMoodProfile {
  for (const item of CURATED_MOOD_PROFILES) {
    if (item.matches.test(queryText)) {
      return item.profile;
    }
  }

  // General classic Bollywood fallback
  return {
    vibeLabel: 'Nostalgic Comfort Melodies',
    genre: 'nostalgia',
    mood: 'peaceful',
    sampleQueries: [
      'Pal Pal Dil Ke Paas Kishore Kumar song',
      'Lag Jaa Gale Lata Mangeshkar song',
      'Chookar Mere Man Ko Kishore Kumar song',
      'Chaudhvin Ka Chand Mohammed Rafi song',
      'Aanewala Pal Janewala Hai Kishore Kumar song',
      'Kabhi Kabhie Mere Dil Mein Mukesh song',
      'Ek Ajnabee Haseena Se Kishore Kumar song',
      'Hothon Se Chhoo Lo Tum Jagjit Singh song',
    ],
  };
}

/**
 * Calls OpenRouter to analyze the current song and recommend 8-10 related tracks matching its mood & genre.
 */
async function analyzeSongWithAI(
  songTitle: string,
  artist: string = ''
): Promise<{ vibeLabel: string; genre: string; mood: string; recommendedQueries: string[] } | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.includes('your_') || apiKey.trim() === '') {
    return null;
  }

  const prompt = `Analyze this song: "${songTitle}"${artist ? ` by "${artist}"` : ''}.
Determine its musical genre, emotion/mood (e.g., sad heartbreak ballad, joyful 70s retro romance, peaceful spiritual bhajan, melancholic acoustic, upbeat retro).
Recommend 8 to 10 distinct, real song tracks that belong to the EXACT same mood, genre, era, and musical flavor so the user can listen to an uninterrupted stream of similar music.

Respond ONLY with a valid JSON object matching this schema:
{
  "vibeLabel": "Short 3-5 word friendly mood title (e.g., 'Sad & Melancholic Ballads' or 'Kishore Kumar 70s Classics')",
  "genre": "one word genre key",
  "mood": "emotional tone (e.g., 'sad', 'romantic', 'peaceful', 'upbeat')",
  "recommendedSongs": [
    "Exact Song Title 1 - Artist Name",
    "Exact Song Title 2 - Artist Name"
  ]
}`;

  for (const model of MODEL_CANDIDATES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.replace(/[<>]/g, '').trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://neuronova.care',
          'X-Title': 'NeuroNova Contextual Queue Engine',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert musicologist and playlist curator specialized in Indian and global music psychology.',
            },
            { role: 'user', content: prompt },
          ],
          stream: false,
          temperature: 0.5,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const data = (await res.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      if (!content) continue;

      let cleaned = content.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleaned);
      if (parsed.vibeLabel && Array.isArray(parsed.recommendedSongs) && parsed.recommendedSongs.length > 0) {
        return {
          vibeLabel: parsed.vibeLabel,
          genre: parsed.genre || 'contextual',
          mood: parsed.mood || 'melodic',
          recommendedQueries: parsed.recommendedSongs.map((s: string) => `${s} song`),
        };
      }
    } catch (_) {
      continue;
    }
  }

  return null;
}

/**
 * Main public method: Takes a song title and artist, analyzes its musical soul/genre/mood,
 * and returns resolved, safe, playable CleanTrack items ready for Neuromusic's "Up Next" queue.
 */
export async function generateContextualQueue(
  songTitle: string,
  artist: string = ''
): Promise<ContextualQueueResult> {
  const combinedQuery = `${songTitle} ${artist}`.trim();

  // 1. Try AI-powered analysis with OpenRouter LLM first
  const aiResult = await analyzeSongWithAI(songTitle, artist);

  let vibeLabel = aiResult?.vibeLabel;
  let genre = aiResult?.genre || 'contextual';
  let mood = aiResult?.mood || 'melodic';
  let queriesToSearch: string[] = aiResult?.recommendedQueries || [];
  let source: 'ai_llm' | 'heuristic_engine' = 'ai_llm';

  // 2. Fall back to smart heuristic profile if LLM is unavailable or times out
  if (!aiResult || queriesToSearch.length === 0) {
    const profile = findHeuristicProfile(combinedQuery);
    vibeLabel = profile.vibeLabel;
    genre = profile.genre;
    mood = profile.mood;
    queriesToSearch = profile.sampleQueries;
    source = 'heuristic_engine';
  }

  // 3. Resolve track candidates using YouTube music search pipeline in parallel chunks
  const resolvedTracks: CleanTrack[] = [];
  const seenIds = new Set<string>();

  // Select top 6-8 distinct songs to query
  const targetQueries = queriesToSearch.slice(0, 8);

  await Promise.all(
    targetQueries.map(async (query) => {
      try {
        const searchRes = await searchYouTubeMusic('1970s', 'all', undefined, query);
        if (searchRes.tracks && searchRes.tracks.length > 0) {
          // Take the top verified clean track for this recommendation
          for (const track of searchRes.tracks) {
            if (!seenIds.has(track.id)) {
              seenIds.add(track.id);
              resolvedTracks.push(track);
              break;
            }
          }
        }
      } catch (_) {
        // Transient error for one song, other queries continue
      }
    })
  );

  return {
    vibeLabel: vibeLabel || 'Similar Therapeutic Melodies',
    genre,
    mood,
    recommendedQueries: targetQueries,
    tracks: resolvedTracks,
    source,
  };
}
