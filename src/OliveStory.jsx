import React, { useRef } from 'react';
import useScrollProgress from './useScrollProgress';
import OliveSequenceCanvas from './OliveSequenceCanvas';
import OliveVideoLayer from './OliveVideoLayer';
import './olive-story.css';

const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const enter = (p, start, end) => ease((p - start) / (end - start));

const chapters = [
  {
    id: 'opening', at: 0, kicker: 'CHAPTER I · THE LAST OLIVE', title: ['The sky failed', 'before the olive did.'],
    paragraphs: [
      'The world did not end when the first fracture appeared. Rivers moved, wind crossed the plateau, and the sun still reached the ground. The error was thin, silent, and easy to call harmless.',
      'But every powerful action widened it. Unchecked assumptions, missing evidence, and decisions no one could reconstruct entered the world through the same bright seam.',
      'On the final living branch, one olive held on. When an answer finally crossed the boundary faster than anyone could verify it, the sky opened—and the olive fell.',
    ],
    note: 'Powerful systems scale useful action. They also scale every hidden mistake inside it.',
  },
  {
    id: 'nuwa', at: .14, kicker: 'CHAPTER II · NÜWA’S PAUSE', title: ['She began with', 'a question.'],
    paragraphs: [
      'Nüwa caught the olive. Its flesh had split in the fall, leaving a small grooved stone in her palm. Everyone waited for her to raise the five-coloured stones and close the wound above them.',
      'She did not. The groove in the olive pit echoed the fracture in the sky. Perhaps the visible crack was not the failure itself, but the trace of something deeper moving through the system.',
      'Before repairing anything, she asked where the failure began, what amplified it, who had seen it, why no one could stop it, and whether the world would still have room to recover if it happened again.',
    ],
    note: 'A patch can hide a failure without removing its cause.',
  },
  {
    id: 'verification', at: .28, kicker: 'CHAPTER III · FIVE COLOURS OF VERIFICATION', title: ['No single light', 'was trusted alone.'],
    paragraphs: [
      'Jade tested boundaries and permissions. Cinnabar applied adversarial pressure. Amber followed evidence and calibration. Ivory exposed the process. Indigo preserved uncertainty, interruption, and recovery.',
      'The five lights did not always agree. Nüwa did not force them into a single answer. Their disagreement was the evidence: one verifier may be confidently wrong, while independent paths can reveal one another’s blind spots.',
      'Only after each light had examined the olive pit—and each result could be challenged by the others—did she allow those paths to enter the seed and descend into the soil.',
    ],
    note: 'Safety emerges from checks that can disagree and still correct one another.',
  },
  {
    id: 'mission', at: .42, kicker: 'CHAPTER IV · PLANT THE OLIVE', title: ['A repair must', 'first take root.'],
    paragraphs: [
      'Nüwa did not close the fracture yet. She lowered the same olive pit into the soil beneath the broken sky. The repair would have to grow before it was allowed to touch the wound.',
      'If the soil remained poisoned, the pit would not germinate. If the roots could not carry evidence, the trunk could not be trusted. If the safeguards failed to grow with capability, no beautiful crown would make the system safe.',
      'This is our mission: abundant verification tokens—enough compute, time, evidence, criticism, human judgment, and recovery capacity to challenge a powerful action before it reaches the world.',
    ],
    note: 'Capability should not consume the whole budget and leave verification with what remains.',
  },
  {
    id: 'roots', at: .56, kicker: 'CHAPTER V · A ROOT SYSTEM OF EVIDENCE', title: ['One root can be', 'confidently wrong.'],
    paragraphs: [
      'The first root found water and returned a satisfying answer. The second struck stone. The third found salt. Two more travelled deeper, carrying back evidence that contradicted the first path.',
      'No root could describe the underground world alone. Together, their successes, failures, disagreements, and empty results gave the seed a map strong enough to act on.',
      'Verifier models, process supervision, debate, multi-model critique, and evidence-carrying outputs form the same kind of structure. Verification needs its own path, its own evidence, and its own way to fail.',
    ],
    note: 'Confidence is not permission. The shoot waited for enough evidence before it broke the surface.',
  },
  {
    id: 'control', at: .68, kicker: 'CHAPTER VI · THE COLOURS GROW', title: ['The tree grew.', 'Its safeguards grew too.'],
    paragraphs: [
      'The sapling thickened into an olive tree while the camera travelled around it. Every new branch increased what the system could reach; every coloured vein increased what its guardians could still observe, question, and stop.',
      'Jade, cinnabar, amber, ivory, and indigo moved from root to trunk and finally appeared together in one narrow olive leaf. The colour was not decoration. It was the visible record of five independent paths surviving the same growth.',
      'Runtime monitors, permissions, audit trails, adversarial checks, and calibrated interruption cannot be painted on after capability matures. They must remain alive inside the system, growing at the same speed as its power.',
    ],
    note: 'Control means that even during rapid growth, we can still see, question, limit, and stop.',
  },
  {
    id: 'storm', at: .78, kicker: 'CHAPTER VII · THE LEAF IS CHOSEN', title: ['Evidence became', 'something she could carry.'],
    paragraphs: [
      'Nüwa did not take the brightest leaf or the largest one. She followed one leaf back through its coloured veins, into the branch, down the trunk, and through the roots to the original pit.',
      'Only when every stage could be reconstructed did she pinch the stem and detach it. The camera moved around the leaf as it left the tree, revealing that the proof remained coherent from another angle instead of collapsing into a convenient surface.',
      'Interpretability makes intervention precise. Evidence-carrying outputs make decisions auditable. Independent verification makes confidence answerable. Together they turn a result into something another mind can inspect and safely carry forward.',
    ],
    note: 'The leaf was not trusted because it was beautiful. It was chosen because its history remained legible.',
  },
  {
    id: 'peace', at: .94, kicker: 'CHAPTER VIII · MEND THE SKY', title: ['Peace was not declared.', 'It was verified.'],
    paragraphs: [
      'Nüwa raised the same leaf to the luminous fracture. As the camera climbed around her hand, the leaf entered the wound edge-first. The sky closed only where verified structure touched it; nothing was hidden behind light or spectacle.',
      'When her fingers released the stem, the repaired blue held. A white dove lifted a small olive branch into the clear air. The leaf became a symbol of peace only after it had endured planting, growth, disagreement, inspection, selection, and repair.',
      'No tree can understand the whole soil alone. We need researchers, engineers, red-teamers, interpreters, and storytellers to add evidence, expose cracks, reproduce conclusions, and improve unfinished repairs.',
    ],
    note: 'Peace is not the absence of powerful systems. It is power made answerable.',
    actions: true,
  },
];

