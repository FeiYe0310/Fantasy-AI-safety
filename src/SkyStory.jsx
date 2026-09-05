import React, { useEffect, useRef, useState } from 'react';
import { clamp, skyTimeline } from './skyTimeline';

const chapters = [
  { at: 0, label: '裂天', title: 'Even the sky can break.', text: '能力不断扩张，验证不能留下裂痕。', detail: 'More capability needs more verification.' },
  { at: 0.23, label: '守界', title: 'First, hold the boundary.', text: 'Soteria · 在伤害发生之前，守住边界。', detail: 'The Greek personification of safety and deliverance.' },
  { at: 0.42, label: '寻隙', title: 'Then, find what needs repair.', text: '女娲 · 找到破口，让修补成为可能。', detail: 'The creator who mended a broken sky.' },
  { at: 0.59, label: '相遇', title: 'Two powers. One purpose.', text: '当约束与修复相遇，验证形成闭环。', detail: 'Prevention meets repair.' },
  { at: 0.8, label: '补天', title: 'Mend what we can verify.', text: '从一点出发，修补整片天空。', detail: 'Evidence. Critique. Correction.' },
  { at: 0.97, label: '新天', title: 'A future worth verifying.', text: '让每一次强大行动，都拥有足够多的验证。', detail: 'Abundant verification tokens.' },
];

function useStoryProgress(ref) {
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let current = 0;
    let target = 0;
    let last = 0;
    const tick = (time) => {
      const dt = Math.min(64, time - (last || time - 16));
      last = time;
      current += (target - current) * (1 - Math.exp(-dt / 95));
      if (Math.abs(target - current) < 0.0001) current = target;
      setProgress(current);
      frame = current !== target ? requestAnimationFrame(tick) : 0;
    };
    const update = () => {
      const element = ref.current;
      if (!element) return;
      target = clamp(-element.getBoundingClientRect().top / Math.max(1, element.offsetHeight - window.innerHeight));
      if (preference.matches) { current = target; setProgress(target); }
      else if (!frame) { last = 0; frame = requestAnimationFrame(tick); }
    };
    const syncPreference = () => { setReduced(preference.matches); update(); };
    syncPreference();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    preference.addEventListener('change', syncPreference);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      preference.removeEventListener('change', syncPreference);
    };
  }, [ref]);
  return { progress, reduced };
}

export default function SkyStory() {
  const ref = useRef(null);
  const { progress, reduced } = useStoryProgress(ref);
  const state = skyTimeline(progress);
  const base = import.meta.env.BASE_URL;
  const jumpTo = (p) => {
    const element = ref.current;
    window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top + p * (element.offsetHeight - window.innerHeight), behavior: reduced ? 'instant' : 'smooth' });
  };
  return (
    <>
      <section className="sky-road" id="top" ref={ref} aria-label="Mending the sky: a story of verification">
        <div className="sky-stage">
          <div className="sky-world" aria-hidden="true" style={{ transform: `scale(${1.04 - state.repair * 0.04})` }}>
            <img className="sky-plate" src={`${base}guardians/sky-broken.png`} alt="" fetchPriority="high" />
            <img className="sky-plate sky-healed" src={`${base}guardians/sky-healed.png`} alt="" style={{ clipPath: `circle(${state.repair * 130}% at 50% 40%)` }} />
          </div>
          <div className="cloud-wash" aria-hidden="true" />
          <div className="story-caption" aria-live="off">
            {chapters.map((chapter, index) => (
              <div className={`caption-layer ${state.chapter === index ? 'is-current' : ''}`} key={chapter.label} aria-hidden={state.chapter !== index}>
                <p className="eyebrow">{String(index + 1).padStart(2, '0')} / {chapter.label} · FANTASY AI SAFETY</p>
                {index === 0 ? <h1>{chapter.title}</h1> : <h2>{chapter.title}</h2>}
                <p className="caption-cn">{chapter.text}</p>
                <p className="caption-detail">{chapter.detail}</p>
              </div>
            ))}
          </div>
          <div className="duet" aria-hidden="true" style={{ opacity: state.pairOpacity, transform: `translate(-50%, -50%) scale(${1 - state.merge * 0.18})`, filter: `blur(${state.merge * 9}px)` }}>
            {['left', 'right'].map((side) => (
              <div key={side} className={`duet-half duet-half--${side}`} style={{ transform: `translateX(${(side === 'left' ? -1 : 1) * state.separation}%)` }}>
                <img src={`${base}guardians/pair-daylight.png`} alt="" />
              </div>
            ))}
          </div>
          <div className="mending-energy" aria-hidden="true" style={{ opacity: state.energy, transform: `translate(-50%, -50%) scale(${0.3 + state.merge * 2.7})` }}><i /><b /><span /></div>
          <div className="daylight-fusion" aria-hidden="true" style={{ opacity: state.fusionOpacity, transform: `translate(-50%, -50%) scale(${0.87 + state.fusionOpacity * 0.13})`, filter: `blur(${(1 - state.fusionOpacity) * 14}px)` }}>
            <img src={`${base}guardians/fusion-daylight.png`} alt="" />
          </div>
          <div className="story-scroll-note" aria-hidden="true">SCROLL TO MEND THE SKY <span>↓</span></div>
          <nav className="chapter-nav" aria-label="Story chapters">
            {chapters.map((chapter, index) => <button key={chapter.label} onClick={() => jumpTo(chapter.at)} aria-current={state.chapter === index ? 'step' : undefined}><span>{String(index + 1).padStart(2, '0')}</span>{chapter.label}</button>)}
          </nav>
        </div>
      </section>
      <section className="guardian-notes" id="guardians" aria-label="Meet the guardians">
        <article><p className="eyebrow">THE BOUNDARY / 守界</p><h2>Soteria</h2><p>The Greek personification of safety and deliverance. She stands for prevention, constraint, and verification before an action reaches the world.</p></article>
        <span className="guardian-join" aria-hidden="true">×</span>
        <article><p className="eyebrow">THE REPAIR / 补天</p><h2>Nüwa <span>女娲</span></h2><p>The creator who mended a broken sky. She stands for locating failure, repairing structure, and recovering when no boundary can anticipate everything.</p></article>
      </section>
    </>
  );
}
