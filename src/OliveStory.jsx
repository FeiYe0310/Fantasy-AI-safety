import React, { useRef } from 'react';
import useScrollProgress from './useScrollProgress';
import OliveSequenceCanvas from './OliveSequenceCanvas';
import './olive-story.css';

const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const enter = (p, start, end) => ease((p - start) / (end - start));
const hold = (p, start, full, fade, end) => enter(p, start, full) * (1 - enter(p, fade, end));

const scenes = [
  { id: 'opening', at: 0, kicker: 'PROLOGUE / 裂天', title: ['The sky', 'was broken.'], cn: '力量越大，裂痕越不能被忽略。', body: 'Powerful systems can open failures wider than any one safeguard can hold.' },
  { id: 'guardians', at: .105, kicker: 'TWO GUARDIANS / 两种安全', title: ['One holds.', 'One repairs.'], cn: 'Soteria 守界。女娲补天。', body: 'Prevention before harm. Recovery after failure. Safety needs both.' },
  { id: 'mending', at: .215, kicker: 'THE CONTACT / 合', title: ['Their purpose', 'touches first.'], cn: '指尖相接，约束与修复成为闭环。', body: 'A boundary that can learn. A repair that can be verified.' },
  { id: 'seed', at: .325, kicker: 'THE SEED / 种', title: ['Then something', 'can begin.'], cn: '天补好了，不是故事结束，而是生命可以开始。', body: 'From the repaired sky, one olive seed reaches the earth.' },
  { id: 'mission', at: .435, kicker: 'OUR MISSION / 根', title: ['Give every action', 'room to be checked.'], cn: '为每一次强大行动，提供充足的验证。', body: 'Abundant verification tokens: enough compute, evidence, critique, and recovery steps to challenge an answer before it reaches the world.' },
  { id: 'research', at: .555, kicker: '01 / SCALABLE VERIFICATION', title: ['Evidence becomes', 'a root system.'], cn: '证据不只依附答案，它要独立生根。', body: 'Verifier models · process supervision · multi-model critique · debate · evidence-carrying outputs' },
  { id: 'control', at: .665, kicker: '02 / MONITORING & CONTROL', title: ['A trunk keeps', 'growth within reach.'], cn: '看得见，问得清，停得下。', body: 'Runtime monitors · tool permissions · audit trails · tripwires · safe interruption' },
  { id: 'repair', at: .765, kicker: '03 / AUDITING & REPAIR', title: ['Every branch', 'can reveal its cause.'], cn: '找到失效的结构，而不只修剪症状。', body: 'Mechanistic interpretability · causal localization · anomalous representations · evidence-grounded intervention' },
  { id: 'peace', at: .865, kicker: 'THE OLIVE LEAF / 和', title: ['What survives', 'can shelter peace.'], cn: '橄榄叶不是装饰，是安全兑现后的结果。', body: 'The tree does not symbolize the absence of power. It shows power made answerable.' },
  { id: 'join', at: .955, kicker: 'OPEN COLLABORATION / 同行', title: ['Carry the leaf', 'into the future.'], cn: '研究、构建、挑战。一起让强大仍可被验证。', body: 'Researchers, engineers, red-teamers, writers, and visual storytellers are welcome.' },
];

const phaseOpacity = (p, index) => {
  const centers = scenes.map(scene => scene.at);
  const start = index === 0 ? -.03 : (centers[index - 1] + centers[index]) / 2;
  const end = index === scenes.length - 1 ? 1.04 : (centers[index] + centers[index + 1]) / 2;
  return hold(p, start, centers[index] - .018, centers[index] + .025, end);
};

