import type { QualityProfile } from './types';

/** Chooses a particle budget from coarse device signals. Refined at runtime by the FPS governor. */
export function detectQuality(): QualityProfile {
  const forced = Number(new URLSearchParams(window.location.search).get('particles'));
  if (forced > 0) return { tier: 'high', count: Math.min(forced, 250000), maxPixelRatio: 2, pointSize: 1 };
  const w = window.innerWidth;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;

  if (memory <= 2 || cores <= 2) {
    return { tier: 'low', count: 22000, maxPixelRatio: 1.5, pointSize: 1.45 };
  }
  if (coarse || w < 768) {
    return { tier: 'medium', count: 42000, maxPixelRatio: 2, pointSize: 1.2 };
  }
  if (cores >= 8 && w >= 1280) {
    return { tier: 'ultra', count: 120000, maxPixelRatio: 2, pointSize: 1 };
  }
  return { tier: 'high', count: 85000, maxPixelRatio: 1.75, pointSize: 1.08 };
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
