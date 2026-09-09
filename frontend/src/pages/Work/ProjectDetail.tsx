import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projects } from '../../data/projects';
import styles from './ProjectDetail.module.css';

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [heroError, setHeroError] = useState(false);

  const project = projects.find((p) => p.slug === slug);

  // ── 404 state ──────────────────────────────────────────────────────────────
  if (!project) {
    return (
      <div className={styles.page}>
        <nav className={styles.nav}>
          <Link to="/work" className={styles.backLink}>
            <span className={styles.backArrow}>←</span>
            Back to Works
          </Link>
        </nav>
        <div className={styles.notFound}>
          <span className={styles.notFoundCode}>404</span>
          <span>Project not found — {slug}</span>
          <Link to="/work" className={styles.backLink}>
            <span className={styles.backArrow}>←</span>
            Return to index
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* ── Terminal-style back nav ─────────────────────────────────── */}
      <nav className={styles.nav}>
        <Link to="/work" className={styles.backLink}>
          <span className={styles.backArrow}>←</span>
          Works
        </Link>
        <span className={styles.navSep}>/</span>
        <span className={styles.navSlug}>{project.slug}</span>
      </nav>

      {/* ── Hero image slot ─────────────────────────────────────────── */}
      <div className={styles.heroSlot}>
        <div className={styles.heroGrid} />
        {!heroError && project.asset ? (
          <img
            src={project.asset}
            alt={project.title}
            className={styles.heroImage}
            onError={() => setHeroError(true)}
          />
        ) : (
          <div className={styles.heroPlaceholder}>
            <span className={styles.heroPlaceholderLabel}>
              ASSET // {project.index}
            </span>
          </div>
        )}
      </div>

      {/* ── Metadata strip ──────────────────────────────────────────── */}
      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Index</span>
          <span className={styles.metaValue}>{project.index}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Year</span>
          <span className={styles.metaValue}>{project.year}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Category</span>
          <span className={styles.metaValue}>{project.category}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Status</span>
          <span className={styles.metaValue}>Coming Soon</span>
        </div>
      </div>

      {/* ── Title ───────────────────────────────────────────────────── */}
      <section className={styles.titleSection}>
        <h1 className={styles.projectTitle}>{project.title}</h1>
        <p className={styles.projectSubtitle}>{project.category} — {project.year}</p>
      </section>

      {/* ── Coming soon body ────────────────────────────────────────── */}
      <section className={styles.comingSoonSection}>
        <span className={styles.comingSoonTag}>Unreleased</span>
        <p className={styles.comingSoonText}>
          Coming Soon. This project will be published here.
        </p>
      </section>

    </div>
  );
}
