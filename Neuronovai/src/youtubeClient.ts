import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const LOGS_DIR = path.resolve(process.cwd(), 'logs');
try {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
} catch (_) {}
const SAFETY_LOG_PATH = path.join(LOGS_DIR, 'search_safety.log');

/**
 * Audit logger recording all search queries and blocked inappropriate content for caregiver/admin safety.
 */
export function logSafetyAudit(event: {
  timestamp?: string;
  type: 'EXPLICIT_BLOCKED' | 'SEARCH_QUERY' | 'MOVIE_BLOCKED' | 'DURATION_BLOCKED';
  query: string;
  videoId?: string;
  title?: string;
  channel?: string;
  reason?: string;
  cleanCount?: number;
}) {
  const entry = {
    timestamp: event.timestamp || new Date().toISOString(),
    ...event,
  };
  const line = JSON.stringify(entry) + '\n';
  try {
    fs.appendFileSync(SAFETY_LOG_PATH, line, 'utf8');
  } catch (_) {}
  if (event.type === 'EXPLICIT_BLOCKED') {
    console.warn(`[SAFETY AUDIT] 🚫 BLOCKED INAPPROPRIATE CONTENT: "${event.title}" from "${event.channel}" (ID: ${event.videoId}) | Reason: ${event.reason} | Query: "${event.query}"`);
  } else if (event.type === 'MOVIE_BLOCKED') {
    console.warn(`[SAFETY AUDIT] 🎬 BLOCKED FULL MOVIE/TRAILER: "${event.title}" from "${event.channel}" (ID: ${event.videoId}) | Reason: ${event.reason} | Query: "${event.query}"`);
  } else if (event.type === 'DURATION_BLOCKED') {
    console.warn(`[SAFETY AUDIT] ⏱️ BLOCKED OVER-LENGTH CONTENT: "${event.title}" from "${event.channel}" (ID: ${event.videoId}) | Reason: ${event.reason} | Query: "${event.query}"`);
  }
}

// ============================================================================
// CRITICAL PATIENT SAFETY BLOCKLISTS (Dementia Patient Protection)
// ============================================================================

// Known problematic channels uploading sexual, suggestive, or provocative visualizer tracks
export const BLOCKED_CHANNEL_PATTERNS = [
  'sxybit',
  'sxy',
  'sexy',
  'erotic',
  'sensual',
  'bikini',
  'lingerie',
  'babes',
  'hot model',
  'hot models',
  'onlyfans',
  'playboy',
  'nsfw',
  'adult music',
  'xxx',
  'strip',
  'stripper',
  'kiss scene',
  'bed scene',
  'romance scene',
  'hot girls',
  'hot girl',
  'lust',
  'seduction',
  'seductive',
  'erotica'
];

// Overtly explicit, sexual, suggestive, 18+, or inappropriate content terms (HARD REJECT)
export const EXPLICIT_CONTENT_TERMS = [
  'sxybit',
  'sxy',
  'sexy',
  'nsfw',
  '18+',
  'erotic',
  'erotica',
  'sensual',
  'sensuous',
  'bikini',
  'lingerie',
  'nude',
  'nudity',
  'naked',
  'sexual',
  'sex',
  'boobs',
  'boobies',
  'cleavage',
  'butt',
  'booty',
  'twerk',
  'twerking',
  'striptease',
  'stripper',
  'porn',
  'porno',
  'xxx',
  'strip club',
  'seduction',
  'seductive',
  'hot girl',
  'hot girls',
  'hot model',
  'hot models',
  'sensual dance',
  'bed scene',
  'kiss scene',
  'hot scene',
  'romance scene',
  'romantic scene',
  'love making',
  'lovemaking',
  'adult only',
  'uncensored',
  'unrated',
  'adult video',
  'onlyfans',
  'babe',
  'babes',
  'intimate scene',
  'steamy',
  'lust',
  'horny',
  'hentai',
  'ecchi',
  'escort',
  'fetish'
];

/**
 * Hard rejection check: returns true if content violates patient safety standards.
 */
