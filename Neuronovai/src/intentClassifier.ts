export type VoiceIntentType =
  | 'GET_TODAYS_SCHEDULE'
  | 'GET_NEXT_MEDICATION'
  | 'COMPLETE_TASK'
  | 'PLAY_MUSIC'
  | 'START_GAMES'
  | 'SEND_CAREGIVER_MESSAGE'
  | 'CALL_CAREGIVER'
  | 'CHECK_DATE_TIME'
  | 'CHECK_WEATHER'
  | 'STOP_ACTION'
  | 'CANCEL_ACTION'
  | 'HELP'
  // Legacy aliases for full backward compatibility
  | 'play_specific_song'
  | 'play_general_music'
  | 'pause_music'
  | 'resume_music'
  | 'routine_inquiry'
  | 'date_time_inquiry'
  | 'game_inquiry'
  | 'weather_inquiry'
  | 'open_ended';

export interface ClassifiedIntent {
  type: VoiceIntentType;
  primaryIntent: 'GET_TODAYS_SCHEDULE' | 'GET_NEXT_MEDICATION' | 'COMPLETE_TASK' | 'PLAY_MUSIC' | 'START_GAMES' | 'SEND_CAREGIVER_MESSAGE' | 'CALL_CAREGIVER' | 'CHECK_DATE_TIME' | 'CHECK_WEATHER' | 'STOP_ACTION' | 'CANCEL_ACTION' | 'HELP' | 'OPEN_ENDED';
  query?: string;
  originalText: string;
  isHindi: boolean;
  isHinglish: boolean;
  language: 'en' | 'hi' | 'hinglish';
  entity?: {
    taskType?: 'medication' | 'meal' | 'exercise' | 'water' | 'general';
    targetPerson?: string;
    messageText?: string;
    songQuery?: string;
  };
}

const GENERIC_MUSIC_TERMS = new Set([
  'music', 'song', 'songs', 'tune', 'tunes', 'melody', 'melodies',
  'some music', 'some songs', 'some peaceful music', 'peaceful music',
  'relaxing music', 'calming music', 'soothing music', 'morning music',
  'sitar music', 'classical music', 'bhajan', 'bhajans', 'kirtan', 'raga', 'ragas',
]);

const GENERIC_HINDI_MUSIC_TERMS = new Set([
  'गाना', 'गाने', 'गीत', 'संगीत', 'भजन', 'धुन', 'शांति', 'शांति वाला',
  'शांतिदायक', 'शांत', 'मधुर', 'मधुर संगीत', 'कोई', 'कोई भी', 'कोई गाना',
  'पुराना', 'पुराने', 'पुराने गाने', 'पुराना गाना', 'सितार', 'सितार संगीत',
  'राग', 'रिलैक्सिंग', 'शांतिपूर्ण', 'gaana', 'sangeet', 'bhajan', 'shanti', 'peaceful',
]);

/**
 * Detects whether the input text is written in Devanagari script.
 */
export function isDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text || '');
}

/**
 * Detects whether the input text or requested language is Hindi or Hinglish.
 */
export function detectLanguageMode(text: string, requestedLang?: string): { isHindi: boolean; isHinglish: boolean; language: 'en' | 'hi' | 'hinglish' } {
  if (requestedLang === 'hinglish') {
    return { isHindi: false, isHinglish: true, language: 'hinglish' };
  }
  if (requestedLang === 'hi' || requestedLang === 'hi-IN') {
    return { isHindi: true, isHinglish: false, language: 'hi' };
  }
  if (requestedLang === 'en' || requestedLang === 'en-IN') {
    // Check if the user spoke Devanagari or strong Hinglish anyway
    if (isDevanagari(text)) return { isHindi: true, isHinglish: false, language: 'hi' };
  }

  const raw = (text || '').toLowerCase();
  if (isDevanagari(raw)) {
    return { isHindi: true, isHinglish: false, language: 'hi' };
  }

  const hinglishPatterns = /\b(kya|kyun|kaun|kaunsa|kaunsi|kab|kaha|kahan|kaise|karo|kare|karein|karna|kar|hai|ho|hoon|hun|hain|tha|thi|hoga|hogi|bajao|bajaao|baja|bajaye|chalao|chalaao|chala|chalaye|suno|sunao|sunaao|gaana|gana|gaane|gane|geet|sangeet|bhajan|dhun|dawai|dawa|dawiyan|goli|khana|khaana|nashta|paani|pani|aaj|kal|parso|din|tarikh|tareekh|samay|waqt|vakt|baje|shuru|band|roko|rok|khatam|khel|khelna|namaste|namaskar|shukriya|dhanyawad|madad|batao|bataiye|bolo|boli|mera|meri|mere|mujhe|mujhko|hum|hume|humko|aap|aapka|aapki|tum|tumhara|shant|sukhad|accha|achha|achhi|theek|kripya|chahiye|bhejo|bhej|de|do|li|le|liya)\b/i;
  
  if (hinglishPatterns.test(raw)) {
    return { isHindi: false, isHinglish: true, language: 'hinglish' };
  }

  return { isHindi: false, isHinglish: false, language: 'en' };
}

