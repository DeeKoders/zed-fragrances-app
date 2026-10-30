import { Skia, type SkRuntimeEffect } from "@shopify/react-native-skia";

// The website's WebGL shaders (src/lib/webgl.ts, src/components/webgl/*) ported to Skia SkSL.
// Skia's fragCoord is top-down (CSS-like) and in canvas points, not device pixels.

/** Shared noise: value noise and fbm (verbatim maths from the website's GLSL_NOISE). */
const NOISE = `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}
`;

/**
 * The split hero's seam (SeamCanvas.tsx), stacked worlds: a wandering gold core, each world's glow
 * on its own side, curling smoke and sparks, brighter as one world wins. uPx = canvas points per
 * hero point (the canvas renders at reduced density and is scaled up).
 */
export const SEAM_SKSL = `
uniform vec2 uRes;
uniform float uTime;
uniform float uSeam;
uniform float uBalance;
uniform float uPx;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uGold;
${NOISE}
vec4 main(vec2 fragCoord) {
  vec2 css = fragCoord / uRes;
  float across = css.y - uSeam;
  float along = css.x;
  float extent = uRes.y / uPx;
  float t = uTime * 0.35;

  float wander = (fbm(vec2(along * 3.0, t)) - 0.5) * 0.05 + (fbm(vec2(along * 11.0 - t * 2.0, t * 1.3)) - 0.5) * 0.015;
  float d = (across - wander) * extent;
  float side = step(0.0, d);
  vec3 sideColor = mix(uColorA, uColorB, side);
  float energy = 0.75 + abs(uBalance) * 0.6;

  float core = exp(-abs(d) / 1.4) * (0.75 + 0.25 * sin(uTime * 7.0 + along * 30.0));
  float glow = exp(-abs(d) / 22.0);
  float haze = exp(-abs(d) / 90.0);

  float smoke = fbm(vec2(across * 14.0 + t * 0.8, along * 5.0 - t)) * fbm(vec2(along * 9.0 + t, across * 30.0));
  smoke = smoothstep(0.12, 0.45, smoke) * haze;

  vec2 grid = vec2(along * 60.0 - t * 8.0, d / 10.0);
  vec2 id = floor(grid);
  float spark = step(0.93, hash(id)) * (1.0 - smoothstep(0.0, 0.45, length(fract(grid) - 0.5))) * exp(-abs(d) / 30.0);
  spark *= 0.5 + 0.5 * sin(uTime * 9.0 + hash(id) * 50.0);

  vec3 color = uGold * core * 1.2 + sideColor * glow * 0.55 * energy + mix(sideColor, uGold, 0.3) * smoke * 0.6 + uGold * spark;
  float alpha = clamp(max(color.r, max(color.g, color.b)), 0.0, 1.0);
  return vec4(min(color, vec3(alpha)), alpha);
}
`;

/** The atmosphere (Atmosphere.tsx): domain-warped smoke, light rays and dust tinted by the theme. */
export const ATMOSPHERE_SKSL = `
uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;
uniform vec3 uAccent;
uniform vec3 uAlt;
uniform vec3 uGlow;
uniform vec3 uGold;
uniform float uCold;
${NOISE}
vec4 main(vec2 fragCoord) {
  vec2 frag = vec2(fragCoord.x, uRes.y - fragCoord.y);
  vec2 uv = frag / uRes;
  vec2 p = (frag - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.04;

  vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, -t * 2.0 + uScroll)), fbm(p * 1.4 + vec2(5.2, 1.3 - t * 1.6)));
  float smoke = smoothstep(0.42, 0.95, fbm(p * 2.0 + 1.8 * q + vec2(0.0, -t * 3.0 + uScroll * 1.5)));
  vec3 color = mix(uAlt, uAccent, smoke) * smoke * 0.5;

  float angle = atan(p.x, 1.4 - p.y);
  float rays = pow(noise(vec2(angle * 9.0, t * 3.0)), 3.0) * smoothstep(0.1, 1.0, uv.y);
  color += mix(uGold, uGlow, uCold) * rays * 0.16;

  vec2 grid = p * 16.0 + vec2(0.0, t * 6.0 - uScroll * 4.0);
  vec2 id = floor(grid);
  vec2 offset = vec2(hash(id + 1.3), hash(id + 7.1)) - 0.5;
  float mote = 1.0 - smoothstep(0.0, 0.08, length(fract(grid) - 0.5 - offset * 0.6));
  mote *= step(0.88, hash(id)) * (0.5 + 0.5 * sin(uTime * 1.3 + hash(id + 3.7) * 40.0));
  color += mix(uGold, uGlow, uCold) * mote * 0.7;

  color *= 1.0 - smoothstep(0.25, 1.25, length(p));
  float alpha = clamp(max(color.r, max(color.g, color.b)) * 1.4, 0.0, 1.0);
  return vec4(min(color, vec3(alpha)), alpha);
}
`;

const cache = new Map<string, SkRuntimeEffect | null>();

/** Compiles a shader once. Null when the device can't (the caller shows its static fallback). */
export function runtimeEffect(source: string): SkRuntimeEffect | null {
  if (!cache.has(source)) {
    let effect: SkRuntimeEffect | null = null;
    try {
      effect = Skia.RuntimeEffect.Make(source);
    } catch {
      effect = null;
    }
    if (!effect && __DEV__) console.warn("[shader] failed to compile");
    cache.set(source, effect);
  }
  return cache.get(source) ?? null;
}
