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
  ExternalLink,
  Globe,
  Radio,
  CheckCircle2,
  ArrowLeft,
  Square,
  HeartHandshake,
  Loader2
} from 'lucide-react';
import { RoutineItem } from '../types';
import { BACKEND_URL, NEUROGAMES_URL } from '../config/urls';
import { LanguageSelectionModal, LanguageCode } from './LanguageSelectionModal';
import { CallModal } from './CallModal';
import { useLanguage } from '../context/LanguageContext';

interface VoiceAssistantProps {
  userName: string;
  userId?: string;
  routine?: RoutineItem[];
  onTriggerCall?: () => void;
}

interface SuggestedAction {
  label: string;
  url: string;
  icon: 'music' | 'game';
}

export type ActionStage = 'idle' | 'listening' | 'understanding' | 'doing' | 'done';

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  userName,
  userId = 'default-patient',
  routine: _routine = [],
  onTriggerCall: _onTriggerCall,
}) => {
  const { language: contextLang, setLanguage: setContextLang } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [suggestedAction, setSuggestedAction] = useState<SuggestedAction | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [actionStage, setActionStage] = useState<ActionStage>('idle');
  const [autoRedirectStatus, setAutoRedirectStatus] = useState<string | null>(null);

  // Modal & Mode controls
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  // Integrated Caregiver Voice Messaging State
  const [isCaregiverMessageMode, setIsCaregiverMessageMode] = useState(false);
  const [caregiverMsgRecording, setCaregiverMsgRecording] = useState(false);
  const [caregiverMsgSeconds, setCaregiverMsgSeconds] = useState(0);
  const [caregiverMsgTranscript, setCaregiverMsgTranscript] = useState('');
  const [caregiverMsgBlob, setCaregiverMsgBlob] = useState<Blob | null>(null);
  const [caregiverMsgAudioUrl, setCaregiverMsgAudioUrl] = useState<string | null>(null);
  const [isSendingCaregiverMsg, setIsSendingCaregiverMsg] = useState(false);
  const [caregiverMsgSentSuccess, setCaregiverMsgSentSuccess] = useState(false);
  const [caregiverMsgError, setCaregiverMsgError] = useState<string | null>(null);

  const caregiverMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const caregiverAudioChunksRef = useRef<Blob[]>([]);
  const caregiverTimerRef = useRef<any>(null);
  const caregiverRecognitionRef = useRef<any>(null);

  // Language preference ('en' | 'hi' | 'hinglish')
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(() => {
    try {
      const stored = localStorage.getItem('neuronova_voice_lang') as LanguageCode;
      return stored && ['en', 'hi', 'hinglish'].includes(stored) ? stored : (contextLang || 'hinglish');
    } catch (_) {
      return contextLang || 'hinglish';
    }
  });

  useEffect(() => {
    if (contextLang && contextLang !== selectedLang) {
      setSelectedLang(contextLang);
      selectedLangRef.current = contextLang;
    }
  }, [contextLang]);

  const selectedLangRef = useRef<LanguageCode>(selectedLang);
  useEffect(() => {
    selectedLangRef.current = selectedLang;
  }, [selectedLang]);

  // Hover voice suggestions
  const [isMicHovered, setIsMicHovered] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  const hoverSuggestions: Record<LanguageCode, string[]> = {
    hinglish: [
      'Dawa kab leni hai?',
      'Shant music play karo',
      'Aaj ka routine kya hai?',
      'Caregiver ko call lagao',
      'Ek pyari si kahani sunao',
    ],
    hi: [
      'मेरी दवाई का समय कब है?',
      'कोई शांत भजन या संगीत बजाओ',
      'आज मेरा क्या शेड्यूल है?',
      'केयरगिवर को कॉल करो',
      'एक सुंदर कहानी सुनाइए',
    ],
    en: [
      'When is my next medication?',
      'Play some relaxing music',
      'What is my routine today?',
      'Call my caregiver',
      'Tell me an uplifting story',
    ],
  };

  const activeSuggestions = hoverSuggestions[selectedLang] || hoverSuggestions.hinglish;

  useEffect(() => {
    const timer = setInterval(() => {
      setSuggestionIndex((prev) => (prev + 1) % activeSuggestions.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [activeSuggestions.length]);

  // Check first-time language onboarding and sync with backend
  useEffect(() => {
    try {
      const onboarded = localStorage.getItem('neuronova_language_onboarded');
      const stored = localStorage.getItem('neuronova_voice_lang');
      // If already marked onboarded OR has stored voice language, NEVER prompt automatically
      if (onboarded === 'true' || (stored && ['en', 'hi', 'hinglish'].includes(stored))) {
        return;
      }
    } catch (_) {}

    // Check backend to see if user has already set their preference in the database
    if (userId) {
      fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/user/${userId}/language`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.language && ['en', 'hi', 'hinglish'].includes(data.language)) {
            // Already configured on backend! Save to localStorage and DO NOT open modal.
            setSelectedLang(data.language);
            selectedLangRef.current = data.language;
            try {
              localStorage.setItem('neuronova_voice_lang', data.language);
              localStorage.setItem('neuronova_language_onboarded', 'true');
            } catch (_) {}
          } else {
            // Truly first time ever across both localStorage and backend
            setIsLanguageModalOpen(true);
          }
        })
        .catch(() => {
          setIsLanguageModalOpen(true);
        });
    } else {
      setIsLanguageModalOpen(true);
    }
  }, [userId]);

  // Listen for language modal trigger from System Controls header
  useEffect(() => {
    const handleOpenLanguage = () => {
      setIsLanguageModalOpen(true);
    };
    window.addEventListener('neuronova:open-language-modal', handleOpenLanguage);
    return () => {
      window.removeEventListener('neuronova:open-language-modal', handleOpenLanguage);
    };
  }, []);

  const isOpenRef = useRef<boolean>(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const noSpeechRetryCountRef = useRef<number>(0);
  const hasSpokenRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const redirectTimerRef = useRef<any>(null);

  // Patient coordinates
  const patientCoordsRef = useRef<{ latitude?: number; longitude?: number }>({});
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          patientCoordsRef.current = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
        },
        () => {},
        { timeout: 6000, maximumAge: 600000 }
      );
    }
  }, []);

  const isSpeechRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Text-to-Speech (TTS) synthesizer in English, Hindi, or Hinglish
  const speakText = (text: string, langHint?: LanguageCode, onEnd?: () => void) => {
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
      utterance.rate = 0.88; // Gentle elderly pace
      utterance.pitch = 1.0;

      const currentL = langHint || selectedLangRef.current;
      const isHindiScript = /[\u0900-\u097F]/.test(text) || currentL === 'hi';
      const voices = window.speechSynthesis.getVoices();

      if (isHindiScript) {
        utterance.lang = 'hi-IN';
        const hindiVoice = voices.find(
          (v) =>
            v.lang.startsWith('hi') ||
            (v.lang.includes('IN') && (v.name.includes('Hindi') || v.name.includes('Kalpana') || v.name.includes('हिन्दी')))
        ) || voices.find((v) => v.lang.startsWith('hi'));
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        utterance.lang = 'en-IN';
        const naturalVoice = voices.find(
          (v) =>
            (v.lang.startsWith('en') || v.lang.includes('IN')) &&
            (v.name.includes('Natural') || v.name.includes('India') || v.name.includes('Google') || v.name.includes('Female'))
        ) || voices.find((v) => v.lang.startsWith('en'));
        if (naturalVoice) utterance.voice = naturalVoice;
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

  // ============================================================================
  // INTEGRATED CAREGIVER VOICE MESSAGING
  // ============================================================================

  const startCaregiverRecording = async () => {
    stopSpeaking();
    setCaregiverMsgError(null);
    setCaregiverMsgTranscript('');
    setCaregiverMsgBlob(null);
    setCaregiverMsgAudioUrl(null);
    caregiverAudioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      caregiverMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          caregiverAudioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const fullBlob = new Blob(caregiverAudioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setCaregiverMsgBlob(fullBlob);
        setCaregiverMsgAudioUrl(URL.createObjectURL(fullBlob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(250);
      setCaregiverMsgRecording(true);
      setCaregiverMsgSeconds(0);

      if (caregiverTimerRef.current) clearInterval(caregiverTimerRef.current);
      caregiverTimerRef.current = setInterval(() => {
        setCaregiverMsgSeconds((prev) => prev + 1);
      }, 1000);

      // Speech Recognition for live transcript
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        caregiverRecognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLangRef.current === 'hi' ? 'hi-IN' : 'en-IN';

        recognition.onresult = (e: any) => {
          let currentTranscript = '';
          for (let i = 0; i < e.results.length; i++) {
            currentTranscript += e.results[i][0].transcript;
          }
          setCaregiverMsgTranscript(currentTranscript);
        };

        recognition.start();
      }
    } catch (err: any) {
      console.error('[Voice Assistant] Caregiver mic access failed:', err);
      setCaregiverMsgError('Microphone access unavailable. Please check microphone permissions.');
      setCaregiverMsgRecording(false);
    }
  };

  const stopCaregiverRecording = () => {
    if (caregiverTimerRef.current) {
      clearInterval(caregiverTimerRef.current);
      caregiverTimerRef.current = null;
    }
    if (caregiverMediaRecorderRef.current && caregiverMediaRecorderRef.current.state === 'recording') {
      caregiverMediaRecorderRef.current.stop();
    }
    if (caregiverRecognitionRef.current) {
      try {
        caregiverRecognitionRef.current.stop();
      } catch (_) {}
    }
    setCaregiverMsgRecording(false);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const sendCaregiverMessage = async () => {
    if (!caregiverMsgBlob && !caregiverMsgTranscript) {
      setCaregiverMsgError('Please speak a message before sending.');
      return;
    }

    stopCaregiverRecording();
    setIsSendingCaregiverMsg(true);
    setCaregiverMsgError(null);

    try {
      let audioBase64 = '';
      if (caregiverMsgBlob) {
        audioBase64 = await blobToBase64(caregiverMsgBlob);
      }

      const response = await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: userId,
          patientName: userName,
          caregiverId: 'user_caregiver',
          transcript: caregiverMsgTranscript || 'Voice message',
          audioBase64,
          durationSeconds: caregiverMsgSeconds || 5,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send voice message');
      }

      setCaregiverMsgSentSuccess(true);

      // Play spoken confirmation
      const confirmText =
        selectedLang === 'hi'
          ? 'आपका संदेश आपके केयरगिवर को भेज दिया गया है।'
          : selectedLang === 'hinglish'
          ? 'Aapka voice message caregiver ko bhej diya gaya hai.'
          : 'Your voice message has been delivered to your caregiver.';
      speakText(confirmText, selectedLang);

      // Auto-return smoothly after 2.5s
      setTimeout(() => {
        setIsCaregiverMessageMode(false);
        setCaregiverMsgSentSuccess(false);
        setCaregiverMsgTranscript('');
        setCaregiverMsgBlob(null);
        setCaregiverMsgAudioUrl(null);
        setCaregiverMsgSeconds(0);
        setActionStage('idle');
      }, 2500);
    } catch (err: any) {
      console.error('[Voice Assistant] Send voice note error:', err);
      setCaregiverMsgError('Could not send message. Please check your connection.');
    } finally {
      setIsSendingCaregiverMsg(false);
    }
  };

  const openIntegratedCaregiverMessenger = () => {
    if (isListening) {
      try {
        if (recognitionRef.current) recognitionRef.current.abort();
      } catch (_) {}
      setIsListening(false);
    }
    stopSpeaking();
    setIsCaregiverMessageMode(true);
    setCaregiverMsgSentSuccess(false);
    setCaregiverMsgError(null);
    setCaregiverMsgTranscript('');
    setCaregiverMsgBlob(null);
    setCaregiverMsgAudioUrl(null);
    setCaregiverMsgSeconds(0);

    // Speak natural transition hint then start recording
    const introText =
      selectedLang === 'hi'
        ? 'आप अपना संदेश बोलिए, मैं आपके केयरगिवर को भेज दूँगा।'
        : selectedLang === 'hinglish'
        ? 'Aap apna message boliye, main aapke caregiver ko bhej dunga.'
        : 'Please speak your message for your caregiver.';
    speakText(introText, selectedLang, () => {
      startCaregiverRecording();
    });
  };

  const closeCaregiverMessageMode = () => {
    stopCaregiverRecording();
    setIsCaregiverMessageMode(false);
    setCaregiverMsgSentSuccess(false);
    setCaregiverMsgError(null);
    setCaregiverMsgTranscript('');
    setCaregiverMsgBlob(null);
    setCaregiverMsgAudioUrl(null);
    setCaregiverMsgSeconds(0);
    setActionStage('idle');
  };

  // Start speech recognition in selected language
  const startListening = () => {
    stopSpeaking();
    setMicError(null);
    setInterimTranscript('');
    setActionStage('listening');
    hasSpokenRef.current = false;

    if (!isSpeechRecognitionSupported) {
      setMicError('Speech recognition is not supported in this browser. Please tap any question below.');
      setIsListening(false);
      setActionStage('idle');
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
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 5; // collect top-5 hypotheses for best-pick

      // Locale: Hindi (hi-IN) or Indian English/Hinglish (en-IN)
      recognition.lang = selectedLangRef.current === 'hi' ? 'hi-IN' : 'en-IN';

      // ── Phonetic normalizer for common Indian-accent mishearings ──────────────
      const normalizeSpeech = (text: string): string => {
        let t = text.trim();
        // Common mishearings → correct form
        const fixes: [RegExp, string][] = [
          [/\bmedison\b/gi, 'medicine'],
          [/\bmedicine\b/gi, 'medicine'],
          [/\bdawai\b/gi, 'dawai'],
          [/\bdawa\b/gi, 'dawa'],
          [/\bgoli\b/gi, 'goli'],
          [/\bkhaana\b/gi, 'khana'],
          [/\bkarna\b/gi, 'karna'],
          [/\bnext level\b/gi, 'next level'],
          [/\bnextel\b/gi, 'next level'],
          [/\bnextlevel\b/gi, 'next level'],
          [/\bhome page\b/gi, 'homepage'],
          [/\bgo back\b/gi, 'go back home'],
          [/\bplay music\b/gi, 'play music'],
          [/\bplay some music\b/gi, 'play music'],
          [/\bcaregiver col\b/gi, 'call caregiver'],
          [/\bcare giver\b/gi, 'caregiver'],
          [/\bcaregever\b/gi, 'caregiver'],
          [/\bcare lever\b/gi, 'caregiver'],
          [/\bkol karo\b/gi, 'call karo'],
          [/\bcol karo\b/gi, 'call karo'],
          [/\bwether\b/gi, 'weather'],
          [/\bweathe\b/gi, 'weather'],
          [/\bwhat is weather\b/gi, 'what is the weather'],
          [/\bschedule\b/gi, 'schedule'],
          [/\broutin\b/gi, 'routine'],
          [/\brootine\b/gi, 'routine'],
          [/\breminder\b/gi, 'reminder'],
          [/\bkhabar\b/gi, 'khabar'],
          [/\btell me story\b/gi, 'tell me a story'],
          [/\bstory sunao\b/gi, 'story sunao'],
          [/\bexersice\b/gi, 'exercise'],
          [/\bexercice\b/gi, 'exercise'],
          [/\bbreakfest\b/gi, 'breakfast'],
        ];
        fixes.forEach(([re, replacement]) => { t = t.replace(re, replacement); });
        return t;
      };

      // ── Pick best hypothesis from top-N alternatives ──────────────────────────
      const pickBestAlternative = (results: SpeechRecognitionResultList, resultIndex: number): string => {
        // Collect all final result alternatives
        const candidates: Array<{ text: string; confidence: number }> = [];
        for (let i = resultIndex; i < results.length; ++i) {
          if (results[i].isFinal) {
            for (let j = 0; j < results[i].length; j++) {
              const alt = results[i][j];
              candidates.push({ text: alt.transcript, confidence: alt.confidence || 0 });
            }
          }
        }
        if (candidates.length === 0) return '';
        // Score each: prefer high confidence AND recognized action keywords
        const actionKeywords = [
          'medicine','dawai','dawa','goli','music','game','games','call','caregiver',
          'weather','routine','schedule','story','exercise','khana','nashta','paani',
          'water','next','level','home','message','bhejo','karo','chalao','sunao',
          'बताओ','दवाई','दवा','गोली','खाना','पानी','कॉल','संगीत','खेल'
        ];
        let best = candidates[0];
        let bestScore = -1;
        for (const c of candidates) {
          const normalized = normalizeSpeech(c.text.toLowerCase());
          const keywordHits = actionKeywords.filter(k => normalized.includes(k)).length;
          const score = (c.confidence * 10) + keywordHits;
          if (score > bestScore) {
            bestScore = score;
            best = c;
          }
        }
        return normalizeSpeech(best.text.trim());
      };

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
        setActionStage('listening');
      };

      recognition.onresult = (event: any) => {
        hasSpokenRef.current = true;
        let interim = '';

        // Show interim from best alternative
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (!event.results[i].isFinal) {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        // Check for any final result — pick best alternative
        const hasFinal = Array.from({ length: event.results.length - event.resultIndex },
          (_, k) => event.results[event.resultIndex + k].isFinal).some(Boolean);

        if (hasFinal) {
          const best = pickBestAlternative(event.results, event.resultIndex);
          if (best) {
            setInterimTranscript('');
            setTranscript(`"${best}"`);
            setIsListening(false);
            setActionStage('understanding');
            void processUserIntent(best);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          if (isOpenRef.current && !hasSpokenRef.current && noSpeechRetryCountRef.current < 2) {
            noSpeechRetryCountRef.current++;
            try {
              recognition.start();
              return;
            } catch (_) {}
          }
          setIsListening(false);
          setActionStage('idle');
          setMicError("I couldn't hear you clearly. Tap the microphone or choose a question below.");
        } else if (event.error === 'not-allowed') {
          setIsListening(false);
          setActionStage('idle');
          setMicError('Microphone permission is blocked. Please enable it in browser settings.');
        } else {
          setIsListening(false);
          setActionStage('idle');
          setMicError('Could not capture audio. Please tap to speak again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setActionStage('idle');
      setMicError('Failed to activate microphone.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
    }
    setIsListening(false);
  };

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setInterimTranscript('');
      setAssistantReply(null);
      setSuggestedAction(null);
      setMicError(null);
      setActionStage('idle');
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

  // Main intent processor
  const processUserIntent = async (query: string) => {
    setIsLoading(true);
    setActionStage('understanding');
    setAssistantReply(null);
    setSuggestedAction(null);

    try {
      const res = await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/voice-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          userId,
          userName,
          language: selectedLangRef.current,
          latitude: patientCoordsRef.current.latitude,
          longitude: patientCoordsRef.current.longitude,
        }),
      });

      if (!res.ok) throw new Error(`Backend HTTP ${res.status}`);

      const data = await res.json();
      const reply = data.displayReply || data.reply || 'I am right here with you.';
      const spoken = data.spokenReply || reply;

      setAssistantReply(reply);
      setSuggestedAction(data.suggestedAction || null);

      // Handle Action Directives
      if (data.actionDirective === 'START_SEQUENTIAL_GAMES') {
        setActionStage('doing');
        setAutoRedirectStatus('🎮 Starting your daily cognitive games session...');
        speakText(spoken, selectedLangRef.current, () => {
          setTimeout(() => {
            window.location.href = `${NEUROGAMES_URL}/?mode=sequential&session=new&userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(userName)}`;
          }, 1200);
        });
        return;
      }

      if (
        data.actionDirective === 'OPEN_VOICE_MESSENGER' ||
        query.toLowerCase().includes('message') ||
        query.toLowerCase().includes('bhejo') ||
        query.toLowerCase().includes('caregiver ko message')
      ) {
        setActionStage('doing');
        openIntegratedCaregiverMessenger();
        return;
      }

      if (data.actionDirective === 'START_CALL') {
        setActionStage('doing');
        speakText(spoken, selectedLangRef.current, () => {
          setIsCallModalOpen(true);
        });
        return;
      }

      if (data.autoRedirect && data.suggestedAction?.url) {
        setActionStage('doing');
        setAutoRedirectStatus('↗ Opening for you now...');
        speakText(spoken, selectedLangRef.current, () => {
          setTimeout(() => {
            window.location.href = data.suggestedAction.url;
          }, 1200);
        });
        return;
      }

      setActionStage('done');
      speakText(spoken, selectedLangRef.current);
    } catch (err: any) {
      console.warn('[Voice Assistant] Backend request failed. Using deterministic fallback.');
      setActionStage('done');
      const fallbackReply = selectedLangRef.current === 'hi'
        ? `मैं आपकी सहायता के लिए यहाँ हूँ, ${userName}।`
        : selectedLangRef.current === 'hinglish'
        ? `Main aapke saath hoon, ${userName}. Aap bataiye main kya help karoon?`
        : `I am right here beside you, ${userName}. How can I assist you today?`;

      setAssistantReply(fallbackReply);
      speakText(fallbackReply, selectedLangRef.current);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (promptText: string) => {
    if (
      promptText.includes('मैसेज') ||
      promptText.toLowerCase().includes('message') ||
      promptText.toLowerCase().includes('bhejo')
    ) {
      openIntegratedCaregiverMessenger();
      return;
    }
    setTranscript(`"${promptText}"`);
    void processUserIntent(promptText);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const q = textInput.trim();
    setTextInput('');
    setTranscript(`"${q}"`);
    void processUserIntent(q);
  };

  // Sample prompts localized according to selected language
  const getLocalizedPrompts = () => {
    if (selectedLang === 'hi') {
      return [
        { title: 'आज मुझे क्या करना है?', sub: 'दैनिक दिनचर्या और काम' },
        { title: 'मेरी अगली दवाई कब है?', sub: 'दवाई का निर्धारित समय' },
        { title: 'मैंने दवाई ले ली', sub: 'कार्य पूरा दर्ज करें' },
        { title: 'मुझे गेम खेलना है', sub: 'दिमागी खेल शुरू करें' },
        { title: 'केयरगिवर को कॉल करो', sub: 'लाइव कॉल कनेक्ट करें' },
        { title: 'केयरगिवर को मैसेज भेजो', sub: 'वॉइस मैसेज भेजें' },
      ];
    }
    if (selectedLang === 'hinglish') {
      return [
        { title: 'Aaj mujhe kya karna hai?', sub: 'Daily routine schedule' },
        { title: 'Meri next medicine kab hai?', sub: 'Upcoming medicine time' },
        { title: 'Maine medicine le li', sub: 'Mark medicine completed' },
        { title: 'Mujhe game khelna hai', sub: 'Start brain games' },
        { title: 'Caregiver ko call karo', sub: 'Call your caregiver' },
        { title: 'Caregiver ko message bhejo', sub: 'Send a voice message' },
      ];
    }
    return [
      { title: 'What do I have to do today?', sub: "View today's routine" },
      { title: 'When is my next medicine?', sub: 'Next medication time' },
      { title: 'I completed my medicine', sub: 'Mark task as completed' },
      { title: 'I want to play games', sub: 'Start daily brain exercises' },
      { title: 'Call my caregiver', sub: 'Initiate caregiver call' },
      { title: 'Send message to caregiver', sub: 'Send a voice recording' },
    ];
  };

  const samplePrompts = getLocalizedPrompts();

  const getLanguageLabel = () => {
    if (selectedLang === 'hi') return 'हिन्दी';
    if (selectedLang === 'hinglish') return 'Hinglish';
    return 'English';
  };

  return (
    <>
      {/* 1. First-Time / On-Demand Language Selection Modal */}
      <LanguageSelectionModal
        isOpen={isLanguageModalOpen}
        currentLanguage={selectedLang}
        onSelectLanguage={(lang) => {
          setSelectedLang(lang);
          selectedLangRef.current = lang;
          setContextLang(lang);
        }}
        onClose={() => {
          setIsLanguageModalOpen(false);
          try {
            localStorage.setItem('neuronova_language_onboarded', 'true');
            if (selectedLang) {
              localStorage.setItem('neuronova_voice_lang', selectedLang);
            }
          } catch (_) {}
        }}
        userId={userId}
      />


      {/* 3. Real-Time WebRTC Call Modal */}
      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        patientId={userId}
        patientName={userName}
      />

      {/* Floating Action Center (Bottom Right) */}
      <div
        className={`fixed bottom-6 right-6 flex items-center gap-3 flex-row-reverse ${isCallModalOpen ? 'z-30' : 'z-40'}`}
        onMouseEnter={() => setIsMicHovered(true)}
        onMouseLeave={() => setIsMicHovered(false)}
      >
        {/* Large Floating Mic Button (64x64px touch target) */}
        <button
          onClick={() => setIsOpen(true)}
          onFocus={() => setIsMicHovered(true)}
          onBlur={() => setIsMicHovered(false)}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-all duration-300 border-4 border-white relative focus-visible:ring-4 focus-visible:ring-amber-400 cursor-pointer shrink-0 group"
          aria-label="Open Voice Assistant"
          title="Voice Assistant - Tap to speak"
        >
          <span className="absolute inset-0 rounded-full bg-amber-400 opacity-30 animate-ping pointer-events-none" />
          <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white group-hover:scale-110 transition-transform duration-200" />
        </button>

        {/* Hover Suggestion Bubble: "Try asking: ..." */}
        <div
          className={`transition-all duration-300 transform group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 group-hover:pointer-events-auto ${
            isMicHovered
              ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto'
              : 'opacity-0 translate-x-3 scale-95 pointer-events-none'
          }`}
          aria-live="polite"
        >
          <div
            onClick={() => setIsOpen(true)}
            className="cursor-pointer bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-amber-200/90 text-slate-800 flex flex-col gap-1 min-w-[210px] max-w-[290px] relative hover:border-amber-400 transition-colors"
          >
            {/* Header: Sparkles + "Try asking:" */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Try asking:</span>
            </div>

            {/* Dynamic rotating suggestion */}
            <p className="text-sm font-bold text-slate-800 leading-snug">
              "{activeSuggestions[suggestionIndex % activeSuggestions.length]}"
            </p>

            {/* Hint */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-amber-100/70">
              <span className="text-amber-600 font-semibold">Tap to speak</span>
              <span>NeuroNova</span>
            </div>

            {/* Speech bubble arrow pointing right towards the mic */}
            <div className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-t border-r border-amber-200/90 rotate-45" />
          </div>
        </div>
      </div>

      {/* Main Voice Assistant Modal */}
      {isOpen && (
        <div
          className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn ${isCallModalOpen ? 'z-30' : 'z-50'}`}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-gradient-to-b from-white to-amber-50/40 rounded-t-3xl sm:rounded-3xl border-t sm:border-2 border-amber-200 p-6 sm:p-8 shadow-2xl animate-slide-up flex flex-col max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="voice-assistant-title"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
                  <MessageSquareHeart className="w-6 h-6" />
                </div>
                <div>
                  <h3 id="voice-assistant-title" className="text-xl sm:text-2xl font-bold text-slate-900 font-brand">
                    NeuroNova Voice Companion
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-600 font-medium">
                      {selectedLang === 'hi' ? 'हमेशा आपके साथ' : 'Always here to listen and assist you'}
                    </span>
                    <button
                      onClick={() => setIsLanguageModalOpen(true)}
                      className="text-xs px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold flex items-center gap-1 transition-colors"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Language: {getLanguageLabel()}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                aria-label="Close voice assistant"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {isCaregiverMessageMode ? (
              /* Integrated Caregiver Voice Messenger View */
              <div className="my-4 flex flex-col items-center animate-fadeIn">
                {/* Mode Top Bar */}
                <div className="w-full flex items-center justify-between pb-3 border-b border-amber-200/70 mb-4">
                  <button
                    type="button"
                    onClick={closeCaregiverMessageMode}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-amber-400 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{selectedLang === 'hi' ? 'वापस' : 'Back'}</span>
                  </button>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/90 px-3.5 py-1 rounded-full border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                    <HeartHandshake className="w-3.5 h-3.5 text-amber-700" />
                    <span>{selectedLang === 'hi' ? 'केयरगिवर को वॉइस मैसेज' : 'Voice Message to Caregiver'}</span>
                  </span>
                  <div className="w-16" />
                </div>

                {caregiverMsgSentSuccess ? (
                  <div className="w-full py-8 px-6 bg-emerald-50 rounded-3xl border-2 border-emerald-300 text-center flex flex-col items-center gap-3 animate-fadeIn">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="text-xl font-black text-emerald-950 font-brand">
                      {selectedLang === 'hi' ? 'संदेश सफलतापूर्वक भेज दिया गया!' : 'Message Sent to Caregiver!'}
                    </h4>
                    <p className="text-sm font-semibold text-emerald-800 max-w-md">
                      {selectedLang === 'hi'
                        ? 'आपका वॉइस नोट आपके केयरगिवर के डैशबोर्ड पर सुरक्षित रूप से पहुँच गया है।'
                        : 'Your voice note and speech transcript have been safely delivered to your caregiver.'}
                    </p>
                    <button
                      type="button"
                      onClick={closeCaregiverMessageMode}
                      className="mt-3 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                    >
                      {selectedLang === 'hi' ? 'वापस जाएँ (Done)' : 'Return to Companion'}
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center gap-4">
                    {/* Big Interactive Recording Button */}
                    <div className="relative flex flex-col items-center my-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (caregiverMsgRecording) {
                            stopCaregiverRecording();
                          } else {
                            startCaregiverRecording();
                          }
                        }}
                        className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 border-4 shadow-2xl active:scale-95 cursor-pointer relative ${
                          caregiverMsgRecording
                            ? 'bg-gradient-to-tr from-rose-500 to-amber-500 border-white text-white animate-pulse'
                            : 'bg-gradient-to-tr from-amber-500 to-orange-500 border-amber-200 text-white hover:scale-105'
                        }`}
                        title={caregiverMsgRecording ? 'Tap to finish recording' : 'Tap to start recording'}
                      >
                        {caregiverMsgRecording && (
                          <span className="absolute inset-0 rounded-full bg-rose-400 opacity-40 animate-ping pointer-events-none" />
                        )}
                        {caregiverMsgRecording ? (
                          <>
                            <Square className="w-10 h-10 text-white fill-current mb-1" />
                            <span className="text-[11px] font-black uppercase tracking-wider">Tap to Stop</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-10 h-10 text-white mb-1" />
                            <span className="text-[11px] font-black uppercase tracking-wider">Tap to Speak</span>
                          </>
                        )}
                      </button>

                      {/* Elapsed Timer / Status Pill */}
                      <div className="mt-3 flex items-center gap-2">
                        {caregiverMsgRecording ? (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                            Recording Live: {Math.floor(caregiverMsgSeconds / 60)}:{String(caregiverMsgSeconds % 60).padStart(2, '0')}s
                          </span>
                        ) : caregiverMsgSeconds > 0 ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                            Recorded: {caregiverMsgSeconds}s
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">
                            {selectedLang === 'hi' ? 'बोलने के लिए माइक दबाएँ' : 'Tap microphone to speak'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Live Transcript / Speech Bubble */}
                    <div className="w-full p-4 rounded-2xl bg-white border border-amber-200 shadow-sm text-left">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
                        <span className="uppercase tracking-wider">
                          {selectedLang === 'hi' ? 'आपका संदेश:' : 'Your spoken message:'}
                        </span>
                        {caregiverMsgAudioUrl && (
                          <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Audio recorded</span>
                          </span>
                        )}
                      </div>

                      <p className="text-base sm:text-lg font-medium text-slate-800 italic min-h-[52px] leading-relaxed">
                        {caregiverMsgTranscript ? (
                          `"${caregiverMsgTranscript}"`
                        ) : caregiverMsgRecording ? (
                          <span className="text-amber-600 font-semibold animate-pulse">
                            {selectedLang === 'hi' ? 'सुन रहे हैं... बोलिए...' : 'Listening... Speak your message naturally...'}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">
                            {selectedLang === 'hi'
                              ? 'माइक दबाकर बोलिए (जैसे "राहुल, मैं ठीक हूँ, बस याद आ रही थी")'
                              : 'Tap microphone and speak (e.g. "Rahul, I took my medicines and am doing fine")'}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Error Banner if any */}
                    {caregiverMsgError && (
                      <div className="w-full p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{caregiverMsgError}</span>
                      </div>
                    )}

                    {/* Caregiver Messenger Actions */}
                    <div className="w-full pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={closeCaregiverMessageMode}
                          className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
                        >
                          {selectedLang === 'hi' ? 'रद्द करें' : 'Cancel'}
                        </button>
                        {(caregiverMsgTranscript || caregiverMsgBlob) && (
                          <button
                            type="button"
                            onClick={() => {
                              stopCaregiverRecording();
                              setCaregiverMsgTranscript('');
                              setCaregiverMsgBlob(null);
                              setCaregiverMsgAudioUrl(null);
                              setCaregiverMsgSeconds(0);
                              startCaregiverRecording();
                            }}
                            className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{selectedLang === 'hi' ? 'फिर से बोलें' : 'Re-record'}</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={sendCaregiverMessage}
                        disabled={isSendingCaregiverMsg || (!caregiverMsgTranscript && !caregiverMsgBlob)}
                        className="w-full sm:w-auto min-h-[48px] px-8 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-40 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                      >
                        {isSendingCaregiverMsg ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{selectedLang === 'hi' ? 'भेज रहे हैं...' : 'Sending message...'}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>{selectedLang === 'hi' ? 'केयरगिवर को भेजें' : 'Send to Caregiver'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Standard Voice Assistant Pipeline View */
              <>
                {/* Stage Progress Pipeline Indicator */}
                <div className="mt-4 px-2 flex items-center justify-between text-xs font-bold text-slate-500 bg-white/70 rounded-xl p-2 border border-amber-100">
                  <div className={`flex items-center gap-1.5 ${actionStage === 'listening' ? 'text-amber-600 font-extrabold' : ''}`}>
                    <Mic className="w-3.5 h-3.5" />
                    <span>1. Listening</span>
                  </div>
                  <span className="text-slate-300">→</span>
                  <div className={`flex items-center gap-1.5 ${actionStage === 'understanding' ? 'text-amber-600 font-extrabold' : ''}`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>2. Understanding</span>
                  </div>
                  <span className="text-slate-300">→</span>
                  <div className={`flex items-center gap-1.5 ${actionStage === 'doing' ? 'text-amber-600 font-extrabold' : ''}`}>
                    <Radio className="w-3.5 h-3.5" />
                    <span>3. Doing</span>
                  </div>
                  <span className="text-slate-300">→</span>
                  <div className={`flex items-center gap-1.5 ${actionStage === 'done' ? 'text-emerald-600 font-extrabold' : ''}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>4. Done</span>
                  </div>
                </div>

                {/* Listening / Speaking State Box */}
                <div className="my-4 py-6 bg-white rounded-3xl border border-amber-200/80 shadow-inner flex flex-col items-center justify-center px-4 text-center">
                  {isListening ? (
                    <>
                      <div className="flex items-center justify-center space-x-2 h-14 mb-3">
                        <span className="w-2.5 bg-amber-500 rounded-full animate-voice-bar-1" />
                        <span className="w-2.5 bg-orange-500 rounded-full animate-voice-bar-2" />
                        <span className="w-2.5 bg-amber-600 rounded-full animate-voice-bar-3" />
                        <span className="w-2.5 bg-yellow-500 rounded-full animate-voice-bar-4" />
                        <span className="w-2.5 bg-orange-600 rounded-full animate-voice-bar-5" />
                      </div>
                      <p className="text-xl font-bold text-slate-800 font-brand">
                        {selectedLang === 'hi' ? 'आपकी आवाज़ सुन रहे हैं...' : 'Listening to your voice...'}
                      </p>
                      <p className="text-sm text-slate-500 mt-1 font-medium">
                        {interimTranscript ? (
                          <span className="text-amber-700 font-semibold italic">"{interimTranscript}..."</span>
                        ) : (
                          selectedLang === 'hi' ? 'सहज रूप से बोलिए। कोई जल्दी नहीं है।' : 'Speak naturally. There is no hurry.'
                        )}
                      </p>
                    </>
                  ) : micError ? (
                    <div className="flex flex-col items-center px-4 py-2">
                      <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mb-2">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800 max-w-md">{micError}</p>
                      <button
                        onClick={() => startListening()}
                        className="mt-3 px-4 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-amber-700 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Try Microphone Again</span>
                      </button>
                    </div>
                  ) : transcript ? (
                    <div className="w-full text-left px-2 sm:px-4">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">
                        {selectedLang === 'hi' ? 'आपने पूछा:' : 'You asked:'}
                      </span>
                      <p className="text-lg font-bold text-slate-900 font-brand italic mb-3">
                        {transcript}
                      </p>

                      {/* Loading indicator */}
                      {isLoading && (
                        <div className="flex items-center gap-2 py-4 text-amber-600 font-bold text-sm">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          <span>{selectedLang === 'hi' ? 'समझ रहे हैं...' : 'Understanding and acting...'}</span>
                        </div>
                      )}

                      {/* Assistant Reply Card */}
                      {assistantReply && (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <Volume2 className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                              <p className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed font-brand">
                                {assistantReply}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                if (isSpeaking) {
                                  stopSpeaking();
                                } else {
                                  speakText(assistantReply, selectedLang);
                                }
                              }}
                              className="p-2 rounded-xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors shrink-0 cursor-pointer"
                              title={isSpeaking ? 'Mute' : 'Replay'}
                            >
                              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Action trigger button */}
                          {suggestedAction && (
                            <div className="pt-2 border-t border-amber-200 flex flex-col items-end gap-1">
                              <button
                                onClick={() => {
                                  window.location.href = suggestedAction.url;
                                }}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                              >
                                {suggestedAction.icon === 'music' && <Music className="w-4 h-4" />}
                                {suggestedAction.icon === 'game' && <Gamepad2 className="w-4 h-4" />}
                                <span>{suggestedAction.label}</span>
                                <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
                              </button>
                              {autoRedirectStatus && (
                                <p className="text-xs text-amber-700 font-semibold animate-pulse">
                                  {autoRedirectStatus}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-base font-semibold text-slate-600">
                      {selectedLang === 'hi'
                        ? 'नीचे दिए गए किसी भी प्रश्न पर टैप करें या बोलें।'
                        : selectedLang === 'hinglish'
                        ? 'Neeche diye gaye questions par tap karein ya natural bolein.'
                        : 'Tap any prompt below or speak naturally.'}
                    </p>
                  )}
                </div>

                {/* Direct 1-Tap Shortcut to Caregiver Voice Messenger */}
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={openIntegratedCaregiverMessenger}
                    className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-100/90 via-orange-100/80 to-amber-100/90 hover:from-amber-200 hover:to-orange-200 border border-amber-300 text-slate-900 transition-all flex items-center justify-between gap-3 shadow-xs active:scale-99 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                        <HeartHandshake className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-sm text-slate-900 block font-brand leading-tight">
                          {selectedLang === 'hi' ? 'केयरगिवर को वॉइस मैसेज भेजें' : 'Send Voice Note to Caregiver'}
                        </span>
                        <span className="text-[11px] text-amber-900/70 font-medium">
                          {selectedLang === 'hi' ? 'अपनी आवाज़ में बात रिकॉर्ड करके भेजें' : 'Record and send a personal spoken update'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-white/90 px-3 py-1 rounded-xl border border-amber-200 shrink-0">
                      {selectedLang === 'hi' ? 'रिकॉर्ड करें →' : 'Record →'}
                    </span>
                  </button>
                </div>

                {/* Quick Suggested Voice Prompts */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    {selectedLang === 'hi' ? 'या इन आसान प्रश्नों पर टैप करें:' : 'Helpful actions and questions:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {samplePrompts.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPrompt(item.title)}
                        className="min-h-[54px] p-3 text-left rounded-2xl bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-400 text-slate-900 transition-all flex items-center gap-2.5 active:scale-98 cursor-pointer group shadow-sm"
                      >
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col">
                          <span className="font-bold text-sm leading-snug">"{item.title}"</span>
                          <span className="text-[11px] font-medium text-slate-500 mt-0.5">{item.sub}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Input Fallback */}
                <form onSubmit={handleSendText} className="mt-4 flex items-center gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={
                      selectedLang === 'hi'
                        ? 'यहाँ कुछ भी पूछें (जैसे "मेरी अगली दवाई कब है?")...'
                        : selectedLang === 'hinglish'
                        ? 'Yahan type karein (jaise "meri next medicine kab hai?")...'
                        : 'Type anything (e.g. "when is my next medicine?")...'
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-amber-500 text-sm text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Ask</span>
                  </button>
                </form>

                {/* Bottom Actions */}
                <div className="mt-5 pt-4 border-t border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                    className="w-full sm:w-auto min-h-[50px] px-6 py-2 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-base flex items-center justify-center gap-2 border border-amber-300 transition-colors active:scale-98 cursor-pointer"
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-5 h-5" />
                        <span>Pause Listening</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        <span>Tap to Speak Again</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full sm:w-auto min-h-[50px] px-8 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-md transition-colors active:scale-98 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
