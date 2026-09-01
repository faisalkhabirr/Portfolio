import { useEffect } from 'react';

import SceneCanvas from './components/scene/SceneCanvas';
import PerformanceHUD from './components/dev/PerformanceHUD';
import NodeTreeOverlay from './components/dev/NodeTreeOverlay';

import GlobalHeader from './components/ui/GlobalHeader';
import DialoguePanel from './components/ui/DialoguePanel';
import FooterControls from './components/ui/FooterControls';
import Preloader from './components/ui/Preloader';

import { usePointerTracking } from './hooks/usePointerTracking';
import { playIntroSequence } from './animation/intro';

export default function App() {
  usePointerTracking();

  useEffect(() => {
    const cleanup = playIntroSequence();

    return cleanup;
  }, []);

  return (
    <div className="app-layout">

      {/* -------------------------------------------------------------- */}
      {/* 3D SCENE                                                       */}
      {/* -------------------------------------------------------------- */}

      <div
        data-intro="scene-stage"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 1,
          transform: 'scale(1)',
        }}
      >
        <SceneCanvas />
      </div>


      {/* -------------------------------------------------------------- */}
      {/* DOM UI                                                         */}
      {/* -------------------------------------------------------------- */}

      <div className="ui-layer">

        <div
          data-intro="header"
          style={{
            opacity: 0,
          }}
        >
          <GlobalHeader />
        </div>


        <DialoguePanel />


        <div
          data-intro="footer-controls"
          style={{
            opacity: 0,
          }}
        >
          <FooterControls />
        </div>

      </div>


      {/* -------------------------------------------------------------- */}
      {/* INTRO / DEVELOPMENT                                             */}
      {/* -------------------------------------------------------------- */}

      <Preloader />

      {/* <PerformanceHUD /> */}

      <NodeTreeOverlay />

    </div>
  );
}