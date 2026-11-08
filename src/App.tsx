import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { I18nProvider } from './i18n/I18nProvider';
import { useI18n } from './hooks/useI18n';
import { useReducedMotion } from './hooks/useMediaQuery';
import { ParticleStage } from './components/particle-engine/ParticleStage';
import { sceneState } from './components/particle-engine/sceneState';
import { Nav } from './components/navigation/Nav';
import { BackToTop } from './components/navigation/BackToTop';
import { Hero } from './sections/Hero/Hero';
import { Expertise } from './sections/Expertise/Expertise';
import { Journey } from './sections/Journey/Journey';
import { Projects } from './sections/Projects/Projects';
import { Contact } from './sections/Contact/Contact';
import { initSmoothScroll, destroySmoothScroll, lockScroll } from './animations/scroll/smoothScroll';
import { createSceneTriggers } from './animations/scroll/sceneTriggers';

function Experience() {
  const { t, lang } = useI18n();
  const reducedMotion = useReducedMotion();
  const [particles, setParticles] = useState<{ ready: boolean; count: number | null }>({ ready: false, count: null });
  const [navVisible, setNavVisible] = useState(false);

  // Smooth scroll + narrative triggers
  useLayoutEffect(() => {
    sceneState.reducedMotion = reducedMotion;
    window.scrollTo(0, 0);
    initSmoothScroll(reducedMotion);
    if (!reducedMotion) lockScroll(true);
    const killScene = createSceneTriggers();
    return () => {
      killScene();
      destroySmoothScroll();
      document.body.classList.remove('is-intro');
    };
  }, [reducedMotion]);

  // Layout settles after web fonts and language switches → re-measure triggers
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh());
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [lang]);

  const onParticlesReady = useCallback((info: { particles: number }) => {
    setParticles({ ready: true, count: info.particles });
  }, []);
  const onParticlesError = useCallback(() => setParticles({ ready: true, count: null }), []);
  const onIdentity = useCallback(() => lockScroll(false), []);
  const onIntroComplete = useCallback(() => setNavVisible(true), []);

  return (
    <>
      <a className="skip-link" href="#expertise">
        {t.a11y.skip}
      </a>
      <ParticleStage onReady={onParticlesReady} onError={onParticlesError} />
      <Nav visible={navVisible} />
      <main id="main">
        <Hero
          reducedMotion={reducedMotion}
          particlesReady={particles.ready}
          particleCount={particles.count}
          onIdentity={onIdentity}
          onIntroComplete={onIntroComplete}
        />
        <Expertise reducedMotion={reducedMotion} />
        <Journey reducedMotion={reducedMotion} />
        <Projects reducedMotion={reducedMotion} />
        <Contact reducedMotion={reducedMotion} />
      </main>
      <BackToTop enabled={navVisible} />
    </>
  );
}

export function App() {
  return (
    <I18nProvider>
      <Experience />
    </I18nProvider>
  );
}
