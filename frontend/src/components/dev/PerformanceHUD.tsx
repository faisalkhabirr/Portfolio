import { useEffect, useState } from 'react';
import { useAppStore } from '../../state/useAppStore';
import { tokens } from '../../styles/tokens';

export default function PerformanceHUD() {
  const perf = useAppStore((s) => s.perf);
  const modelLoaded = useAppStore((s) => s.modelLoaded);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (import.meta.env.PROD) return null;

  return (
    <div style={panelStyle}>
      <Row label="viewport" value={`${viewport.w} × ${viewport.h}`} />
      <Row label="dpr" value={window.devicePixelRatio.toFixed(2)} />
      <Row label="fps" value={String(perf.fps)} />
      <Row label="draw calls" value={String(perf.drawCalls)} />
      <Row label="triangles" value={perf.triangles.toLocaleString()} />
      <Row label="model" value={modelLoaded ? 'loaded' : 'loading…'} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: tokens.textSecondary }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 12,
  left: 12,
  minWidth: 170,
  padding: '8px 10px',
  borderRadius: 8,
  background: 'rgba(16,19,23,0.72)',
  color: tokens.white,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 11,
  lineHeight: 1.6,
  pointerEvents: 'none',
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
};
