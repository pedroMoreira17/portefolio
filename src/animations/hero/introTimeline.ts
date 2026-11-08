import { gsap } from 'gsap';
import { sceneState } from '../../components/particle-engine/sceneState';

interface IntroOptions {
  root: HTMLElement;
  reducedMotion: boolean;
  /** Fired when the identity typography lands: scrolling becomes available. */
  onIdentity: () => void;
  /** Fired at the very end: navigation appears. */
  onComplete: () => void;
}

/**
 * Cinematic entrance in four phases:
 *  1. Awakening — isolated pixels appear in the dark.
 *  2. Formation — thousands of particles converge into the portrait.
 *  3. Reveal    — the portrait settles; subtle life takes over (shader).
 *  4. Identity  — name, role and tagline are set in relation to the face.
 */
export function createIntroTimeline({ root, reducedMotion, onIdentity, onComplete }: IntroOptions) {
  const q = gsap.utils.selector(root);
  const chars = q('[data-hero-char]');
  const lines = q('[data-hero-line]');
  const metas = q('[data-hero-meta]');
  const rule = q('[data-hero-rule]');

  if (reducedMotion) {
    sceneState.appear = 1;
    sceneState.form = 1;
    gsap.set([...chars, ...lines, ...metas], { clearProps: 'all' });
    onIdentity();
    onComplete();
    return gsap.timeline();
  }

  sceneState.appear = 0;
  sceneState.form = 0;

  // hidden initial states, applied before first paint (called from a layout effect)
  gsap.set(chars, { yPercent: 118 });
  gsap.set(lines, { yPercent: 105, opacity: 0 });
  gsap.set(metas, { opacity: 0 });
  gsap.set(rule, { scaleX: 0, transformOrigin: 'left center' });

  const tl = gsap.timeline({ paused: true });

  // Phase 1 — Awakening
  tl.to(sceneState, { appear: 0.11, duration: 1.5, ease: 'power1.in' }, 0);
  // Phase 2 — Formation
  tl.to(sceneState, { appear: 1, duration: 2.5, ease: 'power2.inOut' }, 1.2);
  tl.to(sceneState, { form: 1, duration: 3.6, ease: 'power3.inOut' }, 0.9);

  // Phase 4 — Identity (overlaps the end of formation so it feels composed, not sequential)
  tl.addLabel('identity', 3.5);
  tl.to(chars, { yPercent: 0, duration: 1.5, ease: 'expo.out', stagger: 0.05 }, 'identity');  tl.to(rule, { scaleX: 1, duration: 1.4, ease: 'expo.inOut' }, 'identity+=0.5');
  tl.to(lines, { yPercent: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.12 }, 'identity+=0.7');
  tl.call(onIdentity, [], 'identity+=0.6');
  tl.to(metas, { opacity: 1, duration: 1.2, ease: 'power2.out', stagger: 0.1 }, 'identity+=1.2');
  tl.call(onComplete, [], 'identity+=1.7');

  return tl;
}
