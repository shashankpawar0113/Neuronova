import React, { useRef, useEffect, useState } from 'react';

export const BackgroundVisual: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoAvailable, setVideoAvailable] = useState<boolean>(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  
  // Parallax state for static portrait fallback
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Scrubbing refs to prevent seek-flooding
  const lastMouseX = useRef<number | null>(null);
  const isSeeking = useRef<boolean>(false);
  const targetSeekTime = useRef<number | null>(null);

  // Placeholder image — confirm licensing/usage rights before using in production; replace with a licensed or custom photo before launch.
  const currentImageSrc = '/dadi-and-dada.jpg';

  useEffect(() => {
    const video = videoRef.current;

    const SENSITIVITY = 0.8;

    const handleMouseMove = (e: MouseEvent) => {
      // Parallax calculation for background
      const normalizedX = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const normalizedY = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x: normalizedX * 10, y: normalizedY * 6 });

      // Video scrub calculation
      if (lastMouseX.current === null) {
        lastMouseX.current = e.clientX;
        return;
      }

      const deltaX = e.clientX - lastMouseX.current;
      lastMouseX.current = e.clientX;

      if (video && video.duration && !isNaN(video.duration)) {
        const timeDelta = (deltaX / window.innerWidth) * SENSITIVITY * video.duration;
        const newTime = Math.min(Math.max(video.currentTime + timeDelta, 0), video.duration);
        
        targetSeekTime.current = newTime;

        if (!isSeeking.current) {
          isSeeking.current = true;
          video.currentTime = newTime;
        }
      }
    };

    const handleMouseLeave = () => {
      lastMouseX.current = null;
      setMousePos({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleSeeked = () => {
    isSeeking.current = false;
    const video = videoRef.current;
    if (video && targetSeekTime.current !== null && Math.abs(video.currentTime - targetSeekTime.current) > 0.05) {
      isSeeking.current = true;
      video.currentTime = targetSeekTime.current;
    }
  };

  const handleVideoLoadedData = () => {
    setIsVideoLoaded(true);
    setVideoAvailable(true);
  };

  const handleVideoError = () => {
    setVideoAvailable(false);
  };

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#FAF7F2]">
      {/* 1. Background Video with Mouse-Scrubbing Control */}
      <video
        ref={videoRef}
        src="/companion.mp4"
        poster={currentImageSrc}
        muted
        playsInline
        preload="auto"
        onLoadedData={handleVideoLoadedData}
        onSeeked={handleSeeked}
        onError={handleVideoError}
        className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${
          isVideoLoaded && videoAvailable ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          transform: `scale(1.05) translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)`,
          transition: 'transform 0.2s ease-out',
        }}
      />

      {/* 2. High-Resolution Warm Elderly Companions Portrait */}
      {/* Placeholder image — confirm licensing/usage rights before using in production; replace with a licensed or custom photo before launch. */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-700 ease-out ${
          isVideoLoaded && videoAvailable ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          transform: `scale(1.03) translate(${mousePos.x * -0.4}px, ${mousePos.y * -0.2}px)`,
        }}
      >
        <img
          key={currentImageSrc}
          src={currentImageSrc}
          alt="Caring for our beloved elders with warmth and dignity"
          className="w-full h-full object-cover object-[62%_center] sm:object-[68%_center] md:object-[65%_center] transition-opacity duration-500"
          loading="eager"
        />
      </div>

      {/* 3. Dedicated Text-Over-Photo Contrast Scrim (Left ~65-70% on desktop, scales up at smaller viewports) */}
      <div
        className="absolute inset-y-0 left-0 w-full sm:w-[85%] md:w-[75%] lg:w-[68%] pointer-events-none z-[1]"
        style={{
          background: `linear-gradient(to right, 
            #FAF7F2 0%, 
            #FAF7F2 52%, 
            rgba(250, 247, 242, 0.98) 66%, 
            rgba(250, 247, 242, 0.80) 78%, 
            rgba(250, 247, 242, 0.30) 90%, 
            transparent 100%
          )`,
        }}
      />

      {/* 4. Adaptive Narrow-Viewport Scrim (Strengthens contrast on mobile & tablet when text stacks over photo) */}
      <div
        className="absolute inset-0 md:hidden pointer-events-none z-[1]"
        style={{
          background: `linear-gradient(to top, 
            #FAF7F2 0%, 
            rgba(250, 247, 242, 0.98) 50%, 
            rgba(250, 247, 242, 0.85) 75%, 
            rgba(250, 247, 242, 0.40) 100%
          )`,
        }}
      />

      {/* 5. Soft Warm Global Atmospheric Ambient Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to right, 
              rgba(250, 247, 242, 0.40) 0%, 
              transparent 45%, 
              rgba(212, 163, 115, 0.12) 100%
            ),
            linear-gradient(to top, 
              rgba(250, 247, 242, 0.60) 0%, 
              transparent 35%
            )
          `,
        }}
      />

      {/* 6. Subtle Warm Golden Ambient Glow */}
      <div
        className="absolute top-0 right-0 w-[55vw] h-[55vh] rounded-full blur-3xl opacity-35 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212, 163, 115, 0.45) 0%, rgba(250, 247, 242, 0) 70%)',
        }}
      />
    </div>
  );
};

