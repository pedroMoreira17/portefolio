import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Masked word-by-word headline reveals for every `[data-split]` inside root. */
export function revealSplitHeadlines(root: HTMLElement, start = 'top 82%') {
  root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const words = el.querySelectorAll('.split-word > span');
    gsap.from(words, {
      yPercent: 112,
      rotate: 2,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: el, start, toggleActions: 'play none none reverse' },
    });
  });
}

/** Staggered fade-up for `[data-reveal]` elements, batched by scroll position. */
export function revealFadeUp(root: HTMLElement, selector = '[data-reveal]') {
  const items = gsap.utils.toArray<HTMLElement>(selector, root);
  if (!items.length) return;
  gsap.set(items, { opacity: 0, y: 34 });
  ScrollTrigger.batch(items, {
    start: 'top 88%',
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08, overwrite: true }),
    onLeaveBack: (batch) =>
      gsap.to(batch, { opacity: 0, y: 34, duration: 0.5, ease: 'power2.in', overwrite: true }),
  });
}

/** Thin rules that draw themselves in. */
export function revealRules(root: HTMLElement, selector = '[data-rule]') {
  gsap.utils.toArray<HTMLElement>(selector, root).forEach((el) => {
    gsap.from(el, {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1.4,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
    });
  });
}
