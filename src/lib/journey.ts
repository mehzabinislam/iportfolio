import * as THREE from 'three';
import type { SectionId } from '../types/portfolio';

/** Page order == journey order. Index 0 is the Home / workspace start. */
export const JOURNEY_SECTIONS: SectionId[] = ['overview', 'about', 'projects', 'skills', 'gallery', 'contact'];
export const SEGMENT_COUNT = JOURNEY_SECTIONS.length - 1;

// ---------------------------------------------------------------------------
// Terrain: the walkable surface of the island (matches Island.tsx geometry).
// Base grass top sits at y=1.2; the plateau (workspace deck) at y~1.345.
// ---------------------------------------------------------------------------
const PLATEAU = { cx: 0.6, cz: 0.4, rTop: 3.2, rBottom: 3.5, top: 1.345, base: 1.2 };

export function groundHeight(x: number, z: number): number {
  const r = Math.hypot(x - PLATEAU.cx, z - PLATEAU.cz);
  if (r <= PLATEAU.rTop) return PLATEAU.top;
  if (r >= PLATEAU.rBottom) return PLATEAU.base;
  const k = (r - PLATEAU.rTop) / (PLATEAU.rBottom - PLATEAU.rTop);
  return PLATEAU.top + (PLATEAU.base - PLATEAU.top) * k;
}

// ---------------------------------------------------------------------------
// Cinematic camera pose, expressed as an orbit around a focus point.
// ---------------------------------------------------------------------------
export interface CamPose {
  focus: [number, number, number];
  /** degrees, 0 = camera on the +z side of focus, 90 = +x side */
  az: number;
  /** degrees above the horizon */
  el: number;
  dist: number;
  fov: number;
}

export type ActionId = 'wave' | 'sit-write' | 'type' | 'book' | 'photo' | 'mail';

export interface StopDef {
  id: SectionId;
  /** where she stands (world x,z) */
  pos: [number, number];
  /** what she looks at (world point on the destination object) */
  look: [number, number, number];
  /** optional fixed body yaw (otherwise she faces `look`) */
  yaw?: number;
  /** the unique thing she does here */
  action: ActionId;
  cam: CamPose;
}

export const STOPS: StopDef[] = [
  {
    id: 'overview', // workspace start: whole island in view, she waves hello
    pos: [-0.3, 2.6],
    look: [9, 2.2, 9],
    action: 'wave',
    cam: { focus: [0.3, 1.25, 0.5], az: 45, el: 26, dist: 17.5, fov: 38 },
  },
  {
    id: 'about', // sits in the designer chair and writes in the journal
    pos: [0.3, 1.43],
    look: [0.85, 2.25, 0.6],
    yaw: 2.95, // faces the desk (north), a touch toward the notebook
    action: 'sit-write',
    cam: { focus: [0.7, 1.95, 1.1], az: 85, el: 20, dist: 5.0, fov: 34 },
  },
  {
    id: 'projects', // stands at the desk and works on the laptop
    pos: [0.95, 1.25],
    look: [0.2, 2.3, 0.55],
    action: 'type',
    cam: { focus: [0.6, 2.0, 1.1], az: -20, el: 20, dist: 5.4, fov: 34 },
  },
  {
    id: 'skills', // takes a book from the shelf and reads it
    pos: [-0.55, 1.75],
    look: [-0.7, 1.9, 0.8],
    action: 'book',
    cam: { focus: [-0.4, 1.95, 1.6], az: 35, el: 20, dist: 4.7, fov: 34 },
  },
  {
    id: 'gallery', // raises a camera and takes a photo of the visitor
    pos: [2.55, 1.3],
    look: [1.75, 1.95, 1.1],
    action: 'photo',
    cam: { focus: [2.2, 1.95, 1.25], az: -68, el: 24, dist: 5.6, fov: 34 },
  },
  {
    id: 'contact', // opens the mailbox and reads a letter
    pos: [2.15, 2.45],
    look: [2.7, 2.3, 2.7],
    action: 'mail',
    cam: { focus: [2.45, 1.9, 2.4], az: -5, el: 17, dist: 5.0, fov: 34 },
  },
];

