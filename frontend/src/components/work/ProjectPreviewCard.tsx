import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import styles from './ProjectPreviewCard.module.css';
import type { Project } from '../../data/projects';

interface ProjectPreviewCardProps {
  project: Project | null;
  isActive: boolean;
}

export const ProjectPreviewCard: React.FC<ProjectPreviewCardProps> = ({ project, isActive }) => {
  const [imageError, setImageError] = useState(false);
  // Keep a local copy of the project so we can fade it out smoothly even when the prop becomes null
  const [displayedProject, setDisplayedProject] = useState<Project | null>(project);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync displayed project when active
  useEffect(() => {
    if (project) {
      setDisplayedProject(project);
    }
  }, [project]);

  // Reset image error state when project changes
  useEffect(() => {
    setImageError(false);
  }, [displayedProject?.id]);

  // Handle pointer tracking with GSAP quickTo
  useEffect(() => {
    if (!containerRef.current) return;

    // Use GSAP quickTo for high-performance lerping
    const xTo = gsap.quickTo(containerRef.current, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(containerRef.current, 'y', { duration: 0.6, ease: 'power3' });

    const handleMouseMove = (e: MouseEvent) => {
      // Offset by half width/height so mouse is centered on the card
      const width = 400; // Match CSS width
      const height = 400 / (4 / 5); // Match CSS aspect-ratio

      let targetX = e.clientX - width / 2;
      let targetY = e.clientY - height / 2;

      // Constrain within viewport bounds
      const margin = 20;
      targetX = Math.max(margin, Math.min(targetX, window.innerWidth - width - margin));
      targetY = Math.max(margin, Math.min(targetY, window.innerHeight - height - margin));

      xTo(targetX);
      yTo(targetY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Handle Visibility Transitions
  useEffect(() => {
    if (!containerRef.current) return;
    
    if (isActive && displayedProject) {
      gsap.to(containerRef.current, {
        opacity: 1,
        scale: 1,
        autoAlpha: 1,
        duration: 0.4,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    } else {
      gsap.to(containerRef.current, {
        opacity: 0,
        scale: 0.95,
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power3.in',
        overwrite: 'auto'
      });
    }
  }, [isActive, displayedProject]);

  if (!displayedProject) return null;

  return (
    <div ref={containerRef} className={styles.previewContainer}>
      <div className={styles.previewHeader}>
        <span>PREVIEW // P/{displayedProject.index}</span>
        <span>{displayedProject.year}</span>
      </div>
      <div className={styles.previewImageContainer}>
        {!imageError && displayedProject.asset ? (
          <img 
            src={displayedProject.asset} 
            alt={displayedProject.title} 
            className={styles.previewImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.placeholderImage}>NO_SIGNAL</div>
        )}
      </div>
    </div>
  );
};
