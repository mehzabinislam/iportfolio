import * as THREE from 'three';

/**
 * Procedural geometry for the character. Everything is expressed in metres
 * relative to the pelvis (hips) height H0, so the model can be re-posed freely.
 */
export const H0 = 0.87; // rest hip height above the sole
export const THIGH = 0.41;
export const SHIN = 0.41;
export const ANKLE = 0.07;
/** hip height when seated on the designer chair (seat top ~0.6 above the deck) */
export const SIT_HIP = 0.7;

/** Radial fabric folds so cloth doesn't look like a perfect surface of revolution */
export function foldify(geo: THREE.BufferGeometry, amp: number, freq: number, yPhase: number, seed = 0) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const th = Math.atan2(z, x);
    const k =
      1 +
      amp * Math.sin(freq * th + y * yPhase + seed) +
      amp * 0.45 * Math.sin((freq + 3) * th - y * yPhase * 0.7 + seed * 2.3);
    pos.setXYZ(i, x * k, y, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Lower the front of a cape's hem into a soft point and give it a gentle wave */
function pointHem(geo: THREE.BufferGeometry, yHem: number, drop: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y > yHem + 0.06) continue;
    const k = THREE.MathUtils.smoothstep(yHem + 0.06 - y, 0, 0.06);
    const th = Math.atan2(pos.getZ(i), pos.getX(i));
    const front = Math.max(0, Math.sin(th)) ** 2;
    pos.setY(i, y - k * (drop * front - 0.007 * Math.sin(7 * th)));
  }
  geo.computeVertexNormals();
  return geo;
}

/** Soft ambient-occlusion style gradient: darker toward the bottom (and in fold valleys) */
function shade(geo: THREE.BufferGeometry, lo: number, hi: number, dark: number, light: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.clamp((pos.getY(i) - lo) / (hi - lo), 0, 1);
    const v = dark + (light - dark) * t;
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

function lathe(points: [number, number][], segments: number, phiStart = 0, phiLength = Math.PI * 2) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments, phiStart, phiLength);
}

export interface CharacterGeometries {
  skirt: THREE.BufferGeometry;
  torso: THREE.BufferGeometry;
  drape: THREE.BufferGeometry;
  drapeWrap: THREE.BufferGeometry;
  hijabShell: THREE.BufferGeometry;
  hijabRim: THREE.BufferGeometry;
  underBand: THREE.BufferGeometry;
  head: THREE.BufferGeometry;
  upperArm: THREE.BufferGeometry;
  foreArm: THREE.BufferGeometry;
  cuff: THREE.BufferGeometry;
  hand: THREE.BufferGeometry;
  thumb: THREE.BufferGeometry;
  shoe: THREE.BufferGeometry;
  sole: THREE.BufferGeometry;
  thigh: THREE.BufferGeometry;
  shin: THREE.BufferGeometry;
  belt: THREE.BufferGeometry;
  buckle: THREE.BufferGeometry;
  hemTrim: THREE.BufferGeometry;
  hemBand: THREE.BufferGeometry;
  eyeWhite: THREE.BufferGeometry;
  iris: THREE.BufferGeometry;
  pupil: THREE.BufferGeometry;
  glint: THREE.BufferGeometry;
  lash: THREE.BufferGeometry;
  brow: THREE.BufferGeometry;
  nose: THREE.BufferGeometry;
  pin: THREE.BufferGeometry;
  mouth: THREE.BufferGeometry;
  cheek: THREE.BufferGeometry;
  book: THREE.BufferGeometry;
  bookPages: THREE.BufferGeometry;
  camBody: THREE.BufferGeometry;
  camLens: THREE.BufferGeometry;
  letter: THREE.BufferGeometry;
}

// Head geometry constants (head-local space, +z is the face)
const HEAD_R = 0.108;
const SHELL_R = 0.13;
const SHELL_SCALE = new THREE.Vector3(1.0, 1.1, 1.08);
const FACE = { a: 0.079, b: 0.1, cy: -0.01 }; // face opening ellipse (half-width, half-height, centre y)

/** point on the skin ellipsoid at head-local (x, y): z of the surface */
export function skinZ(x: number, y: number) {
  const q = 1 - (x / (HEAD_R * 0.93)) ** 2 - (y / (HEAD_R * 1.06)) ** 2;
  return HEAD_R * 0.98 * Math.sqrt(Math.max(q, 0.0005));
}

