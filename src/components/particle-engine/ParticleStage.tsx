import { memo, useEffect, useRef } from 'react';
import { loadParticles } from './loadParticles';
import { detectQuality, hasWebGL } from './quality';
import './ParticleStage.scss';

interface Props {
  /** Called once the portrait is sampled and the first frame can render. */
  onReady: (info: { particles: number; renderer: 'webgl' | 'canvas' }) => void;
  onError?: () => void;
}

/**
 * Fixed full-viewport canvas hosting the particle universe. The Three.js engine
 * is code-split and only fetched here, so the rest of the page never waits on it.
 */
function ParticleStageBase({ onReady, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let instance: { dispose: () => void } | null = null;

    (async () => {
      try {
        const quality = detectQuality();
        if (hasWebGL()) {
          const [{ ParticleEngine }, data] = await Promise.all([
            import('./ParticleEngine'),
            loadParticles(quality.count),
          ]);
          if (disposed) return;
          const engine = new ParticleEngine(canvas, data, quality);
          engine.start();
          instance = engine;
          onReady({ particles: engine.particleCount, renderer: 'webgl' });
        } else {
          const [{ Fallback2D }, data] = await Promise.all([
            import('./Fallback2D'),
            loadParticles(Math.min(quality.count, 36000)),
          ]);
          if (disposed) return;
          const fallback = new Fallback2D(canvas, data);
          instance = fallback;
          onReady({ particles: fallback.particleCount, renderer: 'canvas' });
        }
      } catch (err) {
        console.warn('[particles] unavailable, continuing without them', err);
        onError?.();
      }
    })();

    return () => {
      disposed = true;
      instance?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className="particle-stage" aria-hidden="true" />;
}

export const ParticleStage = memo(ParticleStageBase);