export default function OliveStory() {
  const ref = useRef(null);
  const { progress, reduced } = useScrollProgress(ref, '(prefers-reduced-motion: reduce), (max-height: 520px)');
  const base = import.meta.env.BASE_URL;
  const active = scenes.reduce((best, scene, index) => Math.abs(progress - scene.at) < Math.abs(progress - scenes[best].at) ? index : best, 0);
  const pair = hold(progress, .055, .09, .225, .315);
  const approach = enter(progress, .12, .235);
  const fusion = hold(progress, .21, .245, .305, .365);
  const repair = enter(progress, .205, .33);
  const growthProgress = clamp((progress - .315) / .65);
  const growthOpacity = enter(progress, .285, .37);
  const visual = [
    { src: 'sky-broken.png', opacity: 1 - enter(progress, .205, .34) },
    { src: 'sky-healed.png', opacity: enter(progress, .19, .34) },
  ];
  const jumpTo = (at) => {
    const element = ref.current;
    const distance = element.offsetHeight - window.innerHeight;
    window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top + at * distance, behavior: reduced ? 'instant' : 'smooth' });
  };

  return (
    <section className="olive-road" ref={ref} aria-label="From a broken sky to an olive leaf: the Fantasy AI Safety story">
      {scenes.map(scene => <span key={scene.id} id={reduced ? undefined : scene.id} className="olive-anchor" aria-hidden="true" style={{ top: `calc((100% - 100svh) * ${scene.at})` }} />)}
      <div className="olive-stage">
        <div className="olive-world" aria-hidden="true">
          {visual.map((image, index) => <img key={image.src} className={`olive-visual olive-visual--${index}`} src={`${base}guardians/${image.src}`} alt="" fetchPriority={index === 0 ? 'high' : undefined} loading={index > 1 ? 'lazy' : undefined} style={{ opacity: image.opacity, transform: `scale(${1.055 - enter(progress, Math.max(0, index * .16 - .05), Math.min(1, index * .16 + .18)) * .055})` }} />)}
          <OliveSequenceCanvas progress={growthProgress} opacity={growthOpacity} />
          <div className="olive-grade" style={{ opacity: enter(progress, .27, .38) }} />
          <div className="olive-intro-grade" style={{ opacity: 1 - enter(progress, .24, .35) }} />
        </div>
        <div className="guardian-pair" aria-hidden="true" style={{ opacity: pair, transform: `translate(-50%, -50%) scale(${.95 - approach * .08})`, filter: `blur(${fusion * 10}px)` }}>
          <div className="guardian-half guardian-half--left" style={{ transform: `translateX(${-10 + approach * 10}%)` }}><img src={`${base}guardians/pair-daylight.png`} alt="" /></div>
          <div className="guardian-half guardian-half--right" style={{ transform: `translateX(${10 - approach * 10}%)` }}><img src={`${base}guardians/pair-daylight.png`} alt="" /></div>
        </div>
        <div className="fusion-figure" aria-hidden="true" style={{ opacity: fusion, transform: `translate(-50%, -50%) scale(${.82 + fusion * .18})` }}><img src={`${base}guardians/fusion-daylight.png`} alt="" /></div>
        <div className="fusion-seed" aria-hidden="true" style={{ opacity: hold(progress, .21, .24, .335, .39), transform: `translate(-50%, ${-50 + enter(progress, .25, .37) * 390}%) scale(${.6 + enter(progress, .22, .31) * .85})` }}><i /><b /><span /></div>
        <div className="repair-halo" aria-hidden="true" style={{ opacity: hold(progress, .19, .23, .32, .38), transform: `translate(-50%, -50%) scale(${.35 + repair * 5})` }} />

        <div className="olive-copy">
          {scenes.map((scene, index) => {
            const opacity = reduced ? 1 : phaseOpacity(progress, index);
            return <article key={scene.id} id={reduced ? scene.id : undefined} className={`olive-scene olive-scene--${index}`} aria-hidden={!reduced && active !== index} inert={!reduced && active !== index} style={{ opacity, transform: reduced ? undefined : `translateY(${(progress - scene.at) * -48}vh)` }}>
              <p className="eyebrow">{scene.kicker}</p>
              {index === 0 ? <h1>{scene.title.map(line => <span key={line}>{line}</span>)}</h1> : <h2>{scene.title.map(line => <span key={line}>{line}</span>)}</h2>}
              <p className="olive-cn">{scene.cn}</p>
              <p className="olive-body">{scene.body}</p>
              {index === 9 && <div className="olive-actions"><a className="olive-primary" href="https://github.com/FeiYe0310/Fantasy-AI-safety/issues/new?template=join-us.yml" target="_blank" rel="noreferrer">Introduce yourself <span>↗</span></a><a href="https://github.com/FeiYe0310/Fantasy-AI-safety" target="_blank" rel="noreferrer">Explore the work ↗</a></div>}
            </article>;
          })}
        </div>
        <div className="story-index" aria-hidden="true"><span>{String(active + 1).padStart(2, '0')}</span><i style={{ transform: `scaleX(${progress})` }} /><b>{active < 3 ? 'MEND' : active < 8 ? 'GROW' : 'CARRY'}</b></div>
        <nav className="olive-nav" aria-label="Story chapters">
          {[['裂天', 0], ['补天', .215], ['种下', .325], ['生根', .555], ['成树', .765], ['和平', .955]].map(([label, at]) => <button key={label} onClick={() => jumpTo(at)} aria-current={Math.abs(progress - at) < .075 ? 'step' : undefined}>{label}</button>)}
        </nav>
        <p className="scroll-cue" aria-hidden="true">SCROLL · FOLLOW THE OLIVE <span>↓</span></p>
      </div>
    </section>
  );
}
