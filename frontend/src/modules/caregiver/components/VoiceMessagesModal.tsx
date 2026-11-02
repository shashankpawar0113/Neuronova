import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Play, Pause, Clock, CheckCircle2, User, Star, Trash2, MoreVertical } from 'lucide-react';
import { BACKEND_URL } from '../config/urls';
import { caregiverSocketService } from '../services/socketService';

export interface VoiceMessageItem {
  id: string;
  patient_id?: string;
  patientId?: string;
  patient_name?: string;
  patientName?: string;
  caregiver_id?: string;
  caregiverId?: string;
  transcript: string;
  audio_url?: string;
  audioUrl?: string;
  audio_filename?: string;
  audioFilename?: string;
  duration_seconds?: number;
  durationSeconds?: number;
  status?: string;
  is_read?: number;
  is_important?: number | boolean;
  isImportant?: number | boolean;
  created_at?: string;
  createdAt?: string;
}

interface VoiceMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  caregiverId: string;
  activePatientId?: string;
}

export const VoiceMessagesModal: React.FC<VoiceMessagesModalProps> = ({
  isOpen,
  onClose,
  caregiverId,
  activePatientId,
}) => {
  const [messages, setMessages] = useState<VoiceMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Press & Hold Context Dropdown State
  const [activeDropdown, setActiveDropdown] = useState<{
    messageId: string;
    x: number;
    y: number;
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pressTimerRef = useRef<any>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const socket = caregiverSocketService.connect(caregiverId, 'caregiver');
      const handleNewMsg = () => {
        loadMessages();
      };
      socket.on('patient:message:new', handleNewMsg);
      socket.on('caregiver:voice_message:new', handleNewMsg);
      return () => {
        socket.off('patient:message:new', handleNewMsg);
        socket.off('caregiver:voice_message:new', handleNewMsg);
        stopPlayback();
      };
    } else {
      stopPlayback();
      setActiveDropdown(null);
    }
    return () => {
      stopPlayback();
    };
  }, [isOpen, caregiverId, activePatientId]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeDropdown && !(e.target as HTMLElement).closest('.voice-note-dropdown')) {
        setActiveDropdown(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingId(null);
  };

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const url = activePatientId 
        ? `${BACKEND_URL || 'http://localhost:5001'}/api/messages/${caregiverId}?patientId=${activePatientId}`
        : `${BACKEND_URL || 'http://localhost:5001'}/api/messages/${caregiverId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load voice messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessageTime = (msg: VoiceMessageItem): string => {
    const raw = msg.createdAt || msg.created_at;
    if (!raw) return 'Just now';
    try {
      let d = new Date(raw);
      if (isNaN(d.getTime())) {
        // Normalize SQLite 'YYYY-MM-DD HH:MM:SS'
        d = new Date(raw.replace(' ', 'T') + 'Z');
      }
      if (isNaN(d.getTime())) {
        return 'Just now';
      }
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  const handlePlayAudio = (msg: VoiceMessageItem) => {
    if (playingId === msg.id) {
      stopPlayback();
      return;
    }

    stopPlayback();

    const playFallbackTTS = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && msg.transcript) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(msg.transcript);
          utterance.rate = 0.95;
          utterance.pitch = 1.0;
          utterance.onend = () => {
            setPlayingId(null);
            markRead(msg.id);
          };
          utterance.onerror = () => {
            setPlayingId(null);
          };
          setPlayingId(msg.id);
          window.speechSynthesis.speak(utterance);
          markRead(msg.id);
          return;
        } catch (synthErr) {
          console.warn('[Voice Messages] Speech synthesis fallback error:', synthErr);
        }
      }
      setPlayingId(null);
    };

    const rawUrl = msg.audioUrl || msg.audio_url || (msg.audioFilename ? `/api/audio/${msg.audioFilename}` : null);

    if (!rawUrl) {
      playFallbackTTS();
      return;
    }

    const fullAudioUrl = rawUrl.startsWith('http')
      ? rawUrl
      : `${BACKEND_URL || 'http://localhost:5001'}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

    try {
      const audio = new Audio();
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingId(null);
        markRead(msg.id);
      };

      audio.onerror = () => {
        console.warn('[Voice Messages] Audio file playback failed, falling back to speech synthesis...');
        playFallbackTTS();
      };

      audio.src = fullAudioUrl;
      audio.load();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlayingId(msg.id);
            markRead(msg.id);
          })
          .catch((err) => {
            console.warn('[Voice Messages] Audio play() promise rejected:', err);
            playFallbackTTS();
          });
      }
    } catch (err) {
      console.warn('[Voice Messages] Audio initialization error:', err);
      playFallbackTTS();
    }
  };

  const markRead = async (messageId: string) => {
    try {
      await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/messages/${messageId}/read`, {
        method: 'POST',
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_read: 1, status: 'read' } : m))
      );
    } catch (_) {}
  };

  // Press & Hold Handlers
  const handlePointerDown = (e: React.PointerEvent, msgId: string) => {
    if ((e.target as HTMLElement).closest('button')) return;

    startPosRef.current = { x: e.clientX, y: e.clientY };
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    pressTimerRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && 'navigator' in window && (navigator as any).vibrate) {
        (navigator as any).vibrate(40);
      }
      setActiveDropdown({
        messageId: msgId,
        x: Math.min(e.clientX, window.innerWidth - 230),
        y: Math.min(e.clientY, window.innerHeight - 150),
      });
    }, 450);
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 10 || dy > 10) {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, msgId: string) => {
    e.preventDefault();
    setActiveDropdown({
      messageId: msgId,
      x: Math.min(e.clientX, window.innerWidth - 230),
      y: Math.min(e.clientY, window.innerHeight - 150),
    });
  };

  const handleToggleImportant = async (messageId: string) => {
    setActiveDropdown(null);
    try {
      const res = await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/messages/${messageId}/important`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === messageId
              ? { ...m, isImportant: data.isImportant, is_important: data.isImportant ? 1 : 0 }
              : m
          );
          // Re-sort: important notes first
          return [...updated].sort((a, b) => {
            const aImp = a.isImportant || a.is_important ? 1 : 0;
            const bImp = b.isImportant || b.is_important ? 1 : 0;
            return bImp - aImp;
          });
        });
      }
    } catch (err) {
      console.error('Failed to toggle important status:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    setActiveDropdown(null);
    if (playingId === messageId) {
      stopPlayback();
    }
    try {
      const res = await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/messages/${messageId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-[Plus_Jakarta_Sans]">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] relative">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 font-[Outfit]">
                Patient Voice Notes
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Spoken messages and live speech transcripts • Press & hold card for options
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopPlayback();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-xs font-semibold text-slate-400 animate-pulse">
              Loading patient voice messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Mic className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-slate-700">No voice messages yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                When the patient says "Send a message to my caregiver", their voice note and transcript will appear here instantly.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isPlaying = playingId === msg.id;
              const isUnread = msg.status === 'unread' || (msg.is_read !== undefined && !msg.is_read);
              const isImportant = Boolean(msg.isImportant || msg.is_important);
              const duration = msg.durationSeconds || msg.duration_seconds || 5;
              const patientName = msg.patientName || msg.patient_name || 'Patient';
              const timeDisplay = formatMessageTime(msg);

              return (
                <div
                  key={msg.id}
                  onPointerDown={(e) => handlePointerDown(e, msg.id)}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onPointerMove={handlePointerMove}
                  onContextMenu={(e) => handleContextMenu(e, msg.id)}
                  className={`p-4 rounded-2xl border transition-all select-none relative group ${
                    isImportant
                      ? 'bg-amber-50/60 border-amber-300 shadow-sm'
                      : isUnread
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isImportant
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900 text-xs">
                        {patientName}
                      </span>
                      {isImportant && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center gap-1 uppercase tracking-wider">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          Important
                        </span>
                      )}
                      {isUnread && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase">
                          New
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{timeDisplay}</span>
                      </div>
                      {/* Three-dots button for easy access without long-pressing */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveDropdown({
                            messageId: msg.id,
                            x: Math.min(rect.right - 190, window.innerWidth - 210),
                            y: rect.bottom + 6,
                          });
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title="Options: Delete / Mark as Important"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Transcript quote */}
                  <div
                    className={`p-3 rounded-xl border my-2 ${
                      isImportant ? 'bg-amber-100/40 border-amber-200/60' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <p className="text-xs sm:text-sm font-medium text-slate-800 italic">
                      "{msg.transcript}"
                    </p>
                  </div>

                  {/* Audio player button & action links */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handlePlayAudio(msg)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-emerald-600 text-white shadow-md animate-pulse'
                          : isImportant
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause Audio</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play Voice Note ({duration}s)</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-3">
                      {isUnread ? (
                        <button
                          onClick={() => markRead(msg.id)}
                          className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
                        >
                          Mark as read
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Listened
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Tip: Press & hold any note to delete or mark as important
          </span>
          <button
            onClick={() => {
              stopPlayback();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-all cursor-pointer ml-auto"
          >
            Close
          </button>
        </div>

        {/* Press & Hold Context Dropdown Overlay */}
        {activeDropdown && (
          <div
            className="fixed z-50 voice-note-dropdown animate-in fade-in zoom-in-95 duration-150"
            style={{
              top: `${activeDropdown.y}px`,
              left: `${activeDropdown.x}px`,
            }}
          >
            <div className="w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 overflow-hidden text-slate-800 font-[Plus_Jakarta_Sans]">
              {(() => {
                const targetMsg = messages.find((m) => m.id === activeDropdown.messageId);
                const isImp = targetMsg?.isImportant || targetMsg?.is_important;
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleImportant(activeDropdown.messageId)}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 hover:bg-amber-50 hover:text-amber-900 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${isImp ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`}
                      />
                      <span>{isImp ? 'Remove Important' : 'Mark as Important'}</span>
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(activeDropdown.messageId)}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span>Delete Voice Note</span>
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
