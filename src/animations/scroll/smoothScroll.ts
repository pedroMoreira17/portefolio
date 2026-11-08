import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let tickerFn: ((time: number) => void) | null = null;

/** Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function initSmoothScroll(reducedMotion: boolean) {
  destroySmoothScroll();
  if (reducedMotion) return null;
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.4,
  });
  lenis.on('scroll', ScrollTrigger.update);
  tickerFn = (time) => lenis?.raf(time * 1000);
  gsap.ticker.add(tickerFn);
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function destroySmoothScroll() {
  if (tickerFn) gsap.ticker.remove(tickerFn);
  lenis?.destroy();
  lenis = null;
  tickerFn = null;
}

export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.body.classList.toggle('is-intro', locked);
}

export function scrollToTarget(target: string | HTMLElement | number, immediate = false) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (lenis) {
    lenis.scrollTo(target, { duration: immediate ? 0 : 1.6, immediate, offset: 0 });
    return;
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (typeof el === 'number') window.scrollTo({ top: el, behavior: reduced ? 'auto' : 'smooth' });
  else (el as HTMLElement | null)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}
