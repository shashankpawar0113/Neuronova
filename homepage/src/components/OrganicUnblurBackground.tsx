import React, { useEffect, useRef } from 'react';

interface OrganicUnblurBackgroundProps {
  imageSrc?: string;
}

export const OrganicUnblurBackground: React.FC<OrganicUnblurBackgroundProps> = ({
  imageSrc = '/meadow-bg.png',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Offscreen canvas holds the pre-rendered white-blurred meadow image
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d');

    const img = new Image();
    img.src = imageSrc;
    let isImageLoaded = false;

    const renderOffscreen = () => {
      if (!offCtx) return;
      offCtx.clearRect(0, 0, width, height);

      if (isImageLoaded) {
        // Delicately blurred background image with slight overscale to avoid dark edge blur
        offCtx.filter = 'blur(7px)';
        const scale = 1.04;
        const sw = width * scale;
        const sh = height * scale;
        const sx = (width - sw) / 2;
        const sy = (height - sh) / 2;
        offCtx.drawImage(img, sx, sy, sw, sh);
      }

      // Airy, subtle translucent white haze over background
      offCtx.filter = 'none';
      offCtx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      offCtx.fillRect(0, 0, width, height);
    };

    img.onload = () => {
      isImageLoaded = true;
      renderOffscreen();
    };
    if (img.complete) {
      isImageLoaded = true;
      renderOffscreen();
    } else {
      renderOffscreen(); // Render fallback white veil immediately
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      offscreen.width = width;
      offscreen.height = height;
      renderOffscreen();
    };
    window.addEventListener('resize', handleResize);

    // Physics & Motion State
    // Resting size: compact (~115px radius) as requested ("make it a bit small")
    const BASE_RADIUS = 115;

    let targetX = width / 2;
    let targetY = height / 3;

    // Head leads the motion
    let headX = targetX;
    let headY = targetY;

    // Tail drags behind with fluid inertia
    let tailX = targetX;
    let tailY = targetY;

    // Smoothed velocity vector
    let vx = 0;
    let vy = 0;

    let lastTime = performance.now();

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e && e.touches[0] ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e && e.touches[0] ? e.touches[0].clientY : (e as MouseEvent).clientY;
      targetX = clientX;
      targetY = clientY;
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    // Main 60fps Animation Loop
    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // 1. Fluid head tracking (snappy follow with slight organic cushion)
      const prevHeadX = headX;
      const prevHeadY = headY;

      headX += (targetX - headX) * 0.24;
      headY += (targetY - headY) * 0.24;

      // Calculate instantaneous velocity
      const instantVx = (headX - prevHeadX) / (dt || 0.016);
      const instantVy = (headY - prevHeadY) / (dt || 0.016);

      // Smooth velocity
      vx += (instantVx - vx) * 0.2;
      vy += (instantVy - vy) * 0.2;

      const speed = Math.hypot(vx, vy);

      // 2. Tail dragging physics: lags behind head in the direction of motion
      // Stretch factor proportional to speed (clamped for natural fluid tension)
      const stretchAmount = Math.min(speed * 0.16, 130);

      const moveAngle = speed > 15 ? Math.atan2(vy, vx) : 0;
      const targetTailX = headX - Math.cos(moveAngle) * stretchAmount;
      const targetTailY = headY - Math.sin(moveAngle) * stretchAmount;

      // Tail catches up smoothly
      tailX += (targetTailX - tailX) * 0.18;
      tailY += (targetTailY - tailY) * 0.18;

      const headToTailDist = Math.hypot(headX - tailX, headY - tailY);

      // 3. Clear canvas and draw blurred white background
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'none';
      ctx.drawImage(offscreen, 0, 0);

      // 4. Cut out the dynamic organic fluid unblur droplet
      ctx.globalCompositeOperation = 'destination-out';
      ctx.filter = 'blur(16px)'; // Ultra-smooth feathered edge (no geometric harshness)
      ctx.fillStyle = '#000000';

      const tSec = time * 0.0015;

      // Dynamic radii: head stays rounded; tail tapers as it stretches
      const rHead = Math.max(75, BASE_RADIUS - Math.min(headToTailDist * 0.15, 25));
      const rTail = Math.max(40, BASE_RADIUS - Math.min(headToTailDist * 0.45, 65));

      if (headToTailDist < 8) {
        // ─── Resting Organic Droplet (Non-geometric undulating amoeba) ───
        ctx.beginPath();
        const steps = 24;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          // Organic fluid wave harmonics
          const wobble =
            Math.sin(theta * 3 + tSec * 2.2) * 8 +
            Math.cos(theta * 5 - tSec * 1.8) * 5 +
            Math.sin(theta * 2 + 1.3) * 6;
          const rad = BASE_RADIUS + wobble;
          const px = headX + Math.cos(theta) * rad;
          const py = headY + Math.sin(theta) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // ─── Stretched Moving Droplet (Stretches in travel direction) ───
        const dirAngle = Math.atan2(headY - tailY, headX - tailX);
        const sinA = Math.max(-1, Math.min(1, (rHead - rTail) / headToTailDist));
        const alpha = Math.asin(sinA);

        const angleR = dirAngle + Math.PI / 2 - alpha;
        const angleL = dirAngle - Math.PI / 2 + alpha;

        // Tangent contact points on Head and Tail
        const hR = { x: headX + Math.cos(angleR) * rHead, y: headY + Math.sin(angleR) * rHead };
        const tR = { x: tailX + Math.cos(angleR) * rTail, y: tailY + Math.sin(angleR) * rTail };
        const tL = { x: tailX + Math.cos(angleL) * rTail, y: tailY + Math.sin(angleL) * rTail };
        const hL = { x: headX + Math.cos(angleL) * rHead, y: headY + Math.sin(angleL) * rHead };

        // Waist pinch for viscous fluid surface tension
        const pinch = Math.min(headToTailDist * 0.16, 22);
        const nx = -Math.sin(dirAngle);
        const ny = Math.cos(dirAngle);

        const cpR = {
          x: (hR.x + tR.x) / 2 - nx * pinch,
          y: (hR.y + tR.y) / 2 - ny * pinch,
        };
        const cpL = {
          x: (hL.x + tL.x) / 2 + nx * pinch,
          y: (hL.y + tL.y) / 2 + ny * pinch,
        };

        ctx.beginPath();
        // 1. Right side waist curve from head to tail
        ctx.moveTo(hR.x, hR.y);
        ctx.quadraticCurveTo(cpR.x, cpR.y, tR.x, tR.y);

        // 2. Trailing tail round cap
        ctx.arc(tailX, tailY, rTail, angleR, angleL + Math.PI * 2, false);

        // 3. Left side waist curve from tail back to head
        ctx.quadraticCurveTo(cpL.x, cpL.y, hL.x, hL.y);

        // 4. Leading head round cap
        ctx.arc(headX, headY, rHead, angleL, angleR, false);

        ctx.closePath();
        ctx.fill();
      }

      // 5. Delicate soft liquid lens highlight on the unblur boundary
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'blur(10px)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 6;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      cancelAnimationFrame(animId);
    };
  }, [imageSrc]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* 1. Underlying Base: Sharp, unblurred photo in 100% full vibrant focus */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url('${imageSrc}')` }}
      />

      {/* 2. Overlying Canvas: White-blurred frosted layer with dynamic stretching organic unblur cutout */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
};