/** Hand-routed waypoints between adjacent stops (steer around desk, chair,
 *  pedestal, bookshelf, pergola posts and mailbox). */
const WAYPOINTS: [number, number][][] = [
  /* 0 -> 1 */ [[0.6, 2.55], [1.1, 2.15], [1.1, 1.65], [0.75, 1.42]],
  /* 1 -> 2 */ [[0.75, 1.42]],
  /* 2 -> 3 */ [[1.1, 1.65], [1.1, 2.15], [0.6, 2.55], [0.0, 2.4], [-0.45, 2.25]],
  /* 3 -> 4 */ [[-0.45, 2.25], [0.0, 2.4], [0.6, 2.55], [1.7, 2.55], [2.4, 2.25], [2.8, 1.85]],
  /* 4 -> 5 */ [[2.8, 1.85], [2.4, 2.25]],
];

export interface Segment {
  curve: THREE.CatmullRomCurve3;
  length: number;
}

function buildSegments(): Segment[] {
  return WAYPOINTS.map((via, i) => {
    const a = STOPS[i].pos;
    const b = STOPS[i + 1].pos;
    const pts = [a, ...via, b].map(([x, z]) => new THREE.Vector3(x, 0, z));
    // drop consecutive duplicates (a waypoint that equals the stop)
    const clean = pts.filter((p, k) => k === 0 || p.distanceTo(pts[k - 1]) > 1e-3);
    const curve = new THREE.CatmullRomCurve3(clean, false, 'centripetal');
    curve.arcLengthDivisions = 400;
    return { curve, length: curve.getLength() };
  });
}

export const SEGMENTS: Segment[] = buildSegments();

const _tmp = new THREE.Vector3();

/** Sample the full journey at progress p in [0, SEGMENT_COUNT]. Arc-length
 *  parameterised, so equal progress == equal walked distance. */
export function samplePath(p: number, outPos: THREE.Vector3, outTan: THREE.Vector3) {
  const clamped = THREE.MathUtils.clamp(p, 0, SEGMENT_COUNT);
  const seg = Math.min(Math.floor(clamped), SEGMENT_COUNT - 1);
  const t = clamped - seg;
  const { curve } = SEGMENTS[seg];
  curve.getPointAt(t, outPos);
  curve.getTangentAt(t, outTan);
  outPos.y = groundHeight(outPos.x, outPos.z);
  return { seg, t };
}

/** Stops where the route doubles back on itself (she must stop and turn round). */
export const CUSP_STOPS: boolean[] = (() => {
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return JOURNEY_SECTIONS.map((_, k) => {
    if (k === 0 || k === SEGMENT_COUNT) return false;
    SEGMENTS[k - 1].curve.getTangentAt(1, a);
    SEGMENTS[k].curve.getTangentAt(0, b);
    return a.dot(b) < 0.3; // turn of more than ~70 degrees
  });
})();

/** yaw (rotation about +y) that faces from (x,z) toward a world point */
export function yawToward(x: number, z: number, tx: number, tz: number) {
  return Math.atan2(tx - x, tz - z);
}

export function stopYaw(index: number) {
  const s = STOPS[index];
  return s.yaw ?? yawToward(s.pos[0], s.pos[1], s.look[0], s.look[2]);
}

/** Total walking distance between two progress values (for nav-jump timing) */
export function pathDistance(from: number, to: number) {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  let d = 0;
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const a = Math.max(lo, i);
    const b = Math.min(hi, i + 1);
    if (b > a) d += (b - a) * SEGMENTS[i].length;
  }
  return d;
}

export function poseToCamera(pose: CamPose, out: THREE.Vector3) {
  const az = THREE.MathUtils.degToRad(pose.az);
  const el = THREE.MathUtils.degToRad(pose.el);
  return out.set(
    pose.focus[0] + pose.dist * Math.sin(az) * Math.cos(el),
    pose.focus[1] + pose.dist * Math.sin(el),
    pose.focus[2] + pose.dist * Math.cos(az) * Math.cos(el)
  );
}

export const _scratch = _tmp;

