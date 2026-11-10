export const particleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uForm;
  uniform float uAppear;
  uniform float uDisperse;
  uniform float uWCloud;
  uniform float uWLine;
  uniform float uAlpha;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uFaceScale;
  uniform vec3  uFaceOffset;
  uniform float uCloudShift;
  uniform float uCloudScale;
  uniform float uLineX;
  uniform float uLineFlow;
  uniform float uMotion;
  uniform vec3  uHot;
  uniform vec2  uPointer;
  uniform float uPointerForce;

  attribute vec3 aFace;
  attribute vec3 aCloud;
  attribute vec3 aLine;
  attribute vec3 aStart;
  attribute vec3 aColor;
  attribute vec4 aRand;

  varying vec3 vColor;
  varying float vAlpha;

  float easeOutCubic(float t) { return 1.0 - pow(1.0 - t, 3.0); }

  void main() {
    float delay = aRand.x;
    float sizeR = aRand.y;
    float phase = aRand.z * 6.28318;
    float t = uTime * uMotion;

    // --- formation (intro) ---------------------------------------------------
    float f = clamp((uForm * 1.55 - delay * 0.55), 0.0, 1.0);
    float fe = easeOutCubic(f);

    vec3 face = aFace * uFaceScale + uFaceOffset;
    // living portrait: breathing depth + micro drift
    face.z += sin(t * 0.7 + phase) * 0.014;
    face.xy += vec2(sin(t * 0.45 + phase * 2.0), cos(t * 0.38 + phase * 1.5)) * 0.0035;

    vec3 p = mix(aStart * uFaceScale + uFaceOffset, face, fe);
    // spiral while travelling, vanishing once in place
    float travel = fe * (1.0 - fe) * 4.0;
    p.x += sin(phase + f * 5.0) * 0.18 * travel;
    p.y += cos(phase * 1.3 + f * 4.0) * 0.12 * travel;

    // --- constellation --------------------------------------------------------
    vec3 cloud = aCloud * uCloudScale;
    cloud.x += uCloudShift;
    float ca = t * 0.06 + phase * 0.02;
    cloud.y += sin(t * 0.35 + phase) * 0.03;
    cloud.z += cos(t * 0.3 + phase) * 0.03 + sin(ca) * 0.02;

    // --- timeline column ------------------------------------------------------
    vec3 line = aLine;
    line.x += uLineX;
    line.y = mod(aLine.y + uLineFlow * 4.0 + t * 0.04 + 6.0, 12.0) - 6.0;

    float wFace = clamp(1.0 - uWCloud - uWLine, 0.0, 1.0);
    vec3 pos = p * wFace + cloud * uWCloud + line * uWLine;

    // --- controlled dispersion ------------------------------------------------
    // staggered: low-delay particles peel away first, so the portrait erodes
    // progressively instead of exploding all at once
    float local = clamp(uDisperse * 1.8 - delay * 1.0, 0.0, 1.6);
    local = local * local * (3.0 - 2.0 * min(local, 1.0));
    vec3 dir = normalize(aStart - aFace + vec3(0.0001));
    pos += dir * local * (0.5 + sizeR * 0.45) * 0.85;
    pos += vec3(
      sin(t * 0.9 + phase * 3.0),
      cos(t * 0.7 + phase * 2.0),
      sin(t * 0.6 + phase * 5.0)
    ) * local * 0.22;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    // --- pointer field -----------------------------------------------------------
    // uPointer is the cursor ray in view space per unit of depth, so the field
    // sits under the cursor at every depth. Particles are pushed aside, swirl a
    // little and lift towards the camera, then fall back as the force decays.
    vec2 toPointer = mv.xy - uPointer * -mv.z;
    float pDist = length(toPointer);
    float field = exp(-pDist * pDist / 0.11) * uPointerForce * uMotion;
    vec2 away = toPointer / (pDist + 0.0001);
    float pushR = 0.45 + fract(aRand.z * 13.7);
    mv.xy += away * field * 0.2 * pushR;
    mv.xy += vec2(-away.y, away.x) * field * 0.06 * sin(t * 2.2 + phase);
    mv.z += field * 0.35 * fract(aRand.x * 9.1);

    gl_Position = projectionMatrix * mv;

    float lum = dot(aColor, vec3(0.299, 0.587, 0.114));
    float size = uSize * sizeR * (0.7 + lum * 0.55);
    gl_PointSize = max(1.0, size * uPixelRatio * (6.0 / -mv.z));

    // --- visibility -------------------------------------------------------------
    float vis = smoothstep(aRand.w, aRand.w + 0.07, uAppear);
    float twinkle = 0.82 + 0.18 * sin(t * (1.2 + aRand.z * 2.5) + phase * 7.0);
    float travelGlow = 1.0 + travel * 0.6;

    // --- heat ---------------------------------------------------------------------
    // ~12% of particles glow like embers while the portrait erodes, and a few
    // sparks ride the timeline column (same hot accent as the UI). The cursor
    // also warms the particles it disturbs.
    float ember = step(0.88, aRand.z) * min(local, 1.0);
    float spark = step(0.965, aRand.z) * uWLine;
    float touched = step(0.55, aRand.z) * field * 0.9;
    float heat = clamp(ember + spark + touched, 0.0, 1.0);

    vAlpha = vis * twinkle * uAlpha * travelGlow * (1.0 + heat * 0.8);
    vColor = mix(aColor, uHot, heat);
  }
`;

export const particleFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // GL points are squares: keep the hard pixel edge, slightly dim the rim
    vec2 c = abs(gl_PointCoord - 0.5);
    float rim = smoothstep(0.36, 0.5, max(c.x, c.y));
    float a = vAlpha * 0.5 * (1.0 - rim * 0.35);
    gl_FragColor = vec4(vColor * a, a);
  }
`;
