import React, { useEffect, useRef } from 'react';

const FRAME_COUNT = 10;
const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };

const drawCover = (context, image, width, height, scale = 1) => {
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  const mobileBias = width < 760 ? 0.62 : 0.5;
  context.drawImage(image, (width - drawWidth) * mobileBias, (height - drawHeight) * 0.5, drawWidth, drawHeight);
};

export default function OliveSequenceCanvas({ progress = 0, opacity = 1 }) {
  const canvasRef = useRef(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !context) return undefined;
    const base = import.meta.env.BASE_URL;
    const frames = Array.from({ length: FRAME_COUNT }, (_, index) => {
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = index < 3 ? 'high' : 'auto';
      image.src = `${base}olive-sequence/f_${String(index + 1).padStart(3, '0')}.jpg`;
      image.onload = () => { dirty = true; };
      return image;
    });
    let raf = 0;
    let current = progressRef.current;
    let dirty = true;
    let lastWidth = 0;
    let lastHeight = 0;

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const target = clamp(progressRef.current);
      const next = current + (target - current) * 0.18;
      current = Math.abs(target - next) < 0.00015 ? target : next;
      if (width !== lastWidth || height !== lastHeight) {
        lastWidth = width; lastHeight = height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        dirty = true;
      }
      if (dirty || current !== target) {
        const position = current * (FRAME_COUNT - 1);
        const firstIndex = Math.floor(position);
        const secondIndex = Math.min(FRAME_COUNT - 1, firstIndex + 1);
        const mix = ease(position - firstIndex);
        const first = frames[firstIndex];
        const second = frames[secondIndex];
        const fallback = frames.reduce((best, frame, index) => {
          if (!frame.complete || !frame.naturalWidth) return best;
          return best === null || Math.abs(index - position) < Math.abs(best.index - position) ? { image: frame, index } : best;
        }, null);
        const scale = 1.025 - current * 0.025;
        context.save();
        context.scale(dpr, dpr);
        context.fillStyle = '#dbe8e7';
        context.fillRect(0, 0, width, height);
        if (first?.complete && first.naturalWidth) {
          context.globalAlpha = 1;
          drawCover(context, first, width, height, scale);
        } else if (fallback) {
          context.globalAlpha = 1;
          drawCover(context, fallback.image, width, height, scale);
        }
        if (second?.complete && second.naturalWidth && secondIndex !== firstIndex) {
          context.globalAlpha = mix;
          drawCover(context, second, width, height, scale);
        }
        context.restore();
        dirty = false;
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="olive-sequence" aria-hidden="true" style={{ opacity }} />;
}
