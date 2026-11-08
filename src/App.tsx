import { useState, useEffect, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { PageSection } from './components/layout/PageSection';
import { FallbackView } from './components/ui/FallbackView';
import { IslandScene, WebGLErrorBoundary } from './components/three/IslandScene';
import { Hero } from './sections/Hero';
import { ProjectsSection } from './sections/Projects';
import { AboutSection } from './sections/About';
import { SkillsSection } from './sections/Skills';
import { GallerySection } from './sections/Gallery';
import { ContactSection } from './sections/Contact';
import { useIsMobile } from './hooks/useIsMobile';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useSoundEffects } from './hooks/useSoundEffects';
import { CAMERA_VIEWS } from './lib/constants';
import { journey } from './lib/journeyState';
import { JOURNEY_SECTIONS, SEGMENT_COUNT, pathDistance } from './lib/journey';
import type { SectionId } from './types/portfolio';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

/** Content sections, in journey order (Home is index 0 and has no panel) */
const CONTENT: { id: SectionId; title?: string }[] = [
  { id: 'about' },
  { id: 'projects' },
  { id: 'skills', title: 'Skills & Education' },
  { id: 'gallery' },
  { id: 'contact' },
];

export function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [lowPower, setLowPower] = useState<boolean>(false);
  const [webglFailed, setWebglFailed] = useState<boolean>(false);
  /** null = follow the OS reduced-motion preference; boolean = explicit choice */
  const [walkPref, setWalkPref] = useState<boolean | null>(null);
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const { soundEnabled, toggleSound, playChime, playHover } = useSoundEffects();

  const walkMode = !webglFailed && (walkPref ?? !reducedMotion);

  const lenisRef = useRef<Lenis | null>(null);
  /** index we are deliberately travelling to (nav jump); suppresses highlight flicker */
  const jumpLock = useRef<{ index: number; timer: number } | null>(null);

  // ---------------------------------------------------------------------
  // 1. ONE scroll system: Lenis smooths the window, GSAP's ticker drives it,
  //    ScrollTrigger reads the same scroll position.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (reducedMotion) return;
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  // ---------------------------------------------------------------------
  // 2. Scroll -> journey progress. Each "travel" spacer between two panels
  //    owns one leg of the walk: progress 0..1 while that spacer scrolls
  //    through the viewport. Scrolling back simply runs it in reverse.
  // ---------------------------------------------------------------------
  useEffect(() => {
    journey.snap = !walkMode;
    if (!walkMode) return;

    const spacers = Array.from(document.querySelectorAll<HTMLElement>('[data-travel]'));
    const legs = new Array(SEGMENT_COUNT).fill(0);
    const apply = () => {
      journey.target = legs.reduce((a, b) => a + b, 0);
    };

    const triggers = spacers.map((el) => {
      const i = Number(el.dataset.travel);
      return ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'bottom 45%',
        onUpdate: (self) => {
          legs[i] = self.progress;
          apply();
        },
        onRefresh: (self) => {
          legs[i] = self.progress;
          apply();
        },
      });
    });

    // page height changes (filters, expanding cards, fonts) => re-measure
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    const main = document.querySelector('main');
    if (main) ro.observe(main);

    ScrollTrigger.refresh();
    apply();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      triggers.forEach((t) => t.kill());
    };
  }, [walkMode, webglFailed]);

  // Simple-scroll mode: no walking; the character simply stands at the section in view
  useEffect(() => {
    if (walkMode) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = JOURNEY_SECTIONS.indexOf(entry.target.id as SectionId);
          if (idx >= 0) {
            journey.target = idx;
            setActiveSection(entry.target.id as SectionId);
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );
    JOURNEY_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [walkMode, webglFailed]);

  // Walk mode: nav highlight follows whichever stop she is nearest to
  useEffect(() => {
    journey.onStopChange = (index: number) => {
      const lock = jumpLock.current;
      if (lock) {
        if (index !== lock.index) return; // ignore the stops she walks past en route
        window.clearTimeout(lock.timer);
        jumpLock.current = null;
      }
      setActiveSection(JOURNEY_SECTIONS[index]);
    };
    return () => {
      journey.onStopChange = null;
    };
  }, []);

  // ---------------------------------------------------------------------
  // 3. Navigation / 3D-object clicks: scroll to the section; the journey
  //    system walks her (and the camera) there at a natural pace.
  // ---------------------------------------------------------------------
  const handleSelectSection = useCallback(
    (id: SectionId) => {
      const index = JOURNEY_SECTIONS.indexOf(id);
      if (index < 0) return;
      const el = document.getElementById(id);
      if (!el) return;
      playChime(index > 0 ? 640 : 480);
      setActiveSection(id);

      if (jumpLock.current) window.clearTimeout(jumpLock.current.timer);
      jumpLock.current = {
        index,
        timer: window.setTimeout(() => (jumpLock.current = null), 12000),
      };

      // scroll duration scales with how far she has to walk
      const dist = pathDistance(journey.displayed, index);
      const duration = walkMode ? Math.min(Math.max(dist / 2.1, 1.1), 7) : 1.1;
      const lenis = lenisRef.current;
      if (lenis) {
        lenis.scrollTo(el, { duration, offset: 0 });
      } else {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'auto' });
      }
    },
    [playChime, walkMode]
  );

  // Any manual scroll input releases the nav-jump highlight lock
  useEffect(() => {
    const release = () => {
      if (jumpLock.current) {
        window.clearTimeout(jumpLock.current.timer);
        jumpLock.current = null;
      }
    };
    window.addEventListener('wheel', release, { passive: true });
    window.addEventListener('touchstart', release, { passive: true });
    return () => {
      window.removeEventListener('wheel', release);
      window.removeEventListener('touchstart', release);
    };
  }, []);

  // Escape returns to the start of the journey
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && window.scrollY > 8) handleSelectSection('overview');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSelectSection]);

  // dev/test hook (only with ?debug in the URL)
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('debug')) return;
    (window as unknown as Record<string, unknown>).__journey = journey;
  }, []);

  const label = CAMERA_VIEWS[activeSection]?.label ?? 'Home';

  return (
    <div className="relative w-full min-h-svh bg-[#F8F5EF] text-[#292827]">
      <Navigation
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        lowPower={lowPower}
        onToggleLowPower={() => setLowPower((prev) => !prev)}
        walkMode={walkMode}
        onToggleWalkMode={() => setWalkPref(!walkMode)}
      />

      {/* Screen-reader announcement of where the journey currently is */}
      <div className="sr-only" aria-live="polite">
        {`Now at ${activeSection === 'overview' ? 'the workspace' : label}`}
      </div>

      {/* Fixed 3D island backdrop. Page scroll (not the canvas) drives everything. */}
      <div className="fixed inset-0 z-0" role="img" aria-label="Interactive 3D floating island with a guide character">
        {!webglFailed && (
          <WebGLErrorBoundary fallback={null} onError={() => setWebglFailed(true)}>
            <IslandScene
              activeSection={activeSection}
              onSelectSection={handleSelectSection}
              onHoverObject={playHover}
              isMobile={isMobile}
              reducedMotion={!walkMode}
              lowPower={lowPower}
            />
          </WebGLErrorBoundary>
        )}
      </div>

      <main className="relative z-10 pointer-events-none">
        {/* Home / workspace start */}
        <section id="overview" aria-label="Home" className="relative h-svh min-h-[560px]">
          {webglFailed ? (
            <div className="pointer-events-auto h-full overflow-visible">
              <FallbackView onSelectSection={handleSelectSection} />
            </div>
          ) : (
            <Hero onSelectSection={handleSelectSection} isOverview />
          )}
        </section>

        {CONTENT.map(({ id, title }, i) => {
          const view = CAMERA_VIEWS[id];
          return (
            <div key={id}>
              {/* travel leg: scrolling through this empty stretch walks her to the next stop */}
              {walkMode && <div data-travel={i} aria-hidden="true" className="h-[70svh]" />}
              <PageSection id={id} title={title ?? view.label} subtitle={view.sublabel} still={!walkMode}>
                {id === 'about' && <AboutSection />}
                {id === 'projects' && <ProjectsSection />}
                {id === 'skills' && <SkillsSection />}
                {id === 'gallery' && <GallerySection />}
                {id === 'contact' && <ContactSection />}
              </PageSection>
            </div>
          );
        })}
      </main>

      <Footer isOverview={activeSection === 'overview'} />
    </div>
  );
}

export default App;
