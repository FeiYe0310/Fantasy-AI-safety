import React, { useEffect, useMemo, useRef } from 'react';

const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };

// Each clip begins and ends on an existing high-resolution painting. The short
// opacity ramps reveal those paintings at the seam, hiding codec and seek noise.
const CLIPS = [
  { file: '01-olive-breath.mp4', from: .038, to: .078, poster: 'shot-02.jpg', focus: '68% 48%' },
  { file: '02-nuwa-catches-seed.mp4', from: .14, to: .205, poster: 'shot-04.jpg', focus: '68% 50%' },
  { file: '03-five-verifiers.mp4', from: .28, to: .355, poster: 'shot-06.jpg', focus: '67% 50%' },
  { file: '04-plant-the-pit.mp4', from: .42, to: .49, poster: 'shot-08.jpg', focus: '68% 54%' },
  { file: '05-first-root.mp4', from: .49, to: .555, poster: 'shot-09.jpg', focus: '55% 53%' },
  { file: '06-roots-find-evidence.mp4', from: .555, to: .625, poster: 'shot-10.jpg', focus: '53% 52%' },
  { file: '07-growth-within-reach.mp4', from: .625, to: .775, poster: 'shot-11.jpg', focus: '61% 55%' },
  { file: '08-leaves-mend-sky.mp4', from: .775, to: .905, poster: 'shot-12.jpg', focus: '70% 50%' },
  { file: '09-peace-is-carried.mp4', from: .905, to: .97, poster: 'shot-13.jpg', focus: '54% 50%' },
];

const locateClip = (progress) => {
  const index = CLIPS.findIndex(({ from, to }) => progress >= from && progress <= to);
  if (index < 0) return { index: -1, local: 0, opacity: 0 };
  const clip = CLIPS[index];
  const local = clamp((progress - clip.from) / (clip.to - clip.from));
  const opacity = ease(local / .12) * (1 - ease((local - .88) / .12));
  return { index, local, opacity };
};

export default function OliveVideoLayer({ progress = 0, reduced = false, stress = 0 }) {
  const refs = useRef([]);
  const playingRef = useRef(-1);
  const active = useMemo(() => locateClip(progress), [progress]);

  useEffect(() => {
    refs.current.forEach((video, index) => {
      if (!video) return;
      const clip = CLIPS[index];
      const near = progress >= clip.from - .07 && progress <= clip.to + .07;
      if (near && video.preload !== 'auto') {
        video.preload = 'auto';
        video.load();
      }
      if (reduced || index !== active.index) video.pause();
    });
    if (reduced || active.index < 0) {
      playingRef.current = -1;
      return;
    }
    const video = refs.current[active.index];
    if (!video) return;
    if (playingRef.current !== active.index) {
      video.currentTime = 0;
      playingRef.current = active.index;
    }
    if (video.paused && active.local < .96) video.play().catch(() => {});
  }, [active.index, active.local, progress, reduced]);

  if (reduced) return null;
  const base = import.meta.env.BASE_URL;
  const tremor = Math.sin(progress * 185) * stress * 2.2;

  return (
    <div className="olive-video-bank" aria-hidden="true" style={{ transform: `translate3d(${tremor}px, 0, 0) scale(${1 + stress * .006})` }}>
      {CLIPS.map((clip, index) => (
        <video
          key={clip.file}
          ref={(node) => { refs.current[index] = node; }}
          className="olive-video"
          src={`${base}olive-oil-story-v1/video/${clip.file}`}
          poster={`${base}olive-oil-story-v1/${clip.poster}`}
          preload={index < 2 ? 'auto' : 'metadata'}
          muted
          loop
          playsInline
          disablePictureInPicture
          tabIndex={-1}
          style={{ opacity: active.index === index ? active.opacity : 0, objectPosition: clip.focus }}
        />
      ))}
    </div>
  );
}