// These windows follow the visual edit rather than the evenly spaced chapter
// labels. Copy now arrives during the corresponding camera move and transition.
const visualWindows = [
  { from: 0, to: .078 },
  { from: .115, to: .205 },
  { from: .245, to: .355 },
  { from: .385, to: .494 },
  { from: .486, to: .629 },
  { from: .621, to: .752 },
  { from: .744, to: .88 },
  { from: .872, to: 1 },
];

const phaseOpacity = (p, index) => {
  const start = visualWindows[index].from;
  const end = index === chapters.length - 1 ? 1.02 : visualWindows[index + 1].from;
  const incoming = index === 0 ? 1 : enter(p, start, start + .018);
  const outgoing = index === chapters.length - 1 ? 1 : 1 - enter(p, end - .018, end);
  return incoming * outgoing;
};

export default function OliveStory() {
  const ref = useRef(null);
  const { progress, reduced } = useScrollProgress(ref, '(prefers-reduced-motion: reduce), (max-height: 520px)');
  const active = chapters.reduce((best, chapter, index) => Math.abs(progress - chapter.at) < Math.abs(progress - chapters[best].at) ? index : best, 0);
  const stress = 0;
  const jumpTo = (at) => {
    const element = ref.current;
    const distance = element.offsetHeight - window.innerHeight;
    window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top + at * distance, behavior: reduced ? 'instant' : 'smooth' });
  };

  return (
    <section className="olive-road" ref={ref} aria-label="The story of Nüwa and the last olive">
      {chapters.map(chapter => <span key={chapter.id} id={reduced ? undefined : chapter.id} className="olive-anchor" aria-hidden="true" style={{ top: `calc((100% - 100svh) * ${chapter.at})` }} />)}
      <div className="olive-stage">
        <div className="olive-world" aria-hidden="true">
          <OliveSequenceCanvas progress={progress} opacity={1} stress={stress} />
          <OliveVideoLayer progress={progress} reduced={reduced} stress={stress} />
          <div className="olive-grade" />
          <div className="olive-vignette" />
        </div>

        <div className="olive-copy">
          {chapters.map((chapter, index) => {
            const visualWindow = visualWindows[index];
            const visualLocal = clamp((progress - visualWindow.from) / (visualWindow.to - visualWindow.from));
            const opacity = reduced ? 1 : phaseOpacity(progress, index);
            const headingReveal = reduced ? 1 : enter(visualLocal, 0, .14);
            const headingStyle = reduced ? undefined : { opacity: headingReveal, transform: `translateY(${(1 - headingReveal) * 12}px)` };
            return (
              <article key={chapter.id} id={reduced ? chapter.id : undefined} className={`olive-scene olive-scene--${index}`} aria-hidden={!reduced && active !== index} inert={!reduced && active !== index} style={{ opacity, '--chapter-drift': reduced ? '0vh' : `${(progress - chapter.at) * -18}vh` }}>
                <p className="eyebrow" style={headingStyle}>{chapter.kicker}</p>
                {index === 0 ? <h1 style={headingStyle}>{chapter.title.map(line => <span key={line}>{line}</span>)}</h1> : <h2 style={headingStyle}>{chapter.title.map(line => <span key={line}>{line}</span>)}</h2>}
                <div className="olive-narrative">
                  {chapter.paragraphs.map((paragraph, paragraphIndex) => {
                    const reveal = reduced ? 1 : enter(visualLocal, .04 + paragraphIndex * .07, .18 + paragraphIndex * .07);
                    return <p key={paragraph} style={{ opacity: reveal, transform: reduced ? undefined : `translateY(${(1 - reveal) * 14}px)` }}>{paragraph}</p>;
                  })}
                </div>
                <p className="olive-note" style={{ opacity: reduced ? 1 : enter(visualLocal, .24, .4) }}>{chapter.note}</p>
                {chapter.actions && <div className="olive-actions" style={{ opacity: reduced ? 1 : enter(visualLocal, .4, .62) }}><a className="olive-primary" href="https://github.com/FeiYe0310/Fantasy-AI-safety/issues/new?template=join-us.yml" target="_blank" rel="noreferrer">Join the work <span>↗</span></a><a href="https://github.com/FeiYe0310/Fantasy-AI-safety" target="_blank" rel="noreferrer">Explore the research ↗</a></div>}
              </article>
            );
          })}
        </div>

        <div className="story-index" aria-hidden="true"><span>{String(active + 1).padStart(2, '0')}</span><i style={{ transform: `scaleX(${progress})` }} /><b>{active < 3 ? 'QUESTION' : active < 5 ? 'PLANT' : active < 6 ? 'GROW' : active < 7 ? 'CHOOSE' : 'MEND'}</b></div>
        <nav className="olive-nav" aria-label="Story chapters">
          {chapters.map(chapter => <button key={chapter.id} onClick={() => jumpTo(chapter.at)} aria-current={Math.abs(progress - chapter.at) < .06 ? 'step' : undefined}>{chapter.kicker.split(' · ')[1]}</button>)}
        </nav>
        <p className="scroll-cue" aria-hidden="true">SCROLL · FOLLOW THE OLIVE <span>↓</span></p>
      </div>
    </section>
  );
}
