import React from 'react';
import OliveStory from './OliveStory';

export default function App() {
  return (
    <main id="top">
      <a className="skip-link" href="#mission">Skip to the mission</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Fantasy AI Safety home">
          <span className="brand-mark" aria-hidden="true"><i /><b /><em /></span>
          <span>FANTASY / AI SAFETY</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#opening">Story</a>
          <a href="#mission">Mission</a>
          <a href="#roots">Research</a>
          <a href="#peace">Join us</a>
          <a href="https://github.com/FeiYe0310/Fantasy-AI-safety" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </header>
      <OliveStory />
    </main>
  );
}