export function isHindiText(text: string, requestedLang?: string): boolean {
  const { isHindi, isHinglish } = detectLanguageMode(text, requestedLang);
  return isHindi || isHinglish;
}

/**
 * Centralized intent parser & entity extractor.
 */
export function classifyVoiceIntent(input: string, requestedLang?: string): ClassifiedIntent {
  const raw = (input || '').trim();
  const lower = raw.toLowerCase();
  const cleanLower = lower.replace(/[.,!?;:]/g, '').trim();
  const { isHindi, isHinglish, language } = detectLanguageMode(raw, requestedLang);

  // --------------------------------------------------------------------------
  // 1. STOP / CANCEL ACTION
  // --------------------------------------------------------------------------
  if (
    /^(stop|cancel|halt|close|quit)$/i.test(cleanLower) ||
    /^(pause|stop)\s+(the\s+)?(music|song|player|audio|playback|game|games)$/i.test(cleanLower) ||
    cleanLower === 'pause' ||
    cleanLower === 'stop music' ||
    cleanLower === 'stop game' ||
    cleanLower === 'stop games' ||
    /(?:गाना|गीत|संगीत|खेल|गेम|आवाज़)?\s*(?:रोक\s*दो|बंद\s*करो|रोको|रुक\s*जाओ|पॉज़\s*करो|पॉज\s*करो)/i.test(raw) ||
    /\b(rok do|ruk jao|band karo|game band|gaana band|gaana roko|pause karo|chup ho jao)\b/i.test(cleanLower)
  ) {
    return {
      type: 'STOP_ACTION',
      primaryIntent: 'STOP_ACTION',
      originalText: raw,
      isHindi,
      isHinglish,
      language,
    };
  }

  // --------------------------------------------------------------------------
  // 2. CAREGIVER CALL
  // --------------------------------------------------------------------------
  if (
    /^(call|dial|phone|ring|contact)\s+(my\s+)?(caregiver|helper|nurse|family|son|daughter|doctor|ravi|anita)/i.test(lower) ||
    /\b(call\s+caregiver|caregiver\s+ko\s+call|ravi\s+ko\s+call|doctor\s+ko\s+call|call\s+karo)\b/i.test(lower) ||
    /(?:केयरगिवर|देखभालकर्ता|रवि|डॉक्टर|परिवार)?\s*(?:को\s+)?(?:कॉल\s*करो|फोन\s*करो|बात\s*कराओ)/i.test(raw)
  ) {
    // Extract person if mentioned
    let target = 'Caregiver';
    if (/ravi/i.test(raw)) target = 'Ravi';
    if (/doctor|dr/i.test(raw)) target = 'Doctor';
    if (/anita/i.test(raw)) target = 'Dr. Anita';

    return {
      type: 'CALL_CAREGIVER',
      primaryIntent: 'CALL_CAREGIVER',
      originalText: raw,
      isHindi,
      isHinglish,
      language,
      entity: { targetPerson: target },
    };
  }

  // --------------------------------------------------------------------------
  // 3. CAREGIVER VOICE MESSAGE
  // --------------------------------------------------------------------------
  if (
    /\b(send\s+(a\s+)?message|message\s+caregiver|voice\s+message|tell\s+my\s+caregiver)\b/i.test(lower) ||
    /\b(caregiver\s+ko\s+message|ravi\s+ko\s+message|message\s+bhejo|sandesh\s+bhejo|bolo\s+ki)\b/i.test(lower) ||
    /(?:केयरगिवर|रवि|देखभालकर्ता)?\s*(?:को\s+)?(?:मैसेज|संदेश)\s*(?:भेजो|भेजें|करो)/i.test(raw)
  ) {
    let target = 'Caregiver';
    if (/ravi/i.test(raw)) target = 'Ravi';

    // Check if message text is included e.g. "Ravi ko bolo ki maine dawa le li hai"
    let msgExtract = '';
    const boloMatch = raw.match(/(?:bolo\s+ki|kaho\s+ki|bhejo\s+ki|message\s+ki)\s+(.+)$/i);
    if (boloMatch && boloMatch[1]) {
      msgExtract = boloMatch[1].trim();
    }

    return {
      type: 'SEND_CAREGIVER_MESSAGE',
      primaryIntent: 'SEND_CAREGIVER_MESSAGE',
      originalText: raw,
      isHindi,
      isHinglish,
      language,
      entity: { targetPerson: target, messageText: msgExtract },
    };
  }

  // --------------------------------------------------------------------------
  // 4. TASK COMPLETION ("Maine medicine le li", "I completed my medicine")
  // --------------------------------------------------------------------------
  if (
    /\b(i\s+(took|completed|finished|had)\s+my\s+(medicine|medication|pill|tablet|exercise|walk|meal|breakfast|lunch|dinner|water))\b/i.test(lower) ||
    /\b(done\s+with\s+my\s+(medicine|exercise|walk|meal))\b/i.test(lower) ||
    /\b(maine|mai\s+ne)\s+.*?\b(le\s+li|le\s+liya|kha\s+li|kha\s+liya|kar\s+li|kar\s+liya|pee\s+liya|pi\s+liya)\b/i.test(lower) ||
    /(?:मैंने|मैने)?\s*(?:दवाई|दवा|गोली|नाश्ता|खाना|व्यायाम|कसरत|पानी)\s*(?:ले\s*ली|खा\s*ली|पी\s*लिया|कर\s*लिया|पूर्ण\s*हो\s*गया)/i.test(raw) ||
    /\b(medicine\s+ho\s+gayi|dawa\s+ho\s+gayi|exercise\s+ho\s+gayi|walk\s+ho\s+gayi)\b/i.test(lower)
  ) {
    let taskType: 'medication' | 'meal' | 'exercise' | 'water' | 'general' = 'general';
    if (/medicine|medication|pill|tablet|dawa|dawai|goli|दवाई|दवा|गोली/i.test(raw)) {
      taskType = 'medication';
    } else if (/exercise|walk|stretching|kasrat|vyayam|व्यायाम|कसरत|टहल/i.test(raw)) {
      taskType = 'exercise';
    } else if (/meal|breakfast|lunch|dinner|khana|khaana|nashta|खाना|नाश्ता/i.test(raw)) {
      taskType = 'meal';
    } else if (/water|paani|pani|पानी/i.test(raw)) {
      taskType = 'water';
    }

    return {
      type: 'COMPLETE_TASK',
      primaryIntent: 'COMPLETE_TASK',
      originalText: raw,
      isHindi,
      isHinglish,
      language,
      entity: { taskType },
    };
  }

  // --------------------------------------------------------------------------
  // 5. GET NEXT MEDICATION (Specific Medicine Inquiry)
  // --------------------------------------------------------------------------
  if (
    /\b(next\s+medicine|when\s+is\s+my\s+(medicine|pill|medication)|medicine\s+time|next\s+dose)\b/i.test(lower) ||
    /\b(meri\s+next\s+medicine|dawai\s+kab\s+hai|dawa\s+kab\s+len|agla\s+dawa\s+ka\s+time|goli\s+kab\s+hai)\b/i.test(lower) ||
    /(?:मेरी\s+)?(?:अगली\s+)?(?:दवाई|दवा|गोली)\s*(?:कब\s+है|का\s+समय|कब\s+लेनी)/i.test(raw)
  ) {
    return {
      type: 'GET_NEXT_MEDICATION',
      primaryIntent: 'GET_NEXT_MEDICATION',
      originalText: raw,
      isHindi,
      isHinglish,
      language,
      entity: { taskType: 'medication' },
    };
  }

  // --------------------------------------------------------------------------
  // 6. START GAMES (Sequential hands-free gaming session)
  // --------------------------------------------------------------------------
  if (
    /\b(want\s+to\s+play\s+game|play\s+games|start\s+games|play\s+neurogame|play\s+neurogames|brain\s+games)\b/i.test(cleanLower) ||
    /\b(mujhe\s+games?\s+khelna|games?\s+khelne?\s+hai?n?|game\s+khelo|game\s+shuru\s+karo)\b/i.test(cleanLower) ||
    /(?:मुझे\s+)?(?:गेम|खेल|दिमागी\s+खेल)\s*(?:खेलना\s*है|खेलने\s*हैं|खेलो|शुरू\s*करो|लगाओ)/i.test(raw)
  ) {
    return {
      type: 'START_GAMES',
      primaryIntent: 'START_GAMES',
      originalText: raw,
      isHindi,
      isHinglish,
      language,
    };
  }

  // --------------------------------------------------------------------------
  // 7. GET TODAY'S SCHEDULE / ROUTINE
  // --------------------------------------------------------------------------
  if (
    /\b(do\s+today|my\s+schedule|today's\s+schedule|what's\s+next|what\s+to\s+do|anything\s+left|routine)\b/i.test(lower) ||
    /\b(aaj\s+mujhe\s+kya\s+karna\s+hai|aaj\s+kya\s+karna\s+hai|mera\s+schedule|aaj\s+ka\s+kaam)\b/i.test(lower) ||
    /(?:आज\s+)?(?:मुझे\s+)?(?:क्या\s+करना\s+है|दिनचर्या|शेड्यूल|काम\s+है|क्या\s+बाकी\s+है|क्या\s+बचा\s+है)/i.test(raw)
  ) {
    return {
      type: 'GET_TODAYS_SCHEDULE',
      primaryIntent: 'GET_TODAYS_SCHEDULE',
      originalText: raw,
      isHindi,
      isHinglish,
      language,
    };
  }

  // --------------------------------------------------------------------------
  // 8. CHECK DATE & TIME
  // --------------------------------------------------------------------------
  if (
    /\b(what\s+day|what\s+date|what's\s+the\s+date|what\s+time|what\s+is\s+the\s+time|clock|today\s+date)\b/i.test(lower) ||
    /\b(kaun\s+sa\s+din|kya\s+din\s+hai|kya\s+tarikh\s+hai|kitne\s+baje|kya\s+time|samay\s+kya|waqt\s+kya)\b/i.test(lower) ||
    /(?:आज\s+)?(?:कौन\s+सा\s+दिन|क्या\s+दिन|क्या\s+तारीख|कितने\s+बजे|क्या\s+समय|टाइम\s+क्या|तारीख\s+क्या)/i.test(raw)
  ) {
    return {
      type: 'CHECK_DATE_TIME',
      primaryIntent: 'CHECK_DATE_TIME',
      originalText: raw,
      isHindi,
      isHinglish,
      language,
    };
  }

  // --------------------------------------------------------------------------
  // 9. CHECK WEATHER
  // --------------------------------------------------------------------------
  if (
    /\b(weather|temperature|forecast|is\s+it\s+raining|will\s+it\s+rain|is\s+it\s+cold|is\s+it\s+hot|need\s+a\s+sweater|need\s+an\s+umbrella)\b/i.test(lower) ||
    /\b(mausam\s+kaisa|kaisa\s+mausam|barish\s+hogi|thand\s+hai|garmi\s+hai)\b/i.test(lower) ||
    /(?:आज\s+)?(?:मौसम\s+कैसा|कैसा\s+मौसम|मौसम|बारिश|बरसात|तापमान|कितनी\s+ठंड|धूप)/i.test(raw)
  ) {
    return {
      type: 'CHECK_WEATHER',
      primaryIntent: 'CHECK_WEATHER',
      originalText: raw,
      isHindi,
      isHinglish,
      language,
    };
  }

  // --------------------------------------------------------------------------
  // 10. HELP
  // --------------------------------------------------------------------------
  if (
    /^(help|what\s+can\s+you\s+do|how\s+to\s+use|commands)$/i.test(lower) ||
    /\b(madad\s+chahiye|tum\s+kya\s+kar\s+sakte\s+ho|kya\s+kar\s+sakte\s+ho)\b/i.test(lower) ||
    /(?:मदद|सहायता|तुम\s+क्या\s+कर\s+सकते\s+हो)/i.test(raw)
  ) {
    return {
      type: 'HELP',
      primaryIntent: 'HELP',
      originalText: raw,
      isHindi,
      isHinglish,
      language,
    };
  }

  // --------------------------------------------------------------------------
  // 11. PLAY MUSIC (Hindi & Hinglish Specific & General)
  // --------------------------------------------------------------------------
  const HINDI_PLAY_VERBS = '(?:बजाइए|बजाओ|बजाना|बजा\\s*दो|बजा\\s*दीजिए|चलाइए|चलाओ|चलाना|चला\\s*दो|सुनाइए|सुनाओ|सुनाना|लगाइए|लगाओ|लगाना|bajaiye|bajao|baja\\s*do|chalaiye|chalao|sunaiye|sunao|lagaiye|lagao|play\\s*karo)';
  const HINDI_MUSIC_NOUNS = '(?:गाना|गाने|गीत|संगीत|ट्रैक|भजन|आरती|कीर्तन|धुन|gaana|gana|gaane|gane|geet|sangeet|bhajan|bhajans|aarti|dhun|song|songs|music)';

  const hindiPlayPatterns = [
    new RegExp(`^(?:कृपया\\s+|please\\s+)?(.+?)\\s*(?:का|की|के)?\\s*${HINDI_MUSIC_NOUNS}\\s*${HINDI_PLAY_VERBS}?$`, 'i'),
    new RegExp(`^(?:कृपया\\s+|please\\s+)?${HINDI_MUSIC_NOUNS}\\s*${HINDI_PLAY_VERBS}\\s*(.+)?$`, 'i'),
    new RegExp(`^(?:कृपया\\s+|please\\s+)?(.+?)\\s*${HINDI_PLAY_VERBS}$`, 'i'),
    /^(?:कृपया\s+|please\\s+)?(?:मुझे\s+|mujhko\s+|humko\s+)?(.+?)\s*(?:सुनना\s*है|sunna\s*hai)$/i,
    /^(?:please\s+)?(.+?)\s+(?:bajao|chalao|lagao|sunao|play\s+karo)$/i,
  ];

  for (const pattern of hindiPlayPatterns) {
    const match = raw.match(pattern);
    if (match) {
      let candidate = (match[1] || '').trim();
      candidate = candidate.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
      if (!candidate || GENERIC_HINDI_MUSIC_TERMS.has(candidate) || GENERIC_HINDI_MUSIC_TERMS.has(candidate.toLowerCase())) {
        return { type: 'PLAY_MUSIC', primaryIntent: 'PLAY_MUSIC', originalText: raw, isHindi, isHinglish, language };
      }
      return {
        type: 'play_specific_song',
        primaryIntent: 'PLAY_MUSIC',
        query: candidate,
        originalText: raw,
        isHindi,
        isHinglish,
        language,
        entity: { songQuery: candidate },
      };
    }
  }

  // 12. English Play Music Patterns
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
        .replace(/\s+(?:song|songs|track|tracks|music|video|bhajan|aarti)$/i, '')
        .trim();

      if (
        !candidate ||
        GENERIC_MUSIC_TERMS.has(rawCandidate) ||
        GENERIC_MUSIC_TERMS.has(candidate) ||
        /^(peaceful|relaxing|calming|soothing|morning|classical|sitar|instrumental)$/i.test(candidate) ||
        /^(something|anything)(\s+(peaceful|relaxing|calming))?$/i.test(candidate)
      ) {
        return { type: 'PLAY_MUSIC', primaryIntent: 'PLAY_MUSIC', originalText: raw, isHindi, isHinglish, language };
      }

      return {
        type: 'play_specific_song',
        primaryIntent: 'PLAY_MUSIC',
        query: candidate,
        originalText: raw,
        isHindi,
        isHinglish,
        language,
        entity: { songQuery: candidate },
      };
    }
  }

  if (/play/i.test(lower) && (lower.includes('music') || lower.includes('song') || lower.includes('melody'))) {
    return { type: 'PLAY_MUSIC', primaryIntent: 'PLAY_MUSIC', originalText: raw, isHindi, isHinglish, language };
  }

  return {
    type: 'open_ended',
    primaryIntent: 'OPEN_ENDED',
    originalText: raw,
    isHindi,
    isHinglish,
    language,
  };
}

