import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { journey } from '../../../lib/journeyState';
import { stepGait } from '../../../lib/gait';
import { STOPS } from '../../../lib/journey';
import { actionPose, makePose } from '../../../lib/actions';
import {
  H0, THIGH, SHIN, ANKLE, SIT_HIP, skinZ,
  buildCharacterGeometries, buildCharacterMaterials,
} from './characterGeometry';

interface CharacterProps {
  /** lower poly + skip cosmetic extras */
  lowDetail?: boolean;
  /** freeze secondary motion (still follows the journey position) */
  reducedMotion?: boolean;
}

const { damp, clamp, lerp } = THREE.MathUtils;
const DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
const LEFF = 0.8; // effective leg length (never fully straight)

/**
 * The hijabi guide. Reusable & presentation-only: it reads the shared
 * locomotion state (position / yaw / speed / turn rate / gaze / action) every
 * frame and derives its own pose. It never touches React state.
 *
 * Gait: stride phase advances with DISTANCE walked and each foot is solved
 * with two-bone IK onto a ground-locked target -> no foot sliding. Each stop
 * has a unique action (sit & write, type, read a book, take a photo, read a
 * letter, wave) layered on top via lib/actions.ts.
 */
export const Character = memo(function Character({ lowDetail = false, reducedMotion = false }: CharacterProps) {
  const geo = useMemo(() => buildCharacterGeometries(lowDetail), [lowDetail]);
  const mat = useMemo(() => buildCharacterMaterials(), []);

  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);
  useEffect(() => () => Object.values(mat).forEach((m) => m.dispose()), [mat]);

  const root = useRef<THREE.Group>(null);
  const hips = useRef<THREE.Group>(null);
  const upper = useRef<THREE.Group>(null);
  const skirt = useRef<THREE.Group>(null);
  const drape = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const propBook = useRef<THREE.Group>(null);
  const propCam = useRef<THREE.Group>(null);
  const propLetter = useRef<THREE.Group>(null);
  const flash = useRef<THREE.Mesh>(null);
  const legs = [
    { thigh: useRef<THREE.Group>(null), shin: useRef<THREE.Group>(null), foot: useRef<THREE.Group>(null) },
    { thigh: useRef<THREE.Group>(null), shin: useRef<THREE.Group>(null), foot: useRef<THREE.Group>(null) },
  ];
  const arms = [
    { sh: useRef<THREE.Group>(null), el: useRef<THREE.Group>(null) },
    { sh: useRef<THREE.Group>(null), el: useRef<THREE.Group>(null) },
  ];

  const g = useRef({
    phase: 0,
    stepV: 0,
    pitch: 0,
    roll: 0,
    hipH: H0,
    time: 0,
    sit: 0,
    pose: makePose(),
  });

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, journey.maxDt);
    const L = journey.loco;
    const s = g.current;
    if (!root.current || !hips.current || !upper.current) return;
    s.time += dt;

    // ---- place the whole character on the path ----
    root.current.position.set(L.x, L.y, L.z);
    root.current.rotation.y = L.yaw;

    // ---- unique action layer ----
    const wRaw = reducedMotion ? (L.act > 0.5 ? 1 : 0) : L.act;
    const w = wRaw * wRaw * (3 - 2 * wRaw);
    const tAct = reducedMotion ? 3.2 : L.actTime;
    const pose = actionPose(STOPS[L.actStop].action, tAct, s.pose);
    const sit = pose.sit * w;
    s.sit = sit;

    // ---- gait from actual ground speed (distance-driven => no foot sliding) ----
    const v = L.speed;
    const { feet, walkGate } = stepGait(s, v, L.turnRate, dt, reducedMotion);
    // seated: both feet planted forward on the floor
    for (let i = 0; i < 2; i++) {
      feet[i].x = lerp(feet[i].x, 0.38, sit);
      feet[i].lift = lerp(feet[i].lift, 0, sit);
    }

    // hip height follows the supporting leg => natural bob, planted foot stays planted
    const stanceFoot = feet.find((f) => f.stance) ?? feet[0];
    const walkHipH = ANKLE + Math.sqrt(Math.max(LEFF * LEFF - stanceFoot.x * stanceFoot.x, 0.2));
    const targetHipH = lerp(walkHipH, SIT_HIP, sit);
    s.hipH = damp(s.hipH, targetHipH, 30, dt);
    hips.current.position.y = s.hipH;

    // ---- two-bone IK for each leg ----
    for (let i = 0; i < 2; i++) {
      const ik = legs[i];
      if (!ik.thigh.current || !ik.shin.current || !ik.foot.current) continue;
      const tz = feet[i].x;
      const ty = ANKLE + feet[i].lift - s.hipH;
      const d = Math.min(Math.hypot(tz, ty), THIGH + SHIN - 1e-3);
      const base = Math.atan2(tz, -ty);
      const alpha = Math.acos(clamp((THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d), -1, 1));
      const gamma = Math.acos(clamp((THIGH * THIGH + SHIN * SHIN - d * d) / (2 * THIGH * SHIN), -1, 1));
      const thighFwd = base + alpha;
      const knee = Math.PI - gamma;
      ik.thigh.current.rotation.x = -thighFwd;
      ik.thigh.current.rotation.z = (i === 0 ? -1 : 1) * 0.06 * sit;
      ik.shin.current.rotation.x = knee;
      const toe = feet[i].stance ? 0 : 0.18 * Math.sin(Math.PI * (((s.phase + i * 0.5) % 1) - 0.5) * 2);
      ik.foot.current.rotation.x = thighFwd - knee - toe;
    }

    // ---- upper body ----
    const idle = 1 - walkGate;
    const breathe = reducedMotion ? 0 : Math.sin(s.time * 1.9);
    const run = clamp((v - 2.2) / 2.2, 0, 1);
    const targetPitch = 0.025 + 0.07 * clamp(v / 2, 0, 1) + 0.16 * run;
    s.pitch = damp(s.pitch, targetPitch, 6, dt);
    s.roll = damp(s.roll, clamp(-L.turnRate * 0.05, -0.08, 0.08), 6, dt);
    upper.current.rotation.x = s.pitch + pose.lean * w;
    upper.current.rotation.z = s.roll;
    upper.current.scale.y = 1 + 0.006 * breathe;
    const sway = reducedMotion ? 0 : Math.sin(s.time * 0.8) * 0.012 * idle * (1 - sit);
    hips.current.rotation.y = (feet[0].x - feet[1].x) * 0.35 * walkGate * (1 - sit);
    hips.current.rotation.z = sway;
    upper.current.rotation.y = -hips.current.rotation.y * 1.4;

    // ---- arms: counter-swing (+run), then the action pose on top ----
    const swingK = (1.25 + 0.5 * run) * walkGate;
    const t = s.time;
    for (let i = 0; i < 2; i++) {
      const a = arms[i];
      if (!a.sh.current || !a.el.current) continue;
      const outSign = i === 0 ? -1 : 1; // + = away from the body
      const opp = feet[1 - i].x;
      let sx = -opp * swingK;
      let sz = outSign * (0.06 + 0.025 * breathe * idle);
      let sy = 0;
      let ey = 0.12 + (0.35 + 0.6 * run) * clamp(Math.max(0, -sx) * 2.2, 0, 1) * walkGate;
      const tgt = i === 0 ? pose.armL : pose.armR;
      const tw = tgt.w * w;
      if (tw > 0.001) {
        sx = lerp(sx, tgt.x, tw);
        sz = lerp(sz, outSign * tgt.out, tw);
        sy = tgt.y * tw * (i === 0 ? -1 : 1);
        ey = lerp(ey, tgt.e, tw);
      }
      a.sh.current.rotation.x = sx;
      a.sh.current.rotation.y = sy;
      a.sh.current.rotation.z = sz;
      a.el.current.rotation.x = -ey;
    }

    if (DEBUG) {
      journey.debugPose = {
        w, act: L.act, actTime: L.actTime, actStop: L.actStop, armR: pose.armR,
        shR: arms[1].sh.current ? [arms[1].sh.current.rotation.x, arms[1].sh.current.rotation.y, arms[1].sh.current.rotation.z] : null,
        elR: arms[1].el.current ? arms[1].el.current.rotation.x : null,
      };
    }

    // ---- head & face ----
    if (head.current) {
      const look = clamp(L.lookYaw, -1.0, 1.0);
      head.current.rotation.y = damp(head.current.rotation.y, look, 7, dt);
      head.current.rotation.x = damp(head.current.rotation.x, 0.03 + pose.headPitch * w, 5, dt);
      head.current.rotation.z = reducedMotion ? 0 : Math.sin(t * 0.7) * 0.02 * idle;
    }
    if (mouth.current) {
      const smile = 0.25 + pose.smile * w;
      mouth.current.scale.set(1 + 0.22 * smile, 1 + 0.45 * smile, 1);
    }

    // ---- props she is holding ----
    const showProp = (ref: React.RefObject<THREE.Group | null>, amount: number) => {
      if (!ref.current) return;
      const k = clamp(amount * w, 0, 1);
      ref.current.visible = k > 0.02;
      ref.current.scale.setScalar(Math.max(k, 0.001));
    };
    showProp(propBook, pose.book);
    showProp(propCam, pose.camera);
    showProp(propLetter, pose.letter);
    if (flash.current) {
      const m = flash.current.material as THREE.MeshBasicMaterial;
      m.opacity = pose.flash * w * 0.95;
      flash.current.scale.setScalar(1 + pose.flash * 1.6);
    }

    // ---- cloth: hem and hijab trail behind motion; skirt drapes over the knees when seated ----
    if (skirt.current) {
      const sw = Math.sin(s.phase * Math.PI * 2);
      const move = reducedMotion ? 0 : 1;
      skirt.current.rotation.x =
        -1.12 * sit + move * (-0.05 * clamp(v / 2, 0, 1) - 0.06 * run + sw * 0.015 * walkGate);
      skirt.current.scale.set(1 + 0.025 * sw * walkGate * move, 1 - 0.47 * sit, 1 - 0.025 * sw * walkGate * move);
    }
    if (drape.current && !reducedMotion) {
      drape.current.rotation.x = -0.035 * clamp(v / 2, 0, 1) - 0.05 * run + Math.sin(t * 1.3) * 0.006;
      drape.current.rotation.z = Math.sin(t * 1.1 + 1) * 0.008 + L.turnRate * 0.01;
    }
  });

  const eyeX = 0.037;
  const eyeY = 0.016;

  return (
    <group ref={root} dispose={null}>
      {/* HIPS: everything below the waist hangs from here */}
      <group ref={hips} position={[0, H0, 0]}>
        {/* Legs (IK driven) */}
        {[-1, 1].map((side, i) => (
          <group key={side} ref={legs[i].thigh} position={[side * 0.085, 0, 0]}>
            <mesh geometry={geo.thigh} material={mat.dressDeep} castShadow />
            <group ref={legs[i].shin} position={[0, -THIGH, 0]}>
              <mesh geometry={geo.shin} material={mat.dressDeep} castShadow />
              <group ref={legs[i].foot} position={[0, -SHIN, 0]}>
                <mesh geometry={geo.shoe} material={mat.shoe} position={[0, -0.032, 0.04]} castShadow />
                <mesh geometry={geo.sole} material={mat.sole} position={[0, -0.062, 0.04]} />
              </group>
            </group>
          </group>
        ))}

        {/* Long flowing abaya skirt with a cream hem and gold embroidered band */}
        <group ref={skirt}>
          <mesh geometry={geo.skirt} material={mat.dress} castShadow receiveShadow />
          <mesh geometry={geo.hemTrim} material={mat.cream} position={[0, -0.752, 0]} scale={[1.02, 1, 1.02]} />
          <mesh geometry={geo.hemBand} material={mat.gold} position={[0, -0.63, 0]} scale={[1.03, 1, 1.03]} />
        </group>

        {/* UPPER BODY */}
        <group ref={upper}>
          <mesh geometry={geo.torso} material={mat.dressPlain} castShadow />
          <mesh geometry={geo.belt} material={mat.cream} position={[0, 0.17, 0]} />
          <mesh geometry={geo.buckle} material={mat.gold} position={[0, 0.17, 0.1]} />

          {/* Arms */}
          {[-1, 1].map((side, i) => (
            <group key={side} ref={arms[i].sh} position={[side * 0.158, 0.45, 0]} rotation-order="YXZ">
              <mesh geometry={geo.upperArm} material={mat.dressPlain} castShadow />
              <group ref={arms[i].el} position={[0, -0.27, 0]}>
                <mesh geometry={geo.foreArm} material={mat.dressPlain} castShadow />
                <mesh geometry={geo.cuff} material={mat.cream} position={[0, -0.245, 0]} />
                <mesh geometry={geo.hand} material={mat.skin} position={[0, -0.285, 0]} castShadow />
                <mesh
                  geometry={geo.thumb}
                  material={mat.skin}
                  position={[-side * 0.022, -0.275, 0.012]}
                  rotation={[0.2, 0, side * 0.45]}
                />
              </group>
            </group>
          ))}

          {/* Hijab drape over shoulders + chest, with a second layered wrap */}
          <group ref={drape}>
            <mesh geometry={geo.drape} material={mat.hijab} castShadow />
            <mesh geometry={geo.drapeWrap} material={mat.hijabLight} castShadow />
            <mesh geometry={geo.pin} material={mat.gold} position={[0.075, 0.44, 0.1]} />
          </group>

          {/* Things she holds (shown by the current action) */}
          <group ref={propBook} position={[0, 0.4, 0.27]} rotation={[-0.35, 0, 0]} visible={false}>
            <mesh geometry={geo.book} material={mat.book} castShadow />
            <mesh geometry={geo.bookPages} material={mat.bookPages} position={[0.004, 0, 0.002]} />
          </group>
          <group ref={propCam} position={[0, 0.6, 0.27]} visible={false}>
            <mesh geometry={geo.camBody} material={mat.camBody} castShadow />
            <mesh geometry={geo.camLens} material={mat.camLens} position={[0, 0, 0.045]} />
            <mesh ref={flash} position={[0, 0, 0.075]} material={mat.flash}>
              <sphereGeometry args={[0.05, 12, 10]} />
            </mesh>
          </group>
          <group ref={propLetter} position={[0, 0.56, 0.3]} rotation={[-0.95, 0, 0]} visible={false}>
            <mesh geometry={geo.letter} material={mat.letter} castShadow />
          </group>

          {/* HEAD */}
          <group ref={head} position={[0, 0.67, 0]} scale={1.06}>
            <mesh geometry={geo.head} material={mat.skin} castShadow />
            {[-1, 1].map((s) => {
              const ez = skinZ(s * eyeX, eyeY);
              return (
                <group key={s}>
                  <mesh geometry={geo.eyeWhite} material={mat.eyeWhite} position={[s * eyeX, eyeY, ez + 0.0015]} />
                  <mesh geometry={geo.iris} material={mat.iris} position={[s * eyeX, eyeY, ez + 0.0038]} />
                  <mesh geometry={geo.pupil} material={mat.pupil} position={[s * eyeX, eyeY, ez + 0.0058]} />
                  <mesh geometry={geo.glint} material={mat.glint} position={[s * eyeX + 0.0035, eyeY + 0.0045, ez + 0.0075]} />
                  <mesh geometry={geo.lash} material={mat.lash} position={[s * eyeX, eyeY + 0.0015, ez + 0.0045]} rotation={[0, 0, 0]} />
                  <mesh
                    geometry={geo.brow}
                    material={mat.brow}
                    position={[s * (eyeX + 0.002), eyeY + 0.029, skinZ(s * eyeX, eyeY + 0.029) + 0.0015]}
                    rotation={[0, 0, s * -0.14]}
                  />
                  {!lowDetail && (
                    <mesh
                      geometry={geo.cheek}
                      material={mat.cheek}
                      position={[s * 0.056, -0.03, skinZ(s * 0.056, -0.03) + 0.002]}
                      rotation={[0, s * 0.55, 0]}
                    />
                  )}
                </group>
              );
            })}
            <mesh geometry={geo.nose} material={mat.skin} position={[0, -0.014, skinZ(0, -0.014) + 0.0055]} />
            <mesh
              ref={mouth}
              geometry={geo.mouth}
              material={mat.lip}
              position={[0, -0.052, skinZ(0, -0.052) + 0.0022]}
            />

            {/* Hijab wrap + framing rim + light under-scarf */}
            <mesh geometry={geo.hijabShell} material={mat.hijab} position={[0, 0.0, -0.008]} castShadow />
            <mesh geometry={geo.hijabRim} material={mat.hijabDark} position={[0, 0.0, -0.008]} />
            <mesh geometry={geo.underBand} material={mat.underBand} position={[0, 0.0, -0.008]} />
          </group>
        </group>
      </group>
    </group>
  );
});
