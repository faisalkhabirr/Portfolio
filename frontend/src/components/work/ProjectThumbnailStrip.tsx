import React, { useState } from 'react';
import styles from './ProjectThumbnailStrip.module.css';

interface ProjectThumbnailStripProps {
  thumbnails: string[];
  isActive: boolean;
}

export const ProjectThumbnailStrip: React.FC<ProjectThumbnailStripProps> = ({
  thumbnails,
  isActive,
}) => {
  return (
    <div className={`${styles.strip} ${isActive ? styles.stripActive : ''}`}>
      {thumbnails.map((src, i) => (
        <Thumbnail key={src + i} src={src} />
      ))}
    </div>
  );
};

function Thumbnail({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={styles.thumb}>
        <div className={styles.placeholder}>
          <span>SOON</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.thumb}>
      <img
        src={src}
        alt=""
        className={styles.thumbImage}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
