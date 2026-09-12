import React, { useCallback, useRef } from 'react';
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

const labels = ['SIGNAL', 'DESCENT', 'VERIFY', 'ASCEND', 'TRACE', 'FRUIT'];

const phaseOpacity = (progress, index) => {
  const start = windows[index].from;
  const end = index === chapters.length - 1 ? 1.02 : windows[index + 1].from;
  const incoming = index === 0 ? 1 : enter(progress, start, start + .025);
  const outgoing = index === chapters.length - 1 ? 1 : 1 - enter(progress, end - .025, end);
  return incoming * outgoing;
};

const activeChapter = (progress) => chapters.reduce(
  (best, _chapter, index) => phaseOpacity(progress, index) > phaseOpacity(progress, best) ? index : best,
  0,
);

const gradeSideMix = (progress) => {
  let value = chapters[0].side === 'right' ? 1 : 0;
  for (let index = 1; index < chapters.length; index += 1) {
    const midpoint = (chapters[index - 1].at + chapters[index].at) / 2;
    const next = chapters[index].side === 'right' ? 1 : 0;
    if (progress < midpoint - .018) break;
    if (progress <= midpoint + .018) {
      return value + (next - value) * enter(progress, midpoint - .018, midpoint + .018);
    }
    value = next;
  }
  return value;
};

