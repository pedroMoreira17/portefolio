import { useRef } from 'react';
import { gsap } from 'gsap';
import { useI18n } from '../../hooks/useI18n';
import { useGsapContext } from '../../hooks/useGsapContext';
import { projects } from '../../data/projects/projects';
import { SplitWords } from '../../components/typography/SplitWords';
import { ProjectShowcase } from '../../components/projects/ProjectShowcase';
import { revealFadeOnly, revealFadeUp, revealSplitHeadlines } from '../../animations/transitions/reveal';
import './Projects.scss';

interface Props {
  reducedMotion: boolean;
}

export function Projects({ reducedMotion }: Props) {
  const { t, lang } = useI18n();
  const rootRef = useRef<HTMLElement>(null);

  useGsapContext(
    rootRef,
    (_ctx, root) => {
      if (reducedMotion) {
        revealFadeOnly(root, '[data-reveal], [data-split], .project__visual');
        return;
      }
      revealSplitHeadlines(root);
      revealFadeUp(root);

      gsap.utils.toArray<HTMLElement>('.project', root).forEach((project) => {
        const visual = project.querySelector<HTMLElement>('.project__visual')!;
        const inner = project.querySelector<HTMLElement>('.project__visual-inner')!;
        const number = project.querySelector<HTMLElement>('.project__number span')!;

        // masked reveal: the frame opens from a narrow slit to full bleed
        gsap.fromTo(
          visual,
          { clipPath: 'inset(16% 14% 16% 14%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            ease: 'none',
            scrollTrigger: { trigger: visual, start: 'top 98%', end: 'center 72%', scrub: 0.5 },
          },
        );
        gsap.fromTo(
          inner,
          { scale: 1.25 },
          { scale: 1, ease: 'none', scrollTrigger: { trigger: visual, start: 'top bottom', end: 'bottom top', scrub: 0.5 } },
        );
        // oversized numeral drifts against the scroll
        gsap.fromTo(
          number,
          { yPercent: 30 },
          { yPercent: -30, ease: 'none', scrollTrigger: { trigger: project, start: 'top bottom', end: 'bottom top', scrub: true } },
        );
      });
    },
    [reducedMotion, lang],
  );

  return (
    <section id="projects" ref={rootRef} className="projects" aria-labelledby="projects-title">
      <header className="projects__head container">
        <p className="mono section-label" data-reveal>
          04 — {t.projects.label}
        </p>
        <h2 id="projects-title" className="projects__title serif" data-split>
          <SplitWords text={t.projects.titleA} />{' '}
          <em>
            <SplitWords text={t.projects.titleB} />
          </em>
        </h2>
      </header>

      <div className="projects__list container">
        {projects.map((p) => (
          <ProjectShowcase key={p.id} project={p} total={projects.length} reducedMotion={reducedMotion} />
        ))}
      </div>
    </section>
  );
}
