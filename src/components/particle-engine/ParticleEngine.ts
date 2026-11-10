import {
  BufferAttribute,
  BufferGeometry,
  CustomBlending,
  OneFactor,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { PORTRAIT_WORLD_HEIGHT } from './loadParticles';
import { particleFragmentShader, particleVertexShader } from './shaders';
import { deriveUniformTargets, sceneState } from './sceneState';
import type { ParticleData, QualityProfile } from './types';

const FOV = 35;
const CAMERA_Z = 6;
/** Must match the timeline line position in Journey.scss on narrow screens. */
export const MOBILE_LINE_X_PX = 28;
export const MOBILE_BREAKPOINT = 768;

interface Damped {
  wCloud: number;
  wLine: number;
  alpha: number;
  disperse: number;
  contactMix: number;
  cloudShift: number;
  lineFlow: number;
}

/**
 * Reusable GPU particle engine. One draw call; every particle's motion is
 * computed in the vertex shader from a handful of uniforms.
 */
export class ParticleEngine {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  private geometry = new BufferGeometry();
  private material: ShaderMaterial;
  private points: Points;
  private raf = 0;
  private startTime = performance.now();
  private lastFrame = performance.now();
  private running = false;
  private damped: Damped;
  private visW = 1;
  private visH = 1;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  /** Cursor / touch force field: target and smoothed position (NDC), presence and motion energy. */
  private field = { x: 0, y: 0, tx: 0, ty: 0, hover: false, energy: 0, force: 0 };
  private drawCount: number;

  // FPS governor
  private frameTimes: number[] = [];
  private reductions = 0;
  private governorReadyAt = performance.now() + 3500;

  private data: ParticleData;
  private quality: QualityProfile;

  constructor(canvas: HTMLCanvasElement, data: ParticleData, quality: QualityProfile) {
    this.data = data;
    this.quality = quality;
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: false,
    });
    this.renderer.setClearColor(0x050505, 1);

    const g = this.geometry;
    // `position` is required by three for bounding computations; the face target works.
    g.setAttribute('position', new BufferAttribute(data.face, 3));
    g.setAttribute('aFace', new BufferAttribute(data.face, 3));
    g.setAttribute('aCloud', new BufferAttribute(data.cloud, 3));
    g.setAttribute('aLine', new BufferAttribute(data.line, 3));
    g.setAttribute('aStart', new BufferAttribute(data.start, 3));
    g.setAttribute('aColor', new BufferAttribute(data.color, 3));
    g.setAttribute('aRand', new BufferAttribute(data.rand, 4));
    this.drawCount = data.count;

    this.material = new ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: CustomBlending,
      blendSrc: OneFactor,
      blendDst: OneFactor,
      uniforms: {
        uTime: { value: 0 },
        uForm: { value: 0 },
        uAppear: { value: 0 },
        uDisperse: { value: 0 },
        uWCloud: { value: 0 },
        uWLine: { value: 0 },
        uAlpha: { value: 1 },
        uPixelRatio: { value: 1 },
        uSize: { value: 1.75 * quality.pointSize },
        uFaceScale: { value: 1 },
        uFaceOffset: { value: new Vector3() },
        uCloudShift: { value: 0 },
        uCloudScale: { value: 1 },
        uLineX: { value: 0 },
        uLineFlow: { value: 0 },
        uMotion: { value: 1 },
        // --c-hot (#ff5a1f) as 0..1 sRGB, matching the CSS accent
        uHot: { value: new Vector3(1.0, 0.353, 0.122) },
        uPointer: { value: new Vector2() },
        uPointerForce: { value: 0 },
      },
    });

    this.points = new Points(g, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
    this.camera.position.set(0, 0, CAMERA_Z);

    this.damped = { ...deriveUniformTargets(sceneState) };

    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    window.addEventListener('pointerdown', this.onPointer, { passive: true });
    window.addEventListener('pointerup', this.onPointerEnd, { passive: true });
    window.addEventListener('pointercancel', this.onPointerEnd, { passive: true });
    document.documentElement.addEventListener('pointerleave', this.onPointerEnd, { passive: true });
  }

  get particleCount() {
    return this.drawCount;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pointermove', this.onPointer);
    window.removeEventListener('pointerdown', this.onPointer);
    window.removeEventListener('pointerup', this.onPointerEnd);
    window.removeEventListener('pointercancel', this.onPointerEnd);
    document.documentElement.removeEventListener('pointerleave', this.onPointerEnd);
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private onPointer = (e: PointerEvent) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    const mouse = e.pointerType === 'mouse';
    if (mouse) {
      // parallax follows the mouse only: a finger would tilt the portrait on every scroll
      this.pointer.tx = nx;
      this.pointer.ty = ny;
    }

    const f = this.field;
    if (e.type === 'pointerdown') {
      if (!mouse) f.energy = 1; // a tap ripples through the particles
    } else {
      f.energy = Math.min(1, f.energy + Math.hypot(nx - f.tx, ny - f.ty) * 1.6);
    }
    f.tx = nx;
    f.ty = ny;
    // nothing is displaced yet → appear under the pointer instead of sweeping across the screen
    if (f.force < 0.02) {
      f.x = nx;
      f.y = ny;
    }
    f.hover = mouse;
  };

  /** Mouse left the window, or the finger lifted: let the field fade out. */
  private onPointerEnd = (e: PointerEvent) => {
    if (e.type === 'pointerup' && e.pointerType === 'mouse') return;
    this.field.hover = false;
  };

  private resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.quality.maxPixelRatio);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.visH = 2 * CAMERA_Z * Math.tan((FOV * Math.PI) / 360);
    this.visW = this.visH * this.camera.aspect;
    const u = this.material.uniforms;
    u.uPixelRatio.value = dpr;
    u.uCloudScale.value = w < MOBILE_BREAKPOINT ? 0.62 : 1;
    u.uLineX.value = w < MOBILE_BREAKPOINT ? (MOBILE_LINE_X_PX / w - 0.5) * this.visW : 0;
  };

  /** Portrait placement for the hero (t = 0) and contact (t = 1) compositions. */
  private layout(contactMix: number) {
    const H = PORTRAIT_WORLD_HEIGHT;
    const faceW = H * this.data.aspect;
    const narrow = this.camera.aspect < 0.9;
    let hero: [number, number, number];
    let contact: [number, number, number];
    if (narrow) {
      const s = Math.min((this.visH * 0.56) / H, (this.visW * 1.05) / faceW);
      hero = [0, this.visH * 0.13, s];
      contact = [0, this.visH * 0.2, s * 0.78];
    } else {
      const s = Math.min((this.visH * 0.92) / H, (this.visW * 0.55) / faceW);
      hero = [this.visW * 0.17, -this.visH * 0.03, s];
      contact = [this.visW * 0.24, -this.visH * 0.02, s * 0.86];
    }
    const m = (a: number, b: number) => a + (b - a) * contactMix;
    return { x: m(hero[0], contact[0]), y: m(hero[1], contact[1]), s: m(hero[2], contact[2]) };
  }

  private tick = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);

    const dt = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.governor(dt, now);

    const reduced = sceneState.reducedMotion;
    const target = deriveUniformTargets(sceneState);
    if (reduced) {
      // static composition: portrait in the hero, gone while the content scrolls by
      // (never a ghost behind the text), back for the finale
      target.wCloud = 0;
      target.wLine = 0;
      target.disperse = 0;
      const heroFade = 1 - Math.min(1, sceneState.heroToExpertise * 1.2);
      target.alpha = Math.max(heroFade, target.contactMix * 0.62);
      // switch to the contact layout only while invisible, so the face never slides
      target.contactMix = heroFade > 0 ? 0 : 1;
    }
    // narrow screens: contact text scrolls over the returning portrait → keep it a ghost
    if (this.camera.aspect < 0.9) target.alpha *= 1 - 0.78 * target.contactMix;

    // frame-rate independent damping → cinematic inertia on top of Lenis
    const k = reduced ? 1 : 1 - Math.exp(-dt * 5.5);
    const d = this.damped;
    (Object.keys(d) as (keyof Damped)[]).forEach((key) => {
      d[key] += (target[key] - d[key]) * k;
    });

    const u = this.material.uniforms;
    const time = (now - this.startTime) / 1000;
    u.uTime.value = time;
    u.uMotion.value = reduced ? 0 : 1;
    u.uForm.value = sceneState.form;
    u.uAppear.value = sceneState.appear;
    u.uDisperse.value = d.disperse;
    u.uWCloud.value = d.wCloud;
    u.uWLine.value = d.wLine;
    u.uAlpha.value = d.alpha;
    u.uLineFlow.value = d.lineFlow;

    const layout = this.layout(d.contactMix);
    u.uFaceScale.value = layout.s;
    (u.uFaceOffset.value as Vector3).set(layout.x, layout.y, 0);

    const maxCluster = 2.5 * PORTRAIT_WORLD_HEIGHT * 1.55 * u.uCloudScale.value;
    u.uCloudShift.value = (0.5 - d.cloudShift) * 2 * maxCluster;

    // subtle camera-free parallax on the object, only while the portrait is shown
    const faceWeight = Math.max(0, 1 - d.wCloud - d.wLine);
    const p = this.pointer;
    p.x += (p.tx - p.x) * Math.min(1, dt * 2.5);
    p.y += (p.ty - p.y) * Math.min(1, dt * 2.5);
    const motion = reduced ? 0 : 1;
    this.points.rotation.y = (Math.sin(time * 0.17) * 0.09 + p.x * 0.1) * faceWeight * motion;
    this.points.rotation.x = (Math.sin(time * 0.13) * 0.03 + p.y * 0.05) * faceWeight * motion;

    // pointer force field: a resting cursor leaves a soft dent, movement stirs it up
    const f = this.field;
    const follow = Math.min(1, dt * 14);
    f.x += (f.tx - f.x) * follow;
    f.y += (f.ty - f.y) * follow;
    f.energy *= Math.exp(-dt * 1.8);
    const forceTarget = Math.min(1, (f.hover ? 0.28 : 0) + f.energy);
    f.force += (forceTarget - f.force) * Math.min(1, dt * (forceTarget > f.force ? 9 : 3));
    const tanHalfFov = Math.tan((FOV * Math.PI) / 360);
    (u.uPointer.value as Vector2).set(f.x * tanHalfFov * this.camera.aspect, -f.y * tanHalfFov);
    u.uPointerForce.value = f.force;

    this.renderer.render(this.scene, this.camera);
  };

  /** Lowers particle count / resolution when the device cannot hold ~45 fps. */
  private governor(dt: number, now: number) {
    if (now < this.governorReadyAt || this.reductions >= 3) return;
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    if (avg > 1 / 42) {
      this.reductions++;
      this.drawCount = Math.max(Math.floor(this.data.count * 0.3), Math.floor(this.drawCount * 0.72));
      this.geometry.setDrawRange(0, this.drawCount);
      const dpr = Math.max(1, this.renderer.getPixelRatio() * 0.85);
      this.renderer.setPixelRatio(dpr);
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);
      this.material.uniforms.uPixelRatio.value = dpr;
      // slightly larger pixels keep the portrait dense
      this.material.uniforms.uSize.value *= 1.1;
      this.governorReadyAt = now + 2000;
    }
  }
}
