import type { ParticleData, SamplerOptions } from './types';

/**
 * Converts a background-removed portrait (RGBA pixels) into particle buffers.
 *
 * Pure function with no DOM access, so it runs both inside the Web Worker and
 * on the main thread as a fallback.
 *
 * Distribution strategy
 *  - Luminance is normalised against the portrait's own histogram (robust contrast).
 *  - Particle density ∝ brightness^γ, plus a Sobel edge term so eyes, brows,
 *    lips and beard contours stay crisp.
 *  - A floor density inside the silhouette keeps dark hair / jacket faintly visible.
 *  - ~60 % of particles snap to a fine lattice, giving the "digital pixel" texture
 *    of the reference; the rest are free, which avoids a mechanical look.
 *  - Depth comes from an ellipsoidal head model + luminance relief.
 */

// Small, fast, seedable PRNG (mulberry32)
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r: () => number) {
  const u = Math.max(r(), 1e-7);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

const ACCENTS: [number, number, number][] = [
  [0.32, 0.56, 1.0], // blue
  [0.62, 0.46, 1.0], // violet
  [0.36, 0.92, 1.0], // cyan
  [0.42, 1.0, 0.64], // green
];

export function samplePortrait(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  opts: SamplerOptions,
): ParticleData {
  const r = rng(opts.seed);
  const N = width * height;

  // ---- 1. luminance + alpha -------------------------------------------------
  const lum = new Float32Array(N);
  const alpha = new Float32Array(N);
  const hist = new Uint32Array(256);
  let inside = 0;
  for (let i = 0; i < N; i++) {
    const o = i * 4;
    const a = pixels[o + 3] / 255;
    const l = (0.2126 * pixels[o] + 0.7152 * pixels[o + 1] + 0.0722 * pixels[o + 2]) / 255;
    lum[i] = l;
    alpha[i] = a;
    if (a > 0.5) {
      hist[Math.min(255, (l * 255) | 0)]++;
      inside++;
    }
  }
  // robust percentiles
  const pct = (p: number) => {
    const target = inside * p;
    let acc = 0;
    for (let b = 0; b < 256; b++) {
      acc += hist[b];
      if (acc >= target) return b / 255;
    }
    return 1;
  };
  const lo = pct(0.04);
  const hi = pct(0.985);
  const norm = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    norm[i] = Math.min(1, Math.max(0, (lum[i] - lo) / Math.max(0.05, hi - lo)));
  }

  // ---- 2. Sobel edges (on normalised luminance) ------------------------------
  const edge = new Float32Array(N);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const tl = norm[i - width - 1], t = norm[i - width], tr = norm[i - width + 1];
      const l = norm[i - 1], rr = norm[i + 1];
      const bl = norm[i + width - 1], b = norm[i + width], br = norm[i + width + 1];
      const gx = -tl - 2 * l - bl + tr + 2 * rr + br;
      const gy = -tl - 2 * t - tr + bl + 2 * b + br;
      edge[i] = Math.min(1, Math.sqrt(gx * gx + gy * gy) * 0.9);
    }
  }

  // ---- 3. density map → cumulative distribution ------------------------------
  const cdf = new Float64Array(N);
  let total = 0;
  for (let i = 0; i < N; i++) {
    const a = alpha[i];
    let d = 0;
    if (a > 0.04) {
      const y = (i / width) | 0;
      // fade the jacket / lower body so the face dominates
      const bodyFade = y > height * 0.7 ? Math.max(0.18, 1 - (y - height * 0.7) / (height * 0.3)) : 1;
      const v = norm[i];
      d = a * bodyFade * (0.035 + 0.965 * Math.pow(v, 2.1) + edge[i] * 0.7 * (0.25 + v));
    }
    total += d;
    cdf[i] = total;
  }

  const ambient = Math.round(opts.count * opts.ambientRatio);
  const portraitCount = opts.count - ambient;
  const count = opts.count;

  const face = new Float32Array(count * 3);
  const cloud = new Float32Array(count * 3);
  const line = new Float32Array(count * 3);
  const start = new Float32Array(count * 3);
  const color = new Float32Array(count * 3);
  const rand = new Float32Array(count * 4);

  const H = opts.worldHeight;
  const scale = H / height;
  const aspect = width / height;
  // head ellipsoid (in normalised image coordinates)
  const headCx = 0.52, headCy = 0.4, headRx = 0.36, headRy = 0.47;
  const lattice = 2; // source pixels per lattice cell

  const binarySearch = (target: number) => {
    let lo2 = 0, hi2 = N - 1;
    while (lo2 < hi2) {
      const mid = (lo2 + hi2) >> 1;
      if (cdf[mid] < target) lo2 = mid + 1;
      else hi2 = mid;
    }
    return lo2;
  };

  // order of writes is shuffled so any prefix (drawRange) is a uniform subset
  const order = new Uint32Array(count);
  for (let i = 0; i < count; i++) order[i] = i;
  for (let i = count - 1; i > 0; i--) {
    const j = (r() * (i + 1)) | 0;
    const t = order[i]; order[i] = order[j]; order[j] = t;
  }

  for (let n = 0; n < count; n++) {
    const k = order[n];
    const k3 = k * 3, k4 = k * 4;
    const isAmbient = n >= portraitCount;

    let fx: number, fy: number, fz: number;
    let cr: number, cg: number, cb: number;
    let size = 0.75 + r() * 0.6;
    let appear: number;

    if (!isAmbient) {
      const idx = binarySearch(r() * total);
      let px = idx % width;
      let py = (idx / width) | 0;
      let sx: number, sy: number;
      if (r() < 0.72) {
        // snapped to lattice → digital texture
        sx = Math.floor(px / lattice) * lattice + lattice * 0.5;
        sy = Math.floor(py / lattice) * lattice + lattice * 0.5;
      } else {
        sx = px + r();
        sy = py + r();
      }
      const v = norm[idx];
      const nx = sx / width, ny = sy / height;
      // depth: ellipsoidal head + luminance relief
      const dx = (nx - headCx) / headRx, dy = (ny - headCy) / headRy;
      const dd = dx * dx + dy * dy;
      const head = dd < 1 ? Math.sqrt(1 - dd) : 0;
      const body = ny > 0.62 ? -0.12 - (ny - 0.62) * 0.4 : 0;
      fx = (sx - width * 0.5) * scale;
      fy = -(sy - height * 0.5) * scale;
      fz = head * 0.1 * H + v * 0.022 * H + body * H * 0.12 + gauss(r) * 0.006 * H;

      // greyscale with a whisper of the original hue
      const o = idx * 4;
      const g = 0.2 + 0.8 * Math.pow(v, 1.15);
      const pr = pixels[o] / 255, pg = pixels[o + 1] / 255, pb = pixels[o + 2] / 255;
      const pm = Math.max(0.001, (pr + pg + pb) / 3);
      cr = g * (0.9 + 0.1 * (pr / pm));
      cg = g * (0.9 + 0.1 * (pg / pm));
      cb = g * (0.9 + 0.1 * (pb / pm));
      // occasional RGB "sub-pixels"
      if (r() < 0.045 * (0.5 + v)) {
        const acc = ACCENTS[(r() * ACCENTS.length) | 0];
        cr = acc[0]; cg = acc[1]; cb = acc[2];
        size *= 1.1;
      }
      // a few bigger "pixels" in bright areas
      if (r() < 0.06 * v) size = 1.5 + r() * 1.1;
      else if (r() < 0.2) size = 0.55 + r() * 0.2;
      // appearance order: brightest features emerge a little earlier
      appear = 0.08 + r() * 0.82 - v * 0.06;
    } else {
      // ambient dust filling the darkness
      fx = (r() - 0.5) * H * 7;
      fy = (r() - 0.5) * H * 4;
      fz = -H * 2.2 + r() * H * 1.8;
      const g = 0.25 + r() * 0.35;
      cr = g; cg = g; cb = g;
      if (r() < 0.12) {
        const acc = ACCENTS[(r() * ACCENTS.length) | 0];
        cr = acc[0] * 0.7; cg = acc[1] * 0.7; cb = acc[2] * 0.7;
      }
      size = 0.5 + r() * 0.8;
      appear = r() * 0.12; // the first isolated pixels of the awakening
    }

    face[k3] = fx; face[k3 + 1] = fy; face[k3 + 2] = fz;
    color[k3] = cr; color[k3 + 1] = cg; color[k3 + 2] = cb;

    // ---- formation start: scattered around the target, biased towards the camera
    const theta = r() * Math.PI * 2;
    const phi = Math.acos(2 * r() - 1);
    const rad = H * (0.6 + Math.pow(r(), 0.7) * 2.6);
    start[k3] = fx + Math.sin(phi) * Math.cos(theta) * rad;
    start[k3 + 1] = fy + Math.sin(phi) * Math.sin(theta) * rad * 0.7;
    start[k3 + 2] = fz + Math.cos(phi) * rad * 0.8 + H * 0.4;

    // ---- constellation: six clusters (one per expertise domain) + filaments
    const cluster = k % 6;
    const ccx = (cluster - 2.5) * H * 1.55;
    const ccy = Math.sin(cluster * 1.9) * H * 0.22;
    const ccz = Math.cos(cluster * 1.3) * H * 0.25 - H * 0.2;
    const mode = r();
    if (isAmbient) {
      cloud[k3] = fx * 1.2; cloud[k3 + 1] = fy; cloud[k3 + 2] = fz;
    } else if (mode < 0.62) {
      const s = H * 0.2;
      cloud[k3] = ccx + gauss(r) * s;
      cloud[k3 + 1] = ccy + gauss(r) * s;
      cloud[k3 + 2] = ccz + gauss(r) * s;
    } else if (mode < 0.86) {
      // tilted orbital ring
      const a = r() * Math.PI * 2;
      const rr = H * (0.42 + gauss(r) * 0.02);
      const tilt = 0.5 + cluster * 0.3;
      cloud[k3] = ccx + Math.cos(a) * rr;
      cloud[k3 + 1] = ccy + Math.sin(a) * rr * Math.cos(tilt);
      cloud[k3 + 2] = ccz + Math.sin(a) * rr * Math.sin(tilt);
    } else {
      // filament towards the next cluster
      const next = Math.min(5, cluster + 1);
      const t = r();
      const nx2 = (next - 2.5) * H * 1.55, ny2 = Math.sin(next * 1.9) * H * 0.22;
      const nz2 = Math.cos(next * 1.3) * H * 0.25 - H * 0.2;
      const sag = Math.sin(t * Math.PI) * H * 0.18;
      cloud[k3] = ccx + (nx2 - ccx) * t + gauss(r) * H * 0.012;
      cloud[k3 + 1] = ccy + (ny2 - ccy) * t - sag + gauss(r) * H * 0.012;
      cloud[k3 + 2] = ccz + (nz2 - ccz) * t + gauss(r) * H * 0.02;
    }

    // ---- timeline column
    const spread = r() < 0.8 ? 0.004 : 0.03;
    line[k3] = isAmbient ? (r() - 0.5) * H * 4 : gauss(r) * H * spread;
    line[k3 + 1] = (r() - 0.5) * 12;
    line[k3 + 2] = isAmbient ? fz : gauss(r) * H * 0.01;

    rand[k4] = r(); // formation delay
    rand[k4 + 1] = size;
    rand[k4 + 2] = r(); // phase
    rand[k4 + 3] = Math.max(0, appear);
  }

  return { count, face, cloud, line, start, color, rand, aspect };
}
