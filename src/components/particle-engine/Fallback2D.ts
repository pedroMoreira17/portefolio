import { PORTRAIT_WORLD_HEIGHT } from './loadParticles';
import { deriveUniformTargets, sceneState } from './sceneState';
import type { ParticleData } from './types';

/**
 * Non-WebGL fallback: draws the same sampled portrait once as crisp squares on a
 * 2D canvas. Only the canvas opacity follows the scroll narrative.
 */
export class Fallback2D {
  private raf = 0;
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private data: ParticleData;

  constructor(canvas: HTMLCanvasElement, data: ParticleData) {
    this.canvas = canvas;
    this.data = data;
    this.ctx = canvas.getContext('2d')!;
    this.draw();
    window.addEventListener('resize', this.draw);
    this.raf = requestAnimationFrame(this.tick);
  }

  get particleCount() {
    return this.data.count;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.draw);
  }

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);
    const { alpha } = deriveUniformTargets(sceneState);
    this.canvas.style.opacity = String(alpha * sceneState.appear);
  };

  private draw = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);

    const narrow = w / h < 0.9;
    const pxPerUnit = narrow
      ? Math.min((h * 0.56) / PORTRAIT_WORLD_HEIGHT, (w * 1.05) / (PORTRAIT_WORLD_HEIGHT * this.data.aspect))
      : (h * 0.9) / PORTRAIT_WORLD_HEIGHT;
    const cx = narrow ? w / 2 : w * 0.66;
    const cy = narrow ? h * 0.37 : h * 0.52;

    const { face, color, rand, count } = this.data;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i++) {
      const z = face[i * 3 + 2];
      if (z < -1.2) continue; // skip far ambient dust
      const x = cx + face[i * 3] * pxPerUnit;
      const y = cy - face[i * 3 + 1] * pxPerUnit;
      const s = Math.max(1, rand[i * 4 + 1] * 1.6);
      const r = (color[i * 3] * 255) | 0;
      const g = (color[i * 3 + 1] * 255) | 0;
      const b = (color[i * 3 + 2] * 255) | 0;
      ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalCompositeOperation = 'source-over';
  };
}
