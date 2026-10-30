// Procedural texture geometry for product worlds. Seeded by slug and built from arithmetic and
// sqrt only (no trig), so Node and every browser produce identical path strings and server-rendered
// SVG hydrates cleanly. Coordinates live in a 1000×1000 box, scaled to cover by the SVG.

type Point = [number, number];

const SIZE = 1000;
/** Rotation by ±0.12 rad as literal constants, so no Math.sin/cos is needed. */
const TURN_COS = 0.9928086;
const TURN_SIN = 0.1197122;

const cache = new Map<string, unknown>();

function memo<T>(key: string, build: () => T): T {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key) as T;
}

function hashSeed(text: string) {
  let hash = 1779033703 ^ text.length;
  for (let index = 0; index < text.length; index++) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

/** mulberry32: small, fast, deterministic. */
function random(seed: string) {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n = (value: number) => value.toFixed(1);

function normalise([x, y]: Point): Point {
  const length = Math.sqrt(x * x + y * y) || 1;
  return [x / length, y / length];
}

function turn([x, y]: Point, steps: number): Point {
  const sin = steps < 0 ? -TURN_SIN : TURN_SIN;
  let vector: Point = [x, y];
  for (let index = 0; index < Math.abs(steps); index++) {
    vector = [vector[0] * TURN_COS - vector[1] * sin, vector[0] * sin + vector[1] * TURN_COS];
  }
  return normalise(vector);
}

/** Smooth path through points: quadratic curves via midpoints. */
function smoothPath(points: Point[]) {
  if (points.length < 3) return `M${points.map((point) => point.map(n).join(" ")).join("L")}`;
  let d = `M${n(points[0][0])} ${n(points[0][1])}`;
  for (let index = 1; index < points.length - 1; index++) {
    const [x, y] = points[index];
    const [nx, ny] = points[index + 1];
    d += `Q${n(x)} ${n(y)} ${n((x + nx) / 2)} ${n((y + ny) / 2)}`;
  }
  const last = points[points.length - 1];
  return `${d}L${n(last[0])} ${n(last[1])}`;
}

const linePath = (points: Point[]) => `M${points.map(([x, y]) => `${n(x)} ${n(y)}`).join("L")}`;

function walk(rng: () => number, start: Point, direction: Point, steps: number, stride: number, wander: number) {
  const points: Point[] = [start];
  let [x, y] = start;
  let heading = direction;
  let bias = 0;
  for (let index = 0; index < steps; index++) {
    bias = bias * 0.75 + (rng() - 0.5) * wander;
    heading = turn(heading, Math.round(bias));
    const length = stride * (0.6 + rng() * 0.8);
    x += heading[0] * length;
    y += heading[1] * length;
    points.push([x, y]);
  }
  return { points, heading };
}

export type MarbleTexture = { veins: string[]; branches: string[] };

export function marbleVeins(seed: string): MarbleTexture {
  return memo(`marble:${seed}`, () => {
    const rng = random(`${seed}:marble`);
    const veins: string[] = [];
    const branches: string[] = [];
    const count = 5 + Math.floor(rng() * 3);
    for (let vein = 0; vein < count; vein++) {
      const start: Point = [rng() * SIZE, rng() * SIZE];
      const direction = normalise([rng() - 0.5, rng() - 0.5]);
      const { points } = walk(rng, start, direction, 48, 26, 5);
      veins.push(smoothPath(points));
      for (let index = 6; index < points.length - 6; index += 5) {
        if (rng() > 0.45) continue;
        const side = rng() > 0.5 ? 1 : -1;
        const along = normalise([points[index + 1][0] - points[index][0], points[index + 1][1] - points[index][1]]);
        const branch = walk(rng, points[index], turn(along, side * (3 + Math.floor(rng() * 4))), 8 + Math.floor(rng() * 10), 18, 4);
        branches.push(smoothPath(branch.points));
      }
    }
    return { veins, branches };
  });
}

function displace(rng: () => number, from: Point, to: Point, depth: number, spread: number): Point[] {
  let points: Point[] = [from, to];
  let amount = spread;
  for (let level = 0; level < depth; level++) {
    const next: Point[] = [points[0]];
    for (let index = 0; index < points.length - 1; index++) {
      const [ax, ay] = points[index];
      const [bx, by] = points[index + 1];
      const [nx, ny] = normalise([by - ay, ax - bx]);
      const offset = (rng() - 0.5) * amount;
      next.push([(ax + bx) / 2 + nx * offset, (ay + by) / 2 + ny * offset], points[index + 1]);
    }
    points = next;
    amount *= 0.55;
  }
  return points;
}

export type LightningTexture = { bolts: { core: string; branches: string[] }[] };

export function lightning(seed: string): LightningTexture {
  return memo(`lightning:${seed}`, () => {
    const rng = random(`${seed}:lightning`);
    const count = 3 + Math.floor(rng() * 2);
    const bolts = Array.from({ length: count }, () => {
      const startX = 80 + rng() * (SIZE - 160);
      const from: Point = [startX, -40 + rng() * 120];
      const to: Point = [startX + (rng() - 0.5) * 500, 650 + rng() * 400];
      const points = displace(rng, from, to, 7, 260);
      const branches: string[] = [];
      const forks = 2 + Math.floor(rng() * 3);
      for (let fork = 0; fork < forks; fork++) {
        const origin = points[8 + Math.floor(rng() * (points.length - 24))];
        const length = 140 + rng() * 220;
        const sideways = (rng() > 0.5 ? 1 : -1) * (0.4 + rng() * 0.8);
        const end: Point = [origin[0] + sideways * length, origin[1] + length * (0.6 + rng() * 0.5)];
        branches.push(linePath(displace(rng, origin, end, 5, 90)));
      }
      return { core: linePath(points), branches };
    });
    return { bolts };
  });
}

export type SmokeTexture = { x: number; y: number; r: number; opacity: number; duration: number; delay: number }[];

export function smoke(seed: string): SmokeTexture {
  return memo(`smoke:${seed}`, () => {
    const rng = random(`${seed}:smoke`);
    return Array.from({ length: 9 }, () => ({
      x: Math.round(rng() * SIZE),
      y: Math.round(rng() * SIZE),
      r: Math.round(120 + rng() * 220),
      opacity: Number((0.1 + rng() * 0.18).toFixed(2)),
      duration: Math.round(18 + rng() * 16),
      delay: -Math.round(rng() * 20),
    }));
  });
}

export type SilkTexture = { d: string; width: number; opacity: number }[];

export function silk(seed: string): SilkTexture {
  return memo(`silk:${seed}`, () => {
    const rng = random(`${seed}:silk`);
    return Array.from({ length: 6 }, (_, ribbon) => {
      const baseY = 90 + ribbon * 160 + rng() * 60;
      const amplitude = 40 + rng() * 90;
      const half = 180 + rng() * 160;
      let x = -200 - rng() * half;
      let up = rng() > 0.5;
      let d = `M${n(x)} ${n(baseY + (up ? -amplitude : amplitude))}`;
      while (x < SIZE + 200) {
        const y0 = baseY + (up ? -amplitude : amplitude);
        const y1 = baseY + (up ? amplitude : -amplitude);
        d += `C${n(x + half * 0.36)} ${n(y0)} ${n(x + half * 0.64)} ${n(y1)} ${n(x + half)} ${n(y1)}`;
        x += half;
        up = !up;
      }
      return { d, width: Math.round(30 + rng() * 70), opacity: Number((0.05 + rng() * 0.09).toFixed(2)) };
    });
  });
}
