import { useEffect, useState } from 'react';

const clamp = (value) => Math.min(1, Math.max(0, value));

export default function useScrollProgress(ref, mediaQuery = '(prefers-reduced-motion: reduce)') {
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia(mediaQuery);
    let frame = 0;
    let current = 0;
    let target = 0;
    let last = 0;
    const tick = (time) => {
      const dt = Math.min(64, time - (last || time - 16));
      last = time;
      current += (target - current) * (1 - Math.exp(-dt / 95));
      if (Math.abs(target - current) < 0.0001) current = target;
      setProgress(current);
      frame = current !== target ? requestAnimationFrame(tick) : 0;
    };
    const update = () => {
      const element = ref.current;
      if (!element) return;
      target = clamp(-element.getBoundingClientRect().top / Math.max(1, element.offsetHeight - window.innerHeight));
      if (preference.matches) { current = target; setProgress(target); }
      else if (!frame) { last = 0; frame = requestAnimationFrame(tick); }
    };
    const syncPreference = () => { setReduced(preference.matches); update(); };
    syncPreference();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    preference.addEventListener('change', syncPreference);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      preference.removeEventListener('change', syncPreference);
    };
  }, [ref, mediaQuery]);
  return { progress, reduced };
}
