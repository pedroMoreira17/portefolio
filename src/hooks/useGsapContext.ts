import { useLayoutEffect, type DependencyList, type RefObject } from 'react';
import { gsap } from 'gsap';

/**
 * Runs GSAP setup scoped to a root element and reverts everything (tweens,
 * ScrollTriggers, inline styles) on cleanup or when deps change.
 */
export function useGsapContext(
  root: RefObject<HTMLElement | null>,
  setup: (ctx: gsap.Context, root: HTMLElement) => void | (() => void),
  deps: DependencyList,
) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    let extraCleanup: void | (() => void);
    const ctx = gsap.context((self) => {
      extraCleanup = setup(self, el);
    }, el);
    return () => {
      extraCleanup?.();
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
