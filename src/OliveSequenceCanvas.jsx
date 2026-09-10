import React, { useEffect, useRef } from 'react';

const VIRTUAL_FRAME_COUNT = 280;
const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };

// The uneven stops give the olive macro sequence more screen time than the
// establishing paintings, so the object—not the chapter change—drives the cut.
const SHOTS = [
  { file: 'shot-01.jpg', at: 0, focus: [.64, .5] },
  { file: 'transitions/01-olive-breath-start.jpg', at: .038, focus: [.68, .48] },
  { file: 'transitions/01-olive-breath-end.jpg', at: .078, focus: [.53, .5] },
  { file: 'transitions/02-nuwa-catches-seed-start.jpg', at: .14, focus: [.68, .5] },
  { file: 'transitions/02-nuwa-catches-seed-end.jpg', at: .205, focus: [.55, .5] },
  { file: 'transitions/03-five-verifiers-start.jpg', at: .28, focus: [.67, .5] },
  { file: 'transitions/03-five-verifiers-end.jpg', at: .355, focus: [.68, .48] },
  { file: 'transitions/04-plant-the-pit-start.jpg', at: .42, focus: [.68, .54] },
  { file: 'transitions/04-plant-the-pit-end.jpg', at: .486, focus: [.55, .53] },
  { file: 'transitions/05-first-root-start.jpg', at: .494, focus: [.55, .53] },
  { file: 'transitions/05-first-root-end.jpg', at: .551, focus: [.53, .52] },
  { file: 'transitions/06-roots-find-evidence-start.jpg', at: .559, focus: [.53, .52] },
  { file: 'transitions/06-roots-find-evidence-end.jpg', at: .621, focus: [.61, .55] },
  { file: 'transitions/10-growth-orbit-start.jpg', at: .629, focus: [.59, .53] },
  { file: 'transitions/10-growth-orbit-end.jpg', at: .744, focus: [.62, .5] },
  { file: 'transitions/11-pluck-orbit-start.jpg', at: .752, focus: [.62, .5] },
  { file: 'transitions/11-pluck-orbit-end.jpg', at: .852, focus: [.58, .48] },
  { file: 'orbit-14-raised.jpg', at: .872, focus: [.55, .46] },
  { file: 'transitions/12-mend-orbit-start.jpg', at: .88, focus: [.55, .46] },
  { file: 'transitions/12-mend-orbit-end.jpg', at: .946, focus: [.56, .45] },
  { file: 'orbit-15-mended.jpg', at: .958, focus: [.56, .44] },
  { file: 'shot-14.jpg', at: .99, focus: [.68, .5] },
];

const drawCover = (context, image, width, height, scale, focus) => {
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  const focusX = width < 760 ? Math.max(.54, focus[0]) : focus[0];
  context.drawImage(image, (width - drawWidth) * focusX, (height - drawHeight) * focus[1], drawWidth, drawHeight);
};

const locateShot = (progress) => {
  const nextIndex = SHOTS.findIndex((shot) => shot.at > progress);
  if (nextIndex === -1) return { firstIndex: SHOTS.length - 1, secondIndex: SHOTS.length - 1, local: 0, mix: 0 };
  if (nextIndex === 0) return { firstIndex: 0, secondIndex: 0, local: 0, mix: 0 };
  const firstIndex = nextIndex - 1;
  const span = SHOTS[nextIndex].at - SHOTS[firstIndex].at;
  const local = clamp((progress - SHOTS[firstIndex].at) / span);
  // Hold the exact boundary frame, then dissolve across the shared brushwork.
  // Closely spaced stops create a short, deliberate bridge between adjacent clips.
  const mix = ease((local - .12) / .76);
  return { firstIndex, secondIndex: nextIndex, local, mix };
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
    const frames = SHOTS.map((shot, index) => {
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = index < 5 ? 'high' : 'auto';
      image.src = `${base}olive-oil-story-v1/${shot.file}`;
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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const target = clamp(progressRef.current);
      const next = current + (target - current) * .11;
      current = Math.abs(target - next) < .00008 ? target : next;
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
        const { firstIndex, secondIndex, local, mix } = locateShot(smoothProgress);
        const first = frames[firstIndex];
        const second = frames[secondIndex];
        const fallback = frames.reduce((best, frame, index) => {
          if (!frame.complete || !frame.naturalWidth) return best;
          return best === null || Math.abs(index - firstIndex) < Math.abs(best.index - firstIndex) ? { image: frame, index } : best;
        }, null);

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.fillStyle = '#d8e4e5';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (first?.complete && first.naturalWidth) {
          // A restrained push-in keeps every still alive while the user scrolls.
          drawCover(context, first, width, height, 1.005 + local * .048, SHOTS[firstIndex].focus);
          if (secondIndex !== firstIndex && second?.complete && second.naturalWidth && mix > 0) {
            context.save();
            context.globalAlpha = mix;
            drawCover(context, second, width, height, .992 + mix * .018, SHOTS[secondIndex].focus);
            context.restore();
          }
        } else if (fallback) {
          drawCover(context, fallback.image, width, height, 1.01, SHOTS[fallback.index].focus);
        }

        lastVirtualFrame = virtualFrame;
        dirty = false;
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tremor = Math.sin(progress * 185) * stress * 2.2;
  return <canvas ref={canvasRef} className="olive-sequence" aria-hidden="true" style={{ opacity, transform: `translate3d(${tremor}px, 0, 0) scale(${1 + stress * .006})`, filter: `saturate(${1 - stress * .16}) contrast(${1.01 + stress * .06})` }} />;
}
