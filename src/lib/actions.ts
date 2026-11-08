import type { ActionId } from './journey';

/** Target pose for one arm. x: shoulder swing (negative = forward), y: yaw toward the
 *  body's midline/outside, out: abduction (+ = away from the body), e: elbow flexion. */
export interface ArmTarget {
  w: number; // how strongly this arm follows the action (0 = normal walk/idle arm)
  x: number;
  y: number;
  out: number;
  e: number;
}

export interface ActionPose {
  sit: number;
  lean: number;
  headPitch: number;
  smile: number;
  armL: ArmTarget;
  armR: ArmTarget;
  book: number;
  camera: number;
  letter: number;
  flash: number;
}

export function makePose(): ActionPose {
  const arm = (): ArmTarget => ({ w: 0, x: 0, y: 0, out: 0, e: 0 });
  return { sit: 0, lean: 0, headPitch: 0, smile: 0, armL: arm(), armR: arm(), book: 0, camera: 0, letter: 0, flash: 0 };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const sm = (x: number, a: number, b: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function setArm(a: ArmTarget, w: number, x: number, y: number, out: number, e: number) {
  a.w = w; a.x = x; a.y = y; a.out = out; a.e = e;
}

/**
 * The unique thing she does at each stop. `t` is seconds since the action began.
 * Returns the FULL-strength pose; the caller scales by the eased action weight.
 */
export function actionPose(id: ActionId, t: number, o: ActionPose): ActionPose {
  o.sit = 0; o.lean = 0; o.headPitch = 0; o.smile = 0;
  o.book = 0; o.camera = 0; o.letter = 0; o.flash = 0;
  setArm(o.armL, 0, 0, 0, 0, 0);
  setArm(o.armR, 0, 0, 0, 0, 0);

  switch (id) {
    case 'wave': {
      // greets the visitor, then lowers her hand
      const w = sm(t, 0.15, 0.65) * (1 - sm(t, 3.6, 4.2));
      setArm(o.armR, w, -0.15, 0, 2.3, 0.5 + 0.32 * Math.sin(t * 7.5));
      o.smile = 1;
      break;
    }
    case 'sit-write': {
      // sits in the designer chair and writes in the journal
      o.sit = 1;
      o.lean = 0.2;
      o.headPitch = 0.3;
      o.smile = 0.35;
      const w = sm(t, 0.7, 1.5);
      setArm(o.armL, w, -0.78, 0, -0.02, 0.95);
      setArm(o.armR, w, -0.92, 0.18 + 0.05 * Math.sin(t * 4.2), 0.06, 1.05 + 0.07 * Math.sin(t * 8.5));
      break;
    }
    case 'type': {
      // standing at the desk, working on the laptop
      o.lean = 0.12;
      o.headPitch = 0.22;
      o.smile = 0.2;
      const w = sm(t, 0.1, 0.65);
      setArm(o.armL, w, -1.0, 0, -0.04, 0.8 + 0.07 * Math.sin(t * 11));
      setArm(o.armR, w, -1.0, 0, -0.04, 0.8 + 0.07 * Math.sin(t * 11 + 1.9));
      break;
    }
    case 'book': {
      // reaches to the shelf, takes a book, reads it
      const reach = sm(t, 0.1, 0.8);
      const bring = sm(t, 0.9, 1.6);
      const read = sm(t, 1.7, 2.4);
      setArm(o.armR, reach, mix(-1.35, -1.0, bring), 0, mix(0.1, -0.25, bring), mix(0.2, 1.5, bring));
      setArm(o.armL, sm(t, 1.2, 1.8), -1.0, 0, -0.25, 1.45);
      o.book = sm(t, 0.85, 1.15);
      o.headPitch = 0.38 * read;
      o.lean = 0.08 * read;
      o.smile = 0.25;
      break;
    }
    case 'photo': {
      // raises a camera, snaps a photo of the visitor (repeats)
      const tt = t % 5.4;
      const raise = sm(tt, 0.1, 0.85) * (1 - sm(tt, 4.0, 4.7));
      setArm(o.armL, raise, -1.3, 0, -0.38, 1.75);
      setArm(o.armR, raise, -1.3, 0, -0.38, 1.75);
      o.camera = raise;
      o.headPitch = -0.03;
      o.flash = Math.max(0, 1 - Math.abs(tt - 1.6) / 0.13);
      o.smile = 0.6;
      break;
    }
    case 'mail': {
      // opens the mailbox, takes a letter, reads it
      const reach = sm(t, 0.1, 0.8);
      const pull = sm(t, 1.1, 1.9);
      const read = sm(t, 2.0, 2.6);
      setArm(o.armR, reach, mix(-1.25, -0.8, pull), 0, mix(0.1, -0.3, pull), mix(0.3, 1.9, pull));
      setArm(o.armL, sm(t, 1.6, 2.2), -0.8, 0, -0.3, 1.9);
      o.letter = sm(t, 1.0, 1.3);
      o.headPitch = 0.35 * read;
      o.smile = 0.75 * read;
      break;
    }
  }
  return o;
}
