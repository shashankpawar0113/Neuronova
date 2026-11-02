import React, { useEffect, useRef, useState } from 'react';

export interface PostLoginLoaderProps {
  onComplete: () => void;
  videoSrc?: string;
  fallbackTimeoutMs?: number;
  userName?: string;
}

export const PostLoginLoader: React.FC<PostLoginLoaderProps> = ({
  onComplete,
  videoSrc = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260701_083907_581a119a-89b7-4c9f-a6ef-560625e0086f.mp4',
  fallbackTimeoutMs = 4500,
  userName,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Derive display name from props or local storage
  const displayName = (() => {
    if (userName && userName.trim()) return userName.trim();
    try {
      const stored = localStorage.getItem('neuronova_auth_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) return parsed.name;
        if (parsed.displayName) return parsed.displayName;
      }
    } catch (_) {}
    return 'Friend';
  })();

  const handleFinish = React.useCallback(() => {
    if (hasCompleted) return;
    setHasCompleted(true);
    setIsFadingOut(true);
    // Smooth 700ms fade-out transition before signalling completion
    setTimeout(() => {
      onComplete();
    }, 700);
  }, [hasCompleted, onComplete]);

  // Fallback timer to ensure user is never trapped
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFinish();
    }, fallbackTimeoutMs);

    return () => clearTimeout(timer);
  }, [fallbackTimeoutMs, handleFinish]);

  // If video duration is under ~2.2s, loop it until completion
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      if (duration && duration < 2.2) {
        videoRef.current.loop = true;
      }
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden transition-opacity duration-700 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading your personal space"
    >
      {/* 1. Full-Screen Immersive Video without white shades or border vignettes */}
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        muted
        playsInline
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleFinish}
        onError={handleFinish}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 2. Top-Left Text Overlay: Welcome back, {name} */}
      <div 
        className={`absolute top-8 left-8 sm:top-10 sm:left-12 z-20 pointer-events-none select-none transition-all duration-500 ease-out ${
          isFadingOut ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-brand-heading drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          Welcome back, <span className="text-[#EEDAC2]">{displayName}</span>
        </h2>
      </div>

      {/* 3. Bottom-Center Loading Text */}
      <div 
        className={`absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none select-none transition-all duration-500 ease-out ${
          isFadingOut ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        <p className="text-sm sm:text-base font-medium text-white/90 tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] font-brand-body">
          Loading your personal space
        </p>
      </div>

      {/* 4. Seamless Cream Cross-Fade Curtain on Exit */}
      <div
        className={`absolute inset-0 bg-[#FAF7F2] pointer-events-none transition-opacity duration-700 ease-in-out ${
          isFadingOut ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />
    </div>
  );
};

export default PostLoginLoader;
