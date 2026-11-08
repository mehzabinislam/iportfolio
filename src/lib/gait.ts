import * as THREE from 'three';

const { clamp, damp, smoothstep } = THREE.MathUtils;

export interface GaitState {
  phase: number;
  stepV: number;
}

export interface Feet {
  /** forward offset of the ankle relative to the hip (m) */
  x: number;
  /** ankle lift above the ground (m) */
  lift: number;
  stance: boolean;
}

export interface GaitFrame {
  feet: [Feet, Feet];
  A: number;
  walkGate: number;
  turnGate: number;
}

/**
 * Advance the gait by one frame. The stride phase advances with DISTANCE
 * walked (v*dt / strideLength), and a planted foot slides backward relative to
 * the body at exactly the body speed (linear in stance) -> no foot sliding.
 */
export function stepGait(s: GaitState, v: number, turnRate: number, dt: number, frozen: boolean): GaitFrame {
  const turning = Math.abs(turnRate);
  const walkGate = smoothstep(v, 0.04, 0.16);
  const turnGate = (1 - walkGate) * smoothstep(turning, 0.25, 0.7);
  s.stepV = damp(s.stepV, v, 10, dt);
  const run = clamp((s.stepV - 2.2) / 2.2, 0, 1); // jogging when she is far behind the scroll
  const A = (clamp(0.045 + 0.16 * s.stepV, 0.05, 0.34) + 0.12 * run) * walkGate; // half stride (m)
  const D = 4 * Math.max(A, 0.06); // stride length for one full cycle (m)
  const dPhaseWalk = (v * dt) / D;
  const dPhaseTurn = dt * 0.95;
  s.phase += frozen ? 0 : dPhaseWalk * walkGate + dPhaseTurn * turnGate;
  const lift = (0.07 * walkGate + 0.06 * run + 0.045 * turnGate) * (frozen ? 0 : 1);

  const mk = (i: number): Feet => {
    const u = (((s.phase + i * 0.5) % 1) + 1) % 1;
    if (u < 0.5) return { x: A * (1 - 4 * u), lift: 0, stance: true };
    const k = (u - 0.5) * 2;
    return { x: -A * Math.cos(Math.PI * k), lift: lift * Math.sin(Math.PI * k), stance: false };
  };
  return { feet: [mk(0), mk(1)], A, walkGate, turnGate };
}
