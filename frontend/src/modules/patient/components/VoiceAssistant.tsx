import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Music,
  Gamepad2,
  Send,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Globe,
  CheckCircle2,
  ArrowLeft,
  Square,
  HeartHandshake,
  Loader2,
  Settings
} from 'lucide-react';
import { RoutineItem } from '../types';
import { BACKEND_URL, NEUROGAMES_URL } from '../config/urls';
import { LanguageSelectionModal, LanguageCode } from './LanguageSelectionModal';
import { CallModal } from './CallModal';
import { useLanguage } from '../context/LanguageContext';
import { FluidVoiceOrb } from './FluidVoiceOrb';

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
  const [_actionStage, setActionStage] = useState<ActionStage>('idle');
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

    const qLower = query.toLowerCase().trim();

    // Direct Interactive Voice Language Switches
    if (
      qLower.includes('speak in hindi') ||
      qLower.includes('hindi me bolo') ||
      qLower.includes('hindi mein bolo') ||
      qLower.includes('hindi me baat') ||
      qLower.includes('switch to hindi') ||
      qLower.includes('hindi please') ||
      qLower.includes('हिन्दी में बोलो') ||
      qLower.includes('हिंदी में बोलो')
    ) {
      setSelectedLang('hi');
      selectedLangRef.current = 'hi';
      try {
        localStorage.setItem('neuronova_voice_lang', 'hi');
      } catch (_) {}
      const reply = `नमस्ते, ${patientDisplayName}! अब मैं आपसे हिन्दी में बात करूँगी। बताइए, मैं आपकी क्या सहायता करूँ?`;
      setAssistantReply(reply);
      setIsLoading(false);
      speakText(reply, 'hi');
      return;
    }

    if (
      qLower.includes('speak in english') ||
      qLower.includes('switch to english') ||
      qLower.includes('talk in english') ||
      qLower.includes('english please')
    ) {
      setSelectedLang('en');
      selectedLangRef.current = 'en';
      try {
        localStorage.setItem('neuronova_voice_lang', 'en');
      } catch (_) {}
      const reply = `Certainly, ${patientDisplayName}! I am now speaking with you in English. How can I assist you today?`;
      setAssistantReply(reply);
      setIsLoading(false);
      speakText(reply, 'en');
      return;
    }

    if (
      qLower.includes('speak in hinglish') ||
      qLower.includes('switch to hinglish') ||
      qLower.includes('hinglish please')
    ) {
      setSelectedLang('hinglish');
      selectedLangRef.current = 'hinglish';
      try {
        localStorage.setItem('neuronova_voice_lang', 'hinglish');
      } catch (_) {}
      const reply = `Zaroor, ${patientDisplayName}! Ab hum Hinglish mein baat karenge. Bataiye main aapki kya help karoon?`;
      setAssistantReply(reply);
      setIsLoading(false);
      speakText(reply, 'hinglish');
      return;
    }

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
      const qLower = query.toLowerCase();
      let fallbackReply = '';
      if (qLower.includes('story') || qLower.includes('kahani') || qLower.includes('tale') || qLower.includes('uplifting')) {
        fallbackReply = selectedLangRef.current === 'hi'
          ? `एक बार एक छोटे से पौधे ने सूरज से पूछा, 'आप रोज रोशनी क्यों देते हैं?' सूरज ने कहा, 'ताकि सबमें उम्मीद बनी रहे।' उसी तरह, ${userName}, आप भी अपनों के जीवन में उम्मीद और रोशनी हैं।`
          : `Once in a quiet garden, a sunflower turned faithfully toward the morning light, reminding everyone that every new day brings fresh hope and purpose. Like that flower, ${userName}, your gentle spirit brings warmth to those around you today.`;
      } else if (qLower.includes('joke') || qLower.includes('funny') || qLower.includes('chutkula')) {
        fallbackReply = selectedLangRef.current === 'hi'
          ? `दादी जी दीवार घड़ी पर क्यों बैठ गईं? ताकि वे चाय के लिए बिल्कुल 'टाइम पर' रहें! मुस्कुराते रहिए, ${userName}।`
          : `Why did the grandmother sit on her clock? Because she wanted to be on time for her afternoon tea! I hope that brought a smile to your face, ${userName}.`;
      } else {
        fallbackReply = selectedLangRef.current === 'hi'
          ? `मैं आपकी सहायता के लिए हमेशा यहाँ हूँ, ${userName}। आज का दिन बहुत शांत और सुखद है।`
          : selectedLangRef.current === 'hinglish'
          ? `Main aapke saath hoon, ${userName}. Aap bataiye main kya help karoon?`
          : `I am right here with you, ${userName}. Tell me more, or let me know how I can make your day peaceful.`;
      }

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

  const patientDisplayName = React.useMemo(() => {
    if (!userName) return 'Friend';
    const first = userName.split(/[._\s]/)[0];
    if (!first) return 'Friend';
    return first.charAt(0).toUpperCase() + first.slice(1);
  }, [userName]);

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

      {/* Main Full-Page Voice Assistant */}
      {isOpen && (
        <div
          className={`fixed inset-0 bg-[#060A17] text-white flex flex-col justify-between p-4 sm:p-8 select-none overflow-y-auto animate-fadeIn ${
            isCallModalOpen ? 'z-30' : 'z-50'
          }`}
          style={{
            background:
              'radial-gradient(circle at 50% 36%, #0d1738 0%, #060a17 65%, #020409 100%)',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-assistant-title"
        >
          {/* Top Bar: Settings / Language Header */}
          <div className="w-full flex items-center justify-between z-10">
            {/* Left: Branding & Status */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-200 tracking-wide block">
                  NeuroNova AI
                </span>
                <span className="text-[10px] text-blue-400/80 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isListening ? 'Listening live...' : 'Active Companion'}
                </span>
              </div>
            </div>

            {/* Right: Language Pill & Settings Gear */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLanguageModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Change Voice Language"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>{getLanguageLabel()}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLanguageModalOpen(true)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Stage (Center Orb + Fluid Speech Interface) */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full my-auto px-4 py-4 z-10">
            {isCaregiverMessageMode ? (
              /* Caregiver Voice Note Recording Mode in Dark Aesthetic */
              <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 flex flex-col items-center shadow-2xl animate-fadeIn">
                {/* Header */}
                <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <button
                    type="button"
                    onClick={closeCaregiverMessageMode}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{selectedLang === 'hi' ? 'वापस' : 'Back'}</span>
                  </button>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-300 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
                    <span>{selectedLang === 'hi' ? 'केयरगिवर को संदेश' : 'Message to Caregiver'}</span>
                  </span>
                  <div className="w-12" />
                </div>

                {caregiverMsgSentSuccess ? (
                  <div className="w-full py-8 text-center flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shadow-lg animate-bounce">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-white">
                      {selectedLang === 'hi' ? 'संदेश सफलतापूर्वक भेज दिया गया!' : 'Message Sent to Caregiver!'}
                    </h4>
                    <p className="text-xs text-slate-300 max-w-xs">
                      {selectedLang === 'hi'
                        ? 'आपका वॉइस नोट आपके केयरगिवर के डैशबोर्ड पर पहुँच गया है।'
                        : 'Your voice note has been safely delivered to your caregiver.'}
                    </p>
                    <button
                      type="button"
                      onClick={closeCaregiverMessageMode}
                      className="mt-2 px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                    >
                      {selectedLang === 'hi' ? 'वापस जाएँ (Done)' : 'Return to Companion'}
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center gap-4">
                    {/* Record Button */}
                    <div className="relative flex flex-col items-center my-2">
                      {caregiverMsgRecording && (
                        <span className="absolute -inset-2 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (caregiverMsgRecording) stopCaregiverRecording();
                          else startCaregiverRecording();
                        }}
                        className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 border-2 shadow-2xl active:scale-95 cursor-pointer relative ${
                          caregiverMsgRecording
                            ? 'bg-rose-600 border-rose-300 text-white animate-pulse'
                            : 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white'
                        }`}
                      >
                        {caregiverMsgRecording ? (
                          <>
                            <Square className="w-6 h-6 fill-current mb-0.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Stop</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-7 h-7 mb-0.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Record</span>
                          </>
                        )}
                      </button>

                      {/* Timer */}
                      <div className="mt-3">
                        {caregiverMsgRecording ? (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-200 text-xs font-semibold border border-rose-500/30 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                            Recording: {Math.floor(caregiverMsgSeconds / 60)}:
                            {String(caregiverMsgSeconds % 60).padStart(2, '0')}s
                          </span>
                        ) : caregiverMsgSeconds > 0 ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                            Recorded: {caregiverMsgSeconds}s
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            {selectedLang === 'hi' ? 'बोलने के लिए माइक दबाएँ' : 'Tap microphone to speak'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Live Transcript Bubble */}
                    <div className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                        <span className="uppercase tracking-wider">
                          {selectedLang === 'hi' ? 'आपका संदेश:' : 'Your message:'}
                        </span>
                        {caregiverMsgAudioUrl && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Audio ready</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-200 italic min-h-[40px] leading-relaxed line-clamp-2">
                        {caregiverMsgTranscript ? (
                          `"${caregiverMsgTranscript}"`
                        ) : caregiverMsgRecording ? (
                          <span className="text-cyan-300 font-normal animate-pulse">
                            {selectedLang === 'hi'
                              ? 'सुन रहे हैं... बोलिए...'
                              : 'Listening... speak your message naturally...'}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-normal">
                            {selectedLang === 'hi'
                              ? 'माइक दबाकर बोलिए...'
                              : 'Tap microphone and speak your message...'}
                          </span>
                        )}
                      </p>
                    </div>

                    {caregiverMsgError && (
                      <div className="w-full p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{caregiverMsgError}</span>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="w-full pt-1 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={closeCaregiverMessageMode}
                          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
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
                            className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 text-cyan-300 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{selectedLang === 'hi' ? 'फिर से बोलें' : 'Re-record'}</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={sendCaregiverMessage}
                        disabled={isSendingCaregiverMsg || (!caregiverMsgTranscript && !caregiverMsgBlob)}
                        className="h-9 px-5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {isSendingCaregiverMsg ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{selectedLang === 'hi' ? 'संदेश भेजें' : 'Send'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Voice Companion Center View matching user screenshot */
              <>
                {/* Audio-Reactive Fluid Voice Orb (Interactive on inputs & outputs) */}
                <FluidVoiceOrb
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  isLoading={isLoading}
                  size={210}
                />

                {/* Typography Below Orb */}
                {isListening ? (
                  <div className="text-center mt-5 sm:mt-7 animate-fadeIn">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold animate-pulse mb-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>{selectedLang === 'hi' ? 'आपकी आवाज़ सुन रहे हैं...' : 'Listening to your voice...'}</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-normal text-white tracking-tight">
                      I'm listening, {patientDisplayName}...
                    </h2>
                    <p className="text-lg sm:text-2xl font-light text-slate-300 mt-2 min-h-[36px]">
                      {interimTranscript ? (
                        <span className="text-cyan-300 italic font-medium">"{interimTranscript}..."</span>
                      ) : (
                        selectedLang === 'hi' ? 'आप क्या कहना चाहते हैं?' : "What's on your mind?"
                      )}
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="text-center mt-5 sm:mt-7 animate-fadeIn">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-semibold animate-pulse mb-2">
                      <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                      <span>{selectedLang === 'hi' ? 'विचार कर रहे हैं...' : 'Processing answer...'}</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-normal text-white tracking-tight flex items-center justify-center gap-2.5">
                      <span>Thinking...</span>
                    </h2>
                    <p className="text-base sm:text-xl font-light text-slate-300 mt-2 italic">
                      "{transcript.replace(/^"|"$/g, '')}"
                    </p>
                  </div>
                ) : assistantReply ? (
                  <div className="w-full max-w-xl flex flex-col items-center mt-4 text-center animate-fadeIn">
                    {isSpeaking ? (
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-semibold animate-pulse mb-2">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{selectedLang === 'hi' ? 'उत्तर बोल रहे हैं...' : 'Speaking answer...'}</span>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1.5">
                        {selectedLang === 'hi' ? 'आपने पूछा:' : 'You asked:'} "{transcript.replace(/^"|"$/g, '')}"
                      </p>
                    )}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-left w-full shadow-2xl relative">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-base sm:text-lg text-slate-100 font-normal leading-relaxed">
                          {assistantReply}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (isSpeaking) stopSpeaking();
                            else speakText(assistantReply, selectedLang);
                          }}
                          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all shrink-0 cursor-pointer"
                          title={isSpeaking ? 'Mute' : 'Replay'}
                        >
                          {isSpeaking ? (
                            <VolumeX className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {suggestedAction && (
                        <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = suggestedAction.url;
                            }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                          >
                            {suggestedAction.icon === 'music' && <Music className="w-3.5 h-3.5" />}
                            {suggestedAction.icon === 'game' && <Gamepad2 className="w-3.5 h-3.5" />}
                            <span>{suggestedAction.label}</span>
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                          </button>
                          {autoRedirectStatus && (
                            <p className="text-xs text-cyan-300 font-medium animate-pulse">
                              {autoRedirectStatus}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick follow-up action */}
                    <button
                      type="button"
                      onClick={() => {
                        setTranscript('');
                        setAssistantReply(null);
                        setSuggestedAction(null);
                        startListening();
                      }}
                      className="mt-3 px-4 py-1.5 rounded-full bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{selectedLang === 'hi' ? 'अगला सवाल पूछें' : 'Ask another question'}</span>
                    </button>
                  </div>
                ) : micError ? (
                  <div className="flex flex-col items-center mt-5 text-center animate-fadeIn">
                    <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                    <p className="text-sm sm:text-base text-slate-200 max-w-md">{micError}</p>
                    <button
                      type="button"
                      onClick={() => startListening()}
                      className="mt-3 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="text-center mt-5 sm:mt-7 animate-fadeIn">
                    <h2 className="text-2xl sm:text-4xl font-normal text-white tracking-tight">
                      I'm listening, {patientDisplayName}...
                    </h2>
                    <p className="text-lg sm:text-2xl font-light text-slate-300 mt-2">
                      {selectedLang === 'hi' ? 'आप क्या कहना चाहते हैं?' : "What's on your mind?"}
                    </p>
                  </div>
                )}

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-xl">
                  {samplePrompts.slice(0, 4).map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPrompt(item.title)}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-sm text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-md"
                    >
                      "{item.title}"
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={openIntegratedCaregiverMessenger}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs text-rose-300 hover:text-rose-200 transition-all cursor-pointer"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
                    <span>{selectedLang === 'hi' ? 'केयरगिवर को वॉइस नोट' : 'Voice Note to Caregiver'}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Bottom Dock / Floating Pill Controls (matching reference image) */}
          <div className="w-full flex flex-col items-center gap-3 pt-3 pb-2 sm:pb-4 z-10">
            {/* Minimalist typed query input bar */}
            <form onSubmit={handleSendText} className="flex items-center gap-2 max-w-md w-full px-4">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  selectedLang === 'hi'
                    ? 'या यहाँ कुछ लिखकर पूछें...'
                    : selectedLang === 'hinglish'
                    ? 'Ya yahan type karke poochein...'
                    : 'Or type a question here...'
                }
                className="flex-1 h-9 px-4 rounded-full bg-white/5 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 backdrop-blur-md"
              />
              {textInput.trim() && (
                <button
                  type="submit"
                  className="h-9 px-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Bottom Dual Pill Container */}
            <div className="bg-[#121829]/90 backdrop-blur-2xl border border-white/10 p-2 rounded-full flex items-center gap-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
              {/* Circular Close Button (X) */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-12 h-12 rounded-full bg-[#1b233a] hover:bg-[#253050] text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                aria-label="Close voice assistant"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Circular Microphone Toggle Button */}
              <button
                type="button"
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
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                  isListening
                    ? 'bg-blue-600 text-white shadow-[0_0_24px_rgba(37,99,235,0.7)] animate-pulse'
                    : 'bg-[#202b48] hover:bg-[#2c3b64] text-slate-200 hover:text-white'
                }`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
                title={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
