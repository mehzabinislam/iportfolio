import * as THREE from 'three';
import { journey } from './journeyState';
import {
  CUSP_STOPS, SEGMENTS, SEGMENT_COUNT, STOPS, pathDistance, planRoute, samplePath, stopYaw, yawToward,
  groundHeight, type Route,
} from './journey';

const { clamp, damp, smoothstep } = THREE.MathUtils;

/** brisk-but-natural top walking speed (world units / s) */
export const V_MAX = 1.9;
/** a far trip (nav jump, scroll to bottom and back) is jogged at up to this */
export const V_HURRY = 4.4;
/** acceleration / braking limits (u/s^2): smooth starts and stops */
export const A_MAX = 3.0;
const A_BRAKE = 2.4;
const A_HURRY = 6.0;
const A_BRAKE_HURRY = 4.2;
/** yaw-rate caps (rad/s) while travelling / while turning in place */
const TURN_MOVING = 5.0;
const TURN_IDLE = 2.6;
/** how long each unique action takes to ease in/out (s) */
const ACT_IN: Record<string, number> = { 'sit-write': 1.15, wave: 0.5, type: 0.7, book: 0.7, photo: 0.7, mail: 0.7 };
const ACT_OUT = 0.8;

export function angleDiff(a: number, b: number) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

const pos = new THREE.Vector3();
const tan = new THREE.Vector3();

interface ActiveRoute extends Route {
  u: number;
  dest: number;
  from: number;
}
const local = {
  idle: 0,
  lastStop: 0,
  yawInit: false,
  route: null as ActiveRoute | null,
  hurry: 0,
};

export function resetLocomotion() {
  local.idle = 0;
  local.lastStop = 0;
  local.yawInit = false;
  local.route = null;
  local.hurry = 0;
  journey.detour = null;
}

/** Move journey progress by a signed WORLD distance along the routed path,
 *  crossing segment boundaries correctly (segments have different lengths). */
function advance(p: number, dist: number): number {
  let rem = dist;
  let guard = 0;
  while (Math.abs(rem) > 1e-9 && guard++ < 16) {
    if (rem > 0) {
      if (p >= SEGMENT_COUNT) return SEGMENT_COUNT;
      const seg = Math.min(Math.floor(p + 1e-9), SEGMENT_COUNT - 1);
      const len = SEGMENTS[seg].length;
      const room = (seg + 1 - p) * len;
      if (rem <= room) { p += rem / len; rem = 0; } else { p = seg + 1; rem -= room; }
    } else {
      if (p <= 0) return 0;
      const seg = Math.max(Math.ceil(p - 1e-9) - 1, 0);
      const len = SEGMENTS[seg].length;
      const room = (p - seg) * len;
      if (-rem <= room) { p += rem / len; rem = 0; } else { p = seg; rem += room; }
    }
  }
  return clamp(p, 0, SEGMENT_COUNT);
}

/** nearest cusp stop strictly between p (exclusive) and target, in the direction of travel */
function nextCuspBetween(p: number, target: number): number | null {
  if (target > p) {
    for (let k = Math.floor(p + 1e-6) + 1; k < target - 1e-6; k++) if (CUSP_STOPS[k]) return k;
  } else if (target < p) {
    for (let k = Math.ceil(p - 1e-6) - 1; k > target + 1e-6; k--) if (CUSP_STOPS[k]) return k;
  }
  return null;
}

/**
 * Turns "where the page scroll says she should be" (journey.target) into
 * believable locomotion. Pure (no React / no GL) so it can be unit-simulated:
 *  - she chases the target in real distance (never teleports),
 *  - acceleration is limited and braking follows a sqrt profile, so starts and
 *    stops are smooth,
 *  - she turns to face her direction of travel BEFORE she sets off,
 *  - FAR trips take the shortest lane route and she jogs, instead of retracing
 *    every leg (this is what stops the long "walking loop" after a big scroll),
 *  - at each stop she performs its unique action, and must finish it (e.g.
 *    stand up from the chair) before she walks away.
 */
