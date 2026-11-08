import portraitUrl from '../../assets/portrait/portrait.webp';
import { samplePortrait } from './sampler';
import type { ParticleData, SamplerOptions } from './types';

export const PORTRAIT_WORLD_HEIGHT = 2.5;

/**
 * Samples the portrait off the main thread when possible (Worker + OffscreenCanvas),
 * otherwise falls back to a main-thread canvas.
 */
export async function loadParticles(count: number): Promise<ParticleData> {
  const options: SamplerOptions = {
    count,
    ambientRatio: 0.05,
    worldHeight: PORTRAIT_WORLD_HEIGHT,
    seed: 20260207,
  };
  const absoluteUrl = new URL(portraitUrl, window.location.href).href;

  if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
    try {
      return await new Promise<ParticleData>((resolve, reject) => {
        const worker = new Worker(new URL('./sampler.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e) => {
          worker.terminate();
          if (e.data.ok) resolve(e.data.result as ParticleData);
          else reject(new Error(e.data.error));
        };
        worker.onerror = (e) => {
          worker.terminate();
          reject(e);
        };
        worker.postMessage({ url: absoluteUrl, options });
      });
    } catch {
      // fall through to the main-thread path
    }
  }

  const img = new Image();
  img.decoding = 'async';
  img.src = absoluteUrl;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return samplePortrait(data, width, height, options);
}
