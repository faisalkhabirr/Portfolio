import styles from './DialoguePanel.module.css';

// Phase 2: static shell only. No typewriter reveal, no dialogue state
// machine, no CTA pills — those are later phases per the approved
// architecture (DialoguePanel gets its content/state wiring in Phase 4,
// ActionButtons is a separate component that isn't built yet).
//
// The copy below is placeholder — swap it for your actual intro line.
export default function DialoguePanel() {
  return (
    <section className={styles.panel} aria-label="Introduction">
      <p className={styles.eyebrow}>Miam de la Banana</p>
      <h1 className={styles.heading}>
        Bello there, I'm Kevin, Khabir's Interactive Super Assistant
      </h1>
      <p className={styles.sub}>
        You, me, and the internet. Let’s do this. What’s up?
      </p>
      <div className={styles.actionsSlot} />
    </section>
  );
}