export function stepLocomotion(dt: number) {
  const L = journey.loco;

  // ------------------------------------------------------------------
  // A. shortcut-route bookkeeping (only for far trips)
  // ------------------------------------------------------------------
  if (journey.snap) {
    local.route = null;
    journey.detour = null;
  } else {
    const route = local.route;
    const fake = route ? route.from + (route.dest - route.from) * (route.u / route.length) : journey.displayed;
    const dest = journey.target > fake ? Math.floor(journey.target + 1e-6) : Math.ceil(journey.target - 1e-6);
    if (!route) {
      if (Math.abs(dest - fake) >= 1.5 - 1e-6) {
        const r = planRoute(L.x, L.z, dest);
        local.route = { ...r, u: 0, dest, from: journey.displayed };
      }
    } else if (dest !== route.dest) {
      const r = planRoute(L.x, L.z, dest);
      local.route = { ...r, u: 0, dest, from: fake };
    }
  }
  const route = local.route;

  // heading along whichever path she is on
  let tangentYaw: number;
  if (route) {
    route.curve.getTangentAt(clamp(route.u / route.length, 0, 1), tan);
  } else {
    samplePath(journey.displayed, pos, tan);
  }
  tangentYaw = Math.atan2(tan.x, tan.z);

  // ------------------------------------------------------------------
  // B. desired speed
  // ------------------------------------------------------------------
  let intentDir = 0;
  let wantedMagnitude = 0;
  let sign = 1;
  let errD = 0;
  let remaining = 0;
  let cuspLimit = Infinity;

  if (journey.snap) {
    journey.displayed = journey.target;
    journey.velocity = 0;
  } else if (route) {
    remaining = route.length - route.u;
    errD = remaining;
    const cap = V_MAX + clamp((remaining - 2.0) * 0.55, 0, V_HURRY - V_MAX);
    wantedMagnitude = remaining < 1e-4 ? 0 : Math.min(cap, Math.sqrt(2 * A_BRAKE_HURRY * remaining), 7 * remaining);
  } else {
    errD = (journey.target >= journey.displayed ? 1 : -1) * pathDistance(journey.displayed, journey.target);
    const d = Math.abs(errD);
    sign = errD >= 0 ? 1 : -1;
    // small scroll nudges don't make her give up what she is doing
    const threshold = L.act > 0.3 ? 0.35 : 1e-4;
    wantedMagnitude = d < threshold ? 0 : Math.min(V_MAX, Math.sqrt(2 * A_BRAKE * d), 6 * d);

    // a route that doubles back at a stop: she must come to rest there and turn round
    const cusp = nextCuspBetween(journey.displayed, journey.target);
    if (cusp !== null) {
      const dc = pathDistance(journey.displayed, cusp);
      if (dc < 0.012) {
        journey.displayed = cusp;
        journey.velocity = 0;
        wantedMagnitude = 0;
      } else {
        cuspLimit = Math.min(Math.sqrt(2 * A_BRAKE * dc), 6 * dc);
      }
    }
    wantedMagnitude = Math.min(wantedMagnitude, cuspLimit);
  }
  intentDir = wantedMagnitude > 0.08 ? sign : 0;

  // ------------------------------------------------------------------
  // C. unique action easing (sit down / stand up etc.) and gating
  // ------------------------------------------------------------------
  const nearestForAct = route ? route.dest : Math.round(journey.displayed);
  const atRest = !route && L.speed < 0.05 && Math.abs(journey.displayed - nearestForAct) < 0.004;
  const wantsMove = wantedMagnitude > 0.05;
  if (atRest && !wantsMove) local.idle += dt;
  else if (wantsMove || route) local.idle = 0;
  // simple-scroll / reduced-motion mode teleports between stops: restart the action fresh there
  if (journey.snap && nearestForAct !== L.actStop) {
    L.act = 0;
    L.actTime = 0;
    L.actStop = nearestForAct;
    local.idle = 0;
  }
  const actTarget = atRest && !wantsMove && local.idle > 0.35 ? 1 : 0;
  const actName = STOPS[nearestForAct].action;
  const rate = actTarget === 1 ? 1 / (ACT_IN[actName] ?? 0.7) : 1 / ACT_OUT;
  if (actTarget === 1 || L.act > 0.001) {
    if (actTarget === 1 && L.act < 0.001) {
      L.actTime = 0;
      L.actStop = nearestForAct;
    }
    L.act = clamp(L.act + clamp(actTarget - L.act, -rate * dt, rate * dt), 0, 1);
  }
  L.actTime = actTarget === 1 || L.act > 0.02 ? L.actTime + dt : 0;
  // she must be standing again before she walks off
  const actGate = 1 - smoothstep(L.act, 0.02, 0.18);

  // ------------------------------------------------------------------
  // D. integrate speed
  // ------------------------------------------------------------------
  let travelled = 0;
  if (!journey.snap) {
    const headingYaw = route ? tangentYaw : sign > 0 ? tangentYaw : tangentYaw + Math.PI;
    const yawErr = Math.abs(angleDiff(headingYaw, L.yaw));
    const align = 1 - smoothstep(yawErr, 0.45, 1.3);
    const desired = (route ? 1 : sign) * wantedMagnitude * align * actGate;
    const aMax = route ? A_HURRY : A_MAX;
    journey.velocity += clamp(desired - journey.velocity, -aMax * dt, aMax * dt);
    let step = journey.velocity * dt;
    if (route) {
      if (remaining <= Math.abs(step) + 0.02) {
        step = remaining; // close enough: arrive exactly (never stall just short of the stop)
        journey.velocity = 0;
      }
      route.u = clamp(route.u + step, 0, route.length);
      travelled = Math.abs(step);
      if (route.length - route.u < 1e-4) {
        // arrived at the destination stop: hand control back to the chain path
        journey.displayed = route.dest;
        local.route = null;
        journey.detour = null;
        journey.velocity = 0;
      }
    } else {
      if (Math.abs(errD) <= Math.abs(step) + 0.012) {
        step = errD;
        journey.velocity = 0;
      }
      travelled = Math.abs(step);
      journey.displayed = advance(journey.displayed, step);
      if (Math.abs(errD) < 1e-4) journey.velocity = 0;
    }
  }
  journey.displayed = clamp(journey.displayed, 0, SEGMENT_COUNT);

  // ------------------------------------------------------------------
  // E. position + terrain
  // ------------------------------------------------------------------
  const r2 = local.route;
  if (r2) {
    const t = clamp(r2.u / r2.length, 0, 1);
    r2.curve.getPointAt(t, pos);
    r2.curve.getTangentAt(t, tan);
    pos.y = groundHeight(pos.x, pos.z);
    journey.displayed = r2.from + (r2.dest - r2.from) * t;
    journey.detour = { from: r2.from, to: r2.dest, frac: t };
  } else {
    samplePath(journey.displayed, pos, tan);
  }
  L.x = pos.x;
  L.y = pos.y;
  L.z = pos.z;
  L.speed = journey.snap ? 0 : Math.abs(journey.velocity);
  if (L.speed < 0.01) L.speed = 0;
  void travelled;

  // ------------------------------------------------------------------
  // F. nearest stop (nav highlight / camera)
  // ------------------------------------------------------------------
  const nearest = r2 ? r2.dest : Math.round(journey.displayed);
  if (nearest !== local.lastStop) {
    local.lastStop = nearest;
    L.stop = nearest;
    journey.onStopChange?.(nearest);
  }

  // ------------------------------------------------------------------
  // G. facing
  // ------------------------------------------------------------------
  const travelDir = r2 ? (Math.abs(journey.velocity) > 0.03 || intentDir ? 1 : 0)
    : Math.abs(journey.velocity) > 0.03 ? Math.sign(journey.velocity) : intentDir;
  const travelling = travelDir !== 0;
  const heading = Math.atan2(tan.x, tan.z);
  const desiredYaw = travelling ? (travelDir > 0 ? heading : heading + Math.PI) : stopYaw(nearest);
  if (!local.yawInit) {
    L.yaw = desiredYaw;
    local.yawInit = true;
  }
  const dy = angleDiff(desiredYaw, L.yaw);
  const maxTurn = (travelling ? (r2 ? 7.5 : TURN_MOVING) : TURN_IDLE) * dt;
  const turn = clamp(dy * (1 - Math.exp(-(travelling ? 7 : 3.4) * dt)), -maxTurn, maxTurn);
  L.turnRate = dt > 0 ? turn / dt : 0;
  L.yaw += turn;

  // ------------------------------------------------------------------
  // H. gaze & gesture
  // ------------------------------------------------------------------
  const stop = STOPS[nearest];
  const gazeYaw = yawToward(L.x, L.z, stop.look[0], stop.look[2]);
  const settledTarget = L.speed < 0.08 && !r2 && Math.abs(journey.displayed - nearest) < 0.02 ? 1 : 0;
  L.settled = damp(L.settled, settledTarget, 3, dt);
  const lookRel = angleDiff(gazeYaw, L.yaw);
  L.lookYaw = lookRel * L.settled * (nearest === 0 ? 0.6 : 1);
  L.gesture = 0; // superseded by the per-stop actions (L.act / L.actTime)
  L.hurry = damp(L.hurry, r2 ? 1 : 0, 4, dt);
}
