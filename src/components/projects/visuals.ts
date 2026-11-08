/**
 * Generative pixel compositions for each project. They are abstract artworks
 * in the site's particle language, not screenshots and not real data.
 */
export type VisualKind = 'holyvestor' | 'rhsuite' | 'easyshop';

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, accent: string) => void;

const WHITE = 'rgba(243,242,238,';

function px(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), s, s);
}

function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function dotGrid(ctx: CanvasRenderingContext2D, w: number, h: number, step: number) {
  for (let y = step; y < h; y += step) {
    for (let x = step; x < w; x += step) {
      px(ctx, x, y, 1, `${WHITE}0.08)`);
    }
  }
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
  ctx.font = `${size}px "JetBrains Mono Variable", monospace`;
  ctx.fillStyle = `${WHITE}0.45)`;
  ctx.fillText(text, x, y);
}

// ---------------------------------------------------------------------------
const holyvestor: Draw = (ctx, w, h, t, accent) => {
  const cell = Math.max(3, Math.round(w / 260));
  dotGrid(ctx, w, h, cell * 8);
  const left = w * 0.06, right = w * 0.94, top = h * 0.18, bottom = h * 0.82;
  const n = Math.floor((right - left) / cell);

  const series = (i: number) => {
    const x = i / n;
    return (
      0.5 +
      0.18 * Math.sin(x * 5.2 + 0.6) +
      0.09 * Math.sin(x * 13.7 + 1.3) +
      0.05 * Math.sin(x * 29 + t * 0.4) +
      0.22 * (x - 0.5)
    );
  };

  // volume-like columns
  for (let i = 0; i < n; i += 6) {
    const v = 0.15 + hash(i) * 0.35;
    const colH = v * (bottom - top) * 0.35;
    for (let y = bottom; y > bottom - colH; y -= cell + 1) px(ctx, left + i * cell, y, cell, `${WHITE}0.1)`);
  }

  const reveal = (t * 0.12) % 1.25;
  const cursor = Math.min(1, reveal) * n;
  for (let i = 0; i < n; i++) {
    if (i > cursor) break;
    const v = series(i);
    const x = left + i * cell;
    const y = bottom - v * (bottom - top);
    // dithered area under the curve
    for (let yy = y + cell * 2; yy < bottom; yy += cell * 2) {
      const density = 1 - (yy - y) / (bottom - y);
      if (hash(i * 31.7 + yy) < density * 0.32) px(ctx, x, yy, cell - 1, `${WHITE}${0.06 + density * 0.18})`);
    }
    px(ctx, x, y, cell, i > cursor - 4 ? accent : `${WHITE}0.92)`);
  }

  // scanning cursor
  const cx = left + cursor * cell;
  if (reveal < 1) {
    for (let y = top; y < bottom; y += cell * 2) px(ctx, cx, y, 1, `${WHITE}0.3)`);
    const cy = bottom - series(Math.floor(cursor)) * (bottom - top);
    ctx.strokeStyle = accent;
    ctx.strokeRect(cx - cell * 2, cy - cell * 2, cell * 5, cell * 5);
  }

  const fs = Math.max(10, Math.round(w / 95));
  label(ctx, 'HOLYVESTOR / INVESTMENT INTELLIGENCE', left, h * 0.1, fs);
  label(ctx, 'STOCKS · ETF · PORTFOLIO · NEWS', left, h * 0.93, fs);
};

