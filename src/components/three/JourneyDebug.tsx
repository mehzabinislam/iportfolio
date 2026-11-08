import { useMemo } from 'react';
import * as THREE from 'three';
import { SEGMENTS, STOPS, groundHeight } from '../../lib/journey';

const COLORS = ['#ff3b3b', '#ff9f1a', '#2ecc71', '#2d9cff', '#b455ff'];

/** Dev-only (?debug): draws the routed walking paths and stop markers. */
export function JourneyDebug() {
  const lines = useMemo(
    () =>
      SEGMENTS.map((s, i) => {
        const pts = s.curve.getSpacedPoints(80).map((p) => new THREE.Vector3(p.x, groundHeight(p.x, p.z) + 0.04, p.z));
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        return { geo, color: COLORS[i] };
      }),
    []
  );
  return (
    <group>
      {lines.map((l, i) => (
        <line key={i}>
          <primitive object={l.geo} attach="geometry" />
          <lineBasicMaterial color={l.color} />
        </line>
      ))}
      {STOPS.map((s, i) => (
        <mesh key={i} position={[s.pos[0], groundHeight(s.pos[0], s.pos[1]) + 0.06, s.pos[1]]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}
