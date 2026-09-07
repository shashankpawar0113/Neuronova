import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  MessageSquareHeart,
  Music,
  Gamepad2,
  Send,
  AlertCircle,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { RoutineItem } from '../types';

interface VoiceAssistantProps {
  userName: string;
  userId?: string;
  routine: RoutineItem[];
}

interface SuggestedAction {
  label: string;
  url: string;
  icon: 'music' | 'game';
}

export const detectLanguage = (text: string): 'en' | 'hi' => {
  if (!text) return 'en';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  const hindiKeywords =
    /\b(kya|kyun|kaun|kaunsa|kaunsi|kab|kaha|kahan|kaise|karo|kare|karein|karna|kar|hai|ho|hoon|hun|hain|tha|thi|the|hoga|hogi|bajao|bajaao|baja|bajaye|chalao|chalaao|chala|chalaye|suno|sunao|sunaao|gaana|gana|gaane|gane|geet|sangeet|bhajan|dhun|dawai|dawa|dawiyan|goli|khana|khaana|nashta|paani|pani|aaj|kal|parso|din|tarikh|tareekh|samay|waqt|vakt|baje|shuru|band|roko|rok|khatam|khel|khelna|namaste|namaskar|shukriya|dhanyawad|madad|batao|bataiye|bolo|boli|mera|meri|mere|mujhe|mujhko|hum|hume|humko|aap|aapka|aapki|tum|tumhara|shant|sukhad|accha|achha|achhi|theek|kripya|chahiye)\b/i;
  return hindiKeywords.test(text) ? 'hi' : 'en';
};

