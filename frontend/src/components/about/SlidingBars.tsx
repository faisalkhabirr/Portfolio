import styles from './SlidingBars.module.css';

interface Segment {
  width: string;
  color: string;
  pattern?: boolean;
}

interface RowConfig {
  height: number;
  /** Right-side inset for the whole row — creates the jagged left edges. */
  offset: string;
  /** 1-2 segments rendered touching, left-to-right, no gap between them —
      matches the reference's two-tone rows (e.g. dark block butted
      directly against a blue block) rather than one flat color per row. */
  segments: Segment[];
}

const DARK = '#4E5965';
const LIGHT = '#F0F2F0';
const MID = '#8A9399';
const ACCENT = 'var(--accent-color, #E8543A)';

// Dark-dominant, two-tone rows — matches the reference's mostly-black
// palette with occasional accent-color segments and striped texture,
// rows butted together with tight vertical spacing for a dense overlap.
const ROWS: RowConfig[] = [
  { height: 32, offset: '14%', segments: [{ width: '34%', color: DARK }, { width: '20%', color: ACCENT }] },
  { height: 42, offset: '0%', segments: [{ width: '68%', color: MID, pattern: true }] },
  { height: 46, offset: '6%', segments: [{ width: '30%', color: DARK }] },
  { height: 40, offset: '12%', segments: [{ width: '26%', color: DARK }, { width: '38%', color: MID, pattern: true }] },
  { height: 24, offset: '0%', segments: [{ width: '22%', color: DARK }, { width: '30%', color: ACCENT }] },
  { height: 36, offset: '8%', segments: [{ width: '18%', color: DARK }, { width: '34%', color: LIGHT }] },
  { height: 48, offset: '26%', segments: [{ width: '46%', color: DARK }] },
  { height: 20, offset: '0%', segments: [{ width: '20%', color: MID }, { width: '36%', color: ACCENT }] },
  { height: 32, offset: '10%', segments: [{ width: '44%', color: MID, pattern: true }, { width: '20%', color: DARK }] },
  { height: 34, offset: '9%', segments: [{ width: '46%', color: DARK }, { width: '68%', color: LIGHT, pattern: true }] },
  { height: 30, offset: '26%', segments: [{ width: '38%', color: DARK }] },
  { height: 22, offset: '12%', segments: [{ width: '38%', color: DARK }, { width: '24%', color: ACCENT }] },
  { height: 34, offset: '7%', segments: [{ width: '52%', color: MID, pattern: true }] },
  { height: 46, offset: '12%', segments: [{ width: '40%', color: DARK }, { width: '30%', color: LIGHT }] },
  { height: 24, offset: '25%', segments: [{ width: '50%', color: DARK }] },
  { height: 50, offset: '10%', segments: [{ width: '72%', color: DARK }, { width: '48%', color: ACCENT }] },
  { height: 20, offset: '28%', segments: [{ width: '44%', color: MID, pattern: true }] },
  { height: 28, offset: '21%', segments: [{ width: '36%', color: DARK }, { width: '30%', color: LIGHT }] },
];

function BarSet() {
  return (
    <div className={styles.set}>
      {ROWS.map((row, i) => {
        // Sum the segments' widths (as fractions of the overall column) to
        // get this row's own total width, then re-express each segment as
        // a percentage OF THE ROW — nested percentages need a definite
        // parent width to resolve against at every level, or they collapse
        // to zero (which is exactly what happened before this fix).
        const rowWidthPercent = row.segments.reduce(
          (sum, seg) => sum + parseFloat(seg.width),
          0
        );

        return (
          <div
            key={i}
            className={styles.row}
            style={{
              height: row.height,
              width: `${rowWidthPercent}%`,
              marginRight: row.offset,
            }}
          >
            {row.segments.map((seg, j) => (
              <div
                key={j}
                className={styles.segment}
                style={{
                  width: `${(parseFloat(seg.width) / rowWidthPercent) * 100}%`,
                  backgroundColor: seg.pattern ? 'transparent' : seg.color,
                  backgroundImage: seg.pattern
                    ? `repeating-linear-gradient(0deg, ${seg.color} 0px, ${seg.color} 2px, transparent 2px, transparent 5px)`
                    : undefined,
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/**
 * A tall, dense stack of two-tone bar rows that continuously auto-scrolls
 * upward, looping seamlessly forever. Renders the same row set twice
 * back-to-back and animates exactly one set-height upward on a CSS loop,
 * so the seam is invisible.
 */
export function SlidingBars() {
  return (
    <div className={styles.viewport} aria-hidden="true">
      <div className={styles.track}>
        <BarSet />
        <BarSet />
      </div>
    </div>
  );
}
