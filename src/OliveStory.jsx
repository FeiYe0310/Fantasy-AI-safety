import React, { useRef } from 'react';
import useScrollProgress from './useScrollProgress';
import OliveSequenceCanvas from './OliveSequenceCanvas';
import './olive-story.css';

const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const enter = (p, start, end) => ease((p - start) / (end - start));

const chapters = [
  {
    id: 'opening', at: 0, kicker: 'CHAPTER I · THE LAST OLIVE', title: ['Heaven broke.', 'One olive remained.'],
    paragraphs: [
      'A bright fracture crossed the sky. It looked narrow from the ground, but every powerful action widened it: one unchecked assumption, one missing source, one decision no one could reconstruct.',
      'Nüwa, the creator who once repaired heaven, could have reached immediately for spectacle. Instead she caught the last olive beneath the fracture and held it beside the wound.',
      'The groove in the fruit resembled the crack above. Before she repaired the sky, she chose to understand what could make a repair endure.',
    ],
    note: 'A visible failure is often only the surface of a deeper system.',
  },
  {
    id: 'seed', at: .14, kicker: 'CHAPTER II · THE SEED', title: ['She planted the answer', 'instead of performing it.'],
    paragraphs: [
      'Nüwa opened the olive and lowered its pit into the same earth that had carried the failure. The gesture was small enough to miss, but it changed the order of the story.',
      'The repair would not be granted authority because a goddess made it. It would have to survive the soil, expose its dependencies, and earn the right to grow toward the fracture.',
      'AI safety begins the same way: not with a promise placed over capability, but with verification planted inside the process that produces it.',
    ],
    note: 'Do not begin with trust. Begin with a path that can be checked.',
  },
  {
    id: 'roots', at: .28, side: 'right', kicker: 'CHAPTER III · FIVE ROOTS', title: ['Verification', 'had to grow first.'],
    paragraphs: [
      'Jade tested boundaries and permissions. Cinnabar applied adversarial pressure. Ochre followed evidence and calibration. Ivory exposed the process. Indigo preserved uncertainty, interruption, and recovery.',
      'The roots disagreed as they moved through water, stone, and salt. Nüwa did not erase the disagreement. Independent paths were valuable precisely because one confident root could still be wrong.',
      'Only when their evidence could meet, challenge, and correct itself did the first shoot break the surface beneath her hand.',
    ],
    note: 'Redundancy is not repetition when each verifier can expose a different failure.',
  },
  {
    id: 'mission', at: .42, kicker: 'CHAPTER IV · THE TREE', title: ['Capability grew.', 'Safeguards grew with it.'],
    paragraphs: [
      'The olive became a tree. Every new branch expanded what it could reach; every living vein preserved a way to observe, question, limit, and stop what travelled through it.',
      'This is our mission: abundant verification tokens—enough compute, time, evidence, criticism, human judgment, and recovery capacity to challenge powerful actions before they enter the world.',
      'Verification cannot be whatever remains after capability has consumed the budget. It must grow from root to crown at the same pace as the system it is meant to govern.',
    ],
    note: 'Power becomes safer when the means to challenge it scale alongside it.',
  },
  {
    id: 'leaf', at: .56, side: 'right', kicker: 'CHAPTER V · THE LEAF', title: ['One leaf carried', 'the whole path.'],
    paragraphs: [
      'Among thousands of leaves, Nüwa chose one whose veins still revealed every path below: boundary checks, adversarial tests, evidence, transparency, and recovery.',
      'The five colours were not painted on its surface. They lived inside its structure, faint enough to require attention and continuous enough to trace back through branch, trunk, root, and seed.',
      'The olive remained an olive. Verification did not replace the object; it made the object answerable.',
    ],
    note: 'The result matters. Its inspectable history matters too.',
  },
  {
    id: 'verification', at: .69, kicker: 'CHAPTER VI · THE PROOF', title: ['She chose what', 'another mind could trace.'],
    paragraphs: [
      'Nüwa turned the leaf toward the light. From another angle the evidence still held. No colour disappeared when the surface changed, and no convenient story replaced a missing link.',
      'Our research follows those veins: verifier models, process supervision, mechanistic interpretability, debate and critique, evidence-carrying outputs, runtime monitoring, calibrated interruption, and recovery.',
      'A conclusion becomes useful when it can be inspected. It becomes governable when inspection can still change what happens next.',
    ],
    note: 'Confidence is not permission. Traceable evidence can become one.',
  },
  {
    id: 'mend', at: .82, kicker: 'CHAPTER VII · MEND THE SKY', title: ['Only verified structure', 'touched the wound.'],
    paragraphs: [
      'Nüwa carried the leaf upward and placed its edge against the fracture. She did not cover the whole sky with light. The crack closed only where the living evidence made contact.',
      'Root by root, vein by vein, the repair joined the world it was meant to protect. The remaining fracture stayed visible until there was enough verified structure to close it honestly.',
      'That restraint is the point: safety is not a beautiful layer over an opaque system. It is the capacity to know where an action came from—and still intervene before it becomes irreversible.',
    ],
    note: 'A repair is trustworthy when it preserves the evidence that justified it.',
  },
  {
    id: 'peace', at: .94, side: 'right', kicker: 'CHAPTER VIII · PEACE, VERIFIED', title: ['Peace was not declared.', 'It was earned.'],
    paragraphs: [
      'The repaired blue held. The olive tree remained rooted beneath it, carrying every disagreement and correction that had made the repair possible. A white dove lifted one branch into the clear air.',
      'The leaf became a symbol of peace only after planting, growth, challenge, inspection, selection, and repair. What endured was not perfect certainty, but a system with enough evidence and recovery capacity to remain answerable.',
      'We are building that capacity with researchers, engineers, red-teamers, interpreters, and storytellers. Bring a verifier, expose a crack, reproduce a result, or help an unfinished repair grow stronger.',
    ],
    note: 'Peace is power made answerable.',
    actions: true,
  },
];