export function checkExplicitContent(
  title: string,
  channel: string,
  desc: string = ''
): { blocked: boolean; reason?: string } {
  const t = (title || '').toLowerCase();
  const c = (channel || '').toLowerCase();
  const d = (desc || '').toLowerCase();

  // 1. Channel Blocklist check
  for (const b of BLOCKED_CHANNEL_PATTERNS) {
    if (c.includes(b)) {
      return { blocked: true, reason: `Channel blocklist match: "${b}"` };
    }
  }

  // 2. Explicit Terms check with word boundaries
  for (const term of EXPLICIT_CONTENT_TERMS) {
    const escaped = term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\W|_)${escaped}(?:$|\\W|_)`, 'i');
    if (regex.test(t)) {
      return { blocked: true, reason: `Explicit term in title: "${term}"` };
    }
    if (regex.test(c)) {
      return { blocked: true, reason: `Explicit term in channel: "${term}"` };
    }
    if (regex.test(d)) {
      return { blocked: true, reason: `Explicit term in description: "${term}"` };
    }
  }

  return { blocked: false };
}

// ============================================================================
// MOVIE & FEATURE-LENGTH EXCLUSION FILTER (Full Movies, Films, Trailers)
// ============================================================================

// Channels known to upload BOTH songs and full-length movies (e.g. major Bollywood labels)
// These channels must NOT be given uncritical trusted status and require strict title + duration checks
export const MIXED_CONTENT_LABEL_CHANNELS = [
  't-series',
  'tseries',
  'zee music company',
  'zee music',
  'yrf',
  'yash raj films',
  'sony music india',
  'sony music',
  'tips official',
  'tips films',
  'tips',
  'shemaroo',
  'shemaroo filmi gaane',
  'shemaroo movies',
  'venus',
  'venus movies',
  'rajshri',
  'eros now',
  'pen movies',
  'pen music',
  'goldmines',
  'ultra bollywood',
  'speed records'
];

// Full movie, film, trailer, and feature-length indicators for absolute hard exclusion
export const MOVIE_FEATURE_TITLE_MARKERS = [
  'full movie',
  'full film',
  'complete movie',
  'entire movie',
  'feature film',
  'hindi movie',
  'bollywood movie',
  'south movie',
  'blockbuster movie',
  'full hindi movie',
  'full bollywood movie',
  'official trailer',
  'official teaser',
  'trailer',
  'teaser',
  'sneak peek',
  'first look',
  'movie promo',
  'exclusive promo',
  'cinema',
  'box office'
];

/**
 * Hard rejection check: returns true if content is a full-length movie, trailer, or film feature.
 */
export function isMovieContent(
  title: string,
  desc: string = '',
  durationSeconds?: number
): { isMovie: boolean; reason?: string } {
  const t = (title || '').toLowerCase();
  const d = (desc || '').toLowerCase();

  // 1. Direct match for explicit movie / trailer phrases (HARD REJECT)
  for (const marker of MOVIE_FEATURE_TITLE_MARKERS) {
    const escaped = marker.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\W|_)${escaped}(?:$|\\W|_)`, 'i');
    if (regex.test(t)) {
      return { isMovie: true, reason: `Title matched movie/trailer indicator: "${marker}"` };
    }
  }

  // 2. Check for standalone "movie" or "film" if NOT part of a song reference
  // e.g. "YAARIYAN (Full Movie)" or "YAARIYAN Movie" -> reject
  // but "Yaariyan Movie Song" or "Song from the movie Yaariyan" -> allow
  const movieWordRegex = /(?:^|\W|_)(movie|film)(?:$|\W|_)/i;
  if (movieWordRegex.test(t)) {
    const isSongRef =
      /(?:movie|film)\s+(?:song|songs|track|tracks|audio|music|jukebox|theme)/i.test(t) ||
      /song\s+from\s+(?:the\s+)?(?:movie|film)/i.test(t) ||
      /(?:movie|film)\s*:\s*[a-zA-Z]/i.test(t) === false && /\b(song|audio|video song)\b/i.test(t);
    if (!isSongRef) {
      return { isMovie: true, reason: 'Title contains standalone movie/film term without song reference' };
    }
  }

  // 3. Check "(HD)" or "HD" when combined with movie/film context
  if (/\b\(hd\)\b|\bhd\b/i.test(t) && /\b(movie|film|cinema)\b/i.test(t)) {
    return { isMovie: true, reason: 'Title contains HD paired with movie/film context' };
  }

  // 4. "Full Video" rule:
  // Exclude if duration exceeds 10 minutes (600s), or if paired with movie context,
  // while preserving official 3-5 minute song music videos
  if (t.includes('full video')) {
    if (durationSeconds && durationSeconds > 600) {
      return { isMovie: true, reason: `Full Video exceeding 10 minutes (${(durationSeconds / 60).toFixed(1)} mins)` };
    }
    if (/\b(movie|film|cinema)\b/i.test(t) && !/\bsong\b/i.test(t)) {
      return { isMovie: true, reason: 'Full Video paired with movie context' };
    }
  }

  return { isMovie: false };
}

/**
 * Checks if content is a legitimate classical, devotional, or meditation track where longer durations are expected.
 */
export function isClassicalOrDevotionalContent(
  query: string = '',
  title: string = '',
  genre: string = '',
  channel: string = ''
): boolean {
  const combined = `${query} ${title} ${genre} ${channel}`.toLowerCase();
  const terms = [
    'raga', 'raag', 'sitar', 'classical', 'bhajan', 'meditation', 'instrumental',
    'mantra', 'tanpura', 'flute', 'bansuri', 'santoor', 'sarod', 'tabla',
    'veena', 'hindustani', 'carnatic', 'spiritual', 'shanti', 'dhyaan', 'aarti',
    'kirtan', 'devotional', 'chant', 'soundscapes'
  ];
  return terms.some((term) => combined.includes(term));
}

/**
 * Enforces maximum duration ceilings:
 * - General songs & manual search: 10 minutes (600 seconds)
 * - Classical / Raga / Devotional tracks: up to 60 minutes (3600 seconds)
 * - Absolute hard ceiling for ANY track: 60 minutes (3600 seconds)
 */
