import { Routes, Route } from 'react-router-dom';

import HomePage from './pages/Home/HomePage';
import WorkPage from './pages/Work/WorkPage';
import ProjectDetail from './pages/Work/ProjectDetail';

import { useTheme } from './hooks/useTheme';

// ─── Root App — routing only ─────────────────────────────────────────────────
//
// Theme is global because it belongs to the entire site.
//
// Deliberately NOT here (they belong to Home alone, and must mount/unmount
// with the Home route so their work stops when you navigate away):
//   - SceneCanvas / Three.js renderer
//   - usePointerTracking()
//   - playIntroSequence()
//   - GlobalHeader, DialoguePanel, FooterControls, Preloader, NodeTreeOverlay
//
// Hiding the 3D scene with opacity/visibility does NOT stop the R3F render
// loop — that was the original cause of ~90% CPU on /work.
export default function App() {
  useTheme();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/work" element={<WorkPage />} />
      <Route path="/work/:slug" element={<ProjectDetail />} />
    </Routes>
  );
}
