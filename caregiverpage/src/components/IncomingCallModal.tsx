import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Shield } from 'lucide-react';
import { caregiverSocketService } from '../services/socketService';

interface IncomingCallModalProps {
  currentCaregiverId: string;
  currentCaregiverName: string;
}

interface IncomingCallData {
  callId: string;
  callerId: string;
  callerName: string;
  hasVideo?: boolean;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  currentCaregiverId,
  currentCaregiverName,
}) => {
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<any>(null);
  const ringIntervalRef = useRef<any>(null);
  const ringCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const socket = caregiverSocketService.connect(currentCaregiverId, 'caregiver');

    const handleIncomingCall = (data: IncomingCallData) => {
      console.log('[CaregiverCall] Incoming call from patient:', data);
      setIncomingCall(data);
      setIsConnected(false);
      setCallDuration(0);
      playRingTone();
    };

    const handleCallEnded = () => {
      cleanupCall();
    };

    const handleSignal = async (data: any) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        if (data.signal?.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
          // If offer, create answer
          if (data.signal.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('call:signal', {
              peerId: data.peerId || incomingCall?.callerId,
              signal: { sdp: answer },
              callId: incomingCall?.callId,
            });
          }
        } else if (data.signal?.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
        }
      } catch (err) {
        console.error('[CaregiverCall] WebRTC signal error:', err);
      }
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:signal', handleSignal);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:signal', handleSignal);
      cleanupCall();
    };
  }, [currentCaregiverId, incomingCall?.callerId, incomingCall?.callId]);

  const stopRingTone = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    try {
      ringCtxRef.current?.close();
    } catch (_) {}
    ringCtxRef.current = null;
  };

  const playRingTone = () => {
    stopRingTone();
    // Melodic 4-note descending ring: E6→A5→G5→E5 (warm "incoming call" feel)
    const ringOnce = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ringCtxRef.current = ctx;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.15, ctx.currentTime);
        masterGain.connect(ctx.destination);

        // Descending notes — mirror of outgoing ring for instant recognition
        const notes = [
          { freq: 1318, start: 0.00, dur: 0.18 }, // E6
          { freq: 880,  start: 0.22, dur: 0.18 }, // A5
          { freq: 784,  start: 0.44, dur: 0.18 }, // G5
          { freq: 659,  start: 0.66, dur: 0.30 }, // E5
        ];

        notes.forEach(({ freq, start, dur }) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
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

        setTimeout(() => {
          try { ctx.close(); } catch (_) {}
          if (ringCtxRef.current === ctx) ringCtxRef.current = null;
        }, 1400);
      } catch (_) {}
    };

    ringOnce();
    // Repeat every 2.2 s (phrase + pause)
    ringIntervalRef.current = setInterval(ringOnce, 2200);
  };

  const acceptCall = async () => {
    stopRingTone();
    if (!incomingCall) return;
    const socket = caregiverSocketService.getSocket();
    if (!socket) return;

    try {
      // 1. Get microphone stream with resilient fallback
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (mediaErr) {
        console.warn('[CaregiverCall] Mic stream access failed, creating audio context fallback:', mediaErr);
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        osc.connect(dst);
        osc.start();
        stream = dst.stream;
      }
      localStreamRef.current = stream;

      // 2. Initialize RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerConnectionRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote audio stream
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          if (!remoteAudioRef.current) {
            const audio = new Audio();
            audio.autoplay = true;
            remoteAudioRef.current = audio;
          }
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('call:signal', {
            peerId: incomingCall.callerId,
            signal: { candidate: event.candidate },
            callId: incomingCall.callId,
          });
        }
      };

      // 3. Emit call:accept with both peerId and callerId
      socket.emit('call:accept', {
        callId: incomingCall.callId,
        peerId: incomingCall.callerId,
        callerId: incomingCall.callerId,
        receiverId: currentCaregiverId,
        receiverName: currentCaregiverName,
      });

      setIsConnected(true);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[CaregiverCall] Error accepting call:', err);
      declineCall();
    }
  };

  const declineCall = () => {
    stopRingTone();
    if (incomingCall) {
      const socket = caregiverSocketService.getSocket();
      if (socket) {
        socket.emit('call:reject', {
          callId: incomingCall.callId,
          peerId: incomingCall.callerId,
          callerId: incomingCall.callerId,
          reason: 'declined',
        });
      }
    }
    cleanupCall();
  };

  const endCall = () => {
    if (incomingCall) {
      const socket = caregiverSocketService.getSocket();
      if (socket) {
        socket.emit('call:end', {
          callId: incomingCall.callId,
          peerId: incomingCall.callerId,
        });
      }
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    stopRingTone();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIncomingCall(null);
    setIsConnected(false);
    setCallDuration(0);
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

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col items-center p-8 text-center">
        {/* Pulse avatar */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-emerald-100 border-4 border-emerald-500/20 flex items-center justify-center relative z-10 shadow-lg">
            <span className="text-3xl font-extrabold text-emerald-800">
              {incomingCall.callerName ? incomingCall.callerName[0].toUpperCase() : 'P'}
            </span>
          </div>
          <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>Real-Time Caregiver Call</span>
        </div>

        <h3 className="text-2xl font-black text-slate-900 font-[Outfit]">
          {incomingCall.callerName || 'Patient'}
        </h3>
        <p className="text-sm text-slate-500 font-medium mt-0.5 mb-6">
          {isConnected ? (
            <span className="text-emerald-600 font-bold flex items-center justify-center gap-2">
              <Volume2 className="w-4 h-4 animate-bounce" />
              Connected · {formatDuration(callDuration)}
            </span>
          ) : (
            'Incoming call from patient sanctuary...'
          )}
        </p>

        {/* Buttons */}
        {!isConnected ? (
          <div className="flex items-center gap-6 w-full justify-center">
            {/* Decline */}
            <button
              onClick={declineCall}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-md group-hover:scale-105 active:scale-95">
                <PhoneOff className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-slate-600">Decline</span>
            </button>

            {/* Accept */}
            <button
              onClick={acceptCall}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/30 group-hover:scale-105 active:scale-95 animate-pulse">
                <Phone className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-emerald-800">Accept Call</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-6 w-full justify-center">
            {/* Mute */}
            <button
              onClick={toggleMute}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div
                className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all shadow-sm active:scale-95 ${
                  isMuted
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </div>
              <span className="text-xs font-bold text-slate-600">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* Hang Up */}
            <button
              onClick={endCall}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/30 active:scale-95">
                <PhoneOff className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-rose-700">End Call</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