export function checkDurationAllowed(
  durationSeconds: number | undefined,
  query: string = '',
  title: string = '',
  genre: string = '',
  channel: string = ''
): { allowed: boolean; reason?: string } {
  if (!durationSeconds || durationSeconds <= 0) {
    return { allowed: true };
  }

  // Minimum floor: Reject ultra-short snippets, teasers, and shorts under 45 seconds
  if (durationSeconds < 45) {
    return {
      allowed: false,
      reason: `Track is a short snippet or teaser under 45 seconds (${durationSeconds}s)`,
    };
  }

  // Absolute hard ceiling across the system: 60 minutes
  if (durationSeconds > 3600) {
    return {
      allowed: false,
      reason: `Exceeds absolute ceiling of 60 minutes (${(durationSeconds / 60).toFixed(1)} mins)`,
    };
  }

  const isLongForm = isClassicalOrDevotionalContent(query, title, genre, channel);
  if (isLongForm) {
    // Classical / devotional allowed up to 60 minutes
    if (durationSeconds > 3600) {
      return {
        allowed: false,
        reason: `Classical/Devotional track exceeds 60-minute ceiling (${(durationSeconds / 60).toFixed(1)} mins)`,
      };
    }
    return { allowed: true };
  }

  // General songs & manual search ceiling: 10 minutes
  if (durationSeconds > 600) {
    return {
      allowed: false,
      reason: `Song exceeds 10-minute maximum duration ceiling (${(durationSeconds / 60).toFixed(1)} mins)`,
    };
  }

  return { allowed: true };
}

// ============================================================================
// ARCHITECTURAL & COMPLIANCE NOTE:
// YouTube ads cannot be blocked via the IFrame Player API. There is no public
// parameter to disable advertisements on third-party monetized videos without
// violating YouTube's Terms of Service.
//
// SEARCH OPTIMIZATION & MITIGATION PIPELINE:
// 1. Restrict all queries to videoCategoryId=10 (YouTube's "Music" category).
// 2. MANDATORY: safeSearch=strict on all search.list calls.
// 3. Multi-term exclusion & positive bias query terms.
// 4. Unified backend post-filtering:
//    - HARD REJECT: Discards any explicit, sexual, suggestive, or blocklisted channels.
//    - Deprioritize/reject off-topic results (dance covers, workout, tutorials, kids rhymes).
//    - Deprioritize/reject derivative content (remixes, mashups, fan covers, slowed, reactions).
//    - Strongly boost original official uploads (- Topic, VEVO, Official artist channels, major labels).
// 5. Preserve automated queue ad-deprioritization logic for background therapy sessions.
// ============================================================================

export interface CleanTrack {
  id: string; // YouTube videoId
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationMinutes: number;
  durationSeconds?: number;
  formattedDuration?: string;
  era: string;
  genre: string;
  adRiskScore?: number; // Automated queue ranking metric (higher = lower ad probability)
  rankingScore?: number; // Manual search ranking score (higher = higher relevance/originality)
  description?: string;
}

// 24-hour in-memory cache for search results
interface CacheEntry {
  tracks: CleanTrack[];
  timestamp: number;
}
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Channels statistically more likely to feature commercial pre-roll/mid-roll monetization (for automated queue)
const HIGH_MONETIZATION_CHANNELS = [
  't-series',
  'tseries',
  'vevo',
  'sony music',
  'zee music',
  'speed records',
  'tips official',
  'yrf',
  'yash raj',
  'eros now',
  'saregama music',
];

// Channels and genres statistically less likely to aggressively run commercial pre-rolls (for automated queue)
const LOW_MONETIZATION_INDICATORS = [
  'archive',
  'meditation',
  'shanti',
  'heritage',
  'classical',
  'soul',
  'calm',
  'healing',
  'spiritual',
  'raga',
  'folk',
  'instrumental',
  'soundscapes',
  'foundation',
  'traditional',
  'santoor',
  'flute',
  'sarod',
];

/**
 * Calculates a statistical score predicting lower ad probability for the automated therapeutic background queue.
 */
function scoreTrackForAdLikelihood(track: CleanTrack): number {
  let score = 100;
  const channel = (track.channelTitle || '').toLowerCase();
  const title = (track.title || '').toLowerCase();

  for (const label of HIGH_MONETIZATION_CHANNELS) {
    if (channel.includes(label)) {
      score -= 40;
      break;
    }
  }

  for (const indicator of LOW_MONETIZATION_INDICATORS) {
    if (channel.includes(indicator) || title.includes(indicator)) {
      score += 15;
    }
  }

  return score;
}

// ============================================================================
// UNIFIED SEARCH RELEVANCE & ORIGINAL-FIRST RANKING FILTER
// ============================================================================

// Off-topic content markers (dance tutorials, fitness workouts, nursery rhymes, kids cartoons)
const OFF_TOPIC_TITLE_MARKERS = [
  'dance cover', 'fitness dance', 'dance workout', 'zumba', 'tutorial',
  'how to play', 'how to dance', 'nursery rhyme', 'nursery rhymes', 'kids song',
  'kids songs', 'for kids', 'rhymes for kids', 'cartoon', 'shorts', 'workout',
  'choreo', 'choreography', 'aerobics', 'belly dance', 'easy dance steps',
  'step by step dance'
];

const OFF_TOPIC_DESC_MARKERS = [
  'fitness dance', 'dance workout', 'zumba', 'weight loss dance', 'kids rhymes',
  'nursery rhymes', 'for children', 'baby songs', 'toddler songs', 'kids animation'
];

/**
 * Strips conversational fluff and connective keywords to produce clean search targets.
 */
