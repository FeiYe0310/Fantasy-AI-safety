import React, { useEffect, useRef } from 'react';

const KEYFRAME_COUNT = 12;
const VIRTUAL_FRAME_COUNT = 180;
const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };

const TRANSITION_ORIGINS = [
  [.86, .49], [.53, .44], [.69, .47], [.68, .50],
  [.66, .36], [.62, .73], [.68, .68], [.68, .61],
  [.69, .50], [.72, .45], [.76, .47],
];

const drawCover = (context, image, width, height, scale = 1) => {
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  const mobileBias = width < 760 ? 0.67 : 0.5;
  context.drawImage(image, (width - drawWidth) * mobileBias, (height - drawHeight) * 0.5, drawWidth, drawHeight);
};

const drawRadialTransition = (context, buffer, bufferContext, image, width, height, dpr, mix, segment, scale) => {
  if (mix <= 0) return;
  if (mix >= .995) {
    drawCover(context, image, width, height, scale);
    return;
  }

  if (buffer.width !== Math.round(width * dpr) || buffer.height !== Math.round(height * dpr)) {
    buffer.width = Math.round(width * dpr);
    buffer.height = Math.round(height * dpr);
  }

  bufferContext.setTransform(1, 0, 0, 1, 0, 0);
  bufferContext.clearRect(0, 0, buffer.width, buffer.height);
  bufferContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  bufferContext.globalCompositeOperation = 'source-over';
  drawCover(bufferContext, image, width, height, scale);

  const [originX, originY] = TRANSITION_ORIGINS[Math.min(segment, TRANSITION_ORIGINS.length - 1)];
  const x = width * (width < 760 ? Math.min(.72, originX) : originX);
  const y = height * originY;
  const maxRadius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
  const radius = ease(mix) * (maxRadius + 90);
  const feather = Math.min(96, Math.max(46, radius * .2));
  const inner = Math.max(0, radius - feather);
  const gradient = bufferContext.createRadialGradient(x, y, inner, x, y, Math.max(1, radius));
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(.72, 'rgba(255,255,255,.98)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  bufferContext.globalCompositeOperation = 'destination-in';
  bufferContext.fillStyle = gradient;
  bufferContext.fillRect(0, 0, width, height);
  bufferContext.globalCompositeOperation = 'source-over';

  context.drawImage(buffer, 0, 0, width, height);
};

export default function OliveSequenceCanvas({ progress = 0, opacity = 1, stress = 0 }) {
  const canvasRef = useRef(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !context) return undefined;

    const transitionBuffer = document.createElement('canvas');
    const transitionContext = transitionBuffer.getContext('2d');
    const base = import.meta.env.BASE_URL;
    let dirty = true;
    const frames = Array.from({ length: KEYFRAME_COUNT }, (_, index) => {
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = index < 4 ? 'high' : 'auto';
      image.src = `${base}olive-sequence-v3/k_${String(index + 1).padStart(3, '0')}.jpg`;
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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.55);
      const target = clamp(progressRef.current);
      const next = current + (target - current) * .135;
      current = Math.abs(target - next) < .0001 ? target : next;
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
          return best === null || Math.abs(index - position) < Math.abs(best.index - position) ? { image: frame, index } : best;
        }, null);
        const scale = 1.022 - smoothProgress * .012;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.fillStyle = '#dcecf2';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (first?.complete && first.naturalWidth) {
          drawCover(context, first, width, height, scale);
          if (second?.complete && second.naturalWidth && secondIndex !== firstIndex && transitionContext) {
            drawRadialTransition(context, transitionBuffer, transitionContext, second, width, height, dpr, mix, firstIndex, scale);
          }
        } else if (fallback) {
          drawCover(context, fallback.image, width, height, scale);
        }
        lastVirtualFrame = virtualFrame;
        dirty = false;
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tremor = Math.sin(progress * 185) * stress * 3.5;
  return <canvas ref={canvasRef} className="olive-sequence" aria-hidden="true" style={{ opacity, transform: `translate3d(${tremor}px, 0, 0) scale(${1 + stress * .01})`, filter: `saturate(${1 - stress * .22}) contrast(${1.02 + stress * .1})` }} />;
}
