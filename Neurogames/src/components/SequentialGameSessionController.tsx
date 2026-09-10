import React, { useState, useEffect, useRef } from 'react';
import { GameType, GameResult } from '../types';
import { MemoryMatchGame } from '../games/MemoryMatchGame';
import { AttentionGame } from '../games/AttentionGame';
import { SequenceRecallGame } from '../games/SequenceRecallGame';
import { Trophy, Mic, Home, Sparkles, CheckCircle2 } from 'lucide-react';
import { persistGameResult } from '../services/gamePersistence';
import { HOMEPAGE_URL } from '../config/urls';

interface SequentialGameSessionControllerProps {
  onExitToHub: () => void;
  userId?: string;
  userName?: string;
  language?: 'en' | 'hi' | 'hinglish';
}

interface CompletedGameRecord {
  gameType: GameType;
  title: string;
  accuracy: number;
  responseTimeMs: number;
  level: number;
}

const SEQUENTIAL_GAMES: { type: GameType; title: string }[] = [
  { type: 'memoryMatch', title: 'Memory Match' },
  { type: 'attentionGame', title: 'Attention Focus' },
  { type: 'sequenceRecall', title: 'Sequence Recall' },
];

export const SequentialGameSessionController: React.FC<SequentialGameSessionControllerProps> = ({
  onExitToHub,
  userName = 'Friend',
  language: initialLang = 'hinglish',
}) => {
  const [sessionLevel, setSessionLevel] = useState(1);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [completedGames, setCompletedGames] = useState<CompletedGameRecord[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [latestTranscript, setLatestTranscript] = useState<string>('');

  const transitionTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const isSessionCompleteRef = useRef(false);
  const sessionLevelRef = useRef(1);
  const isSpeakingRef = useRef(false);
  const isActionInProgressRef = useRef(false);
  const isMountedRef = useRef(true);

  const language = initialLang || (localStorage.getItem('neuronova_voice_lang') as any) || 'hinglish';

  // Keep refs in sync for voice recognition callbacks
  useEffect(() => {
    isSessionCompleteRef.current = isSessionComplete;
  }, [isSessionComplete]);

  useEffect(() => {
    sessionLevelRef.current = sessionLevel;
  }, [sessionLevel]);

  const speak = (text: string, onEnd?: () => void) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        isSpeakingRef.current = true;
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.95;
        utter.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        utter.onend = () => {
          isSpeakingRef.current = false;
          if (onEnd) onEnd();
        };
        utter.onerror = () => {
          isSpeakingRef.current = false;
          if (onEnd) onEnd();
        };
        window.speechSynthesis.speak(utter);
      } else {
        if (onEnd) onEnd();
      }
    } catch (_) {
      isSpeakingRef.current = false;
      if (onEnd) onEnd();
    }
  };

  const restartTimerRef = useRef<any>(null);

  // Stop any active SpeechRecognition instance cleanly
  const stopRecognition = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      const oldRec = recognitionRef.current;
      recognitionRef.current = null;
      try {
        oldRec.onend = null;
        oldRec.onerror = null;
        oldRec.onresult = null;
        oldRec.abort();
      } catch (_) {}
    }
    if (isMountedRef.current) {
      setIsVoiceListening(false);
    }
  };

  // Actions for the two options
  const handleGoHomepage = () => {
    if (isActionInProgressRef.current) return;
    isActionInProgressRef.current = true;

    stopRecognition();

    // Immediately stop any ongoing speech assistant synthesis
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (_) {}
    isSpeakingRef.current = false;

    setVoiceFeedback('✓ Navigating to Homepage...');
    setTimeout(() => {
      window.location.href = HOMEPAGE_URL || '/';
    }, 250);
  };

  const handleStartNextLevel = () => {
    if (isActionInProgressRef.current) return;
    isActionInProgressRef.current = true;

    stopRecognition();

    // Immediately stop any ongoing speech assistant synthesis
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (_) {}
    isSpeakingRef.current = false;

    const maxSessionLevel = 8;
    const isAtMax = sessionLevelRef.current >= maxSessionLevel;
    const nextLvl = isAtMax ? maxSessionLevel : sessionLevelRef.current + 1;
    setVoiceFeedback(isAtMax ? `✓ Replaying Level ${maxSessionLevel} (Master)...` : `✓ Starting Level ${nextLvl}...`);

    setTimeout(() => {
      setSessionLevel(nextLvl);
      sessionLevelRef.current = nextLvl;
      setCurrentGameIndex(0);
      setCompletedGames([]);
      setIsSessionComplete(false);
      setVoiceFeedback(null);
      setLatestTranscript('');
      isActionInProgressRef.current = false;
    }, 200);
  };

  // Start listening specifically for the post-session choice (Next Level vs Homepage)
  const startVoiceChoiceListening = () => {
    if (!isMountedRef.current || !isSessionCompleteRef.current) return;

    stopRecognition();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false; // Capture clean single utterance
      recognition.interimResults = true;
      recognition.maxAlternatives = 5;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        if (isMountedRef.current) setIsVoiceListening(true);
      };

      recognition.onresult = (event: any) => {
        let chunk = '';
        const candidates: string[] = [];

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          chunk += ' ' + (res[0]?.transcript || '');
          for (let a = 0; a < res.length; a++) {
            const t = (res[a]?.transcript || '').toLowerCase().trim();
            if (t) candidates.push(t);
          }
        }
        if (chunk.trim()) {
          candidates.push(chunk.toLowerCase().trim());
        }

        const primaryText = chunk.toLowerCase().trim() || candidates[0] || '';
        if (!primaryText && candidates.length === 0) return;

        console.log('[Post-Game Voice Choice Candidates]', candidates);
        if (isMountedRef.current) {
          setLatestTranscript(primaryText);
        }

        const nextKeywords = [
          'next', 'level', 'agla', 'aage', 'play', 'start', 'continue',
          'aur', 'dusra', 'tisra', 'two', 'three', 'second', 'third',
          'khel', 'neck', 'net', 'text level', 'max level', 'nest',
          'live', 'love', 'leval', 'devil', 'table',
          'अगला', 'लेवल', 'आगे', 'दूसरा', 'तीसरा', 'शुरू', 'खेलो'
        ];

        const homeKeywords = [
          'home', 'homepage', 'ghar', 'wapas', 'exit', 'back', 'quit',
          'bahar', 'barmer', 'baad', 'ruko', 'band', 'main', 'menu',
          'baba', 'dashboard', 'leave', 'stop', 'done',
          'होमपेज', 'घर', 'वापस', 'बाहर', 'बंद', 'मुख्य'
        ];

        const matchedNext = candidates.some((c) =>
          nextKeywords.some((k) => c.includes(k))
        );

        const matchedHome = candidates.some((c) =>
          homeKeywords.some((k) => c.includes(k))
        );

        if (matchedNext) {
          handleStartNextLevel();
          return;
        }

        if (matchedHome) {
          handleGoHomepage();
          return;
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('[Voice Choice Error]:', e.error);
        if (e.error === 'not-allowed') {
          if (isMountedRef.current) setIsVoiceListening(false);
        }
      };

      recognition.onend = () => {
        if (!isMountedRef.current) return;
        if (recognitionRef.current !== recognition) return;
        setIsVoiceListening(false);

        // Keep re-arming while waiting on completion screen
        if (isSessionCompleteRef.current && !isActionInProgressRef.current) {
          restartTimerRef.current = setTimeout(() => {
            if (isMountedRef.current && isSessionCompleteRef.current && !isActionInProgressRef.current) {
              startVoiceChoiceListening();
            }
          }, 300);
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('[Voice Choice init err]:', err);
    }
  };

  // Clean mount/unmount - do NOT run mic all the time during gameplay
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      stopRecognition();
      if (transitionTimerRef.current) {
        clearInterval(transitionTimerRef.current);
      }
    };
  }, []);

  const handleGameFinished = (result: GameResult) => {
    persistGameResult(result);

    const currentMeta = SEQUENTIAL_GAMES[currentGameIndex];
    const newRecord: CompletedGameRecord = {
      gameType: result.gameType,
      title: currentMeta.title,
      accuracy: result.accuracy,
      responseTimeMs: result.responseTimeMs,
      level: result.level,
    };

    const updated = [...completedGames, newRecord];
    setCompletedGames(updated);

    const nextIndex = currentGameIndex + 1;

    if (nextIndex < SEQUENTIAL_GAMES.length) {
      // Transition to next game
      setIsTransitioning(true);
      setCountdown(3);

      const nextMeta = SEQUENTIAL_GAMES[nextIndex];
      const prompt =
        language === 'hi'
          ? `बहुत बढ़िया! अब अगला खेल "${nextMeta.title}" शुरू हो रहा है...`
          : language === 'hinglish'
          ? `Great job! Ab next game "${nextMeta.title}" shuru ho raha hai...`
          : `Great job! Moving to the next game: ${nextMeta.title}...`;
      speak(prompt);

      let count = 3;
      transitionTimerRef.current = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(transitionTimerRef.current);
          setIsTransitioning(false);
          setCurrentGameIndex(nextIndex);
        }
      }, 1000);
    } else {
      // Session Complete for this Level!
      setIsSessionComplete(true);

      // Voice Assistant prompt - ONLY ask the two things directly!
      const prompt =
        language === 'hi'
          ? 'अगला लेवल या होमपेज?'
          : language === 'hinglish'
          ? 'Next level ya homepage?'
          : 'Next level, or homepage?';

      // Do NOT run mic while assistant is speaking.
      // As voice assistant finishes its speech, take voice input for choice!
      speak(prompt, () => {
        startVoiceChoiceListening();
      });

      // Fallback in case browser speech synthesis onend callback is delayed
      setTimeout(() => {
        if (isSessionCompleteRef.current && !isActionInProgressRef.current) {
          startVoiceChoiceListening();
        }
      }, 1400);
    }
  };

  // Render Transition Interstitial
  if (isTransitioning) {
    const nextGame = SEQUENTIAL_GAMES[currentGameIndex + 1];
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] to-amber-50/60 flex flex-col items-center justify-center p-6 text-center animate-fadeIn font-[Plus_Jakarta_Sans]">
        <div className="w-24 h-24 rounded-3xl bg-amber-500 text-white flex items-center justify-center shadow-xl shadow-amber-500/20 mb-6 animate-bounce">
          <Sparkles className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
          {language === 'hi' ? 'शानदार खेल!' : 'Wonderful Job!'}
        </h2>
        <p className="text-lg text-slate-600 mb-6 max-w-md">
          {language === 'hi'
            ? `अब अगला खेल "${nextGame?.title}" तैयार हो रहा है...`
            : `Next up: ${nextGame?.title}. Taking a gentle breath...`}
        </p>
        <div className="w-16 h-16 rounded-full border-4 border-amber-500 border-t-transparent animate-spin flex items-center justify-center text-amber-700 font-bold text-xl">
          {countdown}
        </div>
      </div>
    );
  }

  // Render Session Summary Screen with Voice Assistant Selection (Fits in ONE single viewport)
  if (isSessionComplete) {
    const avgAccuracy = Math.round(
      completedGames.reduce((acc, g) => acc + g.accuracy, 0) / (completedGames.length || 1)
    );
    const avgResponseTime = Math.round(
      completedGames.reduce((acc, g) => acc + g.responseTimeMs, 0) / (completedGames.length || 1)
    );

    return (
      <div className="h-screen w-screen max-h-screen overflow-hidden bg-gradient-to-b from-[#FAF7F2] to-amber-50/80 flex items-center justify-center p-3 sm:p-4 font-[Plus_Jakarta_Sans]">
        <div className="w-full max-w-md bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-amber-200 text-center relative flex flex-col justify-between max-h-[96vh] animate-slide-up">
          {/* Top Header */}
          <div>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 text-white flex items-center justify-center shadow-md mx-auto mb-1.5">
              <Trophy className="w-6 h-6" />
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold mb-1 border border-amber-300">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Level {sessionLevel} Complete</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {language === 'hi' ? 'दैनिक खेल पूर्ण!' : "Today's Games Completed!"}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5 mb-2.5">
              {language === 'hi'
                ? `लेवल ${sessionLevel} के सभी खेल सफलतापूर्वक पूरे हुए।`
                : `Great job, ${userName}. You completed Level ${sessionLevel}.`}
            </p>

            {/* Stats Badges */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Average Accuracy</span>
                <p className="text-xl font-extrabold text-amber-900 mt-0.5">{avgAccuracy}%</p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Response Speed</span>
                <p className="text-xl font-extrabold text-emerald-900 mt-0.5">{(avgResponseTime / 1000).toFixed(1)}s</p>
              </div>
            </div>

            {/* Games Completed Chips (Compact Horizontal Row) */}
            <div className="grid grid-cols-3 gap-1.5 mb-2.5">
              {completedGames.map((g, i) => (
                <div key={i} className="p-1.5 px-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-left">
                  <div className="flex items-center gap-1 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-700 text-[10px] truncate">
                      {g.title.replace(' Game', '').replace(' Recall', '').replace(' Focus', '')}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                    {g.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Voice Assistant Banner */}
          <div className="mb-2.5 p-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400/80 text-left shadow-sm flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => startVoiceChoiceListening()}
                title="Tap to start mic"
                className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer ${
                  isVoiceListening
                    ? 'bg-amber-500 animate-pulse ring-2 ring-amber-400/40'
                    : 'bg-slate-400 hover:bg-amber-500'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                    Voice Assistant Active
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isVoiceListening ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isVoiceListening ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                    {isVoiceListening ? 'Always Listening...' : 'Tap Mic to Start'}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {language === 'hi'
                    ? `बोलिए: "अगला लेवल" या "होमपेज"`
                    : `Speak: Say "Next Level" or "Homepage"`}
                </p>
              </div>
            </div>

            {/* Real-time speech recognition feedback */}
            {voiceFeedback ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-[11px] font-bold animate-fadeIn">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{voiceFeedback}</span>
              </div>
            ) : latestTranscript ? (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-100/70 border border-amber-200 text-amber-900 text-[11px] font-medium animate-fadeIn truncate">
                <span className="font-bold">Heard:</span>
                <span className="italic">"{latestTranscript}"</span>
              </div>
            ) : null}
          </div>

          {/* Bottom: Options */}
          <div className="flex flex-col gap-2">
            {/* Option 1: Next Level */}
            <button
              type="button"
              onClick={handleStartNextLevel}
              className="w-full p-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm shadow-md shadow-amber-500/20 flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] border border-amber-300 text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="leading-tight text-sm">
                    {sessionLevel >= 8 ? 'Replay Master Level (Level 8)' : `Play Next Level (Level ${sessionLevel + 1})`}
                  </div>
                  <div className="text-[10px] text-amber-100 font-medium">
                    {sessionLevel >= 8 ? 'Practice games at highest challenge level' : `Starts all games at Level ${sessionLevel + 1}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-extrabold shrink-0">
                <Mic className="w-3 h-3" />
                <span>"Next Level"</span>
              </div>
            </button>

            {/* Option 2: Go to Homepage */}
            <button
              type="button"
              onClick={handleGoHomepage}
              className="w-full p-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <div className="leading-tight text-sm">Go to Homepage</div>
                  <div className="text-[10px] text-slate-500 font-normal">Finish session and return home</div>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-extrabold shrink-0 border border-slate-200">
                <Mic className="w-3 h-3" />
                <span>"Homepage"</span>
              </div>
            </button>

            {/* Fallback option: Return to Games Hub */}
            <button
              type="button"
              onClick={onExitToHub}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 underline transition-colors pt-0.5 cursor-pointer"
            >
              Return to Games Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Game View
  const activeGame = SEQUENTIAL_GAMES[currentGameIndex];

  return (
    <div className="relative min-h-screen bg-[#FAF7F2]">
      {/* Floating Session Controller Banner with Voice Stop Indicator */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-amber-200 shadow-lg text-slate-800 text-xs font-bold">
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-extrabold">
          Game {currentGameIndex + 1} of {SEQUENTIAL_GAMES.length}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
          Level {sessionLevel}
        </span>
        <span className="hidden sm:inline text-slate-600">Sequential Session: {activeGame.title}</span>
        {isVoiceListening && (
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span>Say "Stop" anytime</span>
          </span>
        )}
        <button
          onClick={onExitToHub}
          className="ml-2 px-2.5 py-1 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors"
          title="Stop Game Session"
        >
          Exit
        </button>
      </div>

      {voiceFeedback && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold shadow-xl animate-fadeIn border border-slate-700 flex items-center gap-2">
          <Mic className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>{voiceFeedback}</span>
        </div>
      )}

      {/* Render Current Game with Level Prop and Key for Clean Level Increments */}
      {activeGame.type === 'memoryMatch' && (
        <MemoryMatchGame
          key={`mem_${sessionLevel}_${currentGameIndex}`}
          onBack={onExitToHub}
          onGameComplete={handleGameFinished}
          initialLevel={sessionLevel}
        />
      )}
      {activeGame.type === 'attentionGame' && (
        <AttentionGame
          key={`att_${sessionLevel}_${currentGameIndex}`}
          onBack={onExitToHub}
          onGameComplete={handleGameFinished}
          initialLevel={sessionLevel}
        />
      )}
      {activeGame.type === 'sequenceRecall' && (
        <SequenceRecallGame
          key={`seq_${sessionLevel}_${currentGameIndex}`}
          onBack={onExitToHub}
          onGameComplete={handleGameFinished}
          initialLevel={sessionLevel}
        />
      )}
    </div>
  );
};