// ---------------------------------------------------------------------------
const rhsuite: Draw = (ctx, w, h, t, accent) => {
  const cell = Math.max(3, Math.round(w / 300));
  dotGrid(ctx, w, h, cell * 8);
  const stages = 4;
  const y0 = h * 0.5;
  const x0 = w * 0.1, x1 = w * 0.62;

  // pipeline rail + stage nodes
  for (let x = x0; x < x1; x += cell * 2) px(ctx, x, y0, cell - 1, `${WHITE}0.18)`);
  for (let s = 0; s < stages; s++) {
    const sx = x0 + ((x1 - x0) * s) / (stages - 1);
    ctx.strokeStyle = `${WHITE}0.5)`;
    ctx.strokeRect(sx - cell * 3, y0 - cell * 3 + cell / 2, cell * 6, cell * 6);
  }

  // documents travelling along the pipeline
  const pageW = w * 0.07, pageH = pageW * 1.35;
  for (let d = 0; d < 3; d++) {
    const p = ((t * 0.07 + d / 3) % 1);
    const x = x0 + (x1 - x0) * p - pageW / 2;
    const y = y0 - pageH - h * 0.08 + Math.sin(p * Math.PI) * -h * 0.04;
    const alpha = Math.sin(p * Math.PI);
    ctx.strokeStyle = `${WHITE}${0.55 * alpha})`;
    ctx.strokeRect(Math.round(x), Math.round(y), pageW, pageH);
    for (let l = 0; l < 9; l++) {
      const lw = (0.45 + hash(d * 10 + l) * 0.45) * (pageW - cell * 4);
      for (let lx = 0; lx < lw; lx += cell) px(ctx, x + cell * 2 + lx, y + cell * 3 + l * cell * 2.4, cell - 1, `${WHITE}${0.35 * alpha})`);
    }
    // signature once past the third stage
    if (p > 0.66) {
      for (let s = 0; s < 10; s++) {
        px(ctx, x + cell * 2 + s * cell, y + pageH - cell * 4 + Math.sin(s * 1.3) * cell, cell - 1, accent);
      }
    }
  }

  // face-detection frame on a pixel silhouette
  const fx = w * 0.8, fy = h * 0.46, r = Math.min(w, h) * 0.13;
  for (let y = -r * 1.3; y < r * 2.2; y += cell + 1) {
    for (let x = -r * 1.8; x < r * 1.8; x += cell + 1) {
      const head = (x * x) / (r * r * 0.62) + ((y + r * 0.1) * (y + r * 0.1)) / (r * r) < 1;
      const shoulders = y > r * 1.05 && Math.abs(x) < r * 1.7 - (y - r) * 0.3 && y < r * 2.2;
      if ((head || shoulders) && hash(x * 3.1 + y * 7.7) < 0.55) {
        px(ctx, fx + x, fy + y, cell - 1, `${WHITE}${0.2 + hash(x + y) * 0.35})`);
      }
    }
  }
  const scan = ((t * 0.35) % 1) * r * 2.4 - r * 1.2;
  for (let x = -r * 0.95; x < r * 0.95; x += cell) px(ctx, fx + x, fy + scan, cell - 1, accent);
  const b = r * 1.15, bl = r * 0.3;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, cell / 2);
  ctx.beginPath();
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
    const cx = fx + sx * b * 0.85, cy = fy + sy * b;
    ctx.moveTo(cx, cy + -sy * bl);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + -sx * bl, cy);
  });
  ctx.stroke();
  ctx.lineWidth = 1;

  const fs = Math.max(10, Math.round(w / 95));
  label(ctx, 'ONBOARDING / DOCUMENT FLOW', x0, h * 0.1, fs);
  label(ctx, 'FACE DETECTION · PDF · SIGNATURE', x0, h * 0.93, fs);
};

// ---------------------------------------------------------------------------
const easyshop: Draw = (ctx, w, h, t, accent) => {
  const cell = Math.max(3, Math.round(w / 260));
  dotGrid(ctx, w, h, cell * 8);
  const s = Math.min(w, h * 1.6) / 100;
  const ox = w * 0.14, oy = h * 0.22;

  // cart silhouette made of pixels
  const plot = (x: number, y: number, a = 0.8) => px(ctx, ox + x * s, oy + y * s, cell, `${WHITE}${a})`);
  for (let x = 0; x <= 8; x += 0.9) plot(x, 4);
  for (let i = 0; i <= 34; i += 0.9) plot(8 + i * 0.12, 4 + i);
  for (let x = 12; x <= 44; x += 0.9) plot(x, 12);
  for (let x = 13; x <= 41; x += 0.9) plot(x, 31);
  for (let y = 12; y <= 31; y += 0.9) {
    plot(44 - (y - 12) * 0.16, y);
  }
  for (let gx = 17; gx < 42; gx += 4.5) for (let y = 13; y < 31; y += 2.2) plot(gx - (y - 12) * 0.08, y, 0.25);
  for (let x = 13; x <= 40; x += 0.9) plot(x, 37, 0.6);
  [16, 37].forEach((wx) => {
    for (let a = 0; a < Math.PI * 2; a += 0.45) plot(wx + Math.cos(a) * 2.2, 41 + Math.sin(a) * 2.2, 0.9);
  });

  // hardware module
  const mx = ox + 30 * s, my = oy + 6 * s;
  ctx.fillStyle = accent;
  ctx.fillRect(Math.round(mx), Math.round(my), cell * 4, cell * 3);

  // signal arcs towards the phone
  for (let k = 0; k < 4; k++) {
    const phase = ((t * 0.5 + k / 4) % 1);
    const rad = phase * w * 0.3;
    const alpha = (1 - phase) * 0.8;
    for (let a = -0.5; a <= 0.5; a += 0.06) {
      px(ctx, mx + Math.cos(a) * rad, my + Math.sin(a) * rad, cell - 1, `rgba(90,134,255,${alpha})`);
    }
  }

  // phone
  const pw = w * 0.13, ph = pw * 2, phx = w * 0.74, phy = h * 0.5 - ph / 2;
  ctx.strokeStyle = `${WHITE}0.7)`;
  ctx.strokeRect(Math.round(phx), Math.round(phy), pw, ph);
  for (let i = 0; i < 7; i++) {
    const active = Math.floor((t * 0.8) % 7) === i;
    const rowY = phy + ph * 0.14 + i * ph * 0.1;
    px(ctx, phx + cell * 3, rowY, cell * 2, active ? accent : `${WHITE}0.5)`);
    const lw = (0.35 + hash(i) * 0.35) * pw;
    for (let x = 0; x < lw; x += cell) px(ctx, phx + cell * 7 + x, rowY, cell - 1, `${WHITE}${active ? 0.8 : 0.3})`);
  }

  const fs = Math.max(10, Math.round(w / 95));
  label(ctx, 'EASYSHOP / SMART CART', w * 0.06, h * 0.1, fs);
  label(ctx, 'HARDWARE MODULE · MOBILE APP', w * 0.06, h * 0.93, fs);
};

export const visuals: Record<VisualKind, Draw> = { holyvestor, rhsuite, easyshop };
