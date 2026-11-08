import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
  /** The name gets its full metal treatment (SVG lighting) once it has landed. */
  const [forged, setForged] = useState(reducedMotion);

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
          setForged(true);
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

  // Live metal: the key light follows the cursor (or drifts on its own on touch screens)
  useEffect(() => {
    const root = rootRef.current;
    if (!forged || !root) return;
    const name = root.querySelector<HTMLElement>('.hero__name');
    const key = root.querySelector<SVGFEPointLightElement>('#hero-metal-key');
    const rim = root.querySelector<SVGFEPointLightElement>('#hero-metal-rim');
    const bump = root.querySelector<SVGFEGaussianBlurElement>('#hero-metal-bump');
    if (!name || !key || !rim || !bump) return;

    const light = { x: 0, y: 0 };
    let w = 1;
    let h = 1;
    const apply = () => {
      key.setAttribute('x', light.x.toFixed(1));
      key.setAttribute('y', light.y.toFixed(1));
    };
    const measure = () => {
      w = name.offsetWidth;
      h = name.offsetHeight;
      const fs = parseFloat(getComputedStyle(name).fontSize) || 100;
      // bevel width scales with the type so it reads the same on every screen
      bump.setAttribute('stdDeviation', Math.max(1.2, fs * 0.022).toFixed(2));
      key.setAttribute('z', (w * 0.42).toFixed(0));
      rim.setAttribute('x', (w * 0.85).toFixed(0));
      rim.setAttribute('y', (h * 1.7).toFixed(0));
      rim.setAttribute('z', (h * 0.5).toFixed(0));
    };
    measure();
    light.x = w * 0.22;
    light.y = -h * 0.45;
    apply();
    window.addEventListener('resize', measure);

    if (reducedMotion) {
      return () => window.removeEventListener('resize', measure);
    }

    const fine = window.matchMedia('(pointer: fine)').matches;
    let cleanupMotion: () => void;

    if (fine) {
      const toX = gsap.quickTo(light, 'x', { duration: 0.9, ease: 'power3', onUpdate: apply });
      const toY = gsap.quickTo(light, 'y', { duration: 0.9, ease: 'power3', onUpdate: apply });
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse' || window.scrollY > window.innerHeight) return;
        const r = name.getBoundingClientRect();
        toX(gsap.utils.clamp(-w * 0.2, w * 1.2, e.clientX - r.left));
        // keep the light above the surface so the bevels catch it from the top
        toY(gsap.utils.clamp(-h * 1.2, h * 0.6, e.clientY - r.top - h * 0.35));
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      cleanupMotion = () => window.removeEventListener('pointermove', onMove);
    } else {
      const drift = gsap.fromTo(
        light,
        { x: -w * 0.1 },
        { x: w * 1.1, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1, onUpdate: apply },
      );
      const st = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom top',
        onToggle: (self) => (self.isActive ? drift.resume() : drift.pause()),
      });
      cleanupMotion = () => {
        drift.kill();
        st.kill();
      };
    }

    return () => {
      window.removeEventListener('resize', measure);
      cleanupMotion();
    };
  }, [forged, reducedMotion]);

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
      {/*
        Metal shader for the name, built from the glyph shapes themselves:
        blurred alpha → height map → specular lighting (cool key light + hot rim light from below),
        plus horizontal brushed grain blended into the chrome gradient.
      */}
      <svg className="hero__defs" aria-hidden="true" focusable="false">
        <filter id="hero-metal" x="-5%" y="-10%" width="110%" height="120%" colorInterpolationFilters="sRGB">
          <feGaussianBlur id="hero-metal-bump" in="SourceAlpha" stdDeviation="3" result="bump" />

          <feSpecularLighting
            in="bump"
            surfaceScale="5"
            specularConstant="1.15"
            specularExponent="26"
            lightingColor="#fff6ee"
            result="keySpec"
          >
            <fePointLight id="hero-metal-key" x="200" y="-200" z="500" />
          </feSpecularLighting>
          <feComposite in="keySpec" in2="SourceAlpha" operator="in" result="key" />

          <feSpecularLighting
            in="bump"
            surfaceScale="5"
            specularConstant="0.7"
            specularExponent="16"
            lightingColor="#ff5a1f"
            result="rimSpec"
          >
            <fePointLight id="hero-metal-rim" x="900" y="600" z="150" />
          </feSpecularLighting>
          <feComposite in="rimSpec" in2="SourceAlpha" operator="in" result="rim" />

          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.75" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0.2 0.2 0.2 0 0.2  0.2 0.2 0.2 0 0.2  0.2 0.2 0.2 0 0.2  0 0 0 0 1"
            result="grainGray"
          />
          <feComposite in="grainGray" in2="SourceAlpha" operator="in" result="grain" />
          <feBlend in="grain" in2="SourceGraphic" mode="soft-light" result="brushed" />

          <feComposite in="key" in2="brushed" operator="arithmetic" k2="0.85" k3="1" result="lit" />
          <feComposite in="rim" in2="lit" operator="arithmetic" k2="0.6" k3="1" />
        </filter>
      </svg>

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
        <h1 id="hero-title" className={`hero__name${forged ? ' is-forged' : ''}`} aria-label="Pedro Moreira">
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
