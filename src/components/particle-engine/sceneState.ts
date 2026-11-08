/**
 * Shared, mutable scene state. Written by GSAP (intro timeline + ScrollTriggers),
 * read by the particle engine every frame. Deliberately outside React so scroll
 * never triggers re-renders.
 */
export const sceneState = {
  /** Intro: 0 = nothing visible, 1 = every particle visible. */
  appear: 0,
  /** Intro: 0 = scattered start positions, 1 = portrait formed. */
  form: 0,

  /** Scroll progress of each narrative transition (0..1), set by ScrollTrigger. */
  heroToExpertise: 0,
  expertiseToJourney: 0,
  journeyToProjects: 0,
  projectsToContact: 0,
  /** Horizontal progress through the expertise domains (0..1). */
  expertiseTrack: 0,
  /** Progress through the journey section (0..1). */
  journeyProgress: 0,

  /** Static composition (reduced motion): skip time-based motion. */
  reducedMotion: false,
};

export type SceneState = typeof sceneState;

const smooth = (t: number) => t * t * (3 - 2 * t);
const bump = (t: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Skewed bump: slow erosion at first, peak late, then settle. */
const lateBump = (t: number) => bump(Math.pow(Math.min(1, Math.max(0, t)), 1.7));

/** Maps narrative progress into shader-level targets. */
export function deriveUniformTargets(s: SceneState) {
  const p1 = smooth(Math.pow(s.heroToExpertise, 1.25));
  const p2 = smooth(s.expertiseToJourney);
  const p3 = smooth(s.journeyToProjects);
  const p4 = smooth(s.projectsToContact);

  const wCloud = Math.max(0, p1 * (1 - p2) + p3 * (1 - p4));
  const wLine = Math.max(0, p2 * (1 - p3));

  let alpha = 1;
  alpha = mix(alpha, 0.8, p1);
  alpha = mix(alpha, 0.42, p2);
  alpha = mix(alpha, 0.14, p3);
  alpha = mix(alpha, 0.62, p4);

  const disperse =
    1.0 * lateBump(s.heroToExpertise) +
    0.45 * bump(s.expertiseToJourney) +
    0.45 * bump(s.journeyToProjects) +
    0.9 * bump(s.projectsToContact);

  return {
    wCloud,
    wLine,
    alpha,
    disperse,
    /** 0 = hero composition, 1 = contact composition. */
    contactMix: p4,
    cloudShift: s.expertiseTrack,
    lineFlow: s.journeyProgress,
  };
}
