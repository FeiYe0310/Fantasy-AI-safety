import React, { useEffect, useMemo, useRef, useState } from 'react';
import SafetyField from './SafetyField';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

function useSectionProgress(ref) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = ref.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const distance = Math.max(1, element.offsetHeight - window.innerHeight);
      setProgress(clamp(-rect.top / distance));
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ref]);

  return progress;
}

function opacityWindow(progress, enter, fullStart, fullEnd, exit) {
  const enterOpacity = smooth((progress - enter) / Math.max(0.001, fullStart - enter));
  const exitOpacity = 1 - smooth((progress - fullEnd) / Math.max(0.001, exit - fullEnd));
  return clamp(Math.min(enterOpacity, exitOpacity));
}

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
  const roadRef = useRef(null);
  const progress = useSectionProgress(roadRef);
  const base = import.meta.env.BASE_URL;
  const heroOpacity = 1 - smooth((progress - 0.055) / 0.1);
  const soteriaOpacity = opacityWindow(progress, 0.08, 0.15, 0.34, 0.49);
  const nuwaOpacity = opacityWindow(progress, 0.23, 0.3, 0.47, 0.59);
  const contactOpacity = opacityWindow(progress, 0.47, 0.54, 0.71, 0.79);
  const fusionOpacity = smooth((progress - 0.72) / 0.1);
  const thesisOpacity = smooth((progress - 0.78) / 0.12);
  const flashOpacity = Math.max(0, 1 - Math.abs(progress - 0.735) / 0.025);
  const soteriaX = -42 + smooth((progress - 0.1) / 0.35) * 18;
  const nuwaX = 44 - smooth((progress - 0.24) / 0.28) * 18;

  const activeChapter = useMemo(() => {
    if (progress < 0.18) return 'opening';
    if (progress < 0.34) return 'soteria';
    if (progress < 0.5) return 'nuwa';
    if (progress < 0.76) return 'contact';
    return 'fusion';
  }, [progress]);

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

      <section className="intro-road" id="top" ref={roadRef} aria-label="The guardians of verification">
        <div className="intro-stage">
          <SafetyField progress={progress} />

          <div className="progress-rail" aria-hidden="true">
            {['opening', 'soteria', 'nuwa', 'contact', 'fusion'].map((chapter) => (
              <i key={chapter} className={chapter === activeChapter ? 'is-active' : ''} />
            ))}
          </div>

          <div className="hero-copy" style={{ opacity: heroOpacity }}>
            <p className="eyebrow">OPEN RESEARCH · AI SAFETY</p>
            <h1>More capability<br />needs more verification.</h1>
            <p className="hero-copy__cn">让每一次强大行动，都拥有足够多的验证。</p>
            <a className="text-link" href="#mission">Enter the thesis <span>↓</span></a>
          </div>

          <img
            className="guardian guardian--soteria"
            src={`${base}guardians/soteria.png`}
            alt="Soteria, rendered in warm antique-gold light"
            style={{ opacity: soteriaOpacity, transform: `translate3d(${soteriaX}vw, 4vh, 0) scale(${0.9 + soteriaOpacity * 0.08})` }}
          />
          <article className="guardian-copy guardian-copy--soteria" style={{ opacity: soteriaOpacity }} id="guardians">
            <p className="eyebrow eyebrow--gold">01 · THE BOUNDARY</p>
            <h2>Soteria</h2>
            <h3>Safety before harm.</h3>
            <p>The Greek personification of safety and deliverance. She stands for prevention, constraint, and the discipline to verify before an action reaches the world.</p>
            <span className="tag tag--gold">PREVENTION / CONSTRAINT / VERIFICATION</span>
          </article>

          <img
            className="guardian guardian--nuwa"
            src={`${base}guardians/nuwa.png`}
            alt="Nüwa, rendered in luminous jade, cinnabar, indigo and ivory"
            style={{ opacity: nuwaOpacity, transform: `translate3d(${nuwaX}vw, 1vh, 0) scale(${0.86 + nuwaOpacity * 0.08})` }}
          />
          <article className="guardian-copy guardian-copy--nuwa" style={{ opacity: nuwaOpacity }}>
            <p className="eyebrow eyebrow--jade">02 · THE REPAIR</p>
            <h2>Nüwa</h2>
            <h3>Safety after rupture.</h3>
            <p>The creator who mended a broken sky. She stands for locating failure, repairing structure, and recovering when no boundary can anticipate everything.</p>
            <span className="tag tag--jade">CREATION / REPAIR / RECOVERY</span>
          </article>

          <div className="contact-frame" style={{ opacity: contactOpacity }}>
            <img src={`${base}guardians/contact-hands.png`} alt="Soteria and Nüwa performing a mirrored fusion movement as their fingertips meet in a bright gold-and-jade contact point" />
            <p className="eyebrow">THE CONTACT · VERIFICATION MEETS REPAIR</p>
            <span aria-hidden="true">SCROLL TO COMPLETE THE CIRCUIT</span>
          </div>

          <div className="fusion-reveal" style={{ opacity: fusionOpacity }}>
            <img src={`${base}guardians/fusion.png`} alt="The fused guardian, combining Soteria's golden order with Nüwa's jade repair" />
          </div>

          <div className="contact-flash" style={{ opacity: flashOpacity }} aria-hidden="true" />

          <div className="thesis" style={{ opacity: thesisOpacity }}>
            <p className="eyebrow">THE FUSION</p>
            <h2>Safety needs both.</h2>
            <p>Constraint without repair becomes brittle.<br />Creation without verification becomes dangerous.</p>
          </div>
        </div>
      </section>

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
        <img src={`${base}guardians/fusion.png`} alt="" aria-hidden="true" />
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

      <footer className="site-footer">
        <BrandMark />
        <p>FANTASY AI SAFETY</p>
        <h2>More capability<br />needs more verification.</h2>
        <div><span>OPEN RESEARCH · 2026</span><a href="https://github.com/FeiYe0310/Fantasy-AI-safety" target="_blank" rel="noreferrer">GITHUB ↗</a></div>
      </footer>
    </main>
  );
}
