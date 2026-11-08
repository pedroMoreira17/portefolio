import { memo } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { Project } from '../../data/projects/projects';
import { SplitWords } from '../typography/SplitWords';
import { ProjectVisual } from './ProjectVisual';

interface Props {
  project: Project;
  total: number;
  reducedMotion: boolean;
}

/**
 * Editorial project block: oversized numeral + name, meta rail, then the visual
 * side by side with the essentials, and a compact architecture index below.
 */
function ProjectShowcaseBase({ project, total, reducedMotion }: Props) {
  const { t, l } = useI18n();
  const accent = `var(--c-${project.accent})`;

  return (
    <article
      className={`project project--${project.id}`}
      style={{ '--accent': accent } as React.CSSProperties}
      aria-labelledby={`project-${project.id}`}
    >
      <header className="project__head">
        <div className="project__number" aria-hidden="true">
          <span>{project.number}</span>
        </div>
        <div className="project__titles">
          <p className="project__count mono" data-reveal>
            {project.number} / {String(total).padStart(2, '0')} — {l(project.context)}
          </p>
          <h3 id={`project-${project.id}`} className="project__name serif" data-split>
            <SplitWords text={project.name} />
          </h3>
        </div>
      </header>

      <dl className="project__meta mono" data-reveal>
        <div>
          <dt>{t.projects.year}</dt>
          <dd>{project.year ?? <span className="placeholder">{t.projects.pending}</span>}</dd>
        </div>
        <div>
          <dt>{t.projects.role}</dt>
          <dd>{project.role ? l(project.role) : <span className="placeholder">{t.projects.pending}</span>}</dd>
        </div>
        <div className="project__meta-wide">
          <dt>{t.projects.context}</dt>
          <dd>{l(project.category)}</dd>
        </div>
      </dl>

      <div className="project__main">
        <figure className={`project__visual ${project.screenshot ? 'project__visual--shot' : ''}`}>
          <div className="project__visual-inner">
            {project.screenshot ? (
              <img
                className="project__shot"
                src={project.screenshot.src}
                srcSet={project.screenshot.srcSet}
                sizes="(max-width: 1100px) 100vw, 55vw"
                alt={l(project.screenshot.alt)}
                loading="lazy"
                decoding="async"
                style={{ objectPosition: project.screenshot.focus }}
              />
            ) : (
              <ProjectVisual kind={project.visual} accent={accent} reducedMotion={reducedMotion} />
            )}
          </div>
        </figure>

        <div className="project__story">
          {l(project.description).map((p, i) => (
            <p key={i} className="project__lead" data-reveal>
              {p}
            </p>
          ))}
          <ol className="project__features" data-reveal aria-label={t.projects.features}>
            {l(project.features).map((f, i) => (
              <li key={f}>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                {f}
              </li>
            ))}
          </ol>
          {project.note && (
            <p className="project__note mono" data-reveal>
              {l(project.note)}
            </p>
          )}
        </div>
      </div>

      <div className="project__stack" data-reveal>
        <h4 className="mono">{t.projects.architecture}</h4>
        {project.stack.length ? (
          <dl>
            {project.stack.map((group) => (
              <div key={group.label.en} className="project__stack-group">
                <dt className="mono">{l(group.label)}</dt>
                <dd>
                  <ul>
                    {group.items.map((item) => {
                      const text = typeof item === 'string' ? item : l(item);
                      return <li key={text}>{text}</li>;
                    })}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="placeholder">{t.projects.stackPending}</p>
        )}
      </div>
    </article>
  );
}

export const ProjectShowcase = memo(ProjectShowcaseBase);
