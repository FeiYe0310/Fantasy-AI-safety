import React from 'react';
import SkyStory from './SkyStory';

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i className="brand-mark__gold" />
      <i className="brand-mark__jade" />
      <b />
    </span>
  );
}

const researchDirections = [
  {
    number: '01',
    title: 'Scalable verification',
    question: 'How can verification scale faster than generation?',
    body: 'Verifier models, process supervision, multi-model critique, debate, and evidence-carrying outputs that turn plausible answers into independently checkable claims.',
    tags: 'VERIFIERS / PROCESS SUPERVISION / CRITIQUE',
    tone: 'gold',
  },
  {
    number: '02',
    title: 'Agent monitoring & control',
    question: 'How do we keep autonomous systems observable and interruptible?',
    body: 'Runtime monitors, tool permissions, audit trails, tripwires, safe interruption, and staged authorization before high-impact actions reach the world.',
    tags: 'MONITORING / CONTROL / INTERRUPTIBILITY',
    tone: 'ivory',
  },
  {
    number: '03',
    title: 'Mechanistic auditing & repair',
    question: 'Can we repair the cause of failure—not only the symptom?',
    body: 'Mechanistic interpretability, causal localization, anomalous representations, signals of deception or goal drift, and interventions grounded in internal evidence.',
    tags: 'INTERPRETABILITY / CAUSAL EVIDENCE / REPAIR',
    tone: 'jade',
  },
];

export default function App() {
  const base = import.meta.env.BASE_URL;

  return (
    <main>
      <a className="skip-link" href="#mission">Skip cinematic introduction</a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Fantasy AI Safety home">
          <BrandMark />
          <span>FANTASY / AI SAFETY</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#guardians">Guardians</a>
          <a href="#mission">Mission</a>
          <a href="#research">Research</a>
          <a href="#join">Join us</a>
          <a href="https://github.com/FeiYe0310/Fantasy-AI-safety" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </header>

      <SkyStory />

      <section className="mission-section" id="mission">
        <div className="section-rule"><span>03</span><b>MISSION</b><i /></div>
        <div className="mission-grid">
          <div>
            <p className="eyebrow">OUR MISSION</p>
            <h2>Abundant<br /><span>verification tokens.</span></h2>
          </div>
          <div className="mission-copy">
            <p>Powerful systems receive abundant compute to generate an answer, but far less budget to challenge, verify, and repair it.</p>
            <p>We work toward systems where every consequential action can carry enough independent checks, counterarguments, causal evidence, and recovery steps before it reaches the world.</p>
            <a className="pill-link" href="https://github.com/FeiYe0310/Fantasy-AI-safety" target="_blank" rel="noreferrer">Follow the research <span>↗</span></a>
          </div>
        </div>
        <div className="token-logic" aria-label="Verification token model">
          <div><span>GENERATION TOKENS</span><b>answer</b></div>
          <i>→</i>
          <div className="token-logic__verification"><span>VERIFICATION TOKENS</span><b>evidence · critique · revision · confidence</b></div>
        </div>
      </section>

      <section className="research-section" id="research">
        <div className="section-rule"><span>04</span><b>RESEARCH DIRECTIONS</b><i /></div>
        <header className="research-header">
          <p className="eyebrow">OPEN QUESTIONS</p>
          <h2>Build the<br />verification layer.</h2>
          <p>Three connected research programs, one shared constraint: claims about safety should carry evidence strong enough to be challenged.</p>
        </header>
        <div className="research-list">
          {researchDirections.map((direction) => (
            <article className={`research-card research-card--${direction.tone}`} key={direction.number}>
              <div className="research-card__number">{direction.number}</div>
              <div>
                <p className="eyebrow">{direction.tags}</p>
                <h3>{direction.title}</h3>
                <h4>{direction.question}</h4>
                <p>{direction.body}</p>
                <a href="https://github.com/FeiYe0310/Fantasy-AI-safety/issues/new?labels=research" target="_blank" rel="noreferrer">Open a research question <span>↗</span></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="principle-section" aria-labelledby="principle-title">
        <img src={`${base}guardians/fusion-daylight.png`} alt="" aria-hidden="true" />
        <div>
          <p className="eyebrow">THE PRINCIPLE</p>
          <h2 id="principle-title">Verification is not the opposite of creation.</h2>
          <p>It is how creation survives contact with reality.</p>
          <p className="principle-section__cn">验证不是创造的对立面。它让创造经得起现实。</p>
        </div>
      </section>

      <section className="join-section" id="join">
        <div className="section-rule"><span>05</span><b>JOIN US</b><i /></div>
        <div className="join-grid">
          <div>
            <p className="eyebrow">OPEN COLLABORATION</p>
            <h2>Help build the<br />verification layer.</h2>
          </div>
          <div className="join-copy">
            <p>We welcome researchers, engineers, red-teamers, technical writers, and visual storytellers who want powerful AI systems to remain observable, challengeable, interruptible, and repairable.</p>
            <ul>
              <li><b>Research</b><span>Propose open questions, reproduce experiments, and publish notes.</span></li>
              <li><b>Build</b><span>Implement verifiers, evaluations, monitors, and interpretability tools.</span></li>
              <li><b>Challenge</b><span>Find failure modes, design red-team tasks, and audit assumptions.</span></li>
            </ul>
            <div className="join-actions">
              <a className="primary-action" href="https://github.com/FeiYe0310/Fantasy-AI-safety/issues/new?template=join-us.yml" target="_blank" rel="noreferrer">Introduce yourself <span>↗</span></a>
              <a href="https://github.com/FeiYe0310/Fantasy-AI-safety" target="_blank" rel="noreferrer">Contribute on GitHub ↗</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer" style={{ backgroundImage: `url(${base}guardians/sky-healed.png)` }}>
        <BrandMark />
        <p>FANTASY AI SAFETY</p>
        <h2>More capability<br />needs more verification.</h2>
        <div><span>OPEN RESEARCH · 2026</span><a href="https://github.com/FeiYe0310/Fantasy-AI-safety" target="_blank" rel="noreferrer">GITHUB ↗</a></div>
      </footer>
    </main>
  );
}
