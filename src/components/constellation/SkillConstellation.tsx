import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { layoutConstellation } from '../../utils/constellation';
import './SkillConstellation.scss';

interface Props {
  items: string[];
  seed: number;
  label: string;
}

/**
 * Typographic star chart. Desktop: absolutely positioned labels joined by hairlines,
 * each travelled by a small beam of light. Narrow screens: the same labels flow as a
 * weighted typographic cluster (CSS only). Colours come from the domain's `--accent`.
 */
function SkillConstellationBase({ items, seed, label }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layout = useMemo(() => layoutConstellation(items.length, seed), [items.length, seed]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [live, setLive] = useState(() => typeof IntersectionObserver === 'undefined');
  // Beams are drawn in real pixels: the dash pattern (pathLength) is unreliable on a stretched
  // viewBox combined with non-scaling strokes.
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Beams only run while the chart is on screen (the horizontal track keeps six of them mounted).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(([entry]) => {
          const { width, height } = entry.contentRect;
          setSize((s) => (Math.abs(s.w - width) < 1 && Math.abs(s.h - height) < 1 ? s : { w: width, h: height }));
        })
      : null;
    ro?.observe(el);
    if (typeof IntersectionObserver === 'undefined') return () => ro?.disconnect();
    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting), { rootMargin: '10% 0px' });
    io.observe(el);
    return () => {
      io.disconnect();
      ro?.disconnect();
    };
  }, []);

  const linked = useMemo(() => {
    if (hovered === null) return new Set<number>();
    const s = new Set<number>([hovered]);
    layout.edges.forEach(([a, b]) => {
      if (a === hovered) s.add(b);
      if (b === hovered) s.add(a);
    });
    return s;
  }, [hovered, layout.edges]);

  // Alternate the travel direction so the light doesn't all flow the same way.
  const segments = useMemo(
    () =>
      layout.edges.map(([a, b], i) => {
        const [from, to] = i % 2 ? [layout.nodes[b], layout.nodes[a]] : [layout.nodes[a], layout.nodes[b]];
        return { a, b, x1: from.x, y1: from.y, x2: to.x, y2: to.y };
      }),
    [layout],
  );

  return (
    <div ref={rootRef} className={`constellation ${hovered !== null ? 'has-focus' : ''} ${live ? 'is-live' : ''}`}>
      <svg className="constellation__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {segments.map(({ a, b, x1, y1, x2, y2 }, i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className={hovered !== null && (a === hovered || b === hovered) ? 'is-active' : undefined}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <svg className="constellation__beams" viewBox={`0 0 ${size.w || 1} ${size.h || 1}`} aria-hidden="true">
        {size.w > 0 &&
          segments.map(({ a, b, x1, y1, x2, y2 }, i) => {
            const style = {
              '--dur': `${(2.8 + (i % 5) * 0.55).toFixed(2)}s`,
              '--delay': `${(-i * 0.83).toFixed(2)}s`,
            } as React.CSSProperties;
            const active = hovered !== null && (a === hovered || b === hovered);
            const p = {
              x1: (x1 / 100) * size.w,
              y1: (y1 / 100) * size.h,
              x2: (x2 / 100) * size.w,
              y2: (y2 / 100) * size.h,
              pathLength: 100,
            };
            return (
              <g key={i} className={active ? 'beam is-active' : 'beam'} style={style}>
                <line className="beam__tail" {...p} />
                <line className="beam__head" {...p} />
              </g>
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
