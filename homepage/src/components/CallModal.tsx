import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, ShieldAlert, User } from 'lucide-react';
import { getSocket } from '../services/socketService';
import { BACKEND_URL } from '../config/urls';

interface EmergencyContactItem {
  name: string;
  relationship: string;
  phoneNumber: string;
  isPrimary: boolean;
}

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  caregiverId?: string;
  caregiverName?: string;
  isEmergencyCall?: boolean;
}

type CallStatus = 'CALLING' | 'RINGING' | 'CONNECTED' | 'DECLINED' | 'MISSED' | 'ENDED' | 'TIMEOUT';

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  caregiverId = 'default-caregiver',
  caregiverName = 'Caregiver',
  isEmergencyCall = false,
}) => {
  const [callStatus, setCallStatus] = useState<CallStatus>('CALLING');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactItem[]>([]);
  const [showEmergencyFallback, setShowEmergencyFallback] = useState(isEmergencyCall);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const durationTimerRef = useRef<any>(null);
  const timeoutTimerRef = useRef<any>(null);
  const callIdRef = useRef<string>(`call_${Date.now()}`);
  const dialToneIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      startCall();
      fetchEmergencyContacts();
    } else {
      cleanupCall();
    }
  }, [isOpen]);

  const fetchEmergencyContacts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/patients/${patientId}/emergency-contacts`);
      if (res.ok) {
        const data = await res.json();
        setEmergencyContacts(data.contacts || []);
      }
    } catch (_) {}
  };

  const effectiveCaregiverId = (caregiverId && caregiverId !== 'default-caregiver') ? caregiverId : 'user_caregiver';

  // Outgoing ringtone: melodic 4-note ascending phrase (E5→G5→A5→E6) loops while waiting
  const startDialTone = () => {
    stopDialTone();
    const ringOnce = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.13, ctx.currentTime);
        masterGain.connect(ctx.destination);

        // Notes: E5=659, G5=784, A5=880, E6=1318 — classic ascending melodic ring
        const notes = [
          { freq: 659,  start: 0.00, dur: 0.18 },
          { freq: 784,  start: 0.20, dur: 0.18 },
          { freq: 880,  start: 0.40, dur: 0.18 },
          { freq: 1318, start: 0.62, dur: 0.32 },
        ];

        notes.forEach(({ freq, start, dur }) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle'; // warmer than sine
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          g.gain.setValueAtTime(0, ctx.currentTime + start);
          g.gain.linearRampToValueAtTime(1, ctx.currentTime + start + 0.025);
          g.gain.setValueAtTime(1, ctx.currentTime + start + dur - 0.025);
          g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + dur);
        });

        setTimeout(() => { try { ctx.close(); } catch (_) {} }, 1400);
      } catch (_) {}
    };

    ringOnce();
    dialToneIntervalRef.current = setInterval(ringOnce, 2200);
  };

  const stopDialTone = () => {
    if (dialToneIntervalRef.current) {
      clearInterval(dialToneIntervalRef.current);
      dialToneIntervalRef.current = null;
    }
  };

  const startCall = async () => {
    callIdRef.current = `call_${Date.now()}`;
    setCallStatus('CALLING');
    setCallDuration(0);
    setShowEmergencyFallback(false);
    startDialTone(); // 🎵 Start outgoing ring tone

    const socket = getSocket(patientId, 'patient', patientName);

    // Timeout: if no answer in 25 seconds, stop ring and show emergency fallback
    timeoutTimerRef.current = setTimeout(() => {
      stopDialTone(); // 🔕 No answer — stop the ringtone
      setCallStatus('TIMEOUT');
      setShowEmergencyFallback(true);
    }, 25000);

    try {
      // Get local audio stream with resilient fallback
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (mediaErr) {
        console.warn('[Call] Mic permission or device unavailable, fallback stream initiated:', mediaErr);
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        osc.connect(dst);
        osc.start();
        stream = dst.stream;
      }
      localStreamRef.current = stream;

      // Initialize WebRTC Peer Connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('call:signal', {
            peerId: effectiveCaregiverId,
            signal: { candidate: event.candidate },
            callId: callIdRef.current,
          });
        }
      };

      // Send call invitation over Socket
      socket.emit('call:invite', {
        callId: callIdRef.current,
        callerId: patientId,
        callerName: patientName,
        receiverId: effectiveCaregiverId,
        hasVideo: false,
      });

      // Listen for events
      socket.on('call:accepted', async (_data: any) => {
        if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
        stopDialTone(); // 🎵 Stop ring — call connected
        setCallStatus('CONNECTED');
        startDurationCounter();

        // Create WebRTC Offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:signal', {
          peerId: effectiveCaregiverId,
          signal: { sdp: offer },
          callId: callIdRef.current,
        });
      });

      socket.on('call:rejected', () => {
        if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
        stopDialTone(); // 🎵 Stop ring — call declined
        setCallStatus('DECLINED');
        setShowEmergencyFallback(true);
      });

      socket.on('call:ended', () => {
        endCall();
      });

      socket.on('call:signal', async (data: any) => {
        if (data.signal?.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
        } else if (data.signal?.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
          } catch (_) {}
        }
      });
    } catch (err) {
      console.error('[WebRTC] Call start failed:', err);
      setCallStatus('MISSED');
      setShowEmergencyFallback(true);
    }
  };

  const startDurationCounter = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const endCall = () => {
    const socket = getSocket(patientId, 'patient', patientName);
    socket.emit('call:end', {
      callId: callIdRef.current,
      peerId: caregiverId,
    });
    setCallStatus('ENDED');
    cleanupCall();
    setTimeout(() => onClose(), 1200);
  };

  const cleanupCall = () => {
    stopDialTone();
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg animate-fadeIn">
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-700 text-white relative">
        {/* Caller Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xl mx-auto ring-8 ring-amber-500/20">
              <User className="w-12 h-12" />
            </div>
            {callStatus === 'CONNECTED' && (
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-4 border-slate-900" />
            )}
          </div>

          <h2 className="text-2xl font-bold font-brand tracking-tight">{caregiverName}</h2>
          <p className="text-amber-400 font-semibold mt-1">
            {callStatus === 'CALLING' && 'Calling...'}
            {callStatus === 'RINGING' && 'Ringing...'}
            {callStatus === 'CONNECTED' && `Connected (${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')})`}
            {callStatus === 'DECLINED' && 'Caregiver unavailable'}
            {callStatus === 'TIMEOUT' && 'No answer'}
            {callStatus === 'ENDED' && 'Call ended'}
          </p>
        </div>

        {/* Emergency Fallback Section */}
        {showEmergencyFallback && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-100 animate-fadeIn">
            <div className="flex items-center gap-2 text-rose-400 font-bold mb-2">
              <ShieldAlert className="w-5 h-5" />
              <span>Emergency Assistance Available</span>
            </div>
            <p className="text-sm text-rose-200 mb-3">
              Caregiver is currently unreachable. If this is urgent, please connect directly to your verified contacts:
            </p>

            <div className="space-y-2">
              {emergencyContacts.map((c, i) => (
                <a
                  key={i}
                  href={`tel:${c.phoneNumber}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-rose-900/60 hover:bg-rose-900 border border-rose-700/60 text-white transition-colors"
                >
                  <div>
                    <p className="font-bold text-sm">{c.name}</p>
                    <p className="text-xs text-rose-300">{c.relationship}</p>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Call Now
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="flex items-center justify-center gap-6 mt-6">
          {callStatus === 'CONNECTED' && (
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
          )}

          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};
