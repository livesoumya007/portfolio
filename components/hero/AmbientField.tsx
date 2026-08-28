'use client';

import { useEffect, useRef } from 'react';
import { pickParticleColor } from './particle-palette';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
};

type Props = { className?: string };

export function AmbientField({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const dpr = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let rafId: number | null = null;
    let isInView = true;

    const buildParticles = () => {
      // 1. Increased particle count for better density across the screen
      const n = window.innerWidth < 600 ? 120 : 250;
      particles = Array.from({ length: n }, () => {
        const fast = Math.random() < 0.25;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          // 2. Increased velocity multipliers for slightly faster movement
          vx: (Math.random() - 0.5) * (fast ? 0.35 : 0.20),
          vy: (Math.random() - 0.5) * (fast ? 0.35 : 0.20),
          size: 0.55 + Math.random() * 1.45,
          color: pickParticleColor(Math.random()),
        };
      });
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) buildParticles();
    };

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = () => {
      drawFrame();
      rafId = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (reduceMotion) return;
      if (rafId != null) return;
      rafId = requestAnimationFrame(loop);
    };

    const stopLoop = () => {
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    resize();
    drawFrame();
    if (!reduceMotion) startLoop();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      drawFrame();
    });
    resizeObserver.observe(parent);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isInView = entry.isIntersecting;
        if (isInView && !document.hidden) startLoop();
        else stopLoop();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else if (isInView) startLoop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stopLoop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