export function cleanSearchQuery(q: string): string {
  return (q || '')
    .replace(/\b(play|song|songs|gaana|geet|music|track|tracks|audio|video)\b/gi, ' ')
    .replace(/\b(from the movie|from movie|from the film|from film|from|by|of|ki|ka|ke)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Derivative, fake, cover, remake, live concert, and karaoke patterns (suppressed unless user explicitly asked)
export const DERIVATIVE_CONTENT_PATTERNS: RegExp[] = [
  /\bcover\b/i,
  /cover by/i,
  /covered by/i,
  /acoustic cover/i,
  /guitar cover/i,
  /piano cover/i,
  /vocal cover/i,
  /instrumental cover/i,
  /cvr by/i,
  /\bremake\b/i,
  /\btribute\b/i,
  /\bsinging\b/i,
  /\bunplugged\b/i,
  /\breprise\b/i,
  /\breprised\b/i,
  /\brendition\b/i,
  /\bmale version\b/i,
  /\bfemale version\b/i,
  /\blive\b/i,
  /live @/i,
  /live at/i,
  /live concert/i,
  /concert/i,
  /live performance/i,
  /\bremix\b/i,
  /\bmashup\b/i,
  /\bmedley\b/i,
  /slowed/i,
  /reverb/i,
  /8d audio/i,
  /8d/i,
  /bass boosted/i,
  /sped up/i,
  /speed up/i,
  /nightcore/i,
  /lofi/i,
  /lo-fi/i,
  /reaction/i,
  /reacts/i,
  /whatsapp status/i,
  /status video/i,
  /karaoke/i,
  /backing track/i,
];

// Major authentic record labels and publishers (massive original-first priority boost)
export const MAJOR_RECORD_LABELS = [
  'zee music company',
  'zee music',
  't-series',
  'tseries',
  'sony music india',
  'sony music',
  'sonymusic',
  'saregama',
  'yrf',
  'yash raj films',
  'tips official',
  'tips music',
  'tips films',
  'venus worldwide',
  'venus',
  'eros now',
  'speed records',
  'universal music india',
  'universal music',
  'times music',
  'ultra bollywood',
  'ultra music',
  'shemaroo filmi gaane',
  'shemaroo',
  'geet mp3',
  'white hill music',
  'svf music',
  'aditya music',
  'lahari music',
  'anand audio',
  'warner music india',
  'warner records',
  'columbia records',
  'interscope records',
  'republic records',
  'def jam',
  'atlantic records',
  'rca records',
  'epic records',
];

// Known-good trusted channels for therapy & original tracks (pure artist/archive channels)
const TRUSTED_ALLOWLIST_CHANNELS = [
  'saregama hindustani classical',
  'shanti instrumentals',
  'indian soul meditation music',
  'old hindi songs archive',
  'dr. kumar amit spiritual',
  'strumm spiritual',
  'theweekndvevo',
  'eminemvevo',
  'shaboozeyvevo',
  'ed sheeran'
];

/**
 * Parses ISO 8601 duration (e.g. PT4M24S, PT1H2M10S, PT52S) into total seconds.
 */
export function parseIsoDuration(duration?: string): number {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Parses MM:SS or HH:MM:SS string into total seconds.
 */
export function parseTimeString(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

/**
 * Formats total seconds into MM:SS or H:MM:SS.
 */
export function formatSecondsToTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export interface VideoDurationInfo {
  durationSeconds: number;
  durationMinutes: number;
  formattedDuration: string;
}

/**
 * Batches video IDs and calls YouTube Data API v3 videos.list endpoint
 * to retrieve the real duration for every video (costs only 1 quota unit per 50 IDs).
 */
export async function fetchYouTubeVideoDetails(
  videoIds: string[],
  apiKey: string
): Promise<Map<string, VideoDurationInfo>> {
  const result = new Map<string, VideoDurationInfo>();
  const cleanIds = Array.from(new Set(videoIds.filter((id) => Boolean(id && typeof id === 'string'))));
  if (cleanIds.length === 0 || !apiKey || apiKey.trim() === '' || apiKey.includes('your_')) return result;

  for (let i = 0; i < cleanIds.length; i += 50) {
    const chunk = cleanIds.slice(i, i + 50);
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.searchParams.set('part', 'contentDetails');
      url.searchParams.set('id', chunk.join(','));
      url.searchParams.set('key', apiKey.trim());

      const res = await fetch(url.toString(), { method: 'GET' });
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.items && Array.isArray(data.items)) {
          for (const item of data.items) {
            const vidId = item.id;
            const iso = item.contentDetails?.duration || '';
            const totalSec = parseIsoDuration(iso);
            if (totalSec > 0) {
              result.set(vidId, {
                durationSeconds: totalSec,
                durationMinutes: Number((totalSec / 60).toFixed(2)),
                formattedDuration: formatSecondsToTime(totalSec),
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('[NeuroNova YouTube] Failed to fetch video details chunk:', err.message || err);
    }
  }
  return result;
}

/**
 * Shared backend post-filtering and ranking pass.
 * Eliminates explicit content, full movies, trailers, off-topic videos, and over-length content
 * while boosting authentic original music releases across both manual search and automated queue.
 */
export function rankAndFilterSearchResults(
  rawItems: any[],
  userQuery: string,
  durationMap?: Map<string, VideoDurationInfo>,
  options?: { genre?: string; era?: string; isQueue?: boolean }
): CleanTrack[] {
  const cleanQ = (userQuery || '').toLowerCase().trim();
  const genre = options?.genre || (options?.isQueue ? 'therapy_queue' : 'search_result');
  const era = options?.era || 'search';
  const isQueue = Boolean(options?.isQueue);

  // 1. MANDATORY HARD SAFETY, MOVIE, AND DURATION PASS (Absolute Rejection)
  const safeCandidates = rawItems.filter((item) => {
    const title = decodeHtmlEntities(item.snippet?.title || '');
    const channel = decodeHtmlEntities(item.snippet?.channelTitle || '');
    const desc = decodeHtmlEntities(item.snippet?.description || '');
    const videoId = item.id?.videoId || item.id || '';

    // a) Explicit Patient Safety Check (HARD REJECT)
    const safetyCheck = checkExplicitContent(title, channel, desc);
    if (safetyCheck.blocked) {
      logSafetyAudit({
        type: 'EXPLICIT_BLOCKED',
        query: userQuery || `Queue:${era}:${genre}`,
        videoId,
        title,
        channel,
        reason: safetyCheck.reason,
      });
      return false;
    }

    const durInfo = durationMap?.get(videoId);
    const durationSeconds = durInfo?.durationSeconds || item.durationSeconds;

    // b) Movie & Feature-Length Content Check (HARD REJECT)
    const movieCheck = isMovieContent(title, desc, durationSeconds);
    if (movieCheck.isMovie) {
      logSafetyAudit({
        type: 'MOVIE_BLOCKED',
        query: userQuery || `Queue:${era}:${genre}`,
        videoId,
        title,
        channel,
        reason: movieCheck.reason,
      });
      return false;
    }

    // c) Duration Ceiling Check (HARD REJECT: 10 min for songs, 60 min for classical/devotional)
    const durCheck = checkDurationAllowed(durationSeconds, userQuery, title, genre, channel);
    if (!durCheck.allowed) {
      logSafetyAudit({
        type: 'DURATION_BLOCKED',
        query: userQuery || `Queue:${era}:${genre}`,
        videoId,
        title,
        channel,
        reason: durCheck.reason,
      });
      return false;
    }

    return true;
  });

  const scored: CleanTrack[] = safeCandidates.map((item) => {
    let score = 100;
    const title = decodeHtmlEntities(item.snippet?.title || '');
    const titleLower = title.toLowerCase();
    const desc = decodeHtmlEntities(item.snippet?.description || '');
    const descLower = desc.toLowerCase();
    const channel = decodeHtmlEntities(item.snippet?.channelTitle || '');
    const channelLower = channel.toLowerCase();

    // a) Rejects or severely deprioritizes off-topic markers (dance fitness, tutorials, nursery rhymes)
    let isOffTopic = false;
    for (const marker of OFF_TOPIC_TITLE_MARKERS) {
      if (titleLower.includes(marker)) {
        score -= 220;
        isOffTopic = true;
        break;
      }
    }
    if (!isOffTopic) {
      for (const marker of OFF_TOPIC_DESC_MARKERS) {
        if (descLower.includes(marker)) {
          score -= 120;
          isOffTopic = true;
          break;
        }
      }
    }

    const userRequestedDerivative = /\b(remix|cover|live|mashup|slowed|acoustic|karaoke)\b/i.test(userQuery);

    // b) Derivative / Fake / Cover / Remix / Couch singing / Live Bootleg suppression
    if (!userRequestedDerivative) {
      for (const pat of DERIVATIVE_CONTENT_PATTERNS) {
        if (pat.test(titleLower) || pat.test(channelLower)) {
          score -= 350;
          break;
        }
      }
    }

    // Reaction videos penalty
    if (titleLower.includes('reaction') || titleLower.includes('reacts to') || channelLower.includes('reaction')) {
      score -= 350;
    }

    // c) Channel-Aware Prioritization: Major labels & Official channels receive huge original-first boosts
    const isMajorLabel = MAJOR_RECORD_LABELS.some((ml) => channelLower.includes(ml));
    if (isMajorLabel) {
      score += 450;
    }

    // - Auto-generated official audio channels: "- Topic" suffix
    if (channelLower.endsWith('- topic') || channelLower.includes('- topic')) {
      score += 500;
    }

    // - VEVO channels
    if (channelLower.includes('vevo')) {
      score += 500;
    }

    // - Verified or official music / audio titles
    if (
      titleLower.includes('official music video') ||
      titleLower.includes('official audio') ||
      titleLower.includes('official video') ||
      titleLower.includes('official song') ||
      titleLower.includes('original soundtrack') ||
      titleLower.includes('original song') ||
      titleLower.includes('full video song') ||
      titleLower.includes('full song') ||
      titleLower.includes('lyrical video') ||
      titleLower.includes('lyric video') ||
      titleLower.includes('audio song')
    ) {
      score += 150;
    } else if (channelLower.includes('official')) {
      score += 80;
    }

    // - Trusted allow-list channels
    for (const trusted of TRUSTED_ALLOWLIST_CHANNELS) {
      if (channelLower.includes(trusted)) {
        score += 80;
        break;
      }
    }

    // - Title match precision: boosts titles containing user song query words
    const cleanSearchWords = cleanQ.split(/\s+/).filter((w) => w.length > 2);
    let matchedWords = 0;
    for (const word of cleanSearchWords) {
      if (titleLower.includes(word)) matchedWords++;
    }
    if (cleanSearchWords.length > 0) {
      score += Math.round((matchedWords / cleanSearchWords.length) * 60);
    }

    const vidId = item.id?.videoId || item.id || '';
    const durInfo = durationMap?.get(vidId);
    const durationSeconds = durInfo?.durationSeconds || item.durationSeconds;
    const formattedDuration = durInfo?.formattedDuration || item.formattedDuration;
    const durationMinutes = durInfo?.durationMinutes || item.durationMinutes || (durationSeconds ? Number((durationSeconds / 60).toFixed(2)) : 4.5);

    const track: CleanTrack = {
      id: vidId,
      title,
      channelTitle: channel,
      thumbnailUrl:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        '',
      durationMinutes,
      durationSeconds,
      formattedDuration,
      era,
      genre,
      rankingScore: score,
      description: desc,
    };

    if (isQueue) {
      track.adRiskScore = scoreTrackForAdLikelihood(track);
    }

    return track;
  });

  if (isQueue) {
    // Sort descending by adRiskScore for queue
    scored.sort((a, b) => (b.adRiskScore || 0) - (a.adRiskScore || 0));
    return scored;
  }

  // Manual search: filter out heavily penalized items (score <= 0) when valid music candidates exist
  const validTracks = scored.filter((t) => (t.rankingScore || 0) > 0);
  const candidates = validTracks.length >= 3 ? validTracks : scored;

  // Sort descending by rankingScore
  candidates.sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));

  return candidates;
}

// Verified embeddable fallback tracks from independent and classical archives + core search anchors
const VERIFIED_FALLBACK_TRACKS: CleanTrack[] = [
  // Sitar & Classical Meditative Instrumental
  {
    id: 'Wvl_K8VC9C4',
    title: 'Peaceful Sitar & Tanpura Meditation - Calming Mind & Soul',
    channelTitle: 'Shanti Instrumentals',
    thumbnailUrl: 'https://i.ytimg.com/vi/Wvl_K8VC9C4/hqdefault.jpg',
    durationMinutes: 34.85,
    durationSeconds: 2091,
    formattedDuration: '34:51',
    era: '1970s',
    genre: 'sitar_instrumental',
  },
  {
    id: 'IChON6RgY_s',
    title: 'Sitar for Overthinkers | Indian Classical Meditation Music for Mental Stillness',
    channelTitle: 'Shanti Instrumentals',
    thumbnailUrl: 'https://i.ytimg.com/vi/IChON6RgY_s/hqdefault.jpg',
    durationMinutes: 43.02,
    durationSeconds: 2581,
    formattedDuration: '43:01',
    era: '1970s',
    genre: 'sitar_instrumental',
  },
  {
    id: '6Jfq4s-gTzg',
    title: 'Morning Sitar & Flute Raga - Peaceful Awakening',
    channelTitle: 'Indian Soul Meditation Music',
    thumbnailUrl: 'https://i.ytimg.com/vi/6Jfq4s-gTzg/hqdefault.jpg',
    durationMinutes: 28.5,
    durationSeconds: 1710,
    formattedDuration: '28:30',
    era: '1960s',
    genre: 'sitar_instrumental',
  },

  // Golden Era Bollywood Nostalgia (Authentic Archival Recordings)
  {
    id: 'h9Z0V7oQ0eI',
    title: 'Pal Pal Dil Ke Paas - Kishore Kumar (Blackmail)',
    channelTitle: 'Old Hindi Songs Archive',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    durationMinutes: 5.47,
    durationSeconds: 328,
    formattedDuration: '5:28',
    era: '1970s',
    genre: 'bollywood_golden',
  },
  {
    id: 'TFr6G5zveS8',
    title: 'Lag Ja Gale Se Phir - Lata Mangeshkar (Woh Kaun Thi)',
    channelTitle: 'Gaane 70s 80s Nostalgia',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    durationMinutes: 4.3,
    durationSeconds: 258,
    formattedDuration: '4:18',
    era: '1970s',
    genre: 'bollywood_golden',
  },
  {
    id: 'YyN3_N7kY6o',
    title: 'Yeh Shaam Mastani - Kishore Kumar (Kati Patang)',
    channelTitle: 'Old Hindi Songs Archive',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
    durationMinutes: 4.63,
    durationSeconds: 278,
    formattedDuration: '4:38',
    era: '1980s',
    genre: 'bollywood_golden',
  },

  // Devotional, Bhajans & Spiritual Mornings
  {
    id: 'oK6U3W94K2w',
    title: 'Aisi Lagi Lagan Meera Ho Gayi Magan - Anup Jalota',
    channelTitle: 'Strumm Spiritual',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
    durationMinutes: 7.25,
    durationSeconds: 435,
    formattedDuration: '7:15',
    era: '1970s',
    genre: 'devotional_hymns',
  },
  {
    id: 'gF0T4GQWc5g',
    title: 'Govind Bolo Hari Gopal Bolo - Peaceful Instrumental Rhythms',
    channelTitle: 'Dr. Kumar Amit Spiritual',
    thumbnailUrl: 'https://i.ytimg.com/vi/gF0T4GQWc5g/hqdefault.jpg',
    durationMinutes: 21.0,
    durationSeconds: 1260,
    formattedDuration: '21:00',
    era: '1960s',
    genre: 'devotional_hymns',
  },
  {
    id: '1ghGNd5U3jM',
    title: 'Tu Pyar Ka Sagar Hai - Sitar, Flute & Santoor Meditative Ensemble',
    channelTitle: 'Dr. Kumar Amit Spiritual',
    thumbnailUrl: 'https://i.ytimg.com/vi/1ghGNd5U3jM/hqdefault.jpg',
    durationMinutes: 4.48,
    durationSeconds: 269,
    formattedDuration: '4:29',
    era: '1970s',
    genre: 'regional_folk',
  },

  // Search Anchors (Verified Original Tracks)
  {
    id: 'f7k8G7xXgqU',
    title: 'Cham Cham Full Video | BAAGHI | Tiger Shroff, Shraddha Kapoor | Meet Bros, Monali Thakur',
    channelTitle: 'T-Series',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    durationMinutes: 4.55,
    durationSeconds: 273,
    formattedDuration: '4:33',
    era: '2010s',
    genre: 'bollywood_golden',
  },
  {
    id: 'u9Q93kQ8Aqw',
    title: 'The Weeknd - Cry For Me (Official Music Video)',
    channelTitle: 'TheWeekndVEVO',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
    durationMinutes: 3.75,
    durationSeconds: 225,
    formattedDuration: '3:45',
    era: '2020s',
    genre: 'top_hits',
  },
  {
    id: '22tVWwmTie8',
    title: 'Eminem - Houdini [Official Music Video]',
    channelTitle: 'EminemVEVO',
    thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=80',
    durationMinutes: 4.95,
    durationSeconds: 297,
    formattedDuration: '4:57',
    era: '2020s',
    genre: 'top_hits',
  },
  {
    id: 'JGwWNGJdvx8',
    title: 'Ed Sheeran - Shape of You (Official Music Video)',
    channelTitle: 'Ed Sheeran',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
    durationMinutes: 4.4,
    durationSeconds: 264,
    formattedDuration: '4:24',
    era: '2010s',
    genre: 'top_hits',
  },
  {
    id: 't7bQwwqW-Hc',
    title: 'Shaboozey - A Bar Song (Tipsy) [Official Visualizer]',
    channelTitle: 'ShaboozeyVEVO',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    durationMinutes: 2.9,
    durationSeconds: 174,
    formattedDuration: '2:54',
    era: '2020s',
    genre: 'top_hits',
  },
];

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/**
 * Scrapes YouTube public search for video candidates when the Google Cloud YouTube Data API quota is exhausted.
 * This guarantees users can always search any song even if the daily API quota is exceeded.
 */
async function fetchYouTubeWebSearchResults(query: string): Promise<any[]> {
  try {
    const cleaned = cleanSearchQuery(query);
    const queriesToFetch: string[] = [];
    if (cleaned) {
      queriesToFetch.push(`${cleaned} official song`);
      queriesToFetch.push(cleaned);
    } else {
      queriesToFetch.push(query);
    }

    const seenVideoIds = new Set<string>();
    const allItems: any[] = [];

    for (const q of queriesToFetch) {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&safe_search=strict`;
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie': 'PREF=f2=8000000', // Enforce YouTube Restricted Mode (Strict SafeSearch)
        },
      });
      if (!res.ok) continue;

      const html = await res.text();
      const match = html.match(/var ytInitialData = ({.*?});<\/script>/s);
      if (!match) continue;

      const data = JSON.parse(match[1]);
      const sections =
        data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

      for (const s of sections) {
        const contents = s.itemSectionRenderer?.contents || [];
        for (const item of contents) {
          if (item.videoRenderer) {
            const v = item.videoRenderer;
            const videoId = v.videoId;
            if (!videoId || seenVideoIds.has(videoId)) continue;
            seenVideoIds.add(videoId);
            const timeStr = v.lengthText?.simpleText || '';
            const parsedSec = parseTimeString(timeStr);
            allItems.push({
              id: { videoId },
              durationSeconds: parsedSec > 0 ? parsedSec : undefined,
              durationMinutes: parsedSec > 0 ? Number((parsedSec / 60).toFixed(2)) : 4.5,
              formattedDuration: timeStr || undefined,
              snippet: {
                title: v.title?.runs?.map((r: any) => r.text).join('') || '',
                channelTitle: v.ownerText?.runs?.[0]?.text || '',
                description:
                  v.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') || '',
                thumbnails: {
                  high: {
                    url:
                      v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url ||
                      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                  },
                },
              },
            });
          }
        }
      }
      if (allItems.length >= 25) break;
    }
    return allItems;
  } catch (err: any) {
    console.warn('[NeuroNova YouTube] Web search fallback error:', err.message || err);
    return [];
  }
}

/**
 * Searches YouTube Data API v3 and formats clean response.
 * Uses category restriction, negative query terms, and a unified post-filtering/ranking pass.
 * Falls back to direct YouTube web search if the daily API quota is exhausted.
 */
export async function searchYouTubeMusic(
  era: string = '1970s',
  genre: string = 'all',
  region?: string,
  directQuery?: string
): Promise<{ tracks: CleanTrack[]; source: 'youtube_api' | 'cached' | 'fallback'; era: string; genre: string }> {
  const isManualSearch = Boolean(directQuery && directQuery.trim() !== '');
  const cleanDirectQuery = directQuery ? directQuery.trim() : '';

  const cacheKey = isManualSearch
    ? `manual:${cleanDirectQuery.toLowerCase()}`
    : `queue:${era}:${genre}:${region || ''}`.toLowerCase();

  // 1. Check in-memory 24h cache
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { tracks: cached.tracks, source: 'cached', era, genre };
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  // 2. Call YouTube Data API v3 if key is present
  if (apiKey && apiKey.trim() !== '' && !apiKey.includes('your_')) {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('type', 'video');
      url.searchParams.set('videoEmbeddable', 'true');
      // 1. Restrict to YouTube's "Music" category (videoCategoryId=10)
      url.searchParams.set('videoCategoryId', '10');
      // 2. MANDATORY: Enforce YouTube's strict safe search
      url.searchParams.set('safeSearch', 'strict');
      url.searchParams.set('key', apiKey.trim());

      if (isManualSearch) {
        url.searchParams.set('maxResults', '25'); // Larger candidate pool for post-filtering
        const cleanQ = cleanSearchQuery(cleanDirectQuery) || cleanDirectQuery;
        url.searchParams.set('q', `${cleanQ} -"full movie" -trailer -teaser`.trim());
      } else {
        // Automated queue: layer explicit safety exclusions on top of existing formative-era query logic
        url.searchParams.set('maxResults', '15');
        const cleanRegion = region ? region.trim() : '';
        const cleanGenre = genre !== 'all' ? genre.replace(/_/g, ' ') : 'Indian classical sitar nostalgia';
        const queueQuery = `${cleanRegion} ${cleanGenre} ${era} peaceful instrumental meditation relaxation official audio -dance -remix -cover -movie -"full movie" -trailer -teaser -sexy -sxy -bikini -nsfw -18+ -erotic -sensual`.trim();
        url.searchParams.set('q', queueQuery);
      }

      const res = await fetch(url.toString(), { method: 'GET' });

      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          // Extract video IDs and batch-fetch their exact durations
          const candidateIds = data.items
            .map((it: any) => it.id?.videoId || it.id)
            .filter((id: any): id is string => typeof id === 'string' && id.length > 0);
          const durationMap = await fetchYouTubeVideoDetails(candidateIds, apiKey);

          let finalTracks: CleanTrack[] = [];

          if (isManualSearch) {
            // 3. Shared backend post-filtering/ranking pass for manual search
            finalTracks = rankAndFilterSearchResults(data.items, cleanDirectQuery, durationMap, { era, genre, isQueue: false }).slice(0, 10);
          } else {
            // Automated queue: uses the EXACT SAME shared filter pipeline for safety, movie, and duration checks
            finalTracks = rankAndFilterSearchResults(data.items, '', durationMap, { era, genre, isQueue: true }).slice(0, 8);
          }

          if (finalTracks.length > 0) {
            logSafetyAudit({
              type: 'SEARCH_QUERY',
              query: cleanDirectQuery || `Queue:${era}:${genre}`,
              cleanCount: finalTracks.length,
            });
            searchCache.set(cacheKey, { tracks: finalTracks, timestamp: Date.now() });
            return { tracks: finalTracks, source: 'youtube_api', era, genre };
          }
        }
      } else {
        const errText = await res.text();
        console.warn(`[NeuroNova YouTube] API returned status ${res.status} (likely quota exceeded):`, errText);
      }
    } catch (err: any) {
      console.warn('[NeuroNova YouTube] Failed calling YouTube search:', err.message || err);
    }
  }

  // 3. Seamless Web Search Fallback (Triggered when API quota is exhausted or API is unavailable)
  if (isManualSearch) {
    const webItems = await fetchYouTubeWebSearchResults(cleanDirectQuery);
    if (webItems.length > 0) {
      const rankedWebTracks = rankAndFilterSearchResults(webItems, cleanDirectQuery, undefined, { era, genre, isQueue: false }).slice(0, 10);
      if (rankedWebTracks.length > 0) {
        logSafetyAudit({
          type: 'SEARCH_QUERY',
          query: cleanDirectQuery,
          cleanCount: rankedWebTracks.length,
        });
        searchCache.set(cacheKey, { tracks: rankedWebTracks, timestamp: Date.now() });
        return { tracks: rankedWebTracks, source: 'youtube_api', era, genre };
      }
    }
  }

  // 4. Fallback: Return verified tracks matching query, genre, or era
  let results = [...VERIFIED_FALLBACK_TRACKS];

  if (isManualSearch) {
    const qLower = cleanDirectQuery.toLowerCase();
    const queryMatches = results.filter(
      (t) =>
        t.title.toLowerCase().includes(qLower) ||
        t.channelTitle.toLowerCase().includes(qLower)
    );
    if (queryMatches.length > 0) {
      results = queryMatches;
      const mockItems = results.map((t) => ({
        id: { videoId: t.id },
        snippet: {
          title: t.title,
          channelTitle: t.channelTitle,
          description: t.title,
          thumbnails: { high: { url: t.thumbnailUrl } },
        },
      }));
      const rankedFallback = rankAndFilterSearchResults(mockItems, cleanDirectQuery, undefined, { era, genre, isQueue: false });
      searchCache.set(cacheKey, { tracks: rankedFallback, timestamp: Date.now() });
      return { tracks: rankedFallback, source: 'fallback', era, genre };
    }
    // If no verified track matches the user's manual search, return empty array so user is not confused by random tracks
    return { tracks: [], source: 'fallback', era, genre };
  }

  if (genre !== 'all') {
    const genreFiltered = results.filter((t) => t.genre === genre);
    if (genreFiltered.length > 0) results = genreFiltered;
  }
  const eraFiltered = results.filter((t) => t.era === era);
  if (eraFiltered.length >= 2) results = eraFiltered;

  results.sort((a, b) => scoreTrackForAdLikelihood(b) - scoreTrackForAdLikelihood(a));

  searchCache.set(cacheKey, { tracks: results, timestamp: Date.now() });
  return { tracks: results, source: 'fallback', era, genre };
}
