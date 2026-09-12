import React, { useRef } from 'react';
import useScrollProgress from './useScrollProgress';
import OliveSequenceCanvas from './OliveSequenceCanvas';
import './olive-story.css';

const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const enter = (p, start, end) => ease((p - start) / (end - start));

const chapters = [
  {
    id: 'opening', at: 0, kicker: 'I · THE SIGNAL', title: ['From the fracture,', 'one olive fell.'],
    paragraphs: [
      'It was small enough to disappear against the sky, yet every turn of the camera returned to it. The object did not become monumental by growing larger. It became monumental because everything that followed depended on where it went.',
      'Its dark jade shell held a narrow line of antique gold: capability compressed into a form the world had not yet learned to read. It arrived before certainty, policy, or permission.',
      'So the story stays with the olive. One object. One continuous path. No convenient cut away from the consequences.',
    ],
    note: 'Importance is not scale. It is consequence.',
  },
  {
    id: 'descent', at: .16, kicker: 'II · THE DESCENT', title: ['The camera followed', 'what the world could miss.'],
    paragraphs: [
      'The olive crossed cloud, horizon, grass, and soil while the point of view curved around it. Each change of angle revealed a different surface, but never a different object.',
      'That continuity is the first safety claim: when capability moves between contexts, its identity, provenance, and effects should not vanish at the boundary.',
      'At the earth, the visible story narrowed to a dark seam. The most important work was about to happen where an audience could no longer see it.',
    ],
    note: 'A transition should preserve the object—and the responsibility attached to it.',
  },
  {
    id: 'mission', at: .32, side: 'right', kicker: 'III · THE UNSEEN WORK', title: ['Before growth,', 'verification took root.'],
    paragraphs: [
      'Beneath the surface, the shell opened slowly. A root searched downward, a shoot tested the light above, and the golden core remained between them: protected, observed, and still interruptible.',
      'This is our mission: abundant verification tokens—enough compute, evidence, criticism, human judgment, and recovery capacity to examine powerful actions before they become irreversible.',
      'The work may be invisible to the people who later depend on it. That does not make it secondary. It makes the foundation responsible for everything the system is allowed to become.',
    ],
    note: 'The work no one sees becomes the safety everyone can rely on.',
  },
  {
    id: 'research', at: .53, kicker: 'IV · THE ASCENT', title: ['Evidence travelled', 'with capability.'],
    paragraphs: [
      'When the shoot rose, the golden core rose with it. It did not remain buried as a forgotten test result while the system scaled beyond inspection.',
      'Our research follows that ascent: verifier models, process supervision, mechanistic interpretability, adversarial critique, evidence-carrying outputs, runtime monitoring, calibrated interruption, and recovery.',
      'Each method asks the same hard question from another angle: can a powerful action remain traceable, challengeable, and correctable while it is happening?',
    ],
    note: 'Verification must scale inside the path of capability, not arrive after it.',
  },
  {
    id: 'branch', at: .72, side: 'right', kicker: 'V · THE BRANCH', title: ['What scaled', 'remained traceable.'],
    paragraphs: [
      'The camera climbed through trunk and branch without abandoning the core. Fibres crossed the foreground; the angle changed; the light widened. Continuity turned movement into evidence.',
      'A robust safety system needs the same structure: independent checks that can disagree, records that survive handoffs, and intervention points that remain available under pressure.',
      'The goal is not a flawless story told after the event. It is a living chain of evidence strong enough to change the event before the branch breaks.',
    ],
    note: 'A result is governable when its path can still be inspected and changed.',
  },
  {
    id: 'join', at: .9, kicker: 'VI · THE FRUIT', title: ['Safety became something', 'the world could hold.'],
    paragraphs: [
      'The golden core reached open air and became one ordinary olive: still small, still itself, now carrying the full path from fracture to root to crown.',
      'The repaired sky is not a promise of perfect certainty. It is a world in which powerful systems remain answerable because verification grew with them from the beginning.',
      'We are building that capacity with researchers, engineers, red-teamers, interpreters, and storytellers. Bring a verifier, expose a crack, reproduce a result, or help the next root grow stronger.',
    ],
    note: 'Capability can flourish without leaving accountability underground.',
    actions: true,
  },
];

const windows = [
  { from: 0, to: .14 },
  { from: .14, to: .28 },
  { from: .28, to: .47 },
  { from: .49, to: .66 },
  { from: .68, to: .84 },
  { from: .86, to: 1 },
];

const phaseOpacity = (progress, index) => {
  const start = windows[index].from;
  const end = index === chapters.length - 1 ? 1.02 : windows[index + 1].from;
  const incoming = index === 0 ? 1 : enter(progress, start, start + .025);
  const outgoing = index === chapters.length - 1 ? 1 : 1 - enter(progress, end - .025, end);
  return incoming * outgoing;
};

