import React, { useEffect, useRef } from 'react';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export default function SafetyField({ progress = 0 }) {
  const canvasRef = useRef(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (time = 0) => {
      const p = progressRef.current;
      const t = reducedMotion ? 0 : time * 0.00018;
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#000';
      context.fillRect(0, 0, width, height);

      const centreX = width * 0.5;
      const centreY = height * 0.5;
      const convergence = clamp((p - 0.55) / 0.4);

      context.save();
      context.globalCompositeOperation = 'lighter';
      context.lineWidth = 1;

      for (let index = 0; index < 13; index += 1) {
        const offset = (index - 6) * Math.max(20, width * 0.035);
        const startX = width * 0.06;
        const targetX = centreX - 18 + offset * (1 - convergence);
        const wave = Math.sin(t * 5 + index * 0.72) * 9;
        context.beginPath();
        context.moveTo(startX, centreY + offset * 0.42);
        context.bezierCurveTo(width * 0.25, centreY + offset * 0.32, width * 0.39, centreY + wave, targetX, centreY + offset * 0.08);
        context.strokeStyle = `rgba(241,191,67,${0.08 + convergence * 0.11})`;
        context.stroke();
      }

      for (let index = 0; index < 9; index += 1) {
        const radius = Math.min(width, height) * (0.12 + index * 0.045);
        context.beginPath();
        const start = t + index * 0.45 + p * 1.7;
        context.arc(centreX + width * (0.3 - convergence * 0.3), centreY, radius, start, start + Math.PI * (0.62 + convergence * 0.42));
        context.strokeStyle = `rgba(72,207,181,${0.085 + convergence * 0.12})`;
        context.stroke();
      }

      if (convergence > 0.1) {
        const glow = context.createRadialGradient(centreX, centreY, 0, centreX, centreY, 120 * convergence);
        glow.addColorStop(0, `rgba(255,255,255,${0.58 * convergence})`);
        glow.addColorStop(0.18, `rgba(236,229,216,${0.25 * convergence})`);
        glow.addColorStop(0.48, `rgba(59,178,159,${0.14 * convergence})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = glow;
        context.fillRect(centreX - 130, centreY - 130, 260, 260);
      }

      context.restore();
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas className="safety-field" ref={canvasRef} aria-hidden="true" />;
}