export default function OliveStory() {
  const reactRenderCountRef = useRef(0);
  reactRenderCountRef.current += 1;
  const roadRef = useRef(null);
  const filmRef = useRef(null);
  const sceneRefs = useRef([]);
  const scenePartsRef = useRef([]);
  const navRef = useRef(null);
  const navButtonRefs = useRef([]);
  const indexNumberRef = useRef(null);
  const indexLineRef = useRef(null);
  const indexLabelRef = useRef(null);
  const leftGradeRef = useRef(null);
  const rightGradeRef = useRef(null);
  const diagnosticsRef = useRef(null);
  const measureRef = useRef(() => {});
  const lastActiveRef = useRef(-1);
  const lastDiagnosticTimeRef = useRef(0);

  const updateTypography = useCallback((clock) => {
    if (clock.reduced) return;
    const progress = clock.currentProgress;
    const active = activeChapter(progress);

    if (scenePartsRef.current.length !== chapters.length && sceneRefs.current.every(Boolean)) {
      scenePartsRef.current = sceneRefs.current.map((scene) => ({
        heading: scene.querySelectorAll('.eyebrow, h1, h2'),
        paragraphs: scene.querySelectorAll('.olive-narrative p'),
        note: scene.querySelector('.olive-note'),
        actions: scene.querySelector('.olive-actions'),
      }));
    }

    sceneRefs.current.forEach((scene, index) => {
      if (!scene) return;
      const local = clamp((progress - windows[index].from) / (windows[index].to - windows[index].from));
      const revealLocal = index === 0 ? Math.max(.42, local) : local;
      scene.style.opacity = String(phaseOpacity(progress, index));
      scene.style.setProperty('--chapter-drift', `${(progress - chapters[index].at) * -13}vh`);
      const parts = scenePartsRef.current[index];
      if (!parts) return;
      const headingReveal = enter(revealLocal, 0, .16);
      parts.heading.forEach((element) => {
        element.style.opacity = String(headingReveal);
        element.style.transform = `translateY(${(1 - headingReveal) * 12}px)`;
      });
      parts.paragraphs.forEach((paragraph, paragraphIndex) => {
        const reveal = enter(revealLocal, .035 + paragraphIndex * .07, .2 + paragraphIndex * .07);
        paragraph.style.opacity = String(reveal);
        paragraph.style.transform = `translateY(${(1 - reveal) * 13}px)`;
      });
      if (parts.note) parts.note.style.opacity = String(enter(revealLocal, .26, .43));
      if (parts.actions) parts.actions.style.opacity = String(enter(local, .42, .64));
    });

    const rightMix = gradeSideMix(progress);
    if (leftGradeRef.current) leftGradeRef.current.style.opacity = String(1 - rightMix);
    if (rightGradeRef.current) rightGradeRef.current.style.opacity = String(rightMix);
    if (indexLineRef.current) indexLineRef.current.style.transform = `scaleX(${progress})`;

    if (active !== lastActiveRef.current) {
      lastActiveRef.current = active;
      sceneRefs.current.forEach((scene, index) => {
        if (!scene) return;
        scene.setAttribute('aria-hidden', String(index !== active));
        scene.inert = index !== active;
      });
      navButtonRefs.current.forEach((button, index) => {
        if (!button) return;
        if (index === active) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      navRef.current?.classList.toggle('olive-nav--left', chapters[active].side === 'right');
      if (indexNumberRef.current) indexNumberRef.current.textContent = String(active + 1).padStart(2, '0');
      if (indexLabelRef.current) indexLabelRef.current.textContent = labels[active];
    }
  }, []);

  const handleFrame = useCallback((clock) => {
    filmRef.current?.render(clock);
    updateTypography(clock);
    if (import.meta.env.DEV && diagnosticsRef.current && clock.time - lastDiagnosticTimeRef.current > 200) {
      lastDiagnosticTimeRef.current = clock.time;
      const film = filmRef.current?.diagnostics();
      diagnosticsRef.current.textContent = film
        ? [
          `RAF ${clock.rafInterval.toFixed(1)}ms / ${clock.fps.toFixed(0)}fps`,
          `target ${clock.targetProgress.toFixed(4)}  current ${clock.currentProgress.toFixed(4)}`,
          `velocity ${clock.velocity.toFixed(3)}  direction ${clock.direction > 0 ? 'forward' : 'reverse'}`,
          `frame desired ${film.desiredFrame}  rendered ${film.renderedFrame} / ${film.globalFrameCount - 1}`,
          `decoded ${film.decodedCacheSize}  loading ${film.loadingFrames}  queued ${film.queuedFrames}`,
          `hit ${(film.cacheHitRate * 100).toFixed(1)}%  misses ${film.frameMisses}  nearest ${film.substitutions}`,
          `decode avg ${film.averageDecodeMs.toFixed(1)}ms  draw avg ${film.averageDrawMs.toFixed(2)}ms`,
          `React renders ${reactRenderCountRef.current}  fallback after start ${film.fallbackDrawsAfterStart}`,
          `boundary ${film.lastBoundary || '—'}`,
        ].join('\n')
        : 'Film engine booting';
    }
  }, [updateTypography]);

  const clock = useScrollProgress(
    roadRef,
    handleFrame,
    '(prefers-reduced-motion: reduce), (max-height: 520px)',
  );
  measureRef.current = clock.measure;

  const handleTimelineReady = useCallback(({ frameCount, pixelsPerFrame }) => {
    const element = roadRef.current;
    if (!element) return;
    element.style.setProperty('--film-scroll-px', `${Math.round(frameCount * pixelsPerFrame)}px`);
    const hashId = window.location.hash.slice(1);
    const hashChapter = chapters.find((chapter) => chapter.id === hashId);
    if (hashChapter) {
      const distance = element.offsetHeight - window.innerHeight;
      window.scrollTo({
        top: window.scrollY + element.getBoundingClientRect().top + hashChapter.at * distance,
        behavior: 'instant',
      });
    }
    measureRef.current();
  }, []);

  const jumpTo = (at) => {
    const element = roadRef.current;
    if (!element) return;
    const distance = element.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().top + at * distance,
      behavior: 'instant',
    });
    clock.measure();
  };

  return (
    <section className="olive-road" ref={roadRef} aria-label="A continuous journey with one olive seed">
      {chapters.map((chapter) => <span key={chapter.id} id={clock.reduced ? undefined : chapter.id} className="olive-anchor" aria-hidden="true" style={{ top: `calc((100% - 100svh) * ${chapter.at})` }} />)}
      <div className="olive-stage">
        <div className="olive-world" aria-hidden="true">
          <OliveSequenceCanvas ref={filmRef} onTimelineReady={handleTimelineReady} />
          <div ref={leftGradeRef} className="olive-grade olive-grade--left" />
          <div ref={rightGradeRef} className="olive-grade olive-grade--right" style={{ opacity: 0 }} />
          <div className="olive-paint" />
          <div className="olive-vignette" />
        </div>

        <div className="olive-copy">
          {chapters.map((chapter, index) => (
            <article
              ref={(element) => { sceneRefs.current[index] = element; }}
              key={chapter.id}
              id={clock.reduced ? chapter.id : undefined}
              className={`olive-scene olive-scene--${index}${chapter.side === 'right' ? ' olive-scene--right' : ''}`}
              aria-hidden={!clock.reduced && index !== 0}
              inert={!clock.reduced && index !== 0}
              style={{ opacity: clock.reduced || index === 0 ? 1 : 0, '--chapter-drift': '0vh' }}
            >
              <p className="eyebrow">{chapter.kicker}</p>
              {index === 0
                ? <h1>{chapter.title.map((line) => <span key={line}>{line}</span>)}</h1>
                : <h2>{chapter.title.map((line) => <span key={line}>{line}</span>)}</h2>}
              <div className="olive-narrative">
                {chapter.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              <p className="olive-note">{chapter.note}</p>
              {chapter.actions && (
                <div className="olive-actions">
                  <a className="olive-primary" href="https://github.com/FeiYe0310/Fantasy-AI-safety/issues/new?template=join-us.yml" target="_blank" rel="noreferrer">Join the work <span>↗</span></a>
                  <a href="https://github.com/FeiYe0310/Fantasy-AI-safety" target="_blank" rel="noreferrer">Explore the research ↗</a>
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="story-index" aria-hidden="true"><span ref={indexNumberRef}>01</span><i ref={indexLineRef} /><b ref={indexLabelRef}>SIGNAL</b></div>
        <nav ref={navRef} className="olive-nav" aria-label="Story chapters">
          {chapters.map((chapter, index) => (
            <button
              ref={(element) => { navButtonRefs.current[index] = element; }}
              key={chapter.id}
              onClick={() => jumpTo(chapter.at)}
              aria-current={index === 0 ? 'step' : undefined}
            >
              {chapter.kicker.split(' · ')[1]}
            </button>
          ))}
        </nav>
        <p className="scroll-cue" aria-hidden="true">SCROLL · STAY WITH THE OLIVE <span>↓</span></p>
        {import.meta.env.DEV && <pre ref={diagnosticsRef} className="film-diagnostics">Film engine booting</pre>}
      </div>
    </section>
  );
}
