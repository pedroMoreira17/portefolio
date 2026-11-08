import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useI18n } from '../../hooks/useI18n';
import { useGsapContext } from '../../hooks/useGsapContext';
import { skillDomains } from '../../data/skills/skills';
import { SplitWords } from '../../components/typography/SplitWords';
import { SkillConstellation } from '../../components/constellation/SkillConstellation';
import { revealFadeUp, revealSplitHeadlines } from '../../animations/transitions/reveal';
import { sceneState } from '../../components/particle-engine/sceneState';
import './Expertise.scss';

const ACCENTS = ['var(--c-cyan)', 'var(--c-violet)', 'var(--c-blue)', 'var(--c-green)', 'var(--c-cyan)', 'var(--c-violet)'];

interface Props {
  reducedMotion: boolean;
}

export function Expertise({ reducedMotion }: Props) {
  const { t, l, lang } = useI18n();
  const rootRef = useRef<HTMLElement>(null);
  const totalTech = new Set(skillDomains.flatMap((d) => d.items)).size;

  useGsapContext(
    rootRef,
    (_ctx, root) => {
      if (reducedMotion) return;
      revealSplitHeadlines(root);
      revealFadeUp(root, '.expertise__intro [data-reveal]');

      const mm = gsap.matchMedia();
      // Desktop: pinned horizontal traverse through the six domains
      mm.add('(min-width: 1100px)', () => {
        const pin = root.querySelector<HTMLElement>('.expertise__pin')!;
        const track = root.querySelector<HTMLElement>('.expertise__track')!;
        const bar = root.querySelector<HTMLElement>('.expertise__bar-fill')!;
        const ticks = gsap.utils.toArray<HTMLElement>('.expertise__tick', root);
        const distance = () => track.scrollWidth - window.innerWidth;

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            // the pin adds scroll distance: it must be measured before any trigger below it,
            // even when it is recreated later (e.g. after a language switch)
            refreshPriority: 10,
            onUpdate: (self) => {
              sceneState.expertiseTrack = self.progress;
              gsap.set(bar, { scaleX: self.progress });
              const active = Math.min(ticks.length - 1, Math.round(self.progress * (ticks.length - 1)));
              ticks.forEach((tk, i) => tk.classList.toggle('is-active', i === active));
            },
          },
        });

        gsap.utils.toArray<HTMLElement>('.domain', root).forEach((panel) => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: panel,
              containerAnimation: tween,
              start: 'left 78%',
              toggleActions: 'play none none reverse',
            },
          });
          tl.from(panel.querySelectorAll('.domain__index, .domain__meta'), { opacity: 0, y: 20, duration: 0.8, stagger: 0.08, ease: 'power3.out' })
            .from(panel.querySelectorAll('.domain__title .split-word > span'), { yPercent: 110, duration: 1.1, stagger: 0.06, ease: 'expo.out' }, 0.05)
            .from(panel.querySelectorAll('.constellation__lines line'), { opacity: 0, duration: 1.2, stagger: 0.02, ease: 'power2.out' }, 0.3)
            .from(panel.querySelectorAll('.node'), { opacity: 0, scale: 0.85, duration: 0.9, stagger: 0.035, ease: 'power3.out' }, 0.25);
        });
      });

      // Narrow screens: vertical flow, particles drift with progress
      mm.add('(max-width: 1099px)', () => {
        ScrollTrigger.create({
          trigger: root.querySelector('.expertise__track'),
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            sceneState.expertiseTrack = self.progress;
          },
        });
        gsap.utils.toArray<HTMLElement>('.domain', root).forEach((panel) => {
          gsap.from(panel.querySelectorAll('.domain__head > *, .node'), {
            opacity: 0,
            y: 24,
            duration: 0.9,
            stagger: 0.04,
            ease: 'power3.out',
            scrollTrigger: { trigger: panel, start: 'top 82%', toggleActions: 'play none none reverse' },
          });
        });
      });

      return () => mm.revert();
    },
    [reducedMotion, lang],
  );

  return (
    <section id="expertise" ref={rootRef} className="expertise" aria-labelledby="expertise-title">
      <div className="expertise__intro container">
        <p className="mono section-label" data-reveal>
          02 — {t.expertise.label}
        </p>
        <h2 id="expertise-title" className="expertise__title serif" data-split>
          <SplitWords text={t.expertise.titleA} />{' '}
          <em>
            <SplitWords text={t.expertise.titleB} />
          </em>
        </h2>
        <div className="expertise__intro-foot">
          <p className="expertise__lead" data-reveal>
            {t.expertise.lead}
          </p>
          <dl className="expertise__stats mono" data-reveal>
            <div>
              <dt>{t.expertise.domains}</dt>
              <dd>{String(skillDomains.length).padStart(2, '0')}</dd>
            </div>
            <div>
              <dt>{t.expertise.technologies}</dt>
              <dd>{totalTech}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="expertise__pin">
        <div className="expertise__track">
          {skillDomains.map((domain, i) => (
            <article
              key={domain.id}
              className="domain"
              style={{ '--accent': ACCENTS[i] } as React.CSSProperties}
              aria-labelledby={`domain-${domain.id}`}
            >
              <header className="domain__head">
                <div className="domain__row mono">
                  <span className="domain__index">
                    {domain.index} <span className="domain__of">/ {String(skillDomains.length).padStart(2, '0')}</span>
                  </span>
                  <span className="domain__meta">
                    {l(domain.meta)} · {domain.items.length} {t.expertise.technologies}
                  </span>
                </div>
                <h3 id={`domain-${domain.id}`} className="domain__title serif">
                  <SplitWords text={l(domain.title)} />
                </h3>
              </header>
              <div className="domain__chart">
                <SkillConstellation items={domain.items} seed={i + 3} label={l(domain.title)} />
              </div>
            </article>
          ))}
        </div>

        <div className="expertise__progress container" aria-hidden="true">
          <span className="mono">{t.expertise.drag}</span>
          <div className="expertise__bar">
            <span className="expertise__bar-fill" />
          </div>
          <ol className="expertise__ticks mono">
            {skillDomains.map((d, i) => (
              <li key={d.id} className={`expertise__tick ${i === 0 ? 'is-active' : ''}`}>
                {d.index}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
