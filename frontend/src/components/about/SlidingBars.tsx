import styles from './SlidingBars.module.css';

interface BarConfig {
  width: string;
  height: number;
  color: string;
  /** Striped/barcode texture instead of a flat fill. */
  pattern?: boolean;
  /** Right-side inset — varying this (instead of flush-right for every
      bar) is what gives the reference its jagged, collaged look rather
      than a neat uniform column. */
  offset?: string;
}

// Purely decorative — chosen for contrast against this page's dark
// background, with texture/offset variety for visual richness.
const BARS: BarConfig[] = [
  { width: '42%', height: 88, color: '#4E5965', offset: '0%' },
  { width: '64%', height: 56, color: '#8A9399', pattern: true, offset: '5%' },
  { width: '30%', height: 128, color: 'var(--accent-color, #E8543A)', offset: '12%' },
  { width: '52%', height: 64, color: '#F0F2F0', offset: '0%' },
  { width: '68%', height: 48, color: '#8A9399', offset: '7%' },
  { width: '36%', height: 104, color: '#4E5965', pattern: true, offset: '2%' },
  { width: '58%', height: 60, color: '#F0F2F0', offset: '9%' },
  { width: '46%', height: 72, color: '#8A9399', pattern: true, offset: '0%' },
  { width: '72%', height: 44, color: '#4E5965', offset: '4%' },
  { width: '34%', height: 96, color: 'var(--accent-color, #E8543A)', offset: '14%' },
  { width: '60%', height: 52, color: '#F0F2F0', pattern: true, offset: '2%' },
  { width: '40%', height: 84, color: '#8A9399', offset: '6%' },
];

function BarSet() {
  return (
    <div className={styles.set}>
      {BARS.map((bar, i) => (
        <div
          key={i}
          className={styles.bar}
          style={{
            width: bar.width,
            height: bar.height,
            marginRight: bar.offset ?? '0%',
            backgroundColor: bar.pattern ? 'transparent' : bar.color,
            backgroundImage: bar.pattern
              ? `repeating-linear-gradient(0deg, ${bar.color} 0px, ${bar.color} 2px, transparent 2px, transparent 5px)`
              : undefined,
          }}
        />
      ))}
    </div>
  );
}

/**
 * A tall, dense stack of bars that continuously auto-scrolls upward,
 * looping seamlessly forever — not a one-time entrance animation. The
 * track renders the same bar set twice back-to-back and animates exactly
 * one set-height upward on a CSS loop, so the seam is invisible.
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
