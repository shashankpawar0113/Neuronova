export type VoiceIntentType =
  | 'play_specific_song'
  | 'play_general_music'
  | 'pause_music'
  | 'resume_music'
  | 'routine_inquiry'
  | 'date_time_inquiry'
  | 'game_inquiry'
  | 'open_ended';

export interface ClassifiedIntent {
  type: VoiceIntentType;
  query?: string;
  originalText: string;
  isHindi: boolean;
}

const GENERIC_MUSIC_TERMS = new Set([
  'music',
  'song',
  'songs',
  'tune',
  'tunes',
  'melody',
  'melodies',
  'some music',
  'some songs',
  'some peaceful music',
  'peaceful music',
  'relaxing music',
  'calming music',
  'soothing music',
  'morning music',
  'sitar music',
  'classical music',
  'bhajan',
  'bhajans',
  'kirtan',
  'raga',
  'ragas',
]);

const GENERIC_HINDI_MUSIC_TERMS = new Set([
  'गाना',
  'गाने',
  'गीत',
  'संगीत',
  'भजन',
  'धुन',
  'शांति',
  'शांति वाला',
  'शांतिदायक',
  'शांत',
  'मधुर',
  'मधुर संगीत',
  'कोई',
  'कोई भी',
  'कोई गाना',
  'पुराना',
  'पुराने',
  'पुराने गाने',
  'पुराना गाना',
  'सितार',
  'सितार संगीत',
  'राग',
  'रिलैक्सिंग',
  'शांतिपूर्ण',
  'gaana',
  'sangeet',
  'bhajan',
  'shanti',
  'peaceful',
]);

/**
 * Detects whether the input text or requested language is Hindi.
 */
export function isHindiText(text: string, requestedLang?: string): boolean {
  if (requestedLang === 'hi' || requestedLang === 'hi-IN') return true;
  if (!text) return false;
  // Devanagari Unicode script check (\u0900-\u097F)
  if (/[\u0900-\u097F]/.test(text)) return true;
  // Transliterated Hinglish keywords (expanded for seamless auto-detection)
  const hinglishPatterns = /\b(kya|kyun|kaun|kaunsa|kaunsi|kab|kaha|kahan|kaise|karo|kare|karein|karna|kar|hai|ho|hoon|hun|hain|tha|thi|the|hoga|hogi|bajao|bajaao|baja|bajaye|chalao|chalaao|chala|chalaye|suno|sunao|sunaao|gaana|gana|gaane|gane|geet|sangeet|bhajan|dhun|dawai|dawa|dawiyan|goli|khana|khaana|nashta|paani|pani|aaj|kal|parso|din|tarikh|tareekh|samay|waqt|vakt|baje|shuru|band|roko|rok|khatam|khel|khelna|namaste|namaskar|shukriya|dhanyawad|madad|batao|bataiye|bolo|boli|mera|meri|mere|mujhe|mujhko|hum|hume|humko|aap|aapka|aapki|tum|tumhara|shant|sukhad|accha|achha|achhi|theek|kripya|chahiye)\b/i;
  return hinglishPatterns.test(text);
}

/**
 * Normalizes and classifies the user prompt into structured action intent across English and Hindi.
 */
