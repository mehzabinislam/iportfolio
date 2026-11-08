import { useFrame } from '@react-three/fiber';
import { journey } from '../../lib/journeyState';
import { stepLocomotion } from '../../lib/locomotion';

/** Drives the shared locomotion state every frame (see lib/locomotion.ts). */
export function JourneyDirector() {
  useFrame((_, dtRaw) => {
    stepLocomotion(Math.min(dtRaw, journey.maxDt));
  });
  return null;
}
