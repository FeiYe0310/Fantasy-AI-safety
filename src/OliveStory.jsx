import React, { useRef } from 'react';
import useScrollProgress from './useScrollProgress';
import OliveSequenceCanvas from './OliveSequenceCanvas';
import OliveVideoLayer from './OliveVideoLayer';
import './olive-story.css';

const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const enter = (p, start, end) => ease((p - start) / (end - start));
const hold = (p, start, full, fade, end) => enter(p, start, full) * (1 - enter(p, fade, end));

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
      'Only after each light had examined the olive pit—and each result could be challenged by the others—did she allow the same lights to enter the sky.',
    ],
    note: 'Safety emerges from checks that can disagree and still correct one another.',
  },
  {
    id: 'mission', at: .42, kicker: 'CHAPTER IV · PLANT THE PATCH', title: ['A repair is only', 'a hypothesis.'],
    paragraphs: [
      'The fracture closed. From the ground, the sky looked whole again. Nüwa knew that appearance was not proof, so she planted the same olive pit beneath the repaired sky.',
      'If the soil remained poisoned, it would not germinate. If the restored order was unstable, it could not mature. If the patch covered only the surface, the next storm would expose the same weakness.',
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
    id: 'control', at: .70, kicker: 'CHAPTER VI · GROWTH WITHIN REACH', title: ['The tree grew.', 'Safeguards grew with it.'],
    paragraphs: [
      'Yesterday the seedling could only respond to light. Now its branches reached into the environment. Capability had become agency, and every new branch created another place where consequences could begin.',
      'The five colours entered the trunk as living monitoring pathways: recording each fork, sensing anomalies, limiting unauthorised growth, and preserving the ability to pause the whole system when evidence became thin.',
      'Runtime monitors, tool permissions, audit trails, tripwires, and calibrated interruption are not fences placed after growth. They must remain inside the system, close enough to act before consequences outrun them.',
    ],
    note: 'Control means that even during rapid growth, we can still see, question, limit, and stop.',
  },
  {
    id: 'storm', at: .84, kicker: 'CHAPTER VII · THE STORM', title: ['Failure must', 'remain legible.'],
    paragraphs: [
      'The storm did not reopen the sky, but an unfamiliar crosswind broke one branch where the monitors were least sensitive. The safety system had not prevented every injury. Its real test began after the break.',
      'Nüwa followed the exposed grain from branch to trunk, from trunk to root, and from root back to the pit’s first fracture. She looked not for a bad output to erase, but for the internal structure that had produced it.',
      'Mechanistic interpretability, causal localisation, anomaly detection, and evidence-grounded intervention let the branch grow again. The scar remained visible: a coordinate for future monitors and a record the next investigator could audit.',
    ],
    note: 'A system that erases its failures cannot learn from them.',
  },
  {
    id: 'peace', at: .97, kicker: 'CHAPTER VIII · THE OLIVE LEAF', title: ['Peace was not declared.', 'It was carried.'],
    paragraphs: [
      'Years later, the first new olive appeared. Then another. A verified repair did not produce one permanently correct answer; it produced more seeds capable of carrying evidence, inviting criticism, and beginning the test again.',
      'A white dove lifted a small olive branch into the sky. The leaf became a symbol of peace only after the system had endured growth, pressure, failure, explanation, and repair.',
      'No tree can understand the whole soil alone. We need researchers, engineers, red-teamers, interpreters, and storytellers to add evidence, expose cracks, reproduce conclusions, and improve unfinished repairs.',
    ],
    note: 'Peace is not the absence of powerful systems. It is power made answerable.',
    actions: true,
  },
];

const phaseOpacity = (p, index) => {
  const centers = chapters.map(chapter => chapter.at);
  const start = index === 0 ? -.025 : (centers[index - 1] + centers[index]) / 2;
  const end = index === chapters.length - 1 ? 1.035 : (centers[index] + centers[index + 1]) / 2;
  return hold(p, start, centers[index] - .012, centers[index] + .035, end);
};

export default function OliveStory() {
  const ref = useRef(null);
  const { progress, reduced } = useScrollProgress(ref, '(prefers-reduced-motion: reduce), (max-height: 520px)');
  const active = chapters.reduce((best, chapter, index) => Math.abs(progress - chapter.at) < Math.abs(progress - chapters[best].at) ? index : best, 0);
  const stress = hold(progress, .765, .80, .875, .91);
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
            const previous = index === 0 ? -.02 : (chapters[index - 1].at + chapter.at) / 2;
            const next = index === chapters.length - 1 ? 1.02 : (chapter.at + chapters[index + 1].at) / 2;
            const local = clamp((progress - previous) / (next - previous));
            const opacity = reduced ? 1 : phaseOpacity(progress, index);
            return (
              <article key={chapter.id} id={reduced ? chapter.id : undefined} className={`olive-scene olive-scene--${index}`} aria-hidden={!reduced && active !== index} inert={!reduced && active !== index} style={{ opacity, '--chapter-drift': reduced ? '0vh' : `${(progress - chapter.at) * -18}vh` }}>
                <p className="eyebrow">{chapter.kicker}</p>
                {index === 0 ? <h1>{chapter.title.map(line => <span key={line}>{line}</span>)}</h1> : <h2>{chapter.title.map(line => <span key={line}>{line}</span>)}</h2>}
                <div className="olive-narrative">
                  {chapter.paragraphs.map((paragraph, paragraphIndex) => {
                    const reveal = reduced ? 1 : enter(local, .08 + paragraphIndex * .16, .25 + paragraphIndex * .16);
                    return <p key={paragraph} style={{ opacity: reveal, transform: reduced ? undefined : `translateY(${(1 - reveal) * 14}px)` }}>{paragraph}</p>;
                  })}
                </div>
                <p className="olive-note" style={{ opacity: reduced ? 1 : enter(local, .58, .76) }}>{chapter.note}</p>
                {chapter.actions && <div className="olive-actions" style={{ opacity: reduced ? 1 : enter(local, .7, .88) }}><a className="olive-primary" href="https://github.com/FeiYe0310/Fantasy-AI-safety/issues/new?template=join-us.yml" target="_blank" rel="noreferrer">Join the work <span>↗</span></a><a href="https://github.com/FeiYe0310/Fantasy-AI-safety" target="_blank" rel="noreferrer">Explore the research ↗</a></div>}
              </article>
            );
          })}
        </div>

        <div className="story-index" aria-hidden="true"><span>{String(active + 1).padStart(2, '0')}</span><i style={{ transform: `scaleX(${progress})` }} /><b>{active < 3 ? 'QUESTION' : active < 5 ? 'VERIFY' : active < 7 ? 'ENDURE' : 'CARRY'}</b></div>
        <nav className="olive-nav" aria-label="Story chapters">
          {chapters.map(chapter => <button key={chapter.id} onClick={() => jumpTo(chapter.at)} aria-current={Math.abs(progress - chapter.at) < .06 ? 'step' : undefined}>{chapter.kicker.split(' · ')[1]}</button>)}
        </nav>
        <p className="scroll-cue" aria-hidden="true">SCROLL · FOLLOW THE OLIVE <span>↓</span></p>
      </div>
    </section>
  );
}
