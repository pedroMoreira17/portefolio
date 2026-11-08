import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useI18n } from '../../hooks/useI18n';
import { createIntroTimeline } from '../../animations/hero/introTimeline';
import { scrollToTarget } from '../../animations/scroll/smoothScroll';
import './Hero.scss';

interface Props {
  reducedMotion: boolean;
  /** True once the particle portrait is sampled (or definitively unavailable). */
  particlesReady: boolean;
  particleCount: number | null;
  onIdentity: () => void;
  onIntroComplete: () => void;
}

const NAME = ['PEDRO', 'MOREIRA'];
/** Never keep the visitor waiting on a slow device: start the sequence anyway. */
const MAX_WAIT_MS = 2600;
/** Returning in the same session: same choreography, less waiting. */
const INTRO_SEEN_KEY = 'pm-intro-seen';
const REVISIT_SPEED = 1.7;

function introSeen() {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function Hero({ reducedMotion, particlesReady, particleCount, onIdentity, onIntroComplete }: Props) {
  const { t, lang } = useI18n();
  const rootRef = useRef<HTMLElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [introRunning, setIntroRunning] = useState(!reducedMotion);

  // Build the intro (hidden states are applied before first paint)
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      tlRef.current = createIntroTimeline({
        root,
        reducedMotion,
        onIdentity,
        onComplete: () => {
          setIntroRunning(false);
          try {
            sessionStorage.setItem(INTRO_SEEN_KEY, '1');
          } catch {
            /* storage unavailable */
          }
          onIntroComplete();
        },
      });
      if (introSeen()) tlRef.current.timeScale(REVISIT_SPEED);
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // Play when the portrait is ready, or after a grace period
  useEffect(() => {
    const tl = tlRef.current;
    if (!tl || reducedMotion) return;
    if (particlesReady) {
      tl.play();
      return;
    }
    const id = window.setTimeout(() => tl.play(), MAX_WAIT_MS);
    return () => window.clearTimeout(id);
  }, [particlesReady, reducedMotion]);

  // Any key, wheel, tap or click during the intro skips straight to the composed state
  useEffect(() => {
    if (!introRunning) return;
    const skipNow = () => tlRef.current?.progress(1);
    const onKey = (e: KeyboardEvent) => {
      if (['Tab', 'Shift'].includes(e.key)) return;
      skipNow();
    };
    const opts = { passive: true } as const;
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', skipNow, opts);
    window.addEventListener('touchstart', skipNow, opts);
    window.addEventListener('pointerdown', skipNow, opts);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', skipNow);
      window.removeEventListener('touchstart', skipNow);
      window.removeEventListener('pointerdown', skipNow);
    };
  }, [introRunning]);

  // Scroll-out: identity typography lifts away as the face disintegrates
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.6 },
      });
      tl.to('.hero__name', { yPercent: -28, letterSpacing: '0.04em', opacity: 0, ease: 'power1.in' }, 0)
        .to('.hero__sub', { y: -60, opacity: 0, ease: 'power1.in' }, 0)
        .to('.hero__hud, .hero__top', { opacity: 0, ease: 'none' }, 0);
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section id="hero" ref={rootRef} className="hero" aria-labelledby="hero-title">
      <div className="hero__portrait" role="img" aria-label={t.a11y.portrait} />

      <div className="hero__top container">
        <span className="mono" data-hero-meta>{t.hero.index}</span>
        {introRunning && (
          <button className="hero__skip mono" type="button" onClick={() => tlRef.current?.progress(1)}>
            {t.a11y.skipIntro}
          </button>
        )}
      </div>

      <div className="hero__identity container">
        <h1 id="hero-title" className="hero__name" aria-label="Pedro Moreira">
          {NAME.map((word, w) => (
            <span className="hero__word" key={word} aria-hidden="true">
              {word.split('').map((ch, i) => (
                <span className="hero__char-mask" key={i}>
                  <span
                    className="hero__char"
                    data-hero-char
                    style={{ '--i': w * 5 + i } as React.CSSProperties}
                  >
                    {ch}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </h1>

        <div className="hero__sub">
          <span className="hero__rule" data-hero-rule aria-hidden="true" />
          <div className="hero__line-mask">
            <p className="hero__role" data-hero-line>
              {t.hero.role}
            </p>
          </div>
          <div className="hero__line-mask">
            <p className="hero__tagline" data-hero-line>
              {t.hero.tagline}
            </p>
          </div>
        </div>
      </div>

      <div className="hero__hud container">
        <button
          type="button"
          className="hero__scroll mono"
          data-hero-meta
          onClick={() => scrollToTarget('#expertise')}
        >
          <span className="hero__scroll-line" aria-hidden="true" />
          {t.hero.scroll}
        </button>
        <p className="hero__count mono" data-hero-meta>
          {particleCount ? (
            <>
              <span className="hero__count-num">{particleCount.toLocaleString(lang === 'pt' ? 'pt-PT' : 'en-US')}</span>{' '}
              {t.hero.particles} — {t.hero.source}
            </>
          ) : (
            <>&nbsp;</>
          )}
        </p>
      </div>
    </section>
  );
}
