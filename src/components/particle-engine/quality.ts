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

/** Renderers that emulate the GPU on the CPU: WebGL "works" but at a few frames per second. */
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render driver|mesa offscreen/i;

/**
 * True only for hardware-accelerated WebGL. With hardware acceleration off, browsers
 * either expose no WebGL at all or a CPU emulation of it; both go to the 2D fallback.
 * `?renderer=2d` forces the fallback (useful to check it without touching browser settings).
 */
export function hasWebGL(): boolean {
  if (new URLSearchParams(window.location.search).get('renderer') === '2d') return false;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
    const software = SOFTWARE_RENDERER.test(renderer);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !software;
  } catch {
    return false;
  }
}
