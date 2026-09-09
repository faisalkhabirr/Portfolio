import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import SceneCanvas from './components/scene/SceneCanvas';
import NodeTreeOverlay from './components/dev/NodeTreeOverlay';

import GlobalHeader from './components/ui/GlobalHeader';
import DialoguePanel from './components/ui/DialoguePanel';
import FooterControls from './components/ui/FooterControls';
import Preloader from './components/ui/Preloader';

import { usePointerTracking } from './hooks/usePointerTracking';
import { useTheme } from './hooks/useTheme';
import { playIntroSequence } from './animation/intro';

import WorkPage from './pages/Work/WorkPage';
import ProjectDetail from './pages/Work/ProjectDetail';

// ─── Root App — routing shell + persistent 3D ────────────────────────────────
export default function App() {
  usePointerTracking();
  useTheme();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    // Only play intro if we start on the home route, or if we want it globally.
    // The intro timeline manages opacity of scene/header/etc.
    const cleanup = playIntroSequence();
    return cleanup;
  }, []);

  return (
    <>
      {/* ── PERSISTENT 3D SCENE ── */}
      {/* Visibility hidden when not on home so it doesn't block interactions or burn battery as much */}
      <div 
        className="app-layout"
        style={{
          pointerEvents: 'none'
        }}
      >
        <div
          data-intro="scene-stage"
          style={{ 
            position: 'absolute', 
            inset: 0, 
            opacity: isHome ? 1 : 0, 
            visibility: isHome ? 'visible' : 'hidden',
            transition: 'opacity 0.4s ease, visibility 0.4s ease',
            transform: 'scale(1)' 
          }}
        >
          <SceneCanvas />
        </div>

        {/* ── GLOBAL DOM UI ── */}
        <div className="ui-layer">
          <div data-intro="header" style={{ opacity: 0, pointerEvents: 'auto' }}>
            <GlobalHeader />
          </div>

          <div style={{
            opacity: isHome ? 1 : 0, 
            visibility: isHome ? 'visible' : 'hidden',
            transition: 'opacity 0.4s ease, visibility 0.4s ease',
            pointerEvents: isHome ? 'auto' : 'none'
          }}>
            <DialoguePanel />
            <div data-intro="footer-controls" style={{ opacity: 0 }}>
              <FooterControls />
            </div>
          </div>
        </div>

        <Preloader />
        <NodeTreeOverlay />
      </div>

      {/* ── ROUTES LAYER (Overlays on top of Home) ── */}
      <div style={{ position: 'relative', zIndex: 5 }}>
        <Routes>
          <Route path="/" element={<div />} /> {/* Dummy route for home since it's handled above */}
          <Route path="/work" element={<WorkPage />} />
          <Route path="/work/:slug" element={<ProjectDetail />} />
        </Routes>
      </div>
    </>
  );
}
