import { useEffect, useRef } from 'react';

/**
 * Full-viewport ambient snowfall on a fixed canvas.
 * - pointer-events: none, so it never blocks interaction
 * - disabled entirely for prefers-reduced-motion users
 * - pauses when the tab is hidden
 */
const FLAKE_DENSITY = 1 / 14000; // flakes per px² of viewport

export default function Snowfall() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let flakes = [];
    let rafId;
    let running = true;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.round(window.innerWidth * window.innerHeight * FLAKE_DENSITY);
      while (flakes.length < target) flakes.push(makeFlake(true));
      flakes.length = Math.min(flakes.length, target);
    }

    function makeFlake(anywhere = false) {
      return {
        x: Math.random() * window.innerWidth,
        y: anywhere ? Math.random() * window.innerHeight : -8,
        r: 1 + Math.random() * 2.6,          // radius
        s: 0.35 + Math.random() * 0.9,       // fall speed
        w: 0.3 + Math.random() * 1.2,        // horizontal wobble amplitude
        p: Math.random() * Math.PI * 2,      // wobble phase
        o: 0.35 + Math.random() * 0.45,      // opacity
      };
    }

    function frame(t) {
      if (!running) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.fillStyle = '#fff';
      for (const f of flakes) {
        f.y += f.s;
        f.x += Math.sin(t / 2200 + f.p) * f.w * 0.3;
        if (f.y > window.innerHeight + 8) Object.assign(f, makeFlake(), { y: -8 });
        ctx.globalAlpha = f.o;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(frame);
    }

    function onVisibility() {
      running = !document.hidden;
      if (running) rafId = requestAnimationFrame(frame);
      else cancelAnimationFrame(rafId);
    }

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="snowfall-canvas" aria-hidden="true" />;
}