const visualWindows = [
  { from: 0, to: .105 }, { from: .115, to: .245 }, { from: .255, to: .385 }, { from: .395, to: .525 },
  { from: .535, to: .655 }, { from: .665, to: .785 }, { from: .795, to: .915 }, { from: .925, to: 1 },
];

const phaseOpacity = (p, index) => {
  const start = visualWindows[index].from;
  const end = index === chapters.length - 1 ? 1.02 : visualWindows[index + 1].from;
  const incoming = index === 0 ? 1 : enter(p, start, start + .02);
  const outgoing = index === chapters.length - 1 ? 1 : 1 - enter(p, end - .02, end);
  return incoming * outgoing;
};

export default function OliveStory() {
  const ref = useRef(null);
  const { progress, reduced } = useScrollProgress(ref, '(prefers-reduced-motion: reduce), (max-height: 520px)');
  const active = chapters.reduce((best, chapter, index) => Math.abs(progress - chapter.at) < Math.abs(progress - chapters[best].at) ? index : best, 0);
  const jumpTo = (at) => {
    const element = ref.current;
    const distance = element.offsetHeight - window.innerHeight;
    window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top + at * distance, behavior: reduced ? 'instant' : 'smooth' });
  };

  return (
    <section className="olive-road" ref={ref} aria-label="The verified olive, carried by Nüwa">
      {chapters.map(chapter => <span key={chapter.id} id={reduced ? undefined : chapter.id} className="olive-anchor" aria-hidden="true" style={{ top: `calc((100% - 100svh) * ${chapter.at})` }} />)}
      <div className="olive-stage">
        <div className="olive-world" aria-hidden="true">
          <OliveSequenceCanvas progress={progress} />
          <div className="olive-grade olive-grade--left" style={{ opacity: chapters[active].side === 'right' ? 0 : 1 }} />
          <div className="olive-grade olive-grade--right" style={{ opacity: chapters[active].side === 'right' ? 1 : 0 }} />
          <div className="olive-vignette" />
        </div>

        <div className="olive-copy">
          {chapters.map((chapter, index) => {
            const visualWindow = visualWindows[index];
            const visualLocal = clamp((progress - visualWindow.from) / (visualWindow.to - visualWindow.from));
            const revealLocal = index === 0 ? Math.max(.4, visualLocal) : visualLocal;
            const opacity = reduced ? 1 : phaseOpacity(progress, index);
            const headingReveal = reduced ? 1 : enter(revealLocal, 0, .16);
            const headingStyle = reduced ? undefined : { opacity: headingReveal, transform: `translateY(${(1 - headingReveal) * 12}px)` };
            return (
              <article key={chapter.id} id={reduced ? chapter.id : undefined} className={`olive-scene olive-scene--${index}${chapter.side === 'right' ? ' olive-scene--right' : ''}`} aria-hidden={!reduced && active !== index} inert={!reduced && active !== index} style={{ opacity, '--chapter-drift': reduced ? '0vh' : `${(progress - chapter.at) * -16}vh` }}>
                <p className="eyebrow" style={headingStyle}>{chapter.kicker}</p>
                {index === 0 ? <h1 style={headingStyle}>{chapter.title.map(line => <span key={line}>{line}</span>)}</h1> : <h2 style={headingStyle}>{chapter.title.map(line => <span key={line}>{line}</span>)}</h2>}
                <div className="olive-narrative">
                  {chapter.paragraphs.map((paragraph, paragraphIndex) => {
                    const reveal = reduced ? 1 : enter(revealLocal, .04 + paragraphIndex * .075, .2 + paragraphIndex * .075);
                    return <p key={paragraph} style={{ opacity: reveal, transform: reduced ? undefined : `translateY(${(1 - reveal) * 14}px)` }}>{paragraph}</p>;
                  })}
                </div>
                <p className="olive-note" style={{ opacity: reduced ? 1 : enter(revealLocal, .28, .46) }}>{chapter.note}</p>
                {chapter.actions && <div className="olive-actions" style={{ opacity: reduced ? 1 : enter(visualLocal, .44, .68) }}><a className="olive-primary" href="https://github.com/FeiYe0310/Fantasy-AI-safety/issues/new?template=join-us.yml" target="_blank" rel="noreferrer">Join the work <span>↗</span></a><a href="https://github.com/FeiYe0310/Fantasy-AI-safety" target="_blank" rel="noreferrer">Explore the research ↗</a></div>}
              </article>
            );
          })}
        </div>

        <div className="story-index" aria-hidden="true"><span>{String(active + 1).padStart(2, '0')}</span><i style={{ transform: `scaleX(${progress})` }} /><b>{['WITNESS', 'PLANT', 'VERIFY', 'GROW', 'CHOOSE', 'TRACE', 'MEND', 'PEACE'][active]}</b></div>
        <nav className="olive-nav" aria-label="Story chapters">
          {chapters.map(chapter => <button key={chapter.id} onClick={() => jumpTo(chapter.at)} aria-current={Math.abs(progress - chapter.at) < .06 ? 'step' : undefined}>{chapter.kicker.split(' · ')[1]}</button>)}
        </nav>
        <p className="scroll-cue" aria-hidden="true">SCROLL · FOLLOW THE OLIVE <span>↓</span></p>
      </div>
    </section>
  );
}
