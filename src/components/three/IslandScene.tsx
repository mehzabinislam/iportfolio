import { Suspense, Component, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { Lighting } from './Lighting';
import { Island } from './Island';
import { Clouds } from './Cloud';
import { AmbientParticles } from './Particles';
import { JourneyDirector } from './JourneyDirector';
import { JourneyCamera } from './JourneyCamera';
import { JourneyDebug } from './JourneyDebug';
import { journey } from '../../lib/journeyState';
import { CAMERA_VIEWS } from '../../lib/constants';
import type { SectionId } from '../../types/portfolio';

// WebGL Error Boundary class component
interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
  onError?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('WebGL Context / 3D Canvas issue caught:', error);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');

function OverviewControls({
  activeSection,
  controlsRef,
}: {
  activeSection: SectionId;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled =
        activeSection === 'overview' && journey.displayed <= 0.001 && journey.target <= 0.001;
    }
  }, -2);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={[0.3, 1.25, 0.5]}
      enableDamping
      dampingFactor={0.08}
      minDistance={5}
      maxDistance={24}
    />
  );
}

interface IslandSceneProps {
  activeSection: SectionId;
  onSelectSection: (id: SectionId) => void;
  onHoverObject?: () => void;
  isMobile: boolean;
  reducedMotion: boolean;
  lowPower: boolean;
}

export function IslandScene({
  activeSection,
  onSelectSection,
  onHoverObject,
  isMobile,
  reducedMotion,
  lowPower,
}: IslandSceneProps) {
  const initialView = CAMERA_VIEWS.overview;
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const handleWheelCapture = () => {
    const controls = controlsRef.current;
    if (!controls?.enabled || !controls.enableZoom) return;

    controls.enableZoom = false;
    queueMicrotask(() => {
      if (controlsRef.current === controls) controls.enableZoom = true;
    });
  };

  return (
    <div className="w-full h-full relative select-none" onWheelCapture={handleWheelCapture}>
      <Canvas
        onPointerMissed={() => {
          if (activeSection !== 'overview') onSelectSection('overview');
        }}
        shadows={!lowPower}
        camera={{
          position: initialView.position,
          fov: isMobile ? 48 : initialView.fov,
          near: 0.2,
          far: 60,
        }}
        dpr={isMobile || lowPower ? [1, 1.25] : [1, 2]}
        gl={{
          antialias: !lowPower,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
      >
        {/* Soft atmospheric depth fog matching warm canvas sky backdrop */}
        <fog attach="fog" args={['#EFEAE4', 16, 45]} />

        {/* Cinematic Multi-angle Lighting */}
        <Lighting lowPower={lowPower} />

        {/* 3D Scene Objects with Suspense */}
        <Suspense fallback={null}>
          {/* Main Floating Island Diorama */}
          <Island
            activeSection={activeSection}
            onSelectSection={onSelectSection}
            onHoverObject={onHoverObject}
            lowPower={lowPower}
          />

          {/* Surrounding Fluffy Floating Clouds */}
          <Clouds count={isMobile || lowPower ? 5 : 8} />

          {/* Warm Ambient Floating Motes / Stardust */}
          <AmbientParticles count={isMobile || lowPower ? 30 : 70} lowPower={lowPower} />

          {/* Scroll-driven camera journey */}
          <JourneyDirector />
          <OverviewControls activeSection={activeSection} controlsRef={controlsRef} />
          <JourneyCamera
            isMobile={isMobile}
            reducedMotion={reducedMotion}
            manualOverview={activeSection === 'overview'}
          />
          {DEBUG && <JourneyDebug />}
        </Suspense>
      </Canvas>
    </div>
  );
}
