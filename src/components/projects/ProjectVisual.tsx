import { memo, useEffect, useRef } from 'react';
import { visuals, type VisualKind } from './visuals';

interface Props {
  kind: VisualKind;
  accent: string;
  reducedMotion: boolean;
}

const FRAME_MS = 1000 / 30;

/** Lightweight 2D canvas that only animates while on screen. */
function ProjectVisualBase({ kind, accent, reducedMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const draw = visuals[kind];
    const color = getComputedStyle(canvas).getPropertyValue(accent.replace(/var\((.*)\)/, '$1')).trim() || '#fff';

    let w = 0, h = 0, raf = 0, last = 0, visible = false;
    const start = performance.now();

    const render = (now: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = canvas.width / Math.max(1, w);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, w, h, reducedMotion ? 6 : (now - start) / 1000, color);
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      render(now);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      render(performance.now());
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        cancelAnimationFrame(raf);
        if (visible && !reducedMotion) raf = requestAnimationFrame(loop);
      },
      { rootMargin: '100px' },
    );
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [kind, accent, reducedMotion]);

  return <canvas ref={canvasRef} className="project-visual" aria-hidden="true" />;
}

export const ProjectVisual = memo(ProjectVisualBase);
