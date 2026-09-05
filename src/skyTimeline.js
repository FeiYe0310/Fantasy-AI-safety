export const clamp = (value) => Math.min(1, Math.max(0, value));
export const ease = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const between = (p, start, end) => ease((p - start) / (end - start));

export function skyTimeline(progress) {
  const p = clamp(progress);
  const approach = between(p, 0.33, 0.57);
  const merge = between(p, 0.63, 0.81);
  return {
    approach,
    merge,
    pairOpacity: between(p, 0.10, 0.21) * (1 - between(p, 0.66, 0.81)),
    // Both halves use the same image: their fingers stay registered at contact.
    separation: 11 * (1 - approach) - 0.7 * approach,
    fusionOpacity: between(p, 0.73, 0.88),
    repair: between(p, 0.68, 0.91),
    energy: between(p, 0.54, 0.66) * (1 - between(p, 0.83, 0.95)),
    chapter: p < 0.17 ? 0 : p < 0.34 ? 1 : p < 0.53 ? 2 : p < 0.68 ? 3 : p < 0.91 ? 4 : 5,
  };
}
