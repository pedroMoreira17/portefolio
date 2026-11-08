import { memo, useMemo, useState } from 'react';
import { layoutConstellation } from '../../utils/constellation';
import './SkillConstellation.scss';

interface Props {
  items: string[];
  seed: number;
  label: string;
}

/**
 * Typographic star chart. Desktop: absolutely positioned labels joined by hairlines.
 * Narrow screens: the same labels flow as a weighted typographic cluster (CSS only).
 */
function SkillConstellationBase({ items, seed, label }: Props) {
  const layout = useMemo(() => layoutConstellation(items.length, seed), [items.length, seed]);
  const [hovered, setHovered] = useState<number | null>(null);

  const linked = useMemo(() => {
    if (hovered === null) return new Set<number>();
    const s = new Set<number>([hovered]);
    layout.edges.forEach(([a, b]) => {
      if (a === hovered) s.add(b);
      if (b === hovered) s.add(a);
    });
    return s;
  }, [hovered, layout.edges]);

  return (
    <div className={`constellation ${hovered !== null ? 'has-focus' : ''}`}>
      <svg className="constellation__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {layout.edges.map(([a, b], i) => {
          const na = layout.nodes[a];
          const nb = layout.nodes[b];
          const active = hovered !== null && (a === hovered || b === hovered);
          return (
            <line
              key={i}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              className={active ? 'is-active' : undefined}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      <ul className="constellation__nodes" aria-label={label}>
        {items.map((item, i) => {
          const n = layout.nodes[i];
          const tier = n.weight > 0.9 ? 'xl' : n.weight > 0.5 ? 'md' : 'sm';
          return (
            <li
              key={item}
              className={`node node--${tier} ${linked.has(i) ? 'is-linked' : ''}`}
              style={{ '--x': `${n.x}%`, '--y': `${n.y}%`, '--d': `${(i % 5) * -1.3}s` } as React.CSSProperties}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="node__dot" aria-hidden="true" />
              <span className="node__label">{item}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export const SkillConstellation = memo(SkillConstellationBase);
