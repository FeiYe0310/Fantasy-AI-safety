import React, { useRef } from 'react';
import useScrollProgress from './useScrollProgress';
import OliveSequenceCanvas from './OliveSequenceCanvas';
import './olive-story.css';

const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const enter = (p, start, end) => ease((p - start) / (end - start));
const hold = (p, start, full, fade, end) => enter(p, start, full) * (1 - enter(p, fade, end));

const scenes = [
  { id: 'opening', at: 0, kicker: 'PROLOGUE / 裂天', title: ['The answer', 'arrived first.'], cn: '答案已经抵达，验证还在路上。', body: 'A powerful system acts before the world has enough evidence to trust it. The sky does not shatter from malice, but from unchecked speed.' },
  { id: 'warning', at: .07, kicker: 'THE RIFT / 失配', title: ['Power widened', 'the smallest doubt.'], cn: '一个没有被验证的小误差，被能力放大成了天裂。', body: 'Capability scales an action. It also scales every hidden assumption carried inside that action.' },
  { id: 'soteria', at: .14, kicker: 'SOTERIA / 守界', title: ['She could hold', 'the boundary.'], cn: 'Soteria 让危险止步，却无法让已经破碎的世界复原。', body: 'The Greek guardian of safety brings restraint, thresholds, and the right to stop—but prevention alone cannot repair what escaped.' },
  { id: 'nuwa', at: .21, kicker: 'NÜWA / 补天', title: ['She could mend', 'the wound.'], cn: '女娲以五色石补天，却仍要知道下一道裂痕从何而来。', body: 'The Chinese creator restores continuity after catastrophe—but repair without diagnosis can seal the evidence inside the scar.' },
  { id: 'mending', at: .285, kicker: 'THE CONTACT / 合', title: ['So their purposes', 'touched first.'], cn: '指尖相接：约束开始学习，修复开始留下证据。', body: 'Prevention meets recovery. Monitoring meets interpretation. A safeguard becomes a loop that can notice, stop, explain, and mend.' },
  { id: 'seed', at: .365, kicker: 'THE SEED / 种', title: ['The repaired sky', 'released a seed.'], cn: '天补好了，不是故事结束，而是生命终于可以开始。', body: 'The last five-coloured spark cools into an olive pit. Safety is no longer a wall around the future; it becomes the soil beneath it.' },
  { id: 'germination', at: .445, kicker: 'THE FIRST QUESTION / 裂种', title: ['Before it grows,', 'it must open.'], cn: '种核先裂开自己，才让根找到方向。', body: 'Every trustworthy answer begins by exposing what could make it wrong: assumptions, uncertainty, missing evidence, and alternatives.' },
  { id: 'mission', at: .525, kicker: 'OUR MISSION / 丰裕验证', title: ['Give every action', 'room to be checked.'], cn: '为每一次强大行动，提供充足的验证额度。', body: 'Abundant verification tokens means enough compute, time, evidence, critique, and recovery steps to challenge an answer before it reaches the world.' },
  { id: 'research', at: .61, kicker: '01 / SCALABLE VERIFICATION', title: ['Evidence becomes', 'a root system.'], cn: '一条根可以自信地走错；根系会彼此校验。', body: 'Verifier models · process supervision · multi-model critique · debate · evidence-carrying outputs' },
  { id: 'control', at: .695, kicker: '02 / MONITORING & CONTROL', title: ['A trunk turns', 'checks into action.'], cn: '看得见还不够：必须问得清、拦得住、停得下。', body: 'Runtime monitors · tool permissions · audit trails · tripwires · calibrated interruption' },
  { id: 'trial', at: .77, kicker: 'THE STORM / 压力测试', title: ['Then the wind', 'tested every claim.'], cn: '真正的安全，不是从未受压，而是在受压时仍保持可控。', body: 'Adversaries probe the bark. Distribution shifts bend the branches. A living safety system must fail legibly instead of failing silently.' },
  { id: 'repair', at: .84, kicker: '03 / AUDITING & REPAIR', title: ['The broken branch', 'kept its history.'], cn: '沿着异常表示追溯因果，修复结构，而不只修剪症状。', body: 'Mechanistic interpretability · causal localization · anomalous representations · evidence-grounded intervention' },
  { id: 'peace', at: .915, kicker: 'THE OLIVE LEAF / 和', title: ['What survived', 'could offer peace.'], cn: '橄榄叶不是装饰，而是安全机制经受检验后的产物。', body: 'The tree does not promise the absence of power. It shows power made answerable—strong enough to grow, transparent enough to trust.' },
  { id: 'join', at: .98, kicker: 'OPEN COLLABORATION / 同行', title: ['Carry the leaf', 'farther than us.'], cn: '研究、构建、挑战、复现。让每个结论都能被下一双手验证。', body: 'Researchers, engineers, red-teamers, writers, and visual storytellers are invited to add evidence, find cracks, and improve the repair.' },
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
  const pair = hold(progress, .09, .13, .29, .365);
  const approach = enter(progress, .18, .295);
  const fusion = hold(progress, .265, .295, .355, .41);
  const repair = enter(progress, .25, .365);
  const growthProgress = clamp((progress - .355) / .625);
  const growthOpacity = enter(progress, .325, .405);
  const stress = hold(progress, .735, .765, .805, .855);
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
          <OliveSequenceCanvas progress={growthProgress} opacity={growthOpacity} stress={stress} />
          <div className="olive-grade" style={{ opacity: enter(progress, .27, .38) }} />
          <div className="olive-intro-grade" style={{ opacity: 1 - enter(progress, .24, .35) }} />
        </div>
        <div className="guardian-pair" aria-hidden="true" style={{ opacity: pair, transform: `translate(-50%, -50%) scale(${.95 - approach * .08})`, filter: `blur(${fusion * 10}px)` }}>
          <div className="guardian-half guardian-half--left" style={{ transform: `translateX(${-10 + approach * 10}%)` }}><img src={`${base}guardians/pair-daylight.png`} alt="" /></div>
          <div className="guardian-half guardian-half--right" style={{ transform: `translateX(${10 - approach * 10}%)` }}><img src={`${base}guardians/pair-daylight.png`} alt="" /></div>
        </div>
        <div className="fusion-figure" aria-hidden="true" style={{ opacity: fusion, transform: `translate(-50%, -50%) scale(${.82 + fusion * .18})` }}><img src={`${base}guardians/fusion-daylight.png`} alt="" /></div>
        <div className="fusion-seed" aria-hidden="true" style={{ opacity: hold(progress, .27, .30, .39, .445), transform: `translate(-50%, ${-50 + enter(progress, .31, .43) * 390}%) scale(${.6 + enter(progress, .28, .37) * .85})` }}><i /><b /><span /></div>
        <div className="repair-halo" aria-hidden="true" style={{ opacity: hold(progress, .245, .285, .37, .43), transform: `translate(-50%, -50%) scale(${.35 + repair * 5})` }} />

        <div className="olive-copy">
          {scenes.map((scene, index) => {
            const opacity = reduced ? 1 : phaseOpacity(progress, index);
            return <article key={scene.id} id={reduced ? scene.id : undefined} className={`olive-scene olive-scene--${index}`} aria-hidden={!reduced && active !== index} inert={!reduced && active !== index} style={{ opacity, transform: reduced ? undefined : `translateY(${(progress - scene.at) * -48}vh)` }}>
              <p className="eyebrow">{scene.kicker}</p>
              {index === 0 ? <h1>{scene.title.map(line => <span key={line}>{line}</span>)}</h1> : <h2>{scene.title.map(line => <span key={line}>{line}</span>)}</h2>}
              <p className="olive-cn">{scene.cn}</p>
              <p className="olive-body">{scene.body}</p>
              {index === scenes.length - 1 && <div className="olive-actions"><a className="olive-primary" href="https://github.com/FeiYe0310/Fantasy-AI-safety/issues/new?template=join-us.yml" target="_blank" rel="noreferrer">Introduce yourself <span>↗</span></a><a href="https://github.com/FeiYe0310/Fantasy-AI-safety" target="_blank" rel="noreferrer">Explore the work ↗</a></div>}
            </article>;
          })}
        </div>
        <div className="story-index" aria-hidden="true"><span>{String(active + 1).padStart(2, '0')}</span><i style={{ transform: `scaleX(${progress})` }} /><b>{active < 5 ? 'MEND' : active < 10 ? 'GROW' : active < 12 ? 'ENDURE' : 'CARRY'}</b></div>
        <nav className="olive-nav" aria-label="Story chapters">
          {[['裂天', 0], ['守界', .14], ['补天', .285], ['种下', .365], ['生根', .61], ['经风', .77], ['和平', .98]].map(([label, at]) => <button key={label} onClick={() => jumpTo(at)} aria-current={Math.abs(progress - at) < .06 ? 'step' : undefined}>{label}</button>)}
        </nav>
        <p className="scroll-cue" aria-hidden="true">SCROLL · FOLLOW THE OLIVE <span>↓</span></p>
      </div>
    </section>
  );
}
