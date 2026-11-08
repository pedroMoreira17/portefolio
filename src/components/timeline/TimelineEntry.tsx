import { memo } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { JourneyEntry } from '../../data/experiences/experiences';

interface Props {
  entry: JourneyEntry;
  side: 'left' | 'right';
}

function TimelineEntryBase({ entry, side }: Props) {
  const { t, l } = useI18n();
  const marker = entry.current ? t.journey.now : entry.marker;
  return (
    <li
      className={`entry entry--${side} entry--${entry.kind}${entry.current ? ' entry--current' : ''}`}
      style={{ '--accent': `var(--c-${entry.accent})` } as React.CSSProperties}
    >
      <div className="entry__marker" aria-hidden="true">
        <span className="entry__marker-mask">
          {marker.split('').map((ch, i) => (
            <span key={i} className="entry__marker-char">
              {ch}
            </span>
          ))}
        </span>
      </div>

      <span className="entry__node" aria-hidden="true" />

      <article className="entry__body">
        <div className="entry__meta mono" data-reveal>
          <span className="entry__kind">{entry.kind === 'education' ? t.journey.education : t.journey.work}</span>
          {entry.period ? (
            <time>{l(entry.period)}</time>
          ) : (
            <span className="placeholder">{t.journey.datesPending}</span>
          )}
        </div>
        <p className="entry__org" data-reveal>
          {entry.organization}
        </p>
        <h3 className="entry__role serif" data-reveal>
          {l(entry.role)}
        </h3>
        <p className="entry__desc" data-reveal>
          {l(entry.description)}
        </p>

        <div className="entry__focus" data-reveal>
          <span className="mono">{l(entry.focusLabel)}</span>
          <ul>
            {l(entry.focus).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        {entry.tech.length > 0 && (
          <div className="entry__stack">
            <span className="mono">{t.journey.stack}</span>
            <ul className="entry__tech mono">
              {entry.tech.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </li>
  );
}

export const TimelineEntry = memo(TimelineEntryBase);
