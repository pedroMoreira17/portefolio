import { useRef } from 'react';
import { gsap } from 'gsap';
import { useI18n } from '../../hooks/useI18n';
import { useGsapContext } from '../../hooks/useGsapContext';
import { journey } from '../../data/experiences/experiences';
import { SplitWords } from '../../components/typography/SplitWords';
import { TimelineEntry } from '../../components/timeline/TimelineEntry';
import { revealFadeOnly, revealFadeUp, revealSplitHeadlines } from '../../animations/transitions/reveal';
import './Journey.scss';

interface Props {
  reducedMotion: boolean;
}

export function Journey({ reducedMotion }: Props) {
  const { t, lang } = useI18n();
  const rootRef = useRef<HTMLElement>(null);

  useGsapContext(
    rootRef,
    (_ctx, root) => {
      const timeline = root.querySelector<HTMLElement>('.timeline')!;

      if (reducedMotion) {
        // no travelling head: the axis is simply drawn, and every entry reads as active
        gsap.set('.timeline__fill', { scaleY: 1 });
        gsap.set('.timeline__head', { autoAlpha: 0 });
        gsap.utils.toArray<HTMLElement>('.entry', root).forEach((entry) => entry.classList.add('is-active'));
        revealFadeOnly(root, '[data-reveal], [data-split], .entry');
        return;
      }
      revealSplitHeadlines(root);
      revealFadeUp(root);
      // progress line + travelling head
      gsap.fromTo(
        '.timeline__fill',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: timeline, start: 'top 62%', end: 'bottom 62%', scrub: 0.4 },
        },
      );
      gsap.fromTo(
        '.timeline__head',
        { top: '0%' },
        {
          top: '100%',
          ease: 'none',
          scrollTrigger: { trigger: timeline, start: 'top 62%', end: 'bottom 62%', scrub: 0.4 },
        },
      );

      gsap.utils.toArray<HTMLElement>('.entry', root).forEach((entry) => {
        gsap.timeline({
          scrollTrigger: {
            trigger: entry,
            start: 'top 62%',
            end: 'bottom 62%',
            toggleClass: { targets: entry, className: 'is-active' },
          },
        });
        gsap.from(entry.querySelectorAll('.entry__marker-char'), {
          yPercent: 105,
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.05,
          scrollTrigger: { trigger: entry, start: 'top 78%', toggleActions: 'play none none reverse' },
        });
        const techItems = entry.querySelectorAll('.entry__tech li');
        if (!techItems.length) return;
        gsap.from(techItems, {
          opacity: 0,
          x: -8,
          duration: 0.6,
          stagger: 0.03,
          ease: 'power2.out',
          scrollTrigger: { trigger: entry.querySelector('.entry__tech'), start: 'top 90%', toggleActions: 'play none none reverse' },
        });
      });
    },
    [reducedMotion, lang],
  );

  return (
    <section id="journey" ref={rootRef} className="journey" aria-labelledby="journey-title">
      <header className="journey__head container">
        <p className="mono section-label" data-reveal>
          03 — {t.journey.label}
        </p>
        <h2 id="journey-title" className="journey__title serif" data-split>
          <SplitWords text={t.journey.titleA} />{' '}
          <em>
            <SplitWords text={t.journey.titleB} />
          </em>
        </h2>
      </header>

      <div className="timeline container">
        <div className="timeline__axis" aria-hidden="true">
          <span className="timeline__fill" />
          <span className="timeline__head" />
        </div>
        <ol className="timeline__list">
          {journey.map((entry, i) => (
            <TimelineEntry key={entry.id} entry={entry} side={i % 2 === 0 ? 'left' : 'right'} />
          ))}
        </ol>
      </div>
    </section>
  );
}
