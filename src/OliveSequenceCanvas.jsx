import React, { useEffect, useRef } from 'react';

const KEYFRAME_COUNT = 8;
const VIRTUAL_FRAME_COUNT = 120;
const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

const drawCover = (context, image, width, height, scale = 1) => {
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  const mobileBias = width < 760 ? 0.62 : 0.5;
  context.drawImage(image, (width - drawWidth) * mobileBias, (height - drawHeight) * 0.5, drawWidth, drawHeight);
};

const hash = (x, y, seed) => {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return value - Math.floor(value);
};

const revealNextStage = (context, image, width, height, mix, segment, scale) => {
  if (mix <= 0) return;
  if (mix >= 0.995) {
    drawCover(context, image, width, height, scale);
    return;
  }

  // Reveal new growth from the buried pit outward. Cells are opaque so the
  // tree never appears as two overlapping silhouettes during a transition.
  const cell = width < 760 ? 14 : 11;
  const anchorX = width * (width < 760 ? 0.66 : 0.68);
  const anchorY = height * 0.68;
  const maxDistance = Math.hypot(Math.max(anchorX, width - anchorX), Math.max(anchorY, height - anchorY));
  const cutoff = ease(mix) * 1.16;

  context.save();
  context.beginPath();
  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      const dx = (x + cell * 0.5 - anchorX) * 0.82;
      const dy = (y + cell * 0.5 - anchorY) * (y < anchorY ? 0.68 : 1.05);
      const distance = Math.hypot(dx, dy) / maxDistance;
      const threshold = distance + (hash(x / cell, y / cell, segment) - 0.5) * 0.16;
      if (threshold <= cutoff) context.rect(x, y, cell + 1, cell + 1);
    }
  }
  context.clip();
  drawCover(context, image, width, height, scale);
  context.restore();
};

export default function OliveSequenceCanvas({ progress = 0, opacity = 1, stress = 0 }) {
  const canvasRef = useRef(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !context) return undefined;

    const base = import.meta.env.BASE_URL;
    let dirty = true;
    const frames = Array.from({ length: KEYFRAME_COUNT }, (_, index) => {
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = index < 3 ? 'high' : 'auto';
      image.src = `${base}olive-sequence-v2/k_${String(index + 1).padStart(3, '0')}.jpg`;
      image.onload = () => { dirty = true; };
      return image;
    });

    let raf = 0;
    let current = progressRef.current;
    let lastVirtualFrame = -1;
    let lastWidth = 0;
    let lastHeight = 0;

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      const target = clamp(progressRef.current);
      const next = current + (target - current) * 0.16;
      current = Math.abs(target - next) < 0.00015 ? target : next;
      const virtualFrame = Math.round(current * (VIRTUAL_FRAME_COUNT - 1));

      if (width !== lastWidth || height !== lastHeight) {
        lastWidth = width;
        lastHeight = height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        dirty = true;
      }

      if (dirty || virtualFrame !== lastVirtualFrame) {
        const smoothProgress = virtualFrame / (VIRTUAL_FRAME_COUNT - 1);
        const position = smoothProgress * (KEYFRAME_COUNT - 1);
        const firstIndex = Math.floor(position);
        const secondIndex = Math.min(KEYFRAME_COUNT - 1, firstIndex + 1);
        const mix = position - firstIndex;
        const first = frames[firstIndex];
        const second = frames[secondIndex];
        const fallback = frames.reduce((best, frame, index) => {
          if (!frame.complete || !frame.naturalWidth) return best;
          return best === null || Math.abs(index - position) < Math.abs(best.index - position)
            ? { image: frame, index }
            : best;
        }, null);
        const scale = 1.018 - smoothProgress * 0.018;

        context.save();
        context.scale(dpr, dpr);
        context.fillStyle = '#dbe8e7';
        context.fillRect(0, 0, width, height);
        if (first?.complete && first.naturalWidth) {
          drawCover(context, first, width, height, scale);
          if (second?.complete && second.naturalWidth && secondIndex !== firstIndex) {
            revealNextStage(context, second, width, height, mix, firstIndex, scale);
          }
        } else if (fallback) {
          drawCover(context, fallback.image, width, height, scale);
        }
        context.restore();
        dirty = false;
        lastVirtualFrame = virtualFrame;
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tremor = Math.sin(progress * 170) * stress * 4;
  return <canvas ref={canvasRef} className="olive-sequence" aria-hidden="true" style={{ opacity, transform: `translate3d(${tremor}px, 0, 0) scale(${1 + stress * 0.012})`, filter: `saturate(${.94 - stress * .18}) contrast(${1.02 + stress * .12})` }} />;
}
