import { useEffect } from 'react';

import SceneCanvas from '../../components/scene/SceneCanvas';
import NodeTreeOverlay from '../../components/dev/NodeTreeOverlay';

import GlobalHeader from '../../components/ui/GlobalHeader';
import DialoguePanel from '../../components/ui/DialoguePanel';
import FooterControls from '../../components/ui/FooterControls';
import Preloader from '../../components/ui/Preloader';
import ContactOverlay from '../../components/ui/ContactOverlay';

import { usePointerTracking } from '../../hooks/usePointerTracking';
import { playIntroSequence } from '../../animation/intro';

// ─── Home — the cinematic 3D Deadpool experience ─────────────────────────────
//
// Everything Home-specific lives here rather than in App, so that mounting
// and unmounting this route starts and stops ALL of it:
//   HomePage mounts   -> scene renders, pointer tracking listens, intro plays
//   HomePage unmounts -> WebGL context disposed, useFrame stops, listeners
//                        removed, intro timeline killed
//
// Both usePointerTracking() and playIntroSequence() already return their own
// cleanup, so route lifecycle handles them correctly with no extra work.
export default function HomePage() {
  usePointerTracking();

  useEffect(() => {
    const cleanup = playIntroSequence();
    return cleanup;
  }, []);

  return (
    <div className="app-layout">
      <div data-intro="scene-stage" style={{ position: 'absolute', inset: 0 }}>
        <SceneCanvas />
      </div>

      <div className="ui-layer">
        <div data-intro="header" style={{ opacity: 0 }}>
          <GlobalHeader />
        </div>

        <DialoguePanel />

        <div data-intro="footer-controls" style={{ opacity: 0 }}>
          <FooterControls />
        </div>
      </div>

      <Preloader />
      <NodeTreeOverlay />
      <ContactOverlay />
    </div>
  );
}
