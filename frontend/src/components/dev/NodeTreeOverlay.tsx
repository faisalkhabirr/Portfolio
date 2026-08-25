import { useEffect, useState } from 'react';
import { useAppStore } from '../../state/useAppStore';
import { tokens } from '../../styles/tokens';

// Dev-only. The full structured report always goes to the console
// (console.table groups) — this panel is a quick-glance visual mirror of
// the same data, toggled with the backtick key so it doesn't clutter the
// viewport while you're just looking at the framed model.
export default function NodeTreeOverlay() {
  const inspection = useAppStore((s) => s.inspection);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`') setVisible((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (import.meta.env.PROD || !visible || !inspection) return null;

  return (
    <div style={panelStyle}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: tokens.cyan }}>
        node hierarchy ({inspection.totalMeshes} meshes, {inspection.totalTriangles.toLocaleString()} tris)
        — press ` to hide
      </div>
      {inspection.nodes.map((n, i) => (
        <div key={i} style={{ paddingLeft: n.depth * 12, whiteSpace: 'nowrap' }}>
          <span style={{ color: n.isMesh ? tokens.characterYellow : tokens.textSecondary }}>
            {n.isMesh ? '● ' : n.isBone ? '◇ ' : '○ '}
            {n.name}
          </span>{' '}
          <span style={{ color: tokens.textSecondary }}>
            [{n.type}
            {n.isMesh ? `, ${n.triangleCount} tris` : ''}
            {n.morphTargetNames?.length ? `, morphs: ${n.morphTargetNames.join('/')}` : ''}
            {n.isSkinnedMesh ? ', skinned' : ''}]
          </span>
        </div>
      ))}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  top: 12,
  right: 12,
  maxWidth: 380,
  maxHeight: '70vh',
  overflowY: 'auto',
  padding: '10px 12px',
  borderRadius: 8,
  background: 'rgba(16,19,23,0.85)',
  color: tokens.white,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 11,
  lineHeight: 1.7,
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
};
