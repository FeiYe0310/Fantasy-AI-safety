import React, { useEffect, useRef } from 'react';

const clamp = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const range = (value, start, end) => smooth((value - start) / (end - start));

const STILLS = [
  { file: '01-fall.jpg', focus: [.68, .49], mobile: [.66, .46] },
  { file: '02-underground.jpg', focus: [.67, .53], mobile: [.69, .5] },
  { file: '03-germinate.jpg', focus: [.68, .52], mobile: [.7, .5] },
  { file: '04-trunk.jpg', focus: [.65, .5], mobile: [.68, .5] },
  { file: '05-branch.jpg', focus: [.66, .5], mobile: [.69, .5] },
  { file: '06-fruit.jpg', focus: [.7, .48], mobile: [.7, .48] },
];

const drawCover = (context, media, width, height, scale = 1, focus = [.5, .5]) => {
  const mediaWidth = media.videoWidth || media.naturalWidth;
  const mediaHeight = media.videoHeight || media.naturalHeight;
  if (!mediaWidth || !mediaHeight) return;
  const ratio = Math.max(width / mediaWidth, height / mediaHeight) * scale;
  const drawWidth = mediaWidth * ratio;
  const drawHeight = mediaHeight * ratio;
  context.drawImage(media, (width - drawWidth) * focus[0], (height - drawHeight) * focus[1], drawWidth, drawHeight);
};

const paintStill = (context, image, width, height, scale, focus, alpha = 1, rotation = 0) => {
  if (!image?.complete || !image.naturalWidth || alpha <= 0) return;
  context.save();
  context.globalAlpha = alpha;
  if (rotation) {
    context.translate(width / 2, height / 2);
    context.rotate(rotation);
    context.translate(-width / 2, -height / 2);
  }
  drawCover(context, image, width, height, scale, focus);
  context.restore();
};

export default function OliveSequenceCanvas({ progress = 0 }) {
  const canvasRef = useRef(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false, desynchronized: true });
    if (!canvas || !context) return undefined;

    const base = `${import.meta.env.BASE_URL}olive-core-v26/`;
    let dirty = true;
    const stills = STILLS.map((shot, index) => {
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = index < 2 ? 'high' : 'auto';
      image.src = `${base}${shot.file}`;
      image.onload = () => { dirty = true; };
      return image;
    });

    const germination = document.createElement('video');
    germination.src = `${base}02-germination.mp4`;
    germination.preload = 'auto';
    germination.muted = true;
    germination.playsInline = true;
    germination.load();
    germination.addEventListener('loadeddata', () => { dirty = true; });
    germination.addEventListener('seeked', () => { dirty = true; });

    let raf = 0;
    let current = progressRef.current;
    let lastProgress = -1;
    let lastWidth = 0;
    let lastHeight = 0;

    const draw = (p, width, height) => {
      const mobile = width < 760;
      const focus = (index) => mobile ? STILLS[index].mobile : STILLS[index].focus;

      context.fillStyle = '#dceaf0';
      context.fillRect(0, 0, width, height);

      if (p < .18) {
        const local = range(p, 0, .18);
        paintStill(context, stills[0], width, height, 1.01 + local * .19, [focus(0)[0] - local * .055, focus(0)[1] + local * .045]);
        return;
      }

      if (p < .50) {
        const local = clamp((p - .18) / .32);
        const duration = Number.isFinite(germination.duration) ? germination.duration : 5;
        const wantedTime = clamp(local) * Math.max(.01, duration - .04);
        if (germination.readyState >= 2 && !germination.seeking && Math.abs(germination.currentTime - wantedTime) > .025) {
          germination.currentTime = wantedTime;
        }

        paintStill(context, stills[1], width, height, 1.07 - local * .02, focus(1));
        if (germination.readyState >= 2) {
          context.save();
          context.globalAlpha = range(local, 0, .08) * (1 - range(local, .92, 1));
          drawCover(context, germination, width, height, 1.04 + local * .025, focus(1));
          context.restore();
        }
        paintStill(context, stills[2], width, height, 1.045, focus(2), range(local, .91, 1));
        return;
      }

      if (p < .61) {
        const local = range(p, .50, .61);
        paintStill(context, stills[2], width, height, 1.04 + local * 1.5, [focus(2)[0] - local * .11, focus(2)[1]], 1 - range(local, .48, .82));
        context.fillStyle = `rgba(190,126,32,${Math.sin(local * Math.PI) * .2})`;
        context.fillRect(0, 0, width, height);
        paintStill(context, stills[3], width, height, 1.2 - local * .14, [focus(3)[0] + (1 - local) * .05, focus(3)[1]], range(local, .42, .84));
        return;
      }

      if (p < .77) {
        const local = range(p, .61, .77);
        paintStill(context, stills[3], width, height, 1.06 + local * .18, [focus(3)[0] - local * .035, focus(3)[1] + local * .02], 1, (local - .5) * -.012);
        return;
      }

      if (p < .84) {
        const local = range(p, .77, .84);
        paintStill(context, stills[3], width, height, 1.24 + local * .18, focus(3), 1 - range(local, .28, .9), -.012 + local * .018);
        paintStill(context, stills[4], width, height, 1.17 - local * .09, [focus(4)[0] + (1 - local) * .045, focus(4)[1]], range(local, .2, .84), .01 - local * .01);
        return;
      }

      if (p < .91) {
        const local = range(p, .84, .91);
        paintStill(context, stills[4], width, height, 1.08 + local * .12, [focus(4)[0] - local * .025, focus(4)[1] - local * .015]);
        return;
      }

      const local = range(p, .91, 1);
      paintStill(context, stills[4], width, height, 1.2 + local * .18, focus(4), 1 - range(local, .12, .72));
      paintStill(context, stills[5], width, height, 1.13 - local * .1, [focus(5)[0] + (1 - local) * .035, focus(5)[1]], range(local, .08, .66));
    };

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
      const target = clamp(progressRef.current);
      const next = current + (target - current) * .115;
      current = Math.abs(target - next) < .00005 ? target : next;

      if (width !== lastWidth || height !== lastHeight) {
        lastWidth = width;
        lastHeight = height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        dirty = true;
      }

      if (dirty || Math.abs(current - lastProgress) > .00012) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(current, width, height);
        lastProgress = current;
        dirty = false;
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      germination.pause();
      germination.removeAttribute('src');
      germination.load();
    };
  }, []);

  return <canvas ref={canvasRef} className="olive-sequence" aria-hidden="true" />;
}
