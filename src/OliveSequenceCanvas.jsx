import React, { useEffect, useRef } from 'react';

const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

const MEDIA_ROOT = 'olive-core-v27';
const TIMELINE = [
  {
    id: '01-sky-to-soil', from: 0, to: .19, count: 0,
    fallback: ['01-fall.jpg', '02-underground.jpg'], focus: [.67, .48], mobile: [.68, .48],
  },
  {
    id: '02-root-and-shoot', from: .19, to: .45, count: 91,
    frames: 'frames/02-root-and-shoot', fallback: ['02-underground.jpg', '03-germinate.jpg'], focus: [.67, .52], mobile: [.7, .5],
  },
  {
    id: '03-through-the-trunk', from: .45, to: .64, count: 0,
    fallback: ['03-germinate.jpg', '04-trunk.jpg'], focus: [.66, .51], mobile: [.69, .5],
  },
  {
    id: '04-trunk-to-branch', from: .64, to: .83, count: 0,
    fallback: ['04-trunk.jpg', '05-branch.jpg'], focus: [.65, .5], mobile: [.68, .5],
  },
  {
    id: '05-branch-to-fruit', from: .83, to: 1, count: 0,
    fallback: ['05-branch.jpg', '06-fruit.jpg'], focus: [.69, .49], mobile: [.7, .48],
  },
];

const frameName = (index) => `${String(index).padStart(4, '0')}.webp`;

const drawCover = (context, image, width, height, scale = 1, focus = [.5, .5]) => {
  if (!image?.naturalWidth) return false;
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  context.drawImage(image, (width - drawWidth) * focus[0], (height - drawHeight) * focus[1], drawWidth, drawHeight);
  return true;
};

export default function OliveSequenceCanvas({ progress = 0 }) {
  const canvasRef = useRef(null);
  const progressRef = useRef(progress);
  const scheduleRef = useRef(null);
  progressRef.current = progress;

  useEffect(() => {
    scheduleRef.current?.();
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false, desynchronized: true });
    if (!canvas || !context) return undefined;

    const base = `${import.meta.env.BASE_URL}${MEDIA_ROOT}/`;
    const fallbackBase = `${import.meta.env.BASE_URL}olive-core-v26/`;
    let timeline = TIMELINE;
    const cache = new Map();
    const fallbacks = new Map();
    let dirty = true;
    let raf = 0;
    let lastFrameKey = '';
    let lastWidth = 0;
    let lastHeight = 0;
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    scheduleRef.current = schedule;

    const touch = (key, image) => {
      cache.delete(key);
      cache.set(key, image);
      while (cache.size > 24) cache.delete(cache.keys().next().value);
    };

    const loadImage = (url, priority = 'auto') => {
      const existing = cache.get(url);
      if (existing) {
        touch(url, existing);
        return existing;
      }
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = priority;
      image.onload = () => { dirty = true; schedule(); };
      image.src = url;
      touch(url, image);
      return image;
    };

    const loadFallback = (filename) => {
      if (fallbacks.has(filename)) return fallbacks.get(filename);
      const image = new Image();
      image.decoding = 'async';
      image.src = `${fallbackBase}${filename}`;
      image.onload = () => { dirty = true; schedule(); };
      fallbacks.set(filename, image);
      return image;
    };
    TIMELINE.flatMap((segment) => segment.fallback).forEach(loadFallback);

    const manifestController = new AbortController();
    fetch(`${base}sequence.json`, { signal: manifestController.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then((manifest) => {
        const available = new Map(manifest.segments.map((segment) => [segment.id, segment]));
        timeline = TIMELINE.map((segment) => ({ ...segment, ...(available.get(segment.id) || {}) }));
        dirty = true;
        schedule();
      })
      .catch((error) => {
        if (error.name !== 'AbortError') console.warn('Frame manifest unavailable; using still fallbacks.');
      });

    const locate = (p) => timeline.find((segment) => p <= segment.to) || timeline.at(-1);
    const localProgress = (segment, p) => clamp((p - segment.from) / Math.max(.001, segment.to - segment.from));
    const urlFor = (segment, index) => `${base}${segment.frames}/${frameName(index)}`;

    const preloadWindow = (segment, index) => {
      if (!segment.frames || !segment.count) return;
      for (let offset = -5; offset <= 9; offset += 1) {
        const candidate = Math.max(0, Math.min(segment.count - 1, index + offset));
        loadImage(urlFor(segment, candidate), Math.abs(offset) < 2 ? 'high' : 'auto');
      }
      if (index >= segment.count - 12) {
        const next = timeline[timeline.indexOf(segment) + 1];
        if (next?.frames && next.count) {
          for (let candidate = 0; candidate < Math.min(8, next.count); candidate += 1) loadImage(urlFor(next, candidate));
        }
      }
    };

    const drawFallback = (segment, local, width, height, focus) => {
      const first = loadFallback(segment.fallback[0]);
      const last = loadFallback(segment.fallback[1]);
      const change = ease((local - .7) / .3);
      context.save();
      drawCover(context, first, width, height, 1.015 + local * .045, focus);
      if (last?.naturalWidth && change > 0) {
        context.globalAlpha = change;
        drawCover(context, last, width, height, 1.065 - change * .035, focus);
      }
      context.restore();
    };

    const draw = (p, width, height) => {
      const segment = locate(p);
      const local = localProgress(segment, p);
      const focus = width < 760 ? segment.mobile : segment.focus;
      context.fillStyle = '#dceaf0';
      context.fillRect(0, 0, width, height);

      if (!segment.frames || !segment.count) {
        drawFallback(segment, local, width, height, focus);
        return `${segment.id}:fallback:${Math.round(local * 120)}`;
      }

      const index = Math.min(segment.count - 1, Math.round(local * (segment.count - 1)));
      preloadWindow(segment, index);
      const url = urlFor(segment, index);
      const frame = loadImage(url, 'high');
      if (!drawCover(context, frame, width, height, 1.035, focus)) {
        drawFallback(segment, local, width, height, focus);
      }
      return `${segment.id}:${index}`;
    };

    const render = () => {
      raf = 0;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
      if (width !== lastWidth || height !== lastHeight) {
        lastWidth = width;
        lastHeight = height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        dirty = true;
      }

      const target = clamp(progressRef.current);
      const segment = locate(target);
      const local = localProgress(segment, target);
      const expectedKey = segment.frames && segment.count
        ? `${segment.id}:${Math.min(segment.count - 1, Math.round(local * (segment.count - 1)))}`
        : `${segment.id}:fallback:${Math.round(local * 120)}`;

      if (dirty || expectedKey !== lastFrameKey) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        lastFrameKey = draw(target, width, height);
        dirty = false;
      }
    };

    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', schedule);
      manifestController.abort();
      scheduleRef.current = null;
      cache.clear();
      fallbacks.clear();
    };
  }, []);

  return <canvas ref={canvasRef} className="olive-sequence" aria-hidden="true" />;
}
