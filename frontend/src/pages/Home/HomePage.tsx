import { useEffect } from 'react';

import SceneCanvas from '../../components/scene/SceneCanvas';
import NodeTreeOverlay from '../../components/dev/NodeTreeOverlay';

import GlobalHeader from '../../components/ui/GlobalHeader';
import DialoguePanel from '../../components/ui/DialoguePanel';
import Preloader from '../../components/ui/Preloader';
import ContactOverlay from '../../components/ui/ContactOverlay';

import { usePointerTracking } from '../../hooks/usePointerTracking';
import { playIntroSequence } from '../../animation/intro';
import { useAppStore } from '../../state/useAppStore';

// ─── Home — the cinematic 3D Deadpool experience ─────────────────────────────
//
// Everything Home-specific lives here rather than in App, so that mounting
// and unmounting this route starts and stops ALL of it (route isolation,
// unchanged from before).
//
// NEW: on a REVISIT within the same session (visitedViews.home already
// true), this skips <Preloader/> and skips calling playIntroSequence()
// entirely, rendering the header/footer at full opacity immediately
// instead of the 0 -> 1 GSAP entrance. First visit is unaffected — full
// preloader and intro play exactly as before, and the moment intro
// finishes (introComplete flips true), this marks 'home' as visited so
// every subsequent visit this session skips straight to the interactive
// end-state.
export default function HomePage() {
  usePointerTracking();

  const hasVisitedHome = useAppStore((s) => s.visitedViews.home);
  const introComplete = useAppStore((s) => s.introComplete);
  const markVisited = useAppStore((s) => s.markVisited);
  const modelLoaded = useAppStore((s) => s.modelLoaded);

  // Clean up modelLoaded on unmount so a revisit starts from false, allowing
  // us to wait for the model to be fully ready before fading it in.
  useEffect(() => {
    return () => {
      useAppStore.getState().setModelLoaded(false);
    };
  }, []);

  // Only play the intro timeline on a genuinely first visit this session.
  useEffect(() => {
    if (hasVisitedHome) return;
    const cleanup = playIntroSequence();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The moment intro completes for the first time, remember it — every
  // later mount of HomePage this session will see hasVisitedHome = true.
  useEffect(() => {
    if (introComplete && !hasVisitedHome) {
      markVisited('home');
    }
  }, [introComplete, hasVisitedHome, markVisited]);

  return (
    <div className="app-layout">
      <div 
        data-intro="scene-stage" 
        style={{ 
          position: 'absolute', 
          inset: 0,
          opacity: hasVisitedHome ? (modelLoaded ? 1 : 0) : undefined,
          transition: hasVisitedHome ? 'opacity 0.6s ease-out' : undefined
        }}
      >
        <SceneCanvas />
      </div>

      <div className="ui-layer">
        {/* On revisit, render at opacity 1 directly instead of the
            data-intro-driven 0 -> 1 GSAP animation, since that animation
            is never triggered (playIntroSequence didn't run above). */}
        <div data-intro={hasVisitedHome ? undefined : 'header'} style={{ opacity: hasVisitedHome ? 1 : 0 }}>
          <GlobalHeader />
        </div>

        <DialoguePanel />
      </div>

      {/* Only mount the preloader on a genuine first visit this session. */}
      {!hasVisitedHome && <Preloader />}

      <NodeTreeOverlay />
      <ContactOverlay />
    </div>
  );
}
