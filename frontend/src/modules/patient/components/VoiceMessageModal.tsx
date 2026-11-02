import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BACKEND_URL } from '../config/urls';

interface VoiceMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  caregiverName?: string;
  language?: 'en' | 'hi' | 'hinglish';
}

export const VoiceMessageModal: React.FC<VoiceMessageModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  caregiverName = 'Caregiver',
  language = 'en',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    stopRecording();
    setIsRecording(false);
    setRecordingSeconds(0);
    setTranscript('');
    setAudioBlob(null);
    setAudioUrl(null);
    setIsSending(false);
    setSendSuccess(false);
    setErrorMessage(null);
    audioChunksRef.current = [];
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setTranscript('');
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(fullBlob);
        setAudioUrl(URL.createObjectURL(fullBlob));
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Start Speech Recognition for transcript
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

        recognition.onresult = (e: any) => {
          let currentTranscript = '';
          for (let i = 0; i < e.results.length; i++) {
            currentTranscript += e.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognition.start();
      }
    } catch (err: any) {
      console.error('[Voice Message] Microphone access failed:', err);
      setErrorMessage('Microphone access unavailable. Please enable microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsRecording(false);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSendMessage = async () => {
    if (!audioBlob && !transcript) {
      setErrorMessage('Please speak a message before sending.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      let audioBase64 = '';
      if (audioBlob) {
        audioBase64 = await blobToBase64(audioBlob);
      }

      const response = await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          patientName,
          caregiverId: 'user_caregiver',
          transcript: transcript || 'Audio message',
          audioBase64,
          durationSeconds: recordingSeconds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send voice message');
      }

      setSendSuccess(true);

      // Play gentle voice confirmation
      if ('speechSynthesis' in window) {
        const text = language === 'hi'
          ? 'आपका संदेश आपके केयरगिवर तक पहुँच गया है।'
          : language === 'hinglish'
          ? 'Aapka voice message caregiver ko bhej diya gaya hai.'
          : 'Your voice message has been delivered to your caregiver.';
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        window.speechSynthesis.speak(utter);
      }

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('[Voice Message] Send error:', err);
      setErrorMessage('Could not send message. Please check your connection.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-gradient-to-b from-white to-amber-50/50 rounded-3xl p-6 md:p-8 shadow-2xl border border-amber-200 text-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 mb-3">
            <Mic className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold font-brand text-slate-900">
            Voice Message to {caregiverName}
          </h2>
          <p className="text-slate-600 mt-1">
            {language === 'hi' ? 'अपने केयरगिवर के लिए संदेश बोलिए' : 'Speak your voice message for your caregiver'}
          </p>
        </div>

        {/* Success Banner */}
        {sendSuccess && (
          <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Message Delivered!</p>
              <p className="text-sm">Your caregiver has received your voice message.</p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Recorder Center */}
        <div className="flex flex-col items-center justify-center py-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all ${
              isRecording
                ? 'bg-rose-500 hover:bg-rose-600 animate-pulse ring-8 ring-rose-400/30'
                : 'bg-amber-600 hover:bg-amber-700 hover:scale-105 active:scale-95'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-10 h-10 mb-1" />
                <span className="text-xs font-bold uppercase tracking-wider">Tap to Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10 mb-1" />
                <span className="text-xs font-bold uppercase tracking-wider">Tap to Record</span>
              </>
            )}
          </button>

          <div className="mt-4 text-center">
            {isRecording ? (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-lg font-bold text-slate-800">
                  Recording: {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            ) : audioBlob ? (
              <span className="text-emerald-700 font-bold">Audio recorded ({recordingSeconds}s)</span>
            ) : (
              <span className="text-slate-500">Tap microphone to begin speaking</span>
            )}
          </div>
        </div>

        {/* Live Transcript / Message Preview */}
        {(transcript || isRecording) && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Live Transcript:
            </p>
            <p className="text-base text-slate-800 italic leading-relaxed">
              "{transcript || 'Listening to your voice...'}"
            </p>
          </div>
        )}

        {/* Audio Player if recorded */}
        {audioUrl && !isRecording && (
          <div className="mb-6 p-3 rounded-2xl bg-white border border-amber-200">
            <audio controls src={audioUrl} className="w-full h-10 rounded-lg" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSendMessage}
            disabled={(!audioBlob && !transcript) || isRecording || isSending || sendSuccess}
            className="flex-1 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-5 h-5" />
            <span>{isSending ? 'Sending...' : 'Send Message'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
