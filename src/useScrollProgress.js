import { useCallback, useEffect, useRef, useState } from 'react';

const clamp = (value) => Math.min(1, Math.max(0, value));

export default function useScrollProgress(ref, onFrame, mediaQuery = '(prefers-reduced-motion: reduce)') {
  const onFrameRef = useRef(onFrame);
  const measureRef = useRef(() => {});
  const reducedRef = useRef(false);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const velocityRef = useRef(0);
  const directionRef = useRef(1);
  const [reduced, setReduced] = useState(false);
  onFrameRef.current = onFrame;

  useEffect(() => {
    const preference = window.matchMedia(mediaQuery);
    let raf = 0;
    let lastFrameTime = 0;
    let lastScrollTime = performance.now();
    let lastCurrent = 0;
    let rollingFps = 60;

    const measure = () => {
      const element = ref.current;
      if (!element) return;
      const now = performance.now();
      const nextTarget = clamp(-element.getBoundingClientRect().top / Math.max(1, element.offsetHeight - window.innerHeight));
      const targetDelta = nextTarget - targetProgressRef.current;
      if (Math.abs(targetDelta) > 0.000001) directionRef.current = targetDelta > 0 ? 1 : -1;
      targetProgressRef.current = nextTarget;
      lastScrollTime = now;
    };
    measureRef.current = measure;

    const tick = (time) => {
      const dt = Math.min(48, Math.max(1, time - (lastFrameTime || time - 16.67)));
      lastFrameTime = time;
      const target = targetProgressRef.current;
      let current = currentProgressRef.current;

      if (reducedRef.current) {
        current = target;
      } else {
        const distance = Math.abs(target - current);
        const timeConstant = 66 + Math.min(54, distance * 310);
        current += (target - current) * (1 - Math.exp(-dt / timeConstant));
        if (Math.abs(target - current) < 0.00001) current = target;
      }

      const instantVelocity = (current - lastCurrent) / (dt / 1000);
      velocityRef.current += (instantVelocity - velocityRef.current) * (1 - Math.exp(-dt / 70));
      if (Math.abs(instantVelocity) > 0.0001) directionRef.current = instantVelocity > 0 ? 1 : -1;
      currentProgressRef.current = current;
      rollingFps += ((1000 / dt) - rollingFps) * 0.08;

      onFrameRef.current?.({
        time,
        dt,
        rafInterval: dt,
        fps: rollingFps,
        targetProgress: target,
        currentProgress: current,
        velocity: velocityRef.current,
        direction: directionRef.current,
        reduced: reducedRef.current,
        inputIdleMs: time - lastScrollTime,
      });

      lastCurrent = current;
      raf = requestAnimationFrame(tick);
    };

    const syncPreference = () => {
      reducedRef.current = preference.matches;
      setReduced((value) => value === preference.matches ? value : preference.matches);
      measure();
      if (preference.matches) currentProgressRef.current = targetProgressRef.current;
    };

    syncPreference();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    preference.addEventListener('change', syncPreference);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      measureRef.current = () => {};
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      preference.removeEventListener('change', syncPreference);
    };
  }, [ref, mediaQuery]);

  const measure = useCallback(() => measureRef.current(), []);
  return {
    reduced,
    reducedRef,
    targetProgressRef,
    currentProgressRef,
    velocityRef,
    directionRef,
    measure,
  };
}
