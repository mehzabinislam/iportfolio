/**
 * Shared, MUTABLE journey state. Lives outside React on purpose: scroll
 * triggers write to it, the R3F frame loop reads it, and nothing re-renders
 * per frame. React is only told when the nearest stop changes.
 */
export interface Locomotion {
  x: number;
  y: number;
  z: number;
  /** body yaw (rad) */
  yaw: number;
  /** ground speed in world units / second (>= 0) */
  speed: number;
  /** signed yaw rate, rad / s */
  turnRate: number;
  /** head/gaze yaw relative to the body, rad */
  lookYaw: number;
  /** 0..1 how strongly she is "presenting" the destination (idle at a stop) */
  gesture: number;
  /** 0..1 how settled she is at a stop (1 = standing, 0 = travelling) */
  settled: number;
  /** nearest stop index, and whether she is at one */
  stop: number;
  /** current unique action (index into STOPS) and how far into it she is, 0..1 */
  act: number;
  /** stop whose action is playing (kept while she stands up / departs) */
  actStop: number;
  /** seconds since the action began */
  actTime: number;
  /** true while taking a shortcut route (far trip) */
  hurry: number;
}

export const journey = {
  /** where the page scroll says the journey should be, 0..SEGMENT_COUNT */
  target: 0,
  /** where the character actually is (chases `target` at walking pace) */
  displayed: 0,
  /** signed walking velocity along the route, world units / s */
  velocity: 0,
  /** jump instantly instead of walking (reduced motion / simple mode / tests) */
  snap: false,
  loco: {
    x: 0, y: 0, z: 0, yaw: 0, speed: 0, turnRate: 0,
    lookYaw: 0, gesture: 0, settled: 1, stop: 0, act: 0, actStop: 0, actTime: 0, hurry: 0,
  } as Locomotion,
  /** while a shortcut route is being walked: progress range the camera should blend over */
  detour: null as null | { from: number; to: number; frac: number },
  /** dev only: live action pose + arm rotations for ?debug inspection */
  debugPose: null as null | Record<string, unknown>,
  /** frame-time clamp (s); tests raise it so slow software GL still simulates in real time */
  maxDt: 0.05,
  /** dev only: force the camera (used by ?debug screenshots) */
  debugCam: null as null | { pos: [number, number, number]; look: [number, number, number] },
  /** called (rarely) when the nearest stop changes */
  onStopChange: null as null | ((index: number) => void),
};
