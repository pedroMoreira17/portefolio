/** Particle buffers produced by the sampler (all tightly packed Float32Arrays). */
export interface ParticleData {
  count: number;
  /** Target position in the portrait, world units (xyz). */
  face: Float32Array;
  /** Target position in the "technical constellation" (xyz). */
  cloud: Float32Array;
  /** Target position in the vertical timeline column (xyz). */
  line: Float32Array;
  /** Scattered starting position used by the formation sequence (xyz). */
  start: Float32Array;
  /** Linear RGB colour (rgb). */
  color: Float32Array;
  /** Per-particle randoms: x = formation delay, y = size, z = phase, w = appearance threshold. */
  rand: Float32Array;
  /** Aspect ratio (width / height) of the sampled portrait. */
  aspect: number;
}

export interface SamplerOptions {
  /** Total particles, including ambient dust. */
  count: number;
  /** Fraction of particles used as ambient dust around the scene (0..1). */
  ambientRatio: number;
  /** Portrait height in world units. */
  worldHeight: number;
  seed: number;
}

export type QualityTier = 'ultra' | 'high' | 'medium' | 'low';

export interface QualityProfile {
  tier: QualityTier;
  count: number;
  maxPixelRatio: number;
  /** Base point size multiplier (fewer particles → slightly larger pixels). */
  pointSize: number;
}