export const translateQueryForDisplay = (text: string): string => {
  if (!text) return text;
  if (!/[\u0900-\u097F]/.test(text)) return text;
  const raw = text.toLowerCase().trim();
  if (/गाना|गाने|गीत|संगीत|बजाइए|बजाओ|सुनाइए|सुनाओ|चलाइए|चलाओ|लगाइए|लगाओ|भजन|आरती|कीर्तन|धुन|सुनना/.test(raw)) {
    const cleaned = text
      .replace(/(?:कृपया|का|की|के|गाना|गाने|गीत|संगीत|ट्रैक|बजाइए|बजाओ|चलाइए|चलाओ|सुनाइए|सुनाओ|लगाइए|लगाओ|सुनना है|सुनना|धुन|भजन|आरती)/gi, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .trim();
    return cleaned ? `Play "${cleaned}"` : 'Play peaceful music';
  }
  if (/दवाई|दवा|गोली/.test(raw)) return 'When is my next medicine?';
  if (/क्या करना है|दिनचर्या|शेड्यूल|काम/.test(raw)) return 'What do I have to do today?';
  if (/दिन|तारीख|समय|टाइम|बजे/.test(raw)) return 'What day and time is it today?';
  if (/खेल|गेम|पहेली/.test(raw)) return 'Play gentle games';
  if (/रोक|बंद|पॉज़|पॉज/.test(raw)) return 'Pause music';
  if (/शुरू|चालू|फिर/.test(raw)) return 'Resume music';
  if (/नमस्ते|हेलो/.test(raw)) return 'Hello';
  return 'Processing your question...';
};

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  userName,
  userId,
  routine,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [suggestedAction, setSuggestedAction] = useState<SuggestedAction | null>(null);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showHintBubble, setShowHintBubble] = useState(true);
  const [autoRedirectStatus, setAutoRedirectStatus] = useState<string | null>(null);
  const redirectTimerRef = useRef<any>(null);

  // Auto-detected language ('en' or 'hi')
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi'>(() => {
    try {
      return (localStorage.getItem('neuronova_voice_lang') as 'en' | 'hi') || 'en';
    } catch (_) {
      return 'en';
    }
  });

  const selectedLangRef = useRef<'en' | 'hi'>(selectedLang);
  useEffect(() => {
    selectedLangRef.current = selectedLang;
  }, [selectedLang]);

  const isOpenRef = useRef<boolean>(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const noSpeechRetryCountRef = useRef<number>(0);
  const hasSpokenRef = useRef<boolean>(false);

  const BACKEND_URL = 'http://localhost:5001';

  const recognitionRef = useRef<any>(null);

  // Check Web Speech API availability
  const isSpeechRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // Ensure voices are loaded by the browser
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Text-to-Speech (TTS) synthesizer with gentle, calming voice in English or Hindi
  const speakText = (text: string, langHint?: 'en' | 'hi', onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    try {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.88; // Calm, unhurried pace specifically calibrated for elders
      utterance.pitch = 1.0;

      const isHindi = langHint === 'hi' || /[\u0900-\u097F]/.test(text) || selectedLangRef.current === 'hi';
      const voices = window.speechSynthesis.getVoices();

      if (isHindi) {
        utterance.lang = 'hi-IN';
        const hindiVoice = voices.find(
          (v) =>
            v.lang.startsWith('hi') ||
            (v.lang.includes('IN') &&
              (v.name.includes('Hindi') ||
                v.name.includes('Kalpana') ||
                v.name.includes('Hemant') ||
                v.name.includes('Google') ||
                v.name.includes('हिन्दी')))
        ) || voices.find((v) => v.lang.startsWith('hi'));
        if (hindiVoice) {
          utterance.voice = hindiVoice;
        }
      } else {
        utterance.lang = 'en-IN';
        const naturalVoice = voices.find(
          (v) =>
            (v.lang.startsWith('en') || v.lang.includes('en-IN') || v.lang.includes('en-US')) &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('India') ||
              v.name.includes('Female'))
        ) || voices.find((v) => v.lang.startsWith('en'));
        if (naturalVoice) {
          utterance.voice = naturalVoice;
        }
      }

      let ended = false;
      const handleDone = () => {
        if (!ended) {
          ended = true;
          setIsSpeaking(false);
          if (onEnd) onEnd();
        }
      };

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = handleDone;
      utterance.onerror = handleDone;

      window.speechSynthesis.speak(utterance);

      // Fallback timer: word-count duration so onEnd reliably triggers even if browser skips onend
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const estimatedMs = Math.max(4500, Math.round((wordCount / 2.2) * 1000));
      setTimeout(() => {
        handleDone();
      }, estimatedMs + 1000);
    } catch (_) {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    }
  };

  const stopSpeaking = () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    setAutoRedirectStatus(null);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Start speech recognition in selected language with auto-silence retry resilience
  const startListening = (overrideLang?: 'en' | 'hi') => {
    stopSpeaking();
    setMicError(null);
    setInterimTranscript('');
    hasSpokenRef.current = false;

    if (!isSpeechRecognitionSupported) {
      setMicError('Speech recognition is not supported in this browser. Please tap any question below or type your question.');
      setIsListening(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      const langToUse = overrideLang || selectedLangRef.current;
      // Use hi-IN for Hindi and en-IN for natural Indian/Global English recognition
      recognition.lang = langToUse === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onresult = (event: any) => {
        hasSpokenRef.current = true;
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += text;
          } else {
            interim += text;
          }
        }

        if (interim) {
          // If speech is recognized in Devanagari, avoid flashing Hindi script on screen
          if (/[\u0900-\u097F]/.test(interim)) {
            setInterimTranscript('Listening to your voice...');
          } else {
            setInterimTranscript(interim);
          }
        }

        if (final) {
          setInterimTranscript('');
          const trimmed = final.trim();
          // Never display Hindi Devanagari script on screen; translate in background immediately
          const displayQuery = translateQueryForDisplay(trimmed);
          setTranscript(`"${displayQuery}"`);
          setIsListening(false);
          const lang = detectLanguage(trimmed);
          setSelectedLang(lang);
          selectedLangRef.current = lang;
          try {
            localStorage.setItem('neuronova_voice_lang', lang);
          } catch (_) {}
          void processUserIntent(trimmed, lang);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // If user hasn't started speaking yet and hasn't dismissed, gently restart listening up to 2 times
          if (isOpenRef.current && !hasSpokenRef.current && noSpeechRetryCountRef.current < 2) {
            noSpeechRetryCountRef.current++;
            try {
              recognition.start();
              return;
            } catch (_) {}
          }
          setIsListening(false);
          setMicError("I didn't hear any speech. Speak when ready, or choose a question below.");
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
          setMicError('Microphone access was blocked. Please enable microphone permissions in your browser or tap any question below.');
        } else {
          setIsListening(false);
          setMicError('Could not capture audio. Please tap to speak again or use the questions below.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('[VoiceAssistant] Failed to start recognition:', err);
      setIsListening(false);
      setMicError('Microphone is busy or unavailable. You can tap any question below or type.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
  };



  // Manage modal open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setInterimTranscript('');
      setAssistantReply(null);
      setSuggestedAction(null);
      setMicError(null);
      noSpeechRetryCountRef.current = 0;
      startListening();
    } else {
      stopListening();
      stopSpeaking();
    }

    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [isOpen]);

  // Extract a specific song name from requests like "play Double Take song" or "play Kishore Kumar songs"
  const extractSongName = (q: string): string => {
    let cleaned = q
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/^(?:please\s+)?(?:can\s+you\s+|could\s+you\s+)?play\s+/i, '')
      .replace(/^(?:put\s+on|start|listen\s+to)\s+/i, '')
      .replace(/\s+(?:songs?|tracks?|musics?|videos?)$/i, '')
      .trim();
    // Only return if it's a real song name (not a generic "play music" type request)
    const genericTerms = /^(some\s+)?(music|songs?|song\s+music|tune|tunes|melody|melodies|bhajan|bhajans|raga|sitar|peaceful|relaxing|calming)$/i;
    return genericTerms.test(cleaned) ? '' : cleaned;
  };

  // Local keyword fallback (used when backend unreachable)
  const localFallback = (query: string): { reply: string; spokenReply?: string; action: SuggestedAction | null } => {
    const q = query.toLowerCase().trim();
    const songName = extractSongName(query);
    const isHindi = detectLanguage(query) === 'hi';

    if (songName) {
      const en = `Playing "${songName}" for you now, ${userName}. Settle back and enjoy.`;
      const hi = `आपके लिए "${songName}" बजा रहे हैं, ${userName}। आराम से बैठिए और आनंद लीजिए।`;
      return {
        reply: en,
        spokenReply: isHindi ? hi : en,
        action: {
          label: `Play: ${songName}`,
          url: `http://localhost:5177/?play=${encodeURIComponent(songName)}`,
          icon: 'music',
        },
      };
    }
    if (q.includes('music') || q.includes('song') || q.includes('gaana') || q.includes('sangeet')) {
      const en = `Opening peaceful morning melodies for you now, ${userName}. Settle back and let the soothing music ease your mind.`;
      const hi = `आपके लिए शांत और मधुर संगीत शुरू कर रहे हैं, ${userName}। आराम से बैठिए और संगीत का आनंद लीजिए।`;
      return {
        reply: en,
        spokenReply: isHindi ? hi : en,
        action: { label: 'Open Neuromusic', url: 'http://localhost:5177/', icon: 'music' },
      };
    }
    if (q.includes('game') || q.includes('puzzle') || q.includes('khel')) {
      const en = `Exercising your brain keeps your mind vibrant and happy, ${userName}! Would you like to play some gentle Neurogames?`;
      const hi = `दिमागी खेल आपके मन को चुस्त और खुश रखते हैं, ${userName}! क्या आप न्यूरो-गेम्स खेलना चाहेंगे?`;
      return {
        reply: en,
        spokenReply: isHindi ? hi : en,
        action: { label: 'Play Neurogames', url: 'http://localhost:5178/', icon: 'game' },
      };
    }
    if (q.includes('do today') || q.includes('schedule') || q.includes('routine') || q.includes('kya karna')) {
      const pending = routine.filter((r) => !r.completed);
      if (pending.length > 0) {
        const nextItem = pending[0];
        const en = `Up next at ${nextItem.displayTime} is "${nextItem.title}". ${nextItem.friendlyPrompt || ''} You are doing wonderful today!`;
        const hi = `अगली गतिविधि ${nextItem.displayTime} पर "${nextItem.title}" है। ${nextItem.friendlyPrompt || ''} आप बहुत अच्छा कर रहे हैं!`;
        return {
          reply: en,
          spokenReply: isHindi ? hi : en,
          action: null,
        };
      }
      const en = `You have completed all your planned activities for today, ${userName}! Time for peaceful music or rest.`;
      const hi = `आज के लिए आपकी सभी गतिविधियां पूरी हो चुकी हैं, ${userName}! अब आप शांत संगीत सुन सकते हैं या विश्राम कर सकते हैं।`;
      return {
        reply: en,
        spokenReply: isHindi ? hi : en,
        action: null,
      };
    }
    if (q.includes('medicine') || q.includes('pill') || q.includes('tablet') || q.includes('dawai')) {
      const medItem = routine.find((r) => r.category === 'medicine');
      if (medItem) {
        const en = `Your next medicine is scheduled for ${medItem.displayTime} ("${medItem.title}"). Please have it with a warm glass of water.`;
        const hi = `आपकी अगली दवाई ${medItem.displayTime} ("${medItem.title}") पर है। कृपया इसे पानी के साथ लें।`;
        return {
          reply: en,
          spokenReply: isHindi ? hi : en,
          action: null,
        };
      }
      const en = `All your regular medicines for right now are taken care of, ${userName}.`;
      const hi = `अभी के लिए आपकी सभी नियमित दवाइयाँ ली जा चुकी हैं, ${userName}।`;
      return {
        reply: en,
        spokenReply: isHindi ? hi : en,
        action: null,
      };
    }
    if (q.includes('day') || q.includes('date') || q.includes('time') || q.includes('today') || q.includes('din') || q.includes('tarikh') || q.includes('samay')) {
      const now = new Date();
      const dateStrEn = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      const timeStrEn = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const dateStrHi = now.toLocaleDateString('hi-IN', { weekday: 'long', month: 'long', day: 'numeric' });
      const timeStrHi = now.toLocaleTimeString('hi-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
      const en = `Today is ${dateStrEn}. The time is currently ${timeStrEn}. The morning is calm and gentle.`;
      const hi = `आज ${dateStrHi} है। समय लगभग ${timeStrHi} है। आपका दिन शांत और सुखद रहे।`;
      return {
        reply: en,
        spokenReply: isHindi ? hi : en,
        action: null,
      };
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('namaste')) {
      const en = `Hello, ${userName}! It is wonderful to hear your voice. I am right here beside you.`;
      const hi = `नमस्ते, ${userName}! आपकी आवाज़ सुनकर बहुत खुशी हुई। मैं हमेशा आपके साथ हूँ।`;
      return {
        reply: en,
        spokenReply: isHindi ? hi : en,
        action: null,
      };
    }
    return {
      reply: `I am right here beside you to guide you through your routine, music, or brain games. How can I help?`,
      spokenReply: isHindi ? `मैं आपकी दिनचर्या, दवाइयों, शांत संगीत या खेलों में मदद के लिए यहाँ हूँ।` : `I am right here beside you to guide you through your routine, music, or brain games. How can I help?`,
      action: null,
    };
  };

  // Main intent processor — calls the real AI backend, falls back to local logic
  const processUserIntent = async (query: string, langHint?: 'en' | 'hi') => {
    setIsLoading(true);
    setAssistantReply(null);
    setSuggestedAction(null);
    setLastQuery(query);

    const detected = langHint || detectLanguage(query);
    setSelectedLang(detected);
    selectedLangRef.current = detected;
    try {
      localStorage.setItem('neuronova_voice_lang', detected);
    } catch (_) {}

    const scheduleAutoNavigation = (action: SuggestedAction | null, originalQuery: string, shouldRedirect: boolean) => {
      if (!action?.url || !shouldRedirect) {
        setAutoRedirectStatus(null);
        return undefined;
      }

      // Verify that the action or query indicates music or games
      const q = originalQuery.toLowerCase();
      const userAskedForMusic =
        action.icon === 'music' ||
        q.includes('play') ||
        q.includes('music') ||
        q.includes('song') ||
        q.includes('gaana') ||
        q.includes('geet') ||
        q.includes('sangeet') ||
        q.includes('bhajan') ||
        q.includes('aarti') ||
        q.includes('kirtan') ||
        q.includes('dhun') ||
        q.includes('bajao') ||
        q.includes('chalao') ||
        q.includes('sunao') ||
        q.includes('lagao') ||
        q.includes('sunna');

      const userAskedForGame =
        action.icon === 'game' ||
        q.includes('game') ||
        q.includes('puzzle') ||
        q.includes('khel');

      if (!userAskedForMusic && !userAskedForGame) {
        // User asked about their routine, day, or general thoughts (e.g. "is there anything left?")
        // NEVER auto-redirect!
        setAutoRedirectStatus(null);
        return undefined;
      }

      let url = action.url;
      if (action.icon === 'music' && !url.includes('?play=')) {
        const songName = extractSongName(originalQuery);
        if (songName) {
          url = `http://localhost:5177/?play=${encodeURIComponent(songName)}`;
        }
      }

      setAutoRedirectStatus('🎵 Music will start as soon as guidance finishes speaking...');

      // Return callback to execute ONLY after voice speech synthesis has finished!
      return () => {
        setAutoRedirectStatus('↗ Opening Neuromusic for you now...');
        const userParam = encodeURIComponent(userId || 'guest_user');
        const nameParam = encodeURIComponent(userName || 'Dada Anand');
        const roleParam = encodeURIComponent('patient');
        const sep = url.includes('?') ? '&' : '?';
        const finalUrl = url.includes('userId=')
          ? url
          : `${url}${sep}userId=${userParam}&name=${nameParam}&role=${roleParam}`;

        // Directly navigate the active tab so modern browsers NEVER block it as a popup!
        window.location.href = finalUrl;
      };
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${BACKEND_URL}/api/voice-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          userId: userId || 'default-patient',
          userName,
          language: detected,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Backend HTTP ${res.status}`);

      const data = await res.json();
      const isHindi = Boolean(
        data.isHindi || data.language === 'hi' || /[\u0900-\u097F]/.test(query)
      );
      setSelectedLang(isHindi ? 'hi' : 'en');
      selectedLangRef.current = isHindi ? 'hi' : 'en';
      try {
        localStorage.setItem('neuronova_voice_lang', isHindi ? 'hi' : 'en');
      } catch (_) {}

      // Update transcript with English translated question if returned by backend
      if (data.translatedQuestion) {
        setTranscript(`"${data.translatedQuestion}"`);
      }

      // UI screen display is GUARANTEED 100% English
      const replyCandidate = data.displayReply || data.reply;
      const cleanEnglishReply: string =
        replyCandidate && !/[\u0900-\u097F]/.test(replyCandidate)
          ? replyCandidate
          : `I am right here with you, ${userName}. How can I help you today?`;
      let action: SuggestedAction | null = data.suggestedAction || null;

      const qLower = query.toLowerCase();
      const transLower = (data.translatedQuestion || '').toLowerCase();
      const userAskedForMusic =
        data.suggestedAction?.icon === 'music' ||
        data.intent === 'play_specific_song' ||
        data.intent === 'play_general_music' ||
        Boolean(data.autoRedirect) ||
        qLower.includes('play') ||
        qLower.includes('music') ||
        qLower.includes('song') ||
        qLower.includes('gaana') ||
        qLower.includes('geet') ||
        qLower.includes('sangeet') ||
        qLower.includes('bhajan') ||
        qLower.includes('aarti') ||
        qLower.includes('kirtan') ||
        qLower.includes('dhun') ||
        qLower.includes('bajao') ||
        qLower.includes('chalao') ||
        qLower.includes('sunao') ||
        qLower.includes('lagao') ||
        qLower.includes('sunna') ||
        transLower.includes('play') ||
        transLower.includes('music') ||
        transLower.includes('song') ||
        transLower.includes('bhajan') ||
        transLower.includes('aarti') ||
        transLower.includes('listen');

      const userAskedForGame =
        data.suggestedAction?.icon === 'game' ||
        data.intent === 'game_inquiry' ||
        qLower.includes('game') ||
        qLower.includes('puzzle') ||
        qLower.includes('khel') ||
        transLower.includes('game');

      if (!action && userAskedForMusic) {
        const trackTitle = data.track?.title ? data.track.title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim() : '';
        const rawSong = trackTitle || (data.translatedQuestion ? extractSongName(data.translatedQuestion) : '') || extractSongName(query);
        const songName = rawSong.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
        action = {
          label: songName ? `Play: ${songName}` : 'Open Neuromusic',
          url: songName ? `http://localhost:5177/?play=${encodeURIComponent(songName)}` : 'http://localhost:5177/',
          icon: 'music',
        };
      }

      const shouldAutoRedirect = Boolean(
        data.autoRedirect ||
        (data.source === 'action_execution' && (data.intent === 'play_specific_song' || data.intent === 'play_general_music')) ||
        (action && (userAskedForMusic || userAskedForGame))
      );

      setAssistantReply(cleanEnglishReply);
      setSuggestedAction(action);

      const onSpeechEnd = scheduleAutoNavigation(action, query, shouldAutoRedirect);
      // Audio speech output in user's spoken language (Hindi if user spoke Hindi)
      speakText(data.spokenReply || cleanEnglishReply, isHindi ? 'hi' : 'en', onSpeechEnd);
    } catch (err: any) {
      console.warn('[VoiceAssistant] Backend unreachable, using local fallback:', err.message || err);
      // Local fallback so the feature always works even when backend is down
      const { reply, spokenReply, action } = localFallback(query);
      const isHindi = detectLanguage(query) === 'hi';
      setSelectedLang(isHindi ? 'hi' : 'en');
      selectedLangRef.current = isHindi ? 'hi' : 'en';
      setAssistantReply(reply);
      setSuggestedAction(action);

      const qLower = query.toLowerCase();
      const askedMusic = (qLower.includes('play') || qLower.includes('start')) && (qLower.includes('music') || qLower.includes('song') || qLower.includes('gaana'));
      const askedGame = qLower.includes('game') || qLower.includes('puzzle') || qLower.includes('khel');
      const shouldRedirect = Boolean(action && (askedMusic || askedGame));
      const onSpeechEnd = scheduleAutoNavigation(action, query, shouldRedirect);
      speakText(spokenReply || reply, isHindi ? 'hi' : 'en', onSpeechEnd);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    { title: 'What do I have to do today?', sub: 'Check daily schedule & routine' },
    { title: 'When is my next medicine?', sub: 'Friendly reminder & timing' },
    { title: 'What day is it today?', sub: 'Gentle date & time orientation' },
    { title: 'Play peaceful music', sub: 'Calm sitar & relaxation melodies' },
  ];

  const handleSelectPrompt = (prompt: string) => {
    stopListening();
    setTranscript(`"${prompt}"`);
    setInterimTranscript('');
    void processUserIntent(prompt);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    stopListening();
    const query = textInput.trim();
    setTextInput('');
    const displayQuery = translateQueryForDisplay(query);
    setTranscript(`"${displayQuery}"`);
    setInterimTranscript('');
    void processUserIntent(query);
  };

  return (
    <>
      {/* 1. Floating Microphone Button with Onboarding Hint */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end pointer-events-auto">
        {/* Onboarding Hint Tooltip Bubble */}
        {showHintBubble && !isOpen && (
          <div className="mb-3 max-w-xs bg-white text-[#1A202C] px-4 py-2.5 rounded-2xl shadow-warm-lg border-2 border-forest-300 flex items-center space-x-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-forest-600 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">
              Try asking: <span className="text-forest-700 font-bold">"What do I have to do today?"</span>
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHintBubble(false);
              }}
              className="text-[#1A202C]/50 hover:text-[#1A202C] p-1 ml-1 cursor-pointer"
              aria-label="Dismiss voice prompt tip"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Large Floating Mic Button (64x64px touch target) */}
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-forest-600 hover:bg-forest-700 text-white flex items-center justify-center shadow-warm-lg hover:shadow-2xl active:scale-95 transition-all duration-300 border-4 border-[#FAF7F2] relative group focus-visible:ring-4 focus-visible:ring-forest-400 cursor-pointer"
          aria-label="Open Voice Assistant for hands-free help"
          title="Voice Assistant"
        >
          {/* Subtle warm animated pulsing aura */}
          <span className="absolute inset-0 rounded-full bg-forest-500 opacity-30 animate-ping pointer-events-none" />
          <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white group-hover:scale-110 transition-transform duration-200" />
        </button>
      </div>

      {/* 2. Warm Bottom Sheet / Listening Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end justify-center transition-opacity p-0 sm:p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl border-t sm:border-2 border-forest-300 p-6 sm:p-8 shadow-2xl animate-slide-up flex flex-col max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="voice-assistant-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-forest-100 border border-forest-300 flex items-center justify-center text-forest-700 shadow-xs">
                  <MessageSquareHeart className="w-6 h-6" />
                </div>
                <div>
                  <h3 id="voice-assistant-title" className="text-xl sm:text-2xl font-extrabold text-[#1A202C] font-brand-heading">
                    NeuroNova Voice Companion
                  </h3>
                  <p className="text-xs sm:text-sm text-forest-700 font-semibold font-brand-body">
                    Always here to listen and guide you gently
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-cream-200 hover:bg-cream-300 text-[#1A202C] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close voice assistant"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Listening / Speaking State Box */}
            <div className="my-5 py-6 bg-white rounded-3xl border border-forest-200/80 shadow-inner flex flex-col items-center justify-center px-4 text-center">
              {isListening ? (
                <>
                  {/* Visualizer Waveform Bars */}
                  <div className="flex items-center justify-center space-x-2 h-14 mb-4">
                    <span className="w-2.5 bg-forest-600 rounded-full animate-voice-bar-1" />
                    <span className="w-2.5 bg-forest-500 rounded-full animate-voice-bar-2" />
                    <span className="w-2.5 bg-muga-500 rounded-full animate-voice-bar-3" />
                    <span className="w-2.5 bg-river-500 rounded-full animate-voice-bar-4" />
                    <span className="w-2.5 bg-forest-600 rounded-full animate-voice-bar-5" />
                    <span className="w-2.5 bg-muga-400 rounded-full animate-voice-bar-6" />
                  </div>
                  <p className="text-xl font-bold text-forest-800 font-brand-heading">
                    Listening to your voice...
                  </p>
                  <p className="text-sm text-[#1A202C]/70 font-brand-body mt-1">
                    {interimTranscript ? (
                      <span className="text-forest-700 font-semibold italic">"{interimTranscript}..."</span>
                    ) : (
                      'Speak naturally. There is no hurry.'
                    )}
                  </p>
                </>
              ) : micError ? (
                <div className="flex flex-col items-center px-4 py-2">
                  <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mb-2">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-[#1A202C] max-w-md">
                    {micError}
                  </p>
                  <button
                    onClick={() => startListening()}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-forest-600 text-white text-xs font-bold flex items-center space-x-1.5 hover:bg-forest-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Microphone Again</span>
                  </button>
                </div>
              ) : transcript ? (
                <div className="w-full text-left px-2 sm:px-4">
                  <span className="text-xs font-bold text-forest-700 uppercase tracking-wider block mb-1">
                    You asked:
                  </span>
                  <p className="text-lg font-bold text-[#1A202C] font-brand-heading italic mb-4">
                    {transcript}
                  </p>

                  {/* Loading spinner while waiting for AI response */}
                  {isLoading && (
                    <div className="flex flex-col items-center py-6 space-y-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-forest-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-forest-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-forest-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <p className="text-sm text-forest-700 font-semibold">
                        Thinking of a gentle reply...
                      </p>
                    </div>
                  )}

                  {assistantReply && (
                    <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 flex flex-col space-y-3">
                      <div className="flex items-start justify-between space-x-3">
                        <div className="flex items-start space-x-3">
                          <Volume2 className="w-6 h-6 text-forest-600 shrink-0 mt-0.5" />
                          <p className="text-base sm:text-lg font-semibold text-forest-900 leading-relaxed font-brand-body">
                            {assistantReply}
                          </p>
                        </div>
                        {/* Audio replay / mute toggle */}
                        <button
                          onClick={() => {
                            if (isSpeaking) {
                              stopSpeaking();
                            } else {
                              speakText(assistantReply);
                            }
                          }}
                          className="p-2 rounded-xl bg-white border border-forest-200 text-forest-700 hover:bg-forest-100 transition-colors shrink-0 cursor-pointer"
                          title={isSpeaking ? 'Mute speech' : 'Replay voice'}
                        >
                          {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Direct App Link Action Card (e.g. Neuromusic or Neurogames) */}
                      {suggestedAction && (
                        <div className="pt-2 border-t border-forest-200/60 flex flex-col items-end space-y-1">
                          <button
                            onClick={() => {
                              let url = suggestedAction.url;
                              if (suggestedAction.icon === 'music') {
                                const cleaned = lastQuery
                                  .replace(/^(please\s+)?(can\s+you\s+)?play\s+/i, '')
                                  .replace(/^(put\s+on|start|play\s+song)\s+/i, '')
                                  .trim();
                                const generic = /^(some\s+)?(music|songs?|tune|melody|bhajan|raga|sitar|peaceful|relaxing|calming)$/i;
                                if (cleaned && !generic.test(cleaned)) {
                                  url = `http://localhost:5177/?play=${encodeURIComponent(cleaned)}`;
                                }
                              }
                              window.open(url, '_blank');
                            }}
                            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 active:scale-98 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                          >
                            {suggestedAction.icon === 'music' && <Music className="w-4 h-4" />}
                            {suggestedAction.icon === 'game' && <Gamepad2 className="w-4 h-4" />}
                            <span>{suggestedAction.label}</span>
                            <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
                          </button>
                          {autoRedirectStatus && (
                            <p className="text-xs text-forest-600 font-semibold animate-pulse">
                              {autoRedirectStatus}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-base font-semibold text-[#1A202C]/70">
                  Tap any prompt below or speak naturally.
                </p>
              )}
            </div>

            {/* Quick Suggested Voice Prompts */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1A202C]/60 block mb-2 font-brand-body">
                Or tap a helpful question:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {samplePrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPrompt(item.title)}
                    className="min-h-[56px] p-3 text-left rounded-2xl bg-cream-50 hover:bg-forest-100 border border-forest-200 hover:border-forest-400 text-forest-900 transition-all duration-200 flex items-center space-x-2.5 active:scale-98 cursor-pointer group"
                  >
                    <Sparkles className="w-4 h-4 text-forest-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm sm:text-base leading-snug">"{item.title}"</span>
                      <span className="text-[11px] font-medium text-forest-700/80 mt-0.5">{item.sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Text Input Fallback (Type a question anytime) */}
            <form onSubmit={handleSendText} className="mt-4 flex items-center space-x-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Ask anything (e.g. 'what is my schedule?' or 'play peaceful music')..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-forest-200 focus:outline-none focus:border-forest-500 text-sm text-[#1A202C] placeholder-[#1A202C]/50"
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 disabled:opacity-40 text-white text-sm font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Ask</span>
              </button>
            </form>

            {/* Bottom Actions */}
            <div className="mt-5 pt-4 border-t border-[#E8DFD1] flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    setTranscript('');
                    setAssistantReply(null);
                    setSuggestedAction(null);
                    startListening();
                  }
                }}
                className="w-full sm:w-auto min-h-[52px] px-6 py-2.5 rounded-2xl bg-forest-100 hover:bg-forest-200 text-forest-800 font-bold text-base flex items-center justify-center space-x-2 border border-forest-300 transition-colors active:scale-98 cursor-pointer"
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5 text-forest-700" />
                    <span>Pause Listening</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 text-forest-700" />
                    <span>Tap to Speak Again</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto min-h-[52px] px-8 py-2.5 rounded-2xl bg-forest-600 hover:bg-forest-700 text-white font-extrabold text-base shadow-warm-sm transition-colors active:scale-98 cursor-pointer"
              >
                Done Listening
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
