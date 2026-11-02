import React, { useEffect, useRef, useState } from 'react';

interface FluidVoiceOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  isLoading: boolean;
  size?: number;
}

export const FluidVoiceOrb: React.FC<FluidVoiceOrbProps> = ({
  isListening,
  isSpeaking,
  isLoading,
  size = 220,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [liveLevel, setLiveLevel] = useState<number>(0);

  // Set up Web Audio API microphone analyser when listening
  useEffect(() => {
    let isActive = true;

    if (isListening) {
      const initMic = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          if (!isActive) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          micStreamRef.current = stream;

          const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContextClass();
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          audioContextRef.current = ctx;

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.65;
          analyserRef.current = analyser;

          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
        } catch (err) {
          console.warn('[FluidVoiceOrb] Microphone stream access for visualizer:', err);
        }
      };

      void initMic();
    } else {
      // Clean up mic stream
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (_) {}
        audioContextRef.current = null;
      }
      analyserRef.current = null;
    }

    return () => {
      isActive = false;
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (_) {}
        audioContextRef.current = null;
      }
      analyserRef.current = null;
    };
  }, [isListening]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = size;
    const height = size;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let time = 0;
    let smoothLevel = 0;
    const freqData = new Uint8Array(32);

    const render = () => {
      time += 0.025;

      // 1. Determine current audio level
      let targetLevel = 0;
      if (isListening && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(freqData);
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) {
          sum += freqData[i];
        }
        const avg = sum / freqData.length;
        targetLevel = Math.min(1.0, Math.max(0.04, (avg / 128) * 1.5));
      } else if (isSpeaking) {
        // Organic speech cadence simulation (syllable rhythms)
        const syllable1 = Math.sin(time * 6.5) * 0.35 + 0.35;
        const syllable2 = Math.cos(time * 11.2) * 0.2 + 0.2;
        const pauseCycle = Math.sin(time * 1.8);
        const pauseFactor = pauseCycle > 0.3 ? 1 : 0.25;
        targetLevel = (syllable1 + syllable2) * pauseFactor;
      } else if (isLoading) {
        // Fast energetic thought pulse
        targetLevel = 0.35 + Math.sin(time * 8.0) * 0.25;
      } else {
        // Gentle breathing idle state
        targetLevel = 0.05 + Math.sin(time * 1.5) * 0.04;
      }

      smoothLevel += (targetLevel - smoothLevel) * 0.18;
      setLiveLevel(smoothLevel);

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      // Slight responsive scale on audio volume
      const dynamicRadius = (size / 2 - 8) * (1 + smoothLevel * 0.08);

      // 2. Draw Sphere Base with Clip Path
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, dynamicRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Deep obsidian / sapphire spherical base background
      const baseGrad = ctx.createRadialGradient(
        cx - dynamicRadius * 0.35,
        cy - dynamicRadius * 0.4,
        dynamicRadius * 0.1,
        cx,
        cy,
        dynamicRadius
      );
      baseGrad.addColorStop(0, '#0f245c');
      baseGrad.addColorStop(0.45, '#081438');
      baseGrad.addColorStop(0.85, '#040b20');
      baseGrad.addColorStop(1, '#020512');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Fluid Undulating Wave Layers
      // Layer A: Deep Royal Sapphire Wave
      ctx.save();
      ctx.beginPath();
      const wavePhaseA = time * 1.1;
      const ampA = dynamicRadius * (0.22 + smoothLevel * 0.35);
      const midYA = cy + Math.sin(wavePhaseA) * (dynamicRadius * 0.12);

      ctx.moveTo(cx - dynamicRadius, cy + dynamicRadius);
      for (let x = cx - dynamicRadius; x <= cx + dynamicRadius; x += 4) {
        const nx = (x - cx) / dynamicRadius;
        const y =
          midYA +
          Math.sin(nx * 2.8 + wavePhaseA) * ampA +
          Math.cos(nx * 4.2 - wavePhaseA * 0.8) * (ampA * 0.45);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(cx + dynamicRadius, cy + dynamicRadius);
      ctx.closePath();

      const gradA = ctx.createLinearGradient(
        cx - dynamicRadius,
        cy - dynamicRadius,
        cx + dynamicRadius,
        cy + dynamicRadius
      );
      gradA.addColorStop(0, '#1e3a8a');
      gradA.addColorStop(0.5, '#2563eb');
      gradA.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = gradA;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.restore();

      // Layer B: Glowing Electric Cyan / Cerulean Fluid Wave
      ctx.save();
      ctx.beginPath();
      const wavePhaseB = time * 1.6 + 1.2;
      const ampB = dynamicRadius * (0.28 + smoothLevel * 0.45);
      const midYB = cy + Math.cos(wavePhaseB * 0.9) * (dynamicRadius * 0.15);

      ctx.moveTo(cx - dynamicRadius, cy + dynamicRadius);
      for (let x = cx - dynamicRadius; x <= cx + dynamicRadius; x += 3) {
        const nx = (x - cx) / dynamicRadius;
        const y =
          midYB +
          Math.sin(nx * 3.4 + wavePhaseB) * ampB -
          Math.cos(nx * 2.1 + wavePhaseB * 1.2) * (ampB * 0.5);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(cx + dynamicRadius, cy + dynamicRadius);
      ctx.closePath();

      const gradB = ctx.createLinearGradient(
        cx - dynamicRadius * 0.5,
        cy - dynamicRadius,
        cx + dynamicRadius * 0.8,
        cy + dynamicRadius
      );
      gradB.addColorStop(0, '#00f0ff');
      gradB.addColorStop(0.4, '#38bdf8');
      gradB.addColorStop(0.8, '#3b82f6');
      gradB.addColorStop(1, '#6366f1');
      ctx.fillStyle = gradB;
      ctx.globalAlpha = 0.88;
      ctx.fill();
      ctx.restore();

      // Layer C: Bright Aurora Crest (High contrast fluid highlight like in the reference image)
      ctx.save();
      ctx.beginPath();
      const wavePhaseC = time * 2.1 + 2.5;
      const ampC = dynamicRadius * (0.18 + smoothLevel * 0.3);
      const midYC = cy + Math.sin(wavePhaseC * 0.7) * (dynamicRadius * 0.1);

      ctx.moveTo(cx - dynamicRadius, cy + dynamicRadius);
      for (let x = cx - dynamicRadius; x <= cx + dynamicRadius; x += 3) {
        const nx = (x - cx) / dynamicRadius;
        const y =
          midYC +
          Math.sin(nx * 4.1 + wavePhaseC) * ampC +
          Math.sin(nx * 1.8 - wavePhaseC * 1.5) * (ampC * 0.35);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(cx + dynamicRadius, cy + dynamicRadius);
      ctx.closePath();

      const gradC = ctx.createLinearGradient(
        cx,
        cy - dynamicRadius * 0.6,
        cx,
        cy + dynamicRadius
      );
      gradC.addColorStop(0, '#e0f2fe');
      gradC.addColorStop(0.3, '#38bdf8');
      gradC.addColorStop(0.8, '#0284c7');
      gradC.addColorStop(1, 'transparent');
      ctx.fillStyle = gradC;
      ctx.globalAlpha = 0.65 + smoothLevel * 0.3;
      ctx.fill();
      ctx.restore();

      // Layer D: 3D Top-Left Specular Sheen (Curved highlight for liquid depth)
      ctx.save();
      const sheenGrad = ctx.createRadialGradient(
        cx - dynamicRadius * 0.45,
        cy - dynamicRadius * 0.45,
        2,
        cx - dynamicRadius * 0.35,
        cy - dynamicRadius * 0.35,
        dynamicRadius * 0.7
      );
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      sheenGrad.addColorStop(0.3, 'rgba(125, 211, 252, 0.2)');
      sheenGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Layer E: Deep Inset Shadow / Vignette (Giving the recessed portal depth from reference image)
      ctx.save();
      const vignette = ctx.createRadialGradient(
        cx,
        cy,
        dynamicRadius * 0.55,
        cx,
        cy,
        dynamicRadius
      );
      vignette.addColorStop(0, 'rgba(0, 4, 15, 0)');
      vignette.addColorStop(0.65, 'rgba(1, 6, 22, 0.35)');
      vignette.addColorStop(0.9, 'rgba(0, 3, 14, 0.85)');
      vignette.addColorStop(1, 'rgba(0, 2, 8, 0.98)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      ctx.restore(); // end of sphere clipping

      // 4. Outer Aperture Bezel Rim (Exact matching rim from reference image)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, dynamicRadius, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      const rimGrad = ctx.createLinearGradient(
        cx,
        cy - dynamicRadius,
        cx,
        cy + dynamicRadius
      );
      rimGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      rimGrad.addColorStop(0.5, 'rgba(30, 58, 138, 0.5)');
      rimGrad.addColorStop(1, 'rgba(15, 23, 42, 0.9)');
      ctx.strokeStyle = rimGrad;
      ctx.stroke();
      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isListening, isSpeaking, isLoading, size]);

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size + 60, height: size + 60 }}
    >
      {/* Dynamic Ambient Glow Halo that breathes and pulses to audio level */}
      <div
        className="absolute rounded-full transition-transform duration-75 pointer-events-none"
        style={{
          width: size * 1.35,
          height: size * 1.35,
          background: isSpeaking
            ? 'radial-gradient(circle, rgba(56, 189, 248, 0.42) 0%, rgba(37, 99, 235, 0.2) 50%, transparent 75%)'
            : isListening
            ? 'radial-gradient(circle, rgba(14, 165, 233, 0.45) 0%, rgba(59, 130, 246, 0.22) 50%, transparent 75%)'
            : isLoading
            ? 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 75%)'
            : 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(30, 58, 138, 0.12) 50%, transparent 75%)',
          transform: `scale(${1 + liveLevel * 0.35})`,
          filter: 'blur(28px)',
        }}
      />

      {/* Reactive Acoustic Waves (emit during active user speech or assistant speech) */}
      {(isListening || isSpeaking) && liveLevel > 0.12 && (
        <div
          className="absolute rounded-full border border-cyan-400/40 pointer-events-none transition-all duration-100"
          style={{
            width: size * (1.08 + liveLevel * 0.28),
            height: size * (1.08 + liveLevel * 0.28),
            opacity: Math.min(0.8, liveLevel * 1.6),
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.35)',
          }}
        />
      )}

      {(isListening || isSpeaking) && liveLevel > 0.25 && (
        <div
          className="absolute rounded-full border border-blue-400/30 pointer-events-none transition-all duration-150"
          style={{
            width: size * (1.2 + liveLevel * 0.35),
            height: size * (1.2 + liveLevel * 0.35),
            opacity: Math.min(0.6, liveLevel * 1.2),
          }}
        />
      )}

      {/* HTML5 Canvas Orb */}
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="relative z-10 transition-transform duration-75"
      />
    </div>
  );
};