// ---------------------------------------------------------------------------
// Walkable lane graph. Adjacent stops use the hand-routed segments above (that
// is what scroll scrubs through). For FAR trips (a nav jump, or scrolling to
// the bottom and back) she takes the shortest route through this graph
// instead of retracing every leg and doubling back into each stop.
// ---------------------------------------------------------------------------
const GRAPH_NODES: Record<string, [number, number]> = {
  st0: STOPS[0].pos, st1: STOPS[1].pos, st2: STOPS[2].pos,
  st3: STOPS[3].pos, st4: STOPS[4].pos, st5: STOPS[5].pos,
  Lw: [-0.45, 2.25], La: [0.0, 2.4], Lb: [0.6, 2.55], Lc: [1.7, 2.55],
  Ld: [2.4, 2.25], Le: [2.8, 1.85],
  J1: [1.1, 2.15], J2: [1.1, 1.65], J3: [0.75, 1.42],
};
const GRAPH_EDGES: [string, string][] = [
  ['st0', 'La'], ['st0', 'Lb'], ['st0', 'Lw'],
  ['Lw', 'La'], ['La', 'Lb'], ['Lb', 'Lc'], ['Lc', 'Ld'], ['Ld', 'Le'],
  ['Lw', 'st3'], ['Le', 'st4'], ['Ld', 'st5'], ['Lc', 'st5'],
  ['Lb', 'J1'], ['Lc', 'J1'], ['J1', 'J2'], ['J2', 'J3'],
  ['J3', 'st1'], ['J3', 'st2'], ['J2', 'st2'],
];

const ADJ: Record<string, { to: string; w: number }[]> = {};
for (const [a, b] of GRAPH_EDGES) {
  const w = Math.hypot(GRAPH_NODES[a][0] - GRAPH_NODES[b][0], GRAPH_NODES[a][1] - GRAPH_NODES[b][1]);
  (ADJ[a] ??= []).push({ to: b, w });
  (ADJ[b] ??= []).push({ to: a, w });
}

function shortest(from: string, to: string): { path: string[]; cost: number } {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const open = new Set(Object.keys(GRAPH_NODES));
  for (const k of open) { dist[k] = Infinity; prev[k] = null; }
  dist[from] = 0;
  while (open.size) {
    let u = '';
    let best = Infinity;
    for (const k of open) if (dist[k] < best) { best = dist[k]; u = k; }
    if (!u) break;
    open.delete(u);
    if (u === to) break;
    for (const { to: v, w } of ADJ[u] ?? []) {
      if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
    }
  }
  const path: string[] = [];
  for (let k: string | null = to; k; k = prev[k]) path.unshift(k);
  return { path, cost: dist[to] };
}

export interface Route {
  curve: THREE.CatmullRomCurve3;
  length: number;
}

/** Shortest walkable route from an arbitrary point (she is on the chain path)
 *  to a destination stop. Starts from whichever of the two nearest lane nodes
 *  gives the cheaper total route. */
export function planRoute(px: number, pz: number, destStop: number): Route {
  const dest = `st${destStop}`;
  const near = Object.keys(GRAPH_NODES)
    .map((k) => ({ k, d: Math.hypot(GRAPH_NODES[k][0] - px, GRAPH_NODES[k][1] - pz) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 2);
  let best: { path: string[]; cost: number } | null = null;
  for (const n of near) {
    const r = shortest(n.k, dest);
    const cost = n.d + r.cost;
    if (!best || cost < best.cost) best = { path: r.path, cost };
  }
  const pts: THREE.Vector3[] = [new THREE.Vector3(px, 0, pz)];
  for (const k of best!.path) {
    const [x, z] = GRAPH_NODES[k];
    const p = new THREE.Vector3(x, 0, z);
    if (p.distanceTo(pts[pts.length - 1]) > 0.05) pts.push(p);
  }
  if (pts.length < 2) pts.push(new THREE.Vector3(GRAPH_NODES[dest][0], 0, GRAPH_NODES[dest][1]));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  curve.arcLengthDivisions = 300;
  return { curve, length: curve.getLength() };
}
