import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const clamp = (value) => Math.min(1, Math.max(0, value));
const MEDIA_ROOT = 'olive-core-v29';
const FALLBACK_ROOT = 'olive-core-v26';
const GLOBAL_FOCUS = [.67, .5];
const MOBILE_FOCUS = [.69, .5];

const drawCover = (context, image, width, height, scale = 1, focus = [.5, .5]) => {
  const sourceWidth = image?.naturalWidth || image?.width || 0;
  const sourceHeight = image?.naturalHeight || image?.height || 0;
  if (!sourceWidth || !sourceHeight) return false;
  const ratio = Math.max(width / sourceWidth, height / sourceHeight) * scale;
  const drawWidth = sourceWidth * ratio;
  const drawHeight = sourceHeight * ratio;
  context.drawImage(image, (width - drawWidth) * focus[0], (height - drawHeight) * focus[1], drawWidth, drawHeight);
  return true;
};

const loadDecodedImage = async (url, signal) => {
  const started = performance.now();
  const response = await fetch(url, { signal, cache: 'force-cache' });
  if (!response.ok) throw new Error(`Frame ${response.status}: ${url}`);
  const blob = await response.blob();
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(blob);
    return { image: bitmap, decodeMs: performance.now() - started };
  }
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;
    await image.decode();
    return { image, decodeMs: performance.now() - started };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const OliveSequenceCanvas = forwardRef(function OliveSequenceCanvas({ onTimelineReady }, ref) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const onTimelineReadyRef = useRef(onTimelineReady);
  onTimelineReadyRef.current = onTimelineReady;

  useImperativeHandle(ref, () => ({
    render: (clock) => engineRef.current?.render(clock),
    diagnostics: () => engineRef.current?.diagnostics() || null,
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false, desynchronized: true });
    if (!canvas || !context) return undefined;

    const base = `${import.meta.env.BASE_URL}${MEDIA_ROOT}/`;
    const fallbackUrl = `${import.meta.env.BASE_URL}${FALLBACK_ROOT}/01-fall.jpg`;
    const controller = new AbortController();
    const ready = new Map();
    const loading = new Map();
    const queued = new Set();
    const queue = [];
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    const maxCache = mobile ? 48 : 96;
    const concurrency = mobile ? 4 : 7;
    const preloadAhead = mobile ? 36 : 72;
    const preloadBehind = mobile ? 12 : 22;
    const stats = {
      cacheHits: 0,
      frameMisses: 0,
      substitutions: 0,
      decodeCount: 0,
      averageDecodeMs: 0,
      averageDrawMs: 0,
      drawCount: 0,
      desiredFrame: 0,
      renderedFrame: -1,
      lastBoundary: '',
      initialFallbackDraws: 0,
      fallbackDrawsAfterStart: 0,
    };

    let destroyed = false;
    let activeLoads = 0;
    let frames = [];
    let boundaries = [];
    let manifestReady = false;
    let fatal = false;
    let filmStarted = false;
    let fallback = null;
    let fallbackReady = false;
    let lastDesired = -1;
    let lastDirection = 1;
    let lastRendered = -1;
    let lastWidth = 0;
    let lastHeight = 0;
    let lastDpr = 0;

    const closeFrame = (record) => record?.image?.close?.();
    const touch = (index, record = ready.get(index)) => {
      if (!record) return;
      ready.delete(index);
      ready.set(index, record);
      while (ready.size > maxCache) {
        const oldest = ready.keys().next().value;
        if (oldest === lastRendered) {
          const retained = ready.get(oldest);
          ready.delete(oldest);
          ready.set(oldest, retained);
          continue;
        }
        closeFrame(ready.get(oldest));
        ready.delete(oldest);
      }
    };

    const pump = () => {
      while (!destroyed && activeLoads < concurrency && queue.length) {
        const index = queue.shift();
        queued.delete(index);
        if (ready.has(index) || loading.has(index) || !frames[index]) continue;
        activeLoads += 1;
        const task = loadDecodedImage(`${base}${frames[index]}`, controller.signal)
          .then(({ image, decodeMs }) => {
            if (destroyed) {
              image.close?.();
              return;
            }
            stats.decodeCount += 1;
            stats.averageDecodeMs += (decodeMs - stats.averageDecodeMs) / stats.decodeCount;
            ready.set(index, { image, decodedAt: performance.now() });
            touch(index);
          })
          .catch((error) => {
            if (error.name !== 'AbortError' && import.meta.env.DEV) console.warn('Frame decode failed', index, error);
          })
          .finally(() => {
            loading.delete(index);
            activeLoads -= 1;
            pump();
          });
        loading.set(index, task);
      }
    };

    const enqueue = (index, urgent = false) => {
      if (index < 0 || index >= frames.length || ready.has(index) || loading.has(index) || queued.has(index)) return;
      queued.add(index);
      if (urgent) queue.unshift(index);
      else queue.push(index);
    };

    const prepareWindow = (desired, direction, force = false) => {
      if (!frames.length) return;
      if (force || direction !== lastDirection || Math.abs(desired - lastDesired) > preloadAhead) {
        queue.length = 0;
        queued.clear();
      }
      enqueue(desired, true);
      for (let distance = 1; distance <= preloadAhead; distance += 1) enqueue(desired + direction * distance);
      for (let distance = 1; distance <= preloadBehind; distance += 1) enqueue(desired - direction * distance);
      lastDirection = direction;
      pump();
    };

    const nearestReady = (desired, direction) => {
      if (ready.has(desired)) return desired;
      for (let distance = 1; distance < frames.length; distance += 1) {
        const preferred = desired - direction * distance;
        const alternate = desired + direction * distance;
        if (preferred >= 0 && preferred < frames.length && ready.has(preferred)) return preferred;
        if (alternate >= 0 && alternate < frames.length && ready.has(alternate)) return alternate;
      }
      return lastRendered >= 0 && ready.has(lastRendered) ? lastRendered : -1;
    };

    const drawFrame = (index, width, height, dpr) => {
      const record = ready.get(index);
      if (!record) return false;
      const started = performance.now();
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.fillStyle = '#dceaf0';
      context.fillRect(0, 0, width, height);
      const drawn = drawCover(context, record.image, width, height, 1.035, width < 760 ? MOBILE_FOCUS : GLOBAL_FOCUS);
      if (drawn) {
        stats.drawCount += 1;
        stats.averageDrawMs += (performance.now() - started - stats.averageDrawMs) / stats.drawCount;
        stats.renderedFrame = index;
        lastRendered = index;
        touch(index, record);
        filmStarted = true;
      }
      return drawn;
    };

    const drawFallback = (width, height, dpr) => {
      if (!fallbackReady || !fallback) return;
      if (filmStarted) {
        stats.fallbackDrawsAfterStart += 1;
        return;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.fillStyle = '#dceaf0';
      context.fillRect(0, 0, width, height);
      if (drawCover(context, fallback, width, height, 1.035, width < 760 ? MOBILE_FOCUS : GLOBAL_FOCUS)) {
        stats.initialFallbackDraws += 1;
      }
    };

    const recordBoundary = (from, to) => {
      for (const boundary of boundaries) {
        const crossing = boundary.nextSegmentStart;
        if ((from < crossing && to >= crossing) || (from >= crossing && to < crossing)) {
          stats.lastBoundary = boundary.id;
          if (import.meta.env.DEV) console.info(`[film] boundary ${boundary.id}`, { from, to });
        }
      }
    };

    const render = (clock) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
      const resized = width !== lastWidth || height !== lastHeight || dpr !== lastDpr;
      if (resized) {
        lastWidth = width;
        lastHeight = height;
        lastDpr = dpr;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      if (clock.reduced || fatal || !manifestReady) {
        drawFallback(width, height, dpr);
        return;
      }

      const desired = Math.min(frames.length - 1, Math.round(clamp(clock.currentProgress) * (frames.length - 1)));
      stats.desiredFrame = desired;
      if (desired !== lastDesired) {
        recordBoundary(lastDesired, desired);
        if (ready.has(desired)) stats.cacheHits += 1;
        else stats.frameMisses += 1;
        prepareWindow(desired, clock.direction || 1, Math.abs(desired - lastDesired) > preloadAhead);
      }

      const actual = nearestReady(desired, clock.direction || 1);
      if (actual >= 0) {
        if (actual !== desired && desired !== lastDesired) stats.substitutions += 1;
        if (resized || actual !== lastRendered) drawFrame(actual, width, height, dpr);
      } else if (!filmStarted) {
        drawFallback(width, height, dpr);
      }
      lastDesired = desired;
    };

    const diagnostics = () => ({
      ...stats,
      manifestReady,
      filmStarted,
      decodedCacheSize: ready.size,
      loadingFrames: loading.size,
      queuedFrames: queue.length,
      cacheHitRate: (stats.cacheHits + stats.frameMisses)
        ? stats.cacheHits / (stats.cacheHits + stats.frameMisses)
        : 1,
      globalFrameCount: frames.length,
    });

    engineRef.current = { render, diagnostics };

    const fallbackImage = new Image();
    fallbackImage.decoding = 'async';
    fallbackImage.onload = () => {
      fallback = fallbackImage;
      fallbackReady = true;
    };
    fallbackImage.src = fallbackUrl;

    fetch(`${base}sequence.json`, { signal: controller.signal, cache: 'no-cache' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`Manifest ${response.status}`)))
      .then((manifest) => {
        if (!Array.isArray(manifest.frames) || !manifest.frames.length) throw new Error('Global frame timeline missing');
        frames = manifest.frames;
        boundaries = manifest.boundaries || [];
        manifestReady = true;
        const pixelsPerFrame = mobile
          ? manifest.pacing?.mobilePixelsPerFrame || 30
          : manifest.pacing?.desktopPixelsPerFrame || 40;
        onTimelineReadyRef.current?.({ frameCount: frames.length, pixelsPerFrame, boundaries });
        prepareWindow(0, 1, true);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          fatal = true;
          console.warn('Film manifest unavailable; keeping initial painting.', error);
        }
      });

    return () => {
      destroyed = true;
      controller.abort();
      engineRef.current = null;
      queue.length = 0;
      ready.forEach(closeFrame);
      ready.clear();
      loading.clear();
      queued.clear();
    };
  }, []);

  return <canvas ref={canvasRef} className="olive-sequence" aria-hidden="true" />;
});

export default OliveSequenceCanvas;
