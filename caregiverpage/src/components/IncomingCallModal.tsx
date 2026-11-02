import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Shield, Radio, Activity } from 'lucide-react';
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

  const incomingCallRef = useRef<IncomingCallData | null>(null);
  const isConnectedRef = useRef<boolean>(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<any>(null);
  const ringIntervalRef = useRef<any>(null);
  const ringCtxRef = useRef<AudioContext | null>(null);

  // Keep refs up-to-date with latest state
  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // Main Socket & Event Subscription Effect - ONLY re-binds if currentCaregiverId changes!
  useEffect(() => {
    if (!currentCaregiverId) return;

    const socket = caregiverSocketService.connect(currentCaregiverId, 'caregiver');

    const handleIncomingCall = (data: any) => {
      if (!data) return;
      console.log('[CaregiverCall] Incoming call event received:', data);
      const callData: IncomingCallData = {
        callId: data.callId || data.relatedEntityId || `call_${Date.now()}`,
        callerId: data.callerId || data.patientId || 'patient',
        callerName: data.callerName || data.patientName || 'Patient',
        hasVideo: Boolean(data.hasVideo),
      };

      setIncomingCall(callData);
      incomingCallRef.current = callData;
      setIsConnected(false);
      isConnectedRef.current = false;
      setCallDuration(0);
      playRingTone();
    };

    const handleCallEnded = () => {
      console.log('[CaregiverCall] Call ended event received');
      cleanupCall();
    };

    const handleNewNotification = (data: any) => {
      if (data?.type === 'CALL') {
        console.log('[CaregiverCall] Call notification received, triggering incoming call card:', data);
        handleIncomingCall({
          callId: data.callId || data.relatedEntityId || `call_${Date.now()}`,
          callerId: data.callerId || data.patientId || 'patient',
          callerName: data.callerName || data.patientName || data.title?.replace('Incoming Call from ', '') || 'Patient',
          hasVideo: false,
        });
      }
    };

    const handleCustomWindowCall = (e: any) => {
      if (e.detail) {
        console.log('[CaregiverCall] Window custom event neuronova:incoming_call triggered:', e.detail);
        handleIncomingCall(e.detail);
      }
    };

    const handleSignal = async (data: any) => {
      console.log('[CaregiverCall] WebRTC signal received:', data?.signal?.sdp ? 'SDP' : 'ICE candidate');
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        if (data.signal?.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
          // If offer received from patient, formulate WebRTC answer
          if (data.signal.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            const activeCall = incomingCallRef.current;
            const targetPeerId = data.peerId || data.senderId || activeCall?.callerId || 'patient';
            socket.emit('call:signal', {
              peerId: targetPeerId,
              signal: { sdp: answer },
              callId: activeCall?.callId,
            });
            console.log('[CaregiverCall] Sent WebRTC answer back to peer:', targetPeerId);
          }
        } else if (data.signal?.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
          } catch (iceErr) {
            console.warn('[CaregiverCall] ICE candidate addition note:', iceErr);
          }
        }
      } catch (err) {
        console.error('[CaregiverCall] WebRTC signal processing error:', err);
      }
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('caregiver:call:incoming', handleIncomingCall);
    socket.on('caregiver:notification:new', handleNewNotification);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:rejected', handleCallEnded);
    socket.on('call:signal', handleSignal);
    window.addEventListener('neuronova:incoming_call', handleCustomWindowCall);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('caregiver:call:incoming', handleIncomingCall);
      socket.off('caregiver:notification:new', handleNewNotification);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:rejected', handleCallEnded);
      socket.off('call:signal', handleSignal);
      window.removeEventListener('neuronova:incoming_call', handleCustomWindowCall);
      stopRingTone();
    };
  }, [currentCaregiverId]);

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
    // Melodic 4-note descending chime: E6→A5→G5→E5
    const ringOnce = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ringCtxRef.current = ctx;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
        masterGain.connect(ctx.destination);

        const notes = [
          { freq: 1318, start: 0.00, dur: 0.18 }, // E6
          { freq: 880,  start: 0.22, dur: 0.18 }, // A5
          { freq: 784,  start: 0.44, dur: 0.18 }, // G5
          { freq: 659,  start: 0.66, dur: 0.32 }, // E5
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
        }, 1500);
      } catch (_) {}
    };

    ringOnce();
    ringIntervalRef.current = setInterval(ringOnce, 2400);
  };

  const acceptCall = async () => {
    stopRingTone();
    const currentCall = incomingCallRef.current || incomingCall;
    if (!currentCall) return;
    const socket = caregiverSocketService.getSocket();
    if (!socket) return;

    try {
      // 1. Get microphone stream with resilient fallback
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (mediaErr) {
        console.warn('[CaregiverCall] Mic stream access failed, using audio context fallback:', mediaErr);
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
            peerId: currentCall.callerId,
            signal: { candidate: event.candidate },
            callId: currentCall.callId,
          });
        }
      };

      // 3. Emit call:accept with both peerId and callerId
      socket.emit('call:accept', {
        callId: currentCall.callId,
        peerId: currentCall.callerId,
        callerId: currentCall.callerId,
        receiverId: currentCaregiverId,
        receiverName: currentCaregiverName,
      });

      setIsConnected(true);
      isConnectedRef.current = true;

      // Start duration timer
      if (timerRef.current) clearInterval(timerRef.current);
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
    const currentCall = incomingCallRef.current || incomingCall;
    if (currentCall) {
      const socket = caregiverSocketService.getSocket();
      if (socket) {
        socket.emit('call:reject', {
          callId: currentCall.callId,
          peerId: currentCall.callerId,
          callerId: currentCall.callerId,
          reason: 'declined',
        });
      }
    }
    cleanupCall();
  };

  const endCall = () => {
    stopRingTone();
    const currentCall = incomingCallRef.current || incomingCall;
    if (currentCall) {
      const socket = caregiverSocketService.getSocket();
      if (socket) {
        socket.emit('call:end', {
          callId: currentCall.callId,
          peerId: currentCall.callerId,
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
    incomingCallRef.current = null;
    setIsConnected(false);
    isConnectedRef.current = false;
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      {/* Centered Calling Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-emerald-100 dark:border-emerald-950/50 overflow-hidden flex flex-col items-center p-8 text-center relative transition-all">
        
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Pulsing Avatar */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border-4 border-white dark:border-slate-800 flex items-center justify-center relative z-10 shadow-xl shadow-emerald-600/20">
            <span className="text-3xl font-extrabold text-white">
              {incomingCall.callerName ? incomingCall.callerName[0].toUpperCase() : 'P'}
            </span>
          </div>
          {/* Animated concentric ping rings */}
          <div className="absolute -inset-2 rounded-full bg-emerald-400/30 animate-ping" />
          <div className="absolute -inset-5 rounded-full bg-emerald-500/15 animate-pulse" />
        </div>

        {/* Live Call Tag */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-3 shadow-xs">
          {isConnected ? (
            <>
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Voice Channel Active</span>
            </>
          ) : (
            <>
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Incoming Patient Call</span>
            </>
          )}
        </div>

        {/* Patient Name */}
        <h3 className="text-2xl font-black text-slate-900 dark:text-white font-[Outfit] tracking-tight">
          {incomingCall.callerName || 'Patient'}
        </h3>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 mb-6">
          {isConnected ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-2">
              <Activity className="w-4 h-4 animate-bounce" />
              Connected · {formatDuration(callDuration)}
            </span>
          ) : (
            'Calling from Patient Voice Sanctuary...'
          )}
        </p>

        {/* Sound wave visualizer bars when connected */}
        {isConnected && (
          <div className="flex items-center justify-center gap-1 h-6 mb-6">
            {[40, 75, 100, 60, 90, 45, 80, 55, 30].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-emerald-500 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDelay: `${i * 120}ms`,
                  animationDuration: '900ms',
                }}
              />
            ))}
          </div>
        )}

        {/* Action Controls */}
        {!isConnected ? (
          <div className="flex items-center gap-8 w-full justify-center mt-2">
            {/* Decline Button */}
            <button
              onClick={declineCall}
              id="decline-call-btn"
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-md group-hover:scale-105 active:scale-95">
                <PhoneOff className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-rose-600 transition-colors">
                Decline
              </span>
            </button>

            {/* Accept Button */}
            <button
              onClick={acceptCall}
              id="accept-call-btn"
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/40 group-hover:scale-110 active:scale-95 animate-bounce">
                <Phone className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-800">
                Answer Call
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-6 w-full justify-center mt-2">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              id="toggle-mute-btn"
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div
                className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all shadow-sm active:scale-95 ${
                  isMuted
                    ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {isMuted ? 'Unmute' : 'Mute'}
              </span>
            </button>

            {/* End Call Button */}
            <button
              onClick={endCall}
              id="end-call-btn"
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/40 active:scale-95">
                <PhoneOff className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                End Call
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
