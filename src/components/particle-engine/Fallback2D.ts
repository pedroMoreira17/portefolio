import { PORTRAIT_WORLD_HEIGHT } from './loadParticles';
import { sceneState } from './sceneState';
import type { ParticleData } from './types';

const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/**
 * Non-WebGL fallback (no GPU / hardware acceleration off): draws the sampled portrait
 * once as crisp squares on a 2D canvas, then only touches cheap CSS properties per frame.
 * The portrait is shown in the hero, fades out completely while the content sections
 * scroll by (it never sits behind the text) and returns as a faint echo for the contact
 * finale. A light pointer parallax and a slow push-in on scroll keep it from feeling frozen.
 */
export class Fallback2D {
  private raf = 0;
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private data: ParticleData;
  private pointer = { x: 0, y: 0 };
  private current = { x: 0, y: 0, opacity: -1, scale: 1 };

  constructor(canvas: HTMLCanvasElement, data: ParticleData) {
    this.canvas = canvas;
    this.data = data;
    this.ctx = canvas.getContext('2d')!;
    this.draw();
    window.addEventListener('resize', this.draw);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    this.raf = requestAnimationFrame(this.tick);
  }

  get particleCount() {
    return this.data.count;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.draw);
    window.removeEventListener('pointermove', this.onPointer);
    this.canvas.style.removeProperty('opacity');
    this.canvas.style.removeProperty('transform');
    this.canvas.style.removeProperty('transform-origin');
  }

  private onPointer = (e: PointerEvent) => {
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);
    const s = sceneState;
    const reduced = s.reducedMotion;
    const narrow = window.innerWidth / window.innerHeight < 0.9;

    const heroVisible = 1 - smooth(s.heroToExpertise * 1.25);
    const contactVisible = smooth(s.projectsToContact) * (narrow ? 0.2 : 0.5);
    const opacity = Math.max(heroVisible, contactVisible) * s.appear;

    const motion = reduced ? 0 : 1;
    const targetX = this.pointer.x * -14 * motion;
    const targetY = this.pointer.y * -10 * motion;
    const scale = 1 + 0.07 * smooth(s.heroToExpertise) * motion;

    const c = this.current;
    c.x += (targetX - c.x) * 0.08;
    c.y += (targetY - c.y) * 0.08;

    // Only write to the DOM when something visibly changed: without a GPU every style
    // write repaints a full-viewport canvas.
    if (Math.abs(opacity - c.opacity) > 0.004) {
      c.opacity = opacity;
      this.canvas.style.opacity = opacity.toFixed(3);
    }
    if (opacity > 0.01 && (Math.abs(targetX - c.x) > 0.3 || Math.abs(targetY - c.y) > 0.3 || Math.abs(scale - c.scale) > 0.002)) {
      c.scale = scale;
      this.canvas.style.transform = `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
    }
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
    // push-in on scroll grows from the face, not from the middle of the screen
    this.canvas.style.transformOrigin = `${((cx / w) * 100).toFixed(1)}% ${((cy / h) * 100).toFixed(1)}%`;

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
