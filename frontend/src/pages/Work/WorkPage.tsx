import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../../data/projects';
import { ProjectPreviewCard } from '../../components/work/ProjectPreviewCard';
import type { Project } from '../../data/projects';
import styles from './WorkPage.module.css';

export default function WorkPage() {
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <span className={styles.headerLabel}>Selected Works</span>
        <span className={styles.headerCount}>
          {String(projects.length).padStart(2, '0')} Projects
        </span>
      </header>

      {/* ── Project list ────────────────────────────────────────────── */}
      <ul className={styles.projectList} role="list">
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              to={`/work/${project.slug}`}
              className={styles.projectRow}
              onMouseEnter={() => setActiveProject(project)}
              onMouseLeave={() => setActiveProject(null)}
            >
              <span className={styles.projectIndex}>{project.index}</span>
              <span className={styles.projectTitle}>{project.title}</span>
              <span className={styles.projectCategory}>{project.category}</span>
              <span className={styles.projectYear}>{project.year}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        © {new Date().getFullYear()} &nbsp;—&nbsp; khabirr.
      </footer>

      {/* ── Floating preview card (Phase 3/4 GSAP) ─────────────────── */}
      <ProjectPreviewCard
        project={activeProject}
        isActive={activeProject !== null}
      />
    </div>
  );
}
