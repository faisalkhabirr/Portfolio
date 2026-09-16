import { Routes, Route } from 'react-router-dom';

import HomePage from './pages/Home/HomePage';
import WorkPage from './pages/Work/WorkPage';
import ProjectDetail from './pages/Work/ProjectDetail';
import AboutPage from './pages/About/AboutPage';

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
//   - DialoguePanel, FooterControls, Preloader, NodeTreeOverlay
//
// GlobalHeader and ContactOverlay ARE shared across Home and About (both
// mount them directly in their own page component) since neither does any
// 3D/heavy work — only Work opts out, using its own WorksNavbar instead.
export default function App() {
  useTheme();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/work" element={<WorkPage />} />
      <Route path="/work/:slug" element={<ProjectDetail />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}
