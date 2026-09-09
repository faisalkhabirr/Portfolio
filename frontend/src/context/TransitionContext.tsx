import { createContext, useContext, useRef, useCallback, ReactNode } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlitchTransition, {
  type GlitchTransitionHandle,
} from '../components/transitions/GlitchTransition';

// ─── Context ──────────────────────────────────────────────────────────────────

interface TransitionContextValue {
  navigateTo: (path: string) => void;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

// ─── Provider (mount once at the app root) ────────────────────────────────────

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const glitchRef = useRef<GlitchTransitionHandle>(null);

  const navigateTo = useCallback(
    async (path: string) => {
      if (glitchRef.current) {
        // play() resolves at the midpoint (screen fully covered)
        await glitchRef.current.play();
      }
      navigate(path);
    },
    [navigate]
  );

  return (
    <TransitionContext.Provider value={{ navigateTo }}>
      {children}
      {/* Overlay lives outside the route tree so it persists across navigations */}
      <GlitchTransition ref={glitchRef} />
    </TransitionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTransitionNavigate() {
  const ctx = useContext(TransitionContext);
  if (!ctx) {
    throw new Error(
      'useTransitionNavigate must be used within <TransitionProvider>'
    );
  }
  return ctx.navigateTo;
}