export function classifyVoiceIntent(input: string, requestedLang?: string): ClassifiedIntent {
  const raw = (input || '').trim();
  const lower = raw.toLowerCase();
  const isHindi = isHindiText(raw, requestedLang);

  // 1. Playback controls (Pause / Stop)
  if (
    /^(pause|stop)\s+(the\s+)?(music|song|player|audio|playback)$/i.test(lower) ||
    lower === 'pause' ||
    lower === 'stop music' ||
    /(?:गाना|गीत|संगीत|आवाज़)?\s*(?:रोक\s*दो|बंद\s*करो|रोको|पॉज़\s*करो|पॉज\s*करो)/i.test(raw) ||
    /\b(rok do|band karo|gaana band|gaana roko|pause karo)\b/i.test(lower)
  ) {
    return { type: 'pause_music', originalText: raw, isHindi };
  }

  // 2. Playback controls (Resume / Continue)
  if (
    /^(resume|continue|unpause)\s+(the\s+)?(music|song|player|audio|playback)$/i.test(lower) ||
    lower === 'resume' ||
    lower === 'unpause' ||
    /(?:गाना|गीत|संगीत)?\s*(?:फिर\s*से\s*चलाओ|शुरू\s*करो|चालू\s*करो|बजाना\s*शुरू)/i.test(raw) ||
    /\b(phir se chalao|chalu karo|shuru karo|resume karo)\b/i.test(lower)
  ) {
    return { type: 'resume_music', originalText: raw, isHindi };
  }

  // 3. Hindi Play Music Patterns (Devanagari & Hinglish)
  const HINDI_PLAY_VERBS = '(?:बजाइए|बजाओ|बजाना|बजा\\s*दो|बजा\\s*दीजिए|चलाइए|चलाओ|चलाना|चला\\s*दो|चला\\s*दीजिए|सुनाइए|सुनाओ|सुनाना|सुना\\s*दो|सुना\\s*दीजिए|लगाइए|लगाओ|लगाना|लगा\\s*दो|लगा\\s*दीजिए|bajaiye|bajao|baja\\s*do|chalaiye|chalao|chala\\s*do|sunaiye|sunao|suna\\s*do|lagaiye|lagao|laga\\s*do|play\\s*karo|play\\s*kijiye)';
  const HINDI_MUSIC_NOUNS = '(?:गाना|गाने|गीत|संगीत|ट्रैक|भजन|आरती|कीर्तन|धुन|कव्वाली|सूफी|gaana|gana|gaane|gane|geet|sangeet|bhajan|bhajans|aarti|arti|kirtan|dhun|qawwali|track|song|songs)';

  const hindiPlayPatterns = [
    // "X का/की/के गाना/भजन सुनाओ/बजाओ"
    new RegExp(`^(?:कृपया\\s+|please\\s+)?(.+?)\\s*(?:का|की|के)?\\s*${HINDI_MUSIC_NOUNS}\\s*${HINDI_PLAY_VERBS}?$`, 'i'),
    // "गाना/भजन सुनाओ X"
    new RegExp(`^(?:कृपया\\s+|please\\s+)?${HINDI_MUSIC_NOUNS}\\s*${HINDI_PLAY_VERBS}\\s*(.+)?$`, 'i'),
    // "X सुनाओ/बजाओ/चलाओ"
    new RegExp(`^(?:कृपया\\s+|please\\s+)?(.+?)\\s*${HINDI_PLAY_VERBS}$`, 'i'),
    // "X सुनना है / मुझे X सुनना है"
    /^(?:कृपया\s+|please\s+)?(?:मुझे\s+|mujhko\s+|humko\s+|hume\s+)?(.+?)\s*(?:सुनना\s*है|सुनना\s*चाहता|सुनना\s*चाहती|सुनने\s*का\s*मन|sunna\s*hai|sunna\s*chahta|sunne\s*ka\s*man)$/i,
    // Standalone devotional: "साईं बाबा के भजन", "शिर्डी के साईं बाबा भजन", "हनुमान चालीसा"
    /^(?:कृपया\s+|please\s+)?(.+?)\s*(?:के|की|का)?\s*(?:भजन|आरती|कीर्तन|धुन|चालीसा|bhajan|bhajans|aarti|arti|kirtan|dhun|chalisa)$/i,
    /^(?:please\s+)?(.+?)\s+(?:gaana|song|sangeet|bhajan)\s+(?:bajao|chalao|lagao|sunao)$/i,
    /^(?:please\s+)?(?:gaana|sangeet|bhajan)\s+(?:bajao|chalao|lagao|sunao)\s*(.*)$/i,
    /^(?:please\s+)?(.+?)\s+(?:bajao|chalao|lagao|sunao|play\s+karo)$/i,
  ];

  for (const pattern of hindiPlayPatterns) {
    const match = raw.match(pattern);
    if (match) {
      let candidate = (match[1] || '').trim();
      // Clean candidate of parentheticals and extra filler
      candidate = candidate.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
      if (!candidate || GENERIC_HINDI_MUSIC_TERMS.has(candidate) || GENERIC_HINDI_MUSIC_TERMS.has(candidate.toLowerCase())) {
        return { type: 'play_general_music', originalText: raw, isHindi: true };
      }
      return {
        type: 'play_specific_song',
        query: candidate,
        originalText: raw,
        isHindi: true,
      };
    }
  }

  // 4. English Play Music Patterns
  const playPatterns = [
    /^(?:please\s+)?(?:can\s+you\s+|could\s+you\s+)?(?:play|put\s+on|listen\s+to|start|stream)\s+(?:song\s+|track\s+|bhajan\s+|aarti\s+)?(.+)$/i,
    /^(?:play\s+me\s+)(.+)$/i,
    /^(?:i\s+want\s+to\s+(?:hear|listen\s+to))\s+(.+)$/i,
  ];

  for (const pattern of playPatterns) {
    const match = lower.match(pattern);
    if (match && match[1]) {
      const rawCandidate = match[1].trim();
      let candidate = rawCandidate
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\s+(?:song|songs|track|tracks|music|video|bhajan|bhajans|aarti|kirtan)$/i, '')
        .trim();

      // Check if it is merely a generic request (e.g. "play some music", "play peaceful music", "play something relaxing")
      if (
        !candidate ||
        GENERIC_MUSIC_TERMS.has(rawCandidate) ||
        GENERIC_MUSIC_TERMS.has(candidate) ||
        /^(peaceful|relaxing|calming|soothing|morning|classical|sitar|instrumental|background)$/i.test(candidate) ||
        /^(something|anything)(\s+(peaceful|relaxing|calming|soothing|nice))?$/i.test(candidate)
      ) {
        return { type: 'play_general_music', originalText: raw, isHindi };
      }

      return {
        type: 'play_specific_song',
        query: candidate,
        originalText: raw,
        isHindi,
      };
    }
  }

  // Fallback check for queries containing specific "song" or "by [artist]" in English
  if (/play/i.test(lower) && (lower.includes('music') || lower.includes('song') || lower.includes('tune') || lower.includes('bhajan') || lower.includes('aarti'))) {
    const cleaned = lower
      .replace(/^(please\s+)?(can\s+you\s+)?play\s+/i, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\s+song$/i, '')
      .replace(/\s+music$/i, '')
      .trim();
    if (cleaned && !GENERIC_MUSIC_TERMS.has(cleaned)) {
      return {
        type: 'play_specific_song',
        query: cleaned,
        originalText: raw,
        isHindi,
      };
    }
    return { type: 'play_general_music', originalText: raw, isHindi };
  }

  // 5. Routine & Medicine Inquiries (Hindi + English)
  if (
    lower.includes('do today') ||
    lower.includes('schedule') ||
    lower.includes('routine') ||
    lower.includes("what's next") ||
    lower.includes('what to do') ||
    lower.includes('anything left') ||
    lower.includes("what's left") ||
    lower.includes('what is left') ||
    lower.includes('left for me') ||
    lower.includes('left today') ||
    lower.includes('pending') ||
    lower.includes('remaining') ||
    lower.includes('medicine') ||
    lower.includes('pill') ||
    lower.includes('tablet') ||
    lower.includes('medication') ||
    /(?:आज\s+)?(?:क्या\s+करना\s+है|दिनचर्या|शेड्यूल|काम\s+है|दवाई|दवा|गोली|कुछ\s+बाकी|क्या\s+बाकी|बाकी\s+है|बचा\s+है)/i.test(raw) ||
    /\b(kya karna hai|dawai|dawa|goli|kaam|kuch bacha|kya bacha|bacha hai|baaki hai)\b/i.test(lower)
  ) {
    return { type: 'routine_inquiry', originalText: raw, isHindi };
  }

  // 6. Date & Time Inquiries (Hindi + English)
  if (
    lower.includes('what day') ||
    lower.includes('what date') ||
    lower.includes("what's the date") ||
    lower.includes('what time') ||
    lower.includes('clock') ||
    lower.includes('today date') ||
    /(?:आज\s+)?(?:कौन\s+सा\s+दिन|क्या\s+दिन|क्या\s+तारीख|कितने\s+बजे|क्या\s+समय|टाइम\s+क्या|तारीख\s+क्या)/i.test(raw) ||
    /\b(kaun sa din|kya din|kya tarikh|kitne baje|kya time|samay kya)\b/i.test(lower)
  ) {
    return { type: 'date_time_inquiry', originalText: raw, isHindi };
  }

  // 7. Game Inquiries (Hindi + English)
  if (
    lower.includes('play game') ||
    lower.includes('neurogame') ||
    lower.includes('memory match') ||
    lower.includes('puzzle') ||
    lower.includes('brain game') ||
    /(?:दिमागी\s+)?(?:खेल|गेम|पहेली)\s*(?:खेलना|खेलो|चलाओ)/i.test(raw) ||
    /\b(khelna hai|game khelna|dimagi khel)\b/i.test(lower)
  ) {
    return { type: 'game_inquiry', originalText: raw, isHindi };
  }

  return { type: 'open_ended', originalText: raw, isHindi };
}
