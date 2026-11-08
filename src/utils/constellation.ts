export interface ConstellationNode {
  x: number; // 0..100 (% of box width)
  y: number; // 0..100 (% of box height)
  weight: number; // 0..1, used for typographic scale
}

export interface ConstellationLayout {
  nodes: ConstellationNode[];
  edges: [number, number][];
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Deterministic constellation layout: jittered grid placement (keeps labels from
 * colliding) + nearest-neighbour edges (reads as a star chart).
 */
export function layoutConstellation(count: number, seed: number): ConstellationLayout {
  const rand = seeded(seed * 7919 + 17);
  const cols = count > 9 ? 4 : 3;
  const rows = Math.ceil(count / cols);
  const cells: [number, number][] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([c, r]);
  // shuffle cells so primary skills don't always sit top-left
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const nodes: ConstellationNode[] = [];
  for (let i = 0; i < count; i++) {
    const [c, r] = cells[i];
    const stagger = r % 2 ? 0.5 / cols : 0;
    const x = ((c + 0.22 + rand() * 0.42) / cols + stagger * 0.6) * 100;
    const y = ((r + 0.2 + rand() * 0.55) / rows) * 100;
    nodes.push({ x: Math.min(88, Math.max(2, x)), y: Math.min(94, Math.max(4, y)), weight: i < 3 ? 1 : i < 6 ? 0.55 : 0.2 });
  }

  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  nodes.forEach((n, i) => {
    const nearest = nodes
      .map((m, j) => ({ j, d: (m.x - n.x) ** 2 + ((m.y - n.y) * 0.6) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, i % 3 === 0 ? 2 : 1);
    nearest.forEach(({ j }) => {
      const k = key(i, j);
      if (!seen.has(k)) {
        seen.add(k);
        edges.push([i, j]);
      }
    });
  });

  return { nodes, edges };
}
