import SceneCanvas from './components/scene/SceneCanvas';
import PerformanceHUD from './components/dev/PerformanceHUD';
import NodeTreeOverlay from './components/dev/NodeTreeOverlay';
import GlobalHeader from './components/ui/GlobalHeader';
import DialoguePanel from './components/ui/DialoguePanel';
import FooterControls from './components/ui/FooterControls';
import { usePointerTracking } from './hooks/usePointerTracking';

// Phase 3 scope: mouse-parallax tracking now lives on top of the Phase 2
// UI shell. usePointerTracking is a hook, not a component — it sets up a
// window-level listener and writes into the store; it renders nothing and
// never re-renders itself. Still no GSAP timelines, no typewriter, no
// glitch transitions — those are later phases.
export default function App() {
  usePointerTracking();

  return (
    <div className="app-layout">
      <SceneCanvas />

      <div className="ui-layer">
        <GlobalHeader />
        <DialoguePanel />
        <FooterControls />
      </div>

      <PerformanceHUD />
      <NodeTreeOverlay />
    </div>
  );
}