export default function OliveStory() {
  const ref = useRef(null);
  const { progress, reduced } = useScrollProgress(ref, '(prefers-reduced-motion: reduce), (max-height: 520px)');
  const active = chapters.reduce((best, chapter, index) => Math.abs(progress - chapter.at) < Math.abs(progress - chapters[best].at) ? index : best, 0);

  const jumpTo = (at) => {
    const element = ref.current;
    const distance = element.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().top + at * distance,
      behavior: reduced ? 'instant' : 'smooth',
    });
  };

  return (
    <section className="olive-road" ref={ref} aria-label="A continuous journey with one olive seed">
      {chapters.map((chapter) => <span key={chapter.id} id={reduced ? undefined : chapter.id} className="olive-anchor" aria-hidden="true" style={{ top: `calc((100% - 100svh) * ${chapter.at})` }} />)}
      <div className="olive-stage">
        <div className="olive-world" aria-hidden="true">
          <OliveSequenceCanvas progress={progress} />
          <div className={`olive-grade olive-grade--${chapters[active].side === 'right' ? 'right' : 'left'}`} />
          <div className="olive-paint" />
          <div className="olive-vignette" />
        </div>

        <div className="olive-copy">
          {chapters.map((chapter, index) => {
            const local = clamp((progress - windows[index].from) / (windows[index].to - windows[index].from));
            const revealLocal = index === 0 ? Math.max(.42, local) : local;
            const opacity = reduced ? 1 : phaseOpacity(progress, index);
            const headingReveal = reduced ? 1 : enter(revealLocal, 0, .16);
            const headingStyle = reduced ? undefined : { opacity: headingReveal, transform: `translateY(${(1 - headingReveal) * 12}px)` };

            return (
              <article
                key={chapter.id}
                id={reduced ? chapter.id : undefined}
                className={`olive-scene olive-scene--${index}${chapter.side === 'right' ? ' olive-scene--right' : ''}`}
                aria-hidden={!reduced && active !== index}
                inert={!reduced && active !== index}
                style={{ opacity, '--chapter-drift': reduced ? '0vh' : `${(progress - chapter.at) * -13}vh` }}
              >
                <p className="eyebrow" style={headingStyle}>{chapter.kicker}</p>
                {index === 0
                  ? <h1 style={headingStyle}>{chapter.title.map((line) => <span key={line}>{line}</span>)}</h1>
                  : <h2 style={headingStyle}>{chapter.title.map((line) => <span key={line}>{line}</span>)}</h2>}
                <div className="olive-narrative">
                  {chapter.paragraphs.map((paragraph, paragraphIndex) => {
                    const reveal = reduced ? 1 : enter(revealLocal, .035 + paragraphIndex * .07, .2 + paragraphIndex * .07);
                    return <p key={paragraph} style={{ opacity: reveal, transform: reduced ? undefined : `translateY(${(1 - reveal) * 13}px)` }}>{paragraph}</p>;
                  })}
                </div>
                <p className="olive-note" style={{ opacity: reduced ? 1 : enter(revealLocal, .26, .43) }}>{chapter.note}</p>
                {chapter.actions && (
                  <div className="olive-actions" style={{ opacity: reduced ? 1 : enter(local, .42, .64) }}>
                    <a className="olive-primary" href="https://github.com/FeiYe0310/Fantasy-AI-safety/issues/new?template=join-us.yml" target="_blank" rel="noreferrer">Join the work <span>↗</span></a>
                    <a href="https://github.com/FeiYe0310/Fantasy-AI-safety" target="_blank" rel="noreferrer">Explore the research ↗</a>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="story-index" aria-hidden="true"><span>{String(active + 1).padStart(2, '0')}</span><i style={{ transform: `scaleX(${progress})` }} /><b>{['SIGNAL', 'DESCENT', 'VERIFY', 'ASCEND', 'TRACE', 'FRUIT'][active]}</b></div>
        <nav className={`olive-nav${chapters[active].side === 'right' ? ' olive-nav--left' : ''}`} aria-label="Story chapters">
          {chapters.map((chapter) => <button key={chapter.id} onClick={() => jumpTo(chapter.at)} aria-current={Math.abs(progress - chapter.at) < .085 ? 'step' : undefined}>{chapter.kicker.split(' · ')[1]}</button>)}
        </nav>
        <p className="scroll-cue" aria-hidden="true">SCROLL · STAY WITH THE OLIVE <span>↓</span></p>
      </div>
    </section>
  );
}
