import React, { useEffect, useRef } from 'react';

const VIRTUAL_FRAME_COUNT = 320;
const clamp = (value) => Math.min(1, Math.max(0, value));
const smoother = (value) => {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

const SHOTS = [
  { file: '01-the-crack.jpg', at: 0, focus: [.64, .5], mobileFocus: .68, zoom: [1.01, 1.055] },
  { file: '02-plant-the-pit.jpg', at: .14, focus: [.65, .54], mobileFocus: .68, zoom: [1.015, 1.06] },
  { file: '03-roots-of-evidence.jpg', at: .28, focus: [.4, .54], mobileFocus: .42, zoom: [1.01, 1.055] },
  { file: '04-the-tree-grows.jpg', at: .42, focus: [.67, .51], mobileFocus: .69, zoom: [1.01, 1.05] },
  { file: '05-the-leaf-is-chosen.jpg', at: .56, focus: [.39, .48], mobileFocus: .42, zoom: [1.015, 1.06] },
  { file: '06-evidence-to-carry.jpg', at: .69, focus: [.67, .47], mobileFocus: .69, zoom: [1.01, 1.055] },
  { file: '07-mend-the-sky.jpg', at: .82, focus: [.67, .46], mobileFocus: .7, zoom: [1.005, 1.05] },
  { file: '08-peace-verified.jpg', at: .94, focus: [.38, .47], mobileFocus: .4, zoom: [1.01, 1.045] },
];

const drawCover = (context, image, width, height, scale, focus, mobileFocus) => {
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  const focusX = width < 760 ? mobileFocus : focus[0];
  context.drawImage(image, (width - drawWidth) * focusX, (height - drawHeight) * focus[1], drawWidth, drawHeight);
};

const locateShot = (progress) => {
  const nextIndex = SHOTS.findIndex((shot) => shot.at > progress);
  if (nextIndex === -1) return { firstIndex: SHOTS.length - 1, secondIndex: SHOTS.length - 1, local: 1, mix: 0 };
  if (nextIndex === 0) return { firstIndex: 0, secondIndex: 0, local: 0, mix: 0 };
  const firstIndex = nextIndex - 1;
  const span = SHOTS[nextIndex].at - SHOTS[firstIndex].at;
  const local = clamp((progress - SHOTS[firstIndex].at) / span);
  return { firstIndex, secondIndex: nextIndex, local, mix: smoother((local - .58) / .34) };
};

export default function OliveSequenceCanvas({ progress = 0 }) {
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
      image.fetchPriority = index < 2 ? 'high' : 'auto';
      image.src = `${base}olive-oil-story-v24/${shot.file}`;
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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
      const target = clamp(progressRef.current);
      const next = current + (target - current) * .1;
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

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.fillStyle = '#b9cdd5';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (first?.complete && first.naturalWidth) {
          const [startZoom, endZoom] = SHOTS[firstIndex].zoom;
          drawCover(context, first, width, height, startZoom + (endZoom - startZoom) * local, SHOTS[firstIndex].focus, SHOTS[firstIndex].mobileFocus);
        }
        if (secondIndex !== firstIndex && second?.complete && second.naturalWidth && mix > 0) {
          const [startZoom, endZoom] = SHOTS[secondIndex].zoom;
          context.save();
          context.globalAlpha = mix;
          drawCover(context, second, width, height, startZoom + (endZoom - startZoom) * mix * .22, SHOTS[secondIndex].focus, SHOTS[secondIndex].mobileFocus);
          context.restore();
        }

        lastVirtualFrame = virtualFrame;
        dirty = false;
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="olive-sequence" aria-hidden="true" />;
}
