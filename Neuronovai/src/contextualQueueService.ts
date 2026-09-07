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
  // 1. Haryanvi Folk, Desi Beats & Regional Energetic Hits (e.g. Masoom Sharma, Gulzaar, Renuka Panwar)
  {
    matches: /\b(haryanv?i|ragni|masoom\s+sharma|gulzaar\s+chhaniwala|diler\s+kharkiya|renuka\s+panwar|khasa\s+aala|sumit\s+goswami|raju\s+punjabi|sapna\s+choudhary|ajay\s+hooda|amit\s+saini|pranjal\s+dahiya|ruchika\s+jangid|lofar|bahu\s+kale\s+ki|52\s+gaj|kd\s+desi\s+rock|md\s+kd|vicky\s+kajla|bintu\s+pabra|pinna\s+music|sky\s+high\s+music|desi\s+records)\b/i,
    profile: {
      vibeLabel: 'Haryanvi Hits & Desi Beats',
      genre: 'haryanvi_regional',
      mood: 'energetic',
      sampleQueries: [
        'Masoom Sharma hit songs',
        'Gulzaar Chhaniwala top songs',
        'Renuka Panwar hit songs',
        'Diler Kharkiya hit songs',
        'Khasa Aala Chahar top songs',
        'Sumit Goswami hit songs',
        'Raju Punjabi popular songs',
        '52 Gaj Ka Daman Renuka Panwar song',
        'Bahu Kale Ki Ajay Hooda song',
        'Sapna Choudhary dance song',
      ],
    },
  },

  // 2. Punjabi Folk, Pop & Bhangra (e.g. Diljit Dosanjh, Sidhu Moosewala, Karan Aujla, AP Dhillon)
  {
    matches: /\b(punjabi|bhangra|diljit\s+dosanjh|sidhu\s+moose\s*wala|karan\s+aujla|ap\s+dhillon|amrinder\s+gill|gurdas\s+maan|sharry\s+maan|jassi\s+gill|babbu\s+maan|kuldeep\s+manak|harrdy\s+sandhu|ammy\s+virk|b\s+praak|jaani|shubh|jordan\s+sandhu|tarsem\s+jassar|speed\s+records|geet\s+mp3|white\s+hill)\b/i,
    profile: {
      vibeLabel: 'Punjabi Hits & Bhangra Beats',
      genre: 'punjabi_regional',
      mood: 'energetic',
      sampleQueries: [
        'Diljit Dosanjh hit songs',
        'Karan Aujla top songs',
        'Sidhu Moose Wala top tracks',
        'AP Dhillon popular songs',
        'Amrinder Gill popular songs',
        'Harrdy Sandhu hit songs',
        'Ammy Virk popular songs',
        'Gurdas Maan classic songs',
      ],
    },
  },

  // 3. Bollywood Dance & High-Energy Party Hits (e.g. Badshah, Honey Singh, Neha Kakkar)
  {
    matches: /\b(party\s+song|dance\s+song|club\s+mix|dj\s+party|banger|kala\s+chashma|kar\s+gayi\s+chull|aankh\s+marey|party\s+all\s+night|nachde\s+ne\s+saare|london\s+thumakda|badshah|honey\s+singh|yo\s+yo|neha\s+kakkar|mika\s+singh|tony\s+kakkar|sukhwinder|daler\s+mehndi|tunak\s+tunak)\b/i,
    profile: {
      vibeLabel: 'Bollywood Dance & Party Hits',
      genre: 'bollywood_dance',
      mood: 'celebratory',
      sampleQueries: [
        'Kala Chashma Baar Baar Dekho song',
        'Kar Gayi Chull Kapoor and Sons song',
        'Aankh Marey Simmba song',
        'Abhi Toh Party Shuru Hui Hai Badshah song',
        'London Thumakda Queen song',
        'Gallan Goodiyaan Dil Dhadakne Do song',
        'Dil Chori Yo Yo Honey Singh song',
        'Makhna Drive song',
      ],
    },
  },

  // 4. Bhojpuri Hits & Desi Energy
  {
    matches: /\b(bhojpuri|pawan\s+singh|khesari\s+lal|nirahua|dinesh\s+lal|akshara\s+singh|choliya|lollypop\s+lagelu|kamariya|bhojpuriya)\b/i,
    profile: {
      vibeLabel: 'Bhojpuri Hits & Desi Energy',
      genre: 'bhojpuri_regional',
      mood: 'energetic',
      sampleQueries: [
        'Pawan Singh top hit songs',
        'Khesari Lal Yadav popular songs',
        'Lollypop Lagelu Pawan Singh song',
        'Nirahua top Bhojpuri songs',
        'Bhojpuri superhit dance songs',
      ],
    },
  },

  // 5. Rajasthani / Marwadi Folk & Traditional
  {
    matches: /\b(rajasthani|marwadi|ghoomar|choudhary|kesariya\s+balam|seema\s+mishra|prakash\s+mali|mame\s+khan)\b/i,
    profile: {
      vibeLabel: 'Rajasthani Folk & Traditional',
      genre: 'rajasthani_folk',
      mood: 'festive',
      sampleQueries: [
        'Kesariya Balam Rajasthani folk song',
        'Ghoomar Padmavat Rajasthani song',
        'Choudhary Amit Trivedi Mame Khan song',
        'Banna Re Baga Mein Rajasthani song',
        'Prakash Mali Rajasthani bhajan song',
      ],
    },
  },

  // 6. Sad / Melancholic / Heartbreak Hindi Ballads (e.g. "Ahista", "Channa Mereya", "Agar Tum Saath Ho")
  {
    matches: /\b(laila\s+majnu|ahista|agar\s+tum\s+saath\s+ho|channa\s+mereya|kabira|bekhayali|hamari\s+adhuri|phir\s+le\s+aya|tujhe\s+kitna|duaa|dard|judai|alvida|tadap|tanhai|bewafa|sad\s+song|breakup|heartbreak|melancholy|cry|pain|dard\s+bhare)\b/i,
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

  // 7. Modern Bollywood Romance & Soulful (Arijit Singh, Atif Aslam, Shreya Ghoshal, etc.)
  {
    matches: /\b(arijit\s+singh|atif\s+aslam|shreya\s+ghoshal|jubin\s+nautiyal|mohit\s+chauhan|armaan\s+malik|darshan\s+raval|prateek\s+kuhad|anuv\s+jain|jasleen\s+royal|kesariya|tum\s+hi\s+ho|shayad|raataan\s+lambiyan|hawayein|zaalima|tere\s+hawaale|apna\s+bana\s+le|pee\s+loon)\b/i,
    profile: {
      vibeLabel: 'Soulful Bollywood Romance',
      genre: 'bollywood_romantic',
      mood: 'romantic',
      sampleQueries: [
        'Kesariya Brahmastra song',
        'Raataan Lambiyan Shershaah song',
        'Tum Hi Ho Aashiqui 2 song',
        'Hawayein Jab Harry Met Sejal song',
        'Apna Bana Le Bhediya song',
        'Tere Hawaale Laal Singh Chaddha song',
        'Shayad Love Aaj Kal song',
        'Zaalima Raees song',
      ],
    },
  },

  // 8. Kishore Kumar 70s Classics & Vintage Melodies (e.g. "Kiska Rasta Dekhe", "Pal Pal Dil Ke Paas")
  {
    matches: /\b(kishore\s+kumar|kiska\s+rasta|pal\s+pal\s+dil|chookar\s+mere\s+man|yeh\s+jeevan|o\s+mere\s+dil|aanewala\s+pal|mere\s+sapno\s+ki|musafir\s+hoon|zindagi\s+ka\s+safar|diye\s+jalte|70s|80s|r\.?d\.?\s+burman|pancham|lata\s+mangeshkar|mohammed\s+rafi|asha\s+bhosle|mukesh)\b/i,
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

  // 9. Soulful Ghazals (Jagjit Singh, Pankaj Udhas, Mehdi Hassan)
  {
    matches: /\b(ghazal|jagjit\s+singh|pankaj\s+udhas|mehdi\s+hassan|ghulam\s+ali|chitti\s+aayi|hothon\s+se|woh\s+kagaz|jhuki\s+jhuki|hazaron\s+khwahishen|chandan\s+sa|gulzar|shayari)\b/i,
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

  // 10. 90s Bollywood Golden Romance (Kumar Sanu, Alka Yagnik, Udit Narayan, Sonu Nigam)
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

  // 11. Devotional & Spiritual Peace (Bhajans, Mantras, Chants, Sufi)
  {
    matches: /\b(bhajan|aarti|kirtan|mantra|krishna|ram|shiva|devi|spiritual|sufi|kun\s+faya|khwaja\s+mere|arziyan|chaap\s+tilak|kailash\s+kher|nusrat|anup\s+jalota)\b/i,
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

  // 12. Classical Sitar, Flute, Instrumental & Meditation
  {
    matches: /\b(sitar|flute|raga|raag|tanpura|instrumental|meditation|overthinker|peaceful\s+sitar|calm|zen|relaxation|santoor|shehnai)\b/i,
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

  // 13. Global Acoustic & Gentle Pop (e.g. Dhruv, Ed Sheeran, The Weeknd)
  {
    matches: /\b(double\s+take|dhruv|ed\s+sheeran|weeknd|the\s+weeknd|taylor\s+swift|coldplay|acoustic|pop|r&b|english|western|billie\s+eilish|bruno\s+mars|shaboozey|eminem|dua\s+lipa)\b/i,
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
 * Parses raw title and artist strings to identify clean song name and lead performer.
 * Cleans out video markers, record label channel names, and parenthetical metadata.
 */
export function extractArtistAndSong(
  title: string,
  artist: string = ''
): { detectedSong: string; detectedArtist: string } {
  const raw = (title || '').trim();

  // Split by pipe '|' or forward slash '/'
  const pipeParts = raw.split(/[|/]/).map((p) => p.trim()).filter(Boolean);
  const primary = pipeParts[0] || raw;

  // Remove parenthetical video markers from primary, e.g. (Official Video), [Official Audio]
  const beforeParen = primary.split(/[\(\[]/)[0].trim();

  let detectedSong = beforeParen || raw;
  let detectedArtist = (artist || '').trim();

  // 1. If primary contains " - ", e.g. "Lofar - Masoom Sharma" or "Diljit Dosanjh - Born to Shine"
  if (beforeParen.includes(' - ')) {
    const parts = beforeParen.split(' - ');
    detectedSong = parts[0].trim();
    detectedArtist = parts.slice(1).join(' - ').trim();
  }

  // 2. If the provided artist is a generic label/channel or empty, check pipe parts
  const isGenericChannel = /topic|vevo|records|music|company|series|audio|official|films|channel|studio|tv/i.test(detectedArtist);
  if (isGenericChannel || !detectedArtist) {
    for (let i = 1; i < pipeParts.length; i++) {
      const p = pipeParts[i].replace(/[\(\[].*?[\)\]]/g, '').trim();
      if (
        p &&
        !/records|music|company|series|audio|official|trailer|teaser|full\s+song|lyric|video|hd|4k|song/i.test(p) &&
        p.length < 35
      ) {
        detectedArtist = p;
        break;
      }
    }
  }

  // Clean trailing noise from detected artist
  detectedArtist = detectedArtist
    .replace(/\b(official\s+video|official\s+audio|video\s+song|full\s+song|music)\b/gi, '')
    .trim();

  return { detectedSong, detectedArtist };
}

/**
 * Uses fast heuristic pattern matching and artist spotlighting to find a matching cluster profile.
 * Never blindly defaults to 1970s Kishore Kumar ballads for modern or regional music.
 */
function findHeuristicProfile(songTitle: string, artist: string = ''): SongMoodProfile {
  const combinedText = `${songTitle} ${artist}`.trim();
  const { detectedSong, detectedArtist } = extractArtistAndSong(songTitle, artist);

  // 1. Check curated genre clusters first
  for (const item of CURATED_MOOD_PROFILES) {
    if (item.matches.test(combinedText)) {
      // If we identified a specific singer/artist, customize the vibeLabel and top queries!
      if (detectedArtist && !/records|music|company|channel|official|topic|vevo/i.test(detectedArtist)) {
        const cleanArtistName = detectedArtist.trim();
        const existingLabel = item.profile.vibeLabel;
        const alreadyHasArtist = new RegExp(cleanArtistName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(existingLabel);
        const dynamicLabel = alreadyHasArtist ? existingLabel : `${cleanArtistName} & ${existingLabel}`;

        const otherQueries = item.profile.sampleQueries.filter(
          (q) => !q.toLowerCase().includes(cleanArtistName.toLowerCase())
        );

        return {
          ...item.profile,
          vibeLabel: dynamicLabel,
          sampleQueries: [
            `${cleanArtistName} hit songs`,
            `${cleanArtistName} top songs`,
            `${cleanArtistName} popular tracks`,
            ...otherQueries.slice(0, 5),
          ],
        };
      }
      return item.profile;
    }
  }

  // 2. If no genre cluster matched, but we have a valid artist -> Spotlight that artist!
  // This guarantees we NEVER fall back to Kishore Kumar 70s for modern/regional songs
  if (detectedArtist && !/records|music|company|channel|official|topic|vevo/i.test(detectedArtist)) {
    return {
      vibeLabel: `More from ${detectedArtist}`,
      genre: 'artist_spotlight',
      mood: 'similar_vibe',
      sampleQueries: [
        `${detectedArtist} hit songs`,
        `${detectedArtist} top tracks`,
        `${detectedArtist} popular songs`,
        `${detectedArtist} latest song`,
        `${detectedSong} ${detectedArtist} song`,
        `${detectedArtist} songs`,
      ],
    };
  }

  // 3. True generic fallback (uses clean title, NOT Kishore 70s unless title implies retro)
  return {
    vibeLabel: 'Recommended Hits & Melodies',
    genre: 'popular_hits',
    mood: 'uplifting',
    sampleQueries: [
      `${detectedSong} song`,
      `${detectedSong} official track`,
      'Top Trending Hits song',
      'Popular Melodic Hits song',
      'Latest Superhit songs',
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
    const profile = findHeuristicProfile(songTitle, artist);
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
        const searchRes = await searchYouTubeMusic('all', 'all', undefined, query);
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