export function buildCharacterGeometries(low: boolean): CharacterGeometries {
  const seg = low ? 22 : 40;

  // ---- skirt / abaya (long, flowing, modest) ----
  const skirt = shade(
    foldify(
      lathe(
        [
          [0.118, 0.17], [0.148, 0.09], [0.18, 0.0], [0.205, -0.2], [0.235, -0.45],
          [0.285, -0.68], [0.31, -0.755],
        ],
        seg
      ),
      0.026, 7, 4.5, 1.1
    ),
    -0.76, 0.17, 0.72, 1.0
  );

  // ---- bodice ----
  const torso = lathe(
    [[0.1, 0.0], [0.106, 0.1], [0.124, 0.22], [0.137, 0.33], [0.143, 0.43], [0.118, 0.5]],
    seg
  );
  torso.scale(1.0, 1, 0.78);

  // ---- hijab shoulder drape (cape over shoulders & chest) ----
  const drapeProfile: [number, number][] = [
    [0.082, 0.552], [0.104, 0.51], [0.15, 0.475], [0.205, 0.425], [0.236, 0.365],
    [0.238, 0.325],
  ];
  const drape = shade(pointHem(foldify(lathe(drapeProfile, seg), 0.034, 5, 7, 0.4), 0.325, 0.07), 0.25, 0.6, 0.8, 1.0);
  drape.scale(1.0, 1, 0.86);
  // a second, slightly larger layer wrapped diagonally across the front = layered hijab fold
  const drapeWrap = shade(
    pointHem(
      foldify(
        lathe(
          drapeProfile.map(([r, y]) => [r * 1.075, y - 0.02] as [number, number]),
          seg,
          -0.35,
          Math.PI * 1.05
        ),
        0.04, 4, 6, 1.7
      ),
      0.305,
      0.09
    ),
    0.23, 0.58, 0.82, 1.0
  );
  drapeWrap.scale(1.0, 1, 0.9);

  // ---- hijab head wrap: an ellipsoid shell with the face oval cut out ----
  const sphere = new THREE.SphereGeometry(SHELL_R, low ? 34 : 60, low ? 24 : 40);
  sphere.scale(SHELL_SCALE.x, SHELL_SCALE.y, SHELL_SCALE.z);
  const idx = sphere.index!.array;
  const pos = sphere.attributes.position as THREE.BufferAttribute;
  const keep: number[] = [];
  const c = new THREE.Vector3();
  for (let i = 0; i < idx.length; i += 3) {
    c.set(0, 0, 0);
    for (let k = 0; k < 3; k++) {
      c.x += pos.getX(idx[i + k]);
      c.y += pos.getY(idx[i + k]);
      c.z += pos.getZ(idx[i + k]);
    }
    c.multiplyScalar(1 / 3);
    const inside = c.z > 0.03 && (c.x / FACE.a) ** 2 + ((c.y - FACE.cy) / FACE.b) ** 2 < 1.0;
    if (!inside) keep.push(idx[i], idx[i + 1], idx[i + 2]);
  }
  sphere.setIndex(keep);
  foldify(sphere, 0.014, 4, 9, 2.0);
  const hijabShell = shade(sphere, -0.15, 0.15, 0.86, 1.0);

  // ---- fabric rim that frames the face (hides the cut edge) ----
  const Rx = SHELL_R * SHELL_SCALE.x;
  const Ry = SHELL_R * SHELL_SCALE.y;
  const Rz = SHELL_R * SHELL_SCALE.z;
  const N = 60;
  const ring = (scale: number, dz: number) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      const x = FACE.a * scale * Math.cos(th);
      const y = FACE.cy + FACE.b * scale * Math.sin(th);
      const q = 1 - (x / Rx) ** 2 - (y / Ry) ** 2;
      pts.push(new THREE.Vector3(x, y, Rz * Math.sqrt(Math.max(q, 0.02)) + dz));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  };
  const hijabRim = new THREE.TubeGeometry(ring(1.03, 0), 80, 0.0142, 8, true);
  // the light under-scarf peeking out right at the face edge
  const underBand = new THREE.TubeGeometry(ring(0.955, -0.003), 80, 0.0085, 8, true);

  const head = new THREE.SphereGeometry(HEAD_R, low ? 22 : 36, low ? 16 : 28);
  head.scale(0.93, 1.06, 0.98);

  const upperArm = new THREE.CylinderGeometry(0.037, 0.042, 0.27, low ? 8 : 14);
  upperArm.translate(0, -0.135, 0);
  const foreArm = new THREE.CylinderGeometry(0.033, 0.038, 0.25, low ? 8 : 14);
  foreArm.translate(0, -0.125, 0);
  const cuff = new THREE.CylinderGeometry(0.037, 0.037, 0.032, low ? 8 : 14);
  const hand = new THREE.SphereGeometry(0.031, 14, 12);
  hand.scale(0.9, 1.2, 0.78);
  const thumb = new THREE.CapsuleGeometry(0.0095, 0.026, 4, 8);

  const shoe = new THREE.CapsuleGeometry(0.036, 0.1, 5, 12);
  shoe.rotateX(Math.PI / 2);
  shoe.scale(1.0, 0.78, 1.0);
  const sole = new THREE.CapsuleGeometry(0.037, 0.102, 4, 12);
  sole.rotateX(Math.PI / 2);
  sole.scale(1.02, 0.22, 1.01);

  const thigh = new THREE.CylinderGeometry(0.058, 0.045, THIGH, 10);
  thigh.translate(0, -THIGH / 2, 0);
  const shin = new THREE.CylinderGeometry(0.043, 0.03, SHIN, 10);
  shin.translate(0, -SHIN / 2, 0);

  const belt = new THREE.TorusGeometry(0.122, 0.017, 8, seg);
  belt.rotateX(Math.PI / 2);
  belt.scale(1, 1, 0.8);
  const buckle = new THREE.CylinderGeometry(0.022, 0.022, 0.012, 12);
  buckle.rotateX(Math.PI / 2);

  // dress trim near the hem: cream edge + gold embroidered band
  const hemTrim = new THREE.TorusGeometry(0.31, 0.011, 6, seg * 2);
  hemTrim.rotateX(Math.PI / 2);
  const hemBand = new THREE.TorusGeometry(0.279, 0.006, 6, seg * 2);
  hemBand.rotateX(Math.PI / 2);

  // ---- face ----
  const eyeWhite = new THREE.SphereGeometry(0.0135, 12, 10);
  eyeWhite.scale(1.15, 0.95, 0.42);
  const iris = new THREE.SphereGeometry(0.0108, 12, 10);
  iris.scale(1, 1.05, 0.4);
  const pupil = new THREE.SphereGeometry(0.0055, 10, 8);
  pupil.scale(1, 1.05, 0.4);
  const glint = new THREE.SphereGeometry(0.0034, 8, 6);
  const lash = new THREE.TorusGeometry(0.0138, 0.0017, 5, 14, Math.PI * 0.95);
  lash.rotateZ(Math.PI * 0.025);
  const brow = new THREE.CapsuleGeometry(0.0034, 0.024, 3, 6);
  brow.rotateZ(Math.PI / 2);
  const nose = new THREE.SphereGeometry(0.0095, 10, 8);
  nose.scale(0.95, 1.05, 0.8);
  const pin = new THREE.SphereGeometry(0.014, 10, 8);
  // smile: lower arc of a circle (ends curl up)
  const mouth = new THREE.TorusGeometry(0.0145, 0.0022, 6, 14, Math.PI * 0.8);
  mouth.rotateZ(Math.PI + Math.PI * 0.1);
  const cheek = new THREE.CircleGeometry(0.024, 16);

  // ---- props ----
  const book = new THREE.BoxGeometry(0.17, 0.23, 0.035);
  const bookPages = new THREE.BoxGeometry(0.158, 0.218, 0.03);
  const camBody = new THREE.BoxGeometry(0.13, 0.075, 0.055);
  const camLens = new THREE.CylinderGeometry(0.026, 0.03, 0.04, 16);
  camLens.rotateX(Math.PI / 2);
  const letter = new THREE.BoxGeometry(0.15, 0.1, 0.004);

  return {
    skirt, torso, drape, drapeWrap, hijabShell, hijabRim, underBand, head, upperArm, foreArm, cuff, hand, thumb,
    shoe, sole, thigh, shin, belt, buckle, hemTrim, hemBand, eyeWhite, iris, pupil, glint, lash, brow, nose, pin,
    mouth, cheek, book, bookPages, camBody, camLens, letter,
  };
}

