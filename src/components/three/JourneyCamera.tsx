import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { journey } from '../../lib/journeyState';
import { SEGMENT_COUNT, STOPS, type CamPose } from '../../lib/journey';

const { damp, clamp, lerp, smoothstep } = THREE.MathUtils;

interface JourneyCameraProps {
  isMobile: boolean;
  reducedMotion: boolean;
  manualOverview: boolean;
}

const focusV = new THREE.Vector3();
const wantPos = new THREE.Vector3();
const wantLook = new THREE.Vector3();
const fwd = new THREE.Vector3();
const right = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function lerpAngleDeg(a: number, b: number, t: number) {
  const d = ((b - a + 540) % 360) - 180;
  return a + d * t;
}

function blendPose(a: CamPose, b: CamPose, t: number) {
  return {
    fx: lerp(a.focus[0], b.focus[0], t),
    fy: lerp(a.focus[1], b.focus[1], t),
    fz: lerp(a.focus[2], b.focus[2], t),
    az: lerpAngleDeg(a.az, b.az, t),
    el: lerp(a.el, b.el, t),
    dist: lerp(a.dist, b.dist, t),
    fov: lerp(a.fov, b.fov, t),
  };
}

/**
 * Cinematic observer. Between stops it glides from one composed shot to the
 * next, following the scroll-driven journey between composed shots.
 * Everything is damped, so there are no cuts or jerks. A tiny pointer drift
 * keeps the world feeling alive.
 */
export function JourneyCamera({ isMobile, reducedMotion, manualOverview }: JourneyCameraProps) {
  const { camera, size, pointer, controls } = useThree();
  const overviewStateSaved = useRef(false);
  const wasAtOverview = useRef(false);
  const stateRef = useRef({
    pos: new THREE.Vector3(),
    look: new THREE.Vector3(),
    fov: 38,
    ox: 0,
    oy: 0,
    init: false,
    px: 0,
    py: 0,
  });

  useFrame((_, dtRaw) => {
    const s = stateRef.current;
    const dt = Math.min(dtRaw, journey.maxDt);
    const cam = camera as THREE.PerspectiveCamera;
    const p = clamp(journey.displayed, 0, SEGMENT_COUNT);
    const settledAtOverview = manualOverview && p <= 0.001 && journey.target <= 0.001;
    const seg = Math.min(Math.floor(p), SEGMENT_COUNT - 1);
    const t = p - seg;
    const e = t * t * (3 - 2 * t); // ease between shots
    const pa = STOPS[seg].cam;
    const pb = STOPS[seg + 1].cam;
    const base = blendPose(pa, pb, e);

    // pull a little further back on small screens so the island still reads
    const mobileK = isMobile ? 1.5 : 1;
    // Slightly widen the shot while moving between sections.
    const transitionWeight = reducedMotion ? 0 : 0.82 * Math.pow(Math.sin(Math.PI * t), 0.8);
    focusV.set(base.fx, base.fy, base.fz);

    const dist = base.dist * mobileK * (1 + 0.22 * transitionWeight);
    const az = THREE.MathUtils.degToRad(base.az);
    const el = THREE.MathUtils.degToRad(base.el);
    wantPos.set(
      focusV.x + dist * Math.sin(az) * Math.cos(el),
      focusV.y + dist * Math.sin(el),
      focusV.z + dist * Math.cos(az) * Math.cos(el)
    );
    wantLook.copy(focusV);

    // subtle pointer drift (desktop only)
    if (!isMobile && !reducedMotion) {
      s.px = damp(s.px, pointer.x, 2.2, dt);
      s.py = damp(s.py, pointer.y, 2.2, dt);
      fwd.copy(wantLook).sub(wantPos).normalize();
      right.crossVectors(fwd, UP).normalize();
      wantPos.addScaledVector(right, s.px * 0.35 * Math.min(dist / 4, 2.5));
      wantPos.y += s.py * 0.18 * Math.min(dist / 4, 2.5);
    }

    const fovWant = base.fov + (isMobile ? 9 : 0);

    if (!s.init || journey.snap || reducedMotion) {
      s.pos.copy(wantPos);
      s.look.copy(wantLook);
      s.fov = fovWant;
      s.init = true;
    } else {
      const k = 3.4;
      s.pos.x = damp(s.pos.x, wantPos.x, k, dt);
      s.pos.y = damp(s.pos.y, wantPos.y, k, dt);
      s.pos.z = damp(s.pos.z, wantPos.z, k, dt);
      s.look.x = damp(s.look.x, wantLook.x, k + 0.6, dt);
      s.look.y = damp(s.look.y, wantLook.y, k + 0.6, dt);
      s.look.z = damp(s.look.z, wantLook.z, k + 0.6, dt);
      s.fov = damp(s.fov, fovWant, 3, dt);
    }

    // Once the composed Overview pose is active, leave the camera to OrbitControls.
    if (settledAtOverview && overviewStateSaved.current && wasAtOverview.current && !journey.debugCam) return;

    cam.position.copy(s.pos);
    cam.lookAt(s.look);
    if (journey.debugCam) {
      cam.position.set(...journey.debugCam.pos);
      cam.lookAt(...journey.debugCam.look);
    }
    if (Math.abs(cam.fov - s.fov) > 0.01) cam.fov = s.fov;

    // ---- keep the subject clear of the content panel via an off-axis shift ----
    // (the panel is on the right on desktop and a bottom sheet on mobile)
    const w0 = size.width;
    const h0 = size.height;
    const arrival = seg === 0 ? smoothstep(t, 0.15, 1) : 1 - 0.4 * Math.sin(Math.PI * t);
    const reach = journey.snap ? (Math.round(p) === 0 ? 0 : 1) : arrival;
    let tx = 0;
    let ty = 0;
    if (isMobile) {
      ty = h0 * 0.27 * reach + h0 * 0.1 * (1 - reach);
    } else {
      const panelW = w0 >= 1024 ? 680 : w0 >= 768 ? 620 : 0;
      // content panel on the right once she is at a stop; at the start, nudge the
      // island right so the hero card (bottom-left) never covers her
      tx = (panelW / 2) * reach - w0 * 0.17 * (1 - reach);
      ty = h0 * 0.13 * (1 - reach);
    }
    s.ox = journey.snap || reducedMotion || settledAtOverview ? tx : damp(s.ox, tx, 4, dt);
    s.oy = journey.snap || reducedMotion || settledAtOverview ? ty : damp(s.oy, ty, 4, dt);
    if (Math.abs(s.ox) > 0.5 || Math.abs(s.oy) > 0.5) {
      cam.setViewOffset(w0, h0, s.ox, s.oy, w0, h0);
    } else if (cam.view) {
      cam.clearViewOffset();
    }
    cam.updateProjectionMatrix();

    if (settledAtOverview && !journey.debugCam) {
      const orbitControls = controls as OrbitControlsImpl | null;
      if (orbitControls) {
        if (!overviewStateSaved.current) {
          orbitControls.saveState();
          overviewStateSaved.current = true;
        } else if (!wasAtOverview.current) {
          orbitControls.reset();
        }
        wasAtOverview.current = true;
      }
    } else {
      wasAtOverview.current = false;
    }
  });

  return null;
}