export const HEAD = { R: HEAD_R, FACE };

export function buildCharacterMaterials() {
  const std = (color: string, rough = 0.8, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.02, ...extra });
  return {
    skin: std('#DDA988', 0.58),
    hijab: std('#BDB1D8', 0.88, { side: THREE.DoubleSide, vertexColors: true }),
    hijabLight: std('#CDC3E4', 0.88, { side: THREE.DoubleSide, vertexColors: true }),
    hijabDark: std('#A89BC8', 0.9, { side: THREE.DoubleSide }),
    underBand: std('#EFE7F2', 0.85),
    dress: std('#6B4556', 0.86, { side: THREE.DoubleSide, vertexColors: true }),
    dressPlain: std('#6B4556', 0.86, { side: THREE.DoubleSide }),
    dressDeep: std('#5A3847', 0.9),
    cream: std('#EEE8DE', 0.7),
    gold: std('#D4A373', 0.32, { metalness: 0.65 }),
    shoe: std('#E2CDB0', 0.55),
    sole: std('#7A5A48', 0.8),
    eyeWhite: std('#FBF7F2', 0.4),
    iris: std('#5B3A2E', 0.35),
    pupil: new THREE.MeshBasicMaterial({ color: '#150e0c' }),
    glint: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    lash: new THREE.MeshBasicMaterial({ color: '#2a1d1a' }),
    brow: std('#3B2B26', 0.9),
    lip: std('#C26F69', 0.5),
    cheek: new THREE.MeshBasicMaterial({ color: '#E8938C', transparent: true, opacity: 0.3, depthWrite: false }),
    book: std('#B7835A', 0.7),
    bookPages: std('#F4EBD9', 0.9),
    camBody: std('#262626', 0.5, { metalness: 0.4 }),
    camLens: std('#111418', 0.2, { metalness: 0.6 }),
    letter: std('#FFFFFF', 0.8),
    flash: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }),
  };
}
