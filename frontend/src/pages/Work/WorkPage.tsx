import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../state/useAppStore';
import { projects } from '../../data/projects';
import { ProjectThumbnailStrip } from '../../components/work/ProjectThumbnailStrip';
import { WorksPreloader } from '../../components/work/WorksPreloader';
import { WorksNavbar } from '../../components/work/WorksNavbar';
import { useLenisScroll } from '../../hooks/useLenisScroll';
import { useInfiniteScrollLoop } from '../../hooks/useInfiniteScrollLoop';
import { useScrambleText } from '../../hooks/useScrambleText';
import styles from './WorkPage.module.css';

/** The list renders 3x back-to-back (prev / current / next) to loop seamlessly. */
const COPIES = [0, 1, 2] as const;
const MIDDLE_COPY = 1;

interface RowProps {
  index: string;
  title: string;
  year: string;
  slug: string;
  thumbnails: string[];
  isHovered: boolean;
  isDimmed: boolean;
  decodeTrigger: number;
  shouldDecode: boolean;
  onHover: () => void;
}

function ProjectRow({
  index,
  title,
  year,
  slug,
  thumbnails,
  isHovered,
  isDimmed,
  decodeTrigger,
  shouldDecode,
  onHover,
}: RowProps) {
  const isActive = isHovered;

  // `shouldDecode` gates the animation itself (not just the displayed text) —
  // off-screen loop copies never run scramble timers at all, only the
  // visible middle copy does. See useScrambleText's `enabled` param.
  const decodedIndex = useScrambleText(index, decodeTrigger, undefined, shouldDecode);
  const decodedTitle = useScrambleText(
    title,
    decodeTrigger,
    { cyclesPerChar: 6, cycleSpeed: 24, staggerPerChar: 18 },
    shouldDecode
  );
  const decodedYear = useScrambleText(year, decodeTrigger, undefined, shouldDecode);

  return (
    <li className={styles.rowWrapper}>
      <Link
        to={`/work/${slug}`}
        className={`${styles.projectRow} ${isDimmed ? styles.rowDimmed : ''}`}
        onMouseEnter={onHover}
      >
        <span className={styles.sideLine}>
          <span className={`${styles.sideLineIndex} ${isActive ? styles.textActive : ''}`}>
            {decodedIndex}
          </span>
          <span className={`${styles.sideLineMark} ${isActive ? styles.sideLineMarkActive : ''}`} />
        </span>

        <span className={`${styles.projectTitle} ${isActive ? styles.textActive : ''}`}>
          {decodedTitle}
        </span>

        <ProjectThumbnailStrip thumbnails={thumbnails} isActive={isActive} />

        <span aria-hidden="true" />

        <span className={`${styles.projectYear} ${isActive ? styles.textActive : ''}`}>
          {decodedYear}
        </span>
      </Link>
    </li>
  );
}

export default function WorkPage() {
  const hasVisitedWork = useAppStore((s) => s.visitedViews.work);
  const markVisited = useAppStore((s) => s.markVisited);

  const [preloaderDone, setPreloaderDone] = useState(hasVisitedWork);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [decodeTrigger, setDecodeTrigger] = useState(0);
  const [hasDecodedOnce, setHasDecodedOnce] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null); // the .scrollViewport element
  const contentRef = useRef<HTMLDivElement>(null);
  const middleListRef = useRef<HTMLUListElement>(null); // measured for loop height
  const singleHeightRef = useRef<number>(0);

  const isHovering = hoveredKey !== null;

  const lenisRef = useLenisScroll(wrapperRef, contentRef);
  useInfiniteScrollLoop(lenisRef, singleHeightRef, preloaderDone);

  // Measure the middle copy's height so the loop hook knows where to wrap.
  useEffect(() => {
    if (!preloaderDone || !middleListRef.current) return;

    const measure = () => {
      if (middleListRef.current) {
        singleHeightRef.current = middleListRef.current.offsetHeight;
      }
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(middleListRef.current);
    return () => observer.disconnect();
  }, [preloaderDone]);

  useEffect(() => {
    if (!preloaderDone || hasDecodedOnce) return;
    setDecodeTrigger((n) => n + 1);
    setHasDecodedOnce(true);
  }, [preloaderDone, hasDecodedOnce]);

  const scrollToTop = () => {
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(singleHeightRef.current, { immediate: false });
  };

  return (
    <>
      {!preloaderDone && (
        <WorksPreloader 
          onComplete={() => {
            setPreloaderDone(true);
            markVisited('work');
          }} 
        />
      )}

      <div className={styles.page}>
        <WorksNavbar onProjectsClick={scrollToTop} />

        <div className={styles.scrollViewport} ref={wrapperRef}>
          <div className={styles.scrollContent} ref={contentRef}>
            {COPIES.map((copyIndex) => (
              <ul
                key={copyIndex}
                className={styles.projectList}
                role="list"
                ref={copyIndex === MIDDLE_COPY ? middleListRef : undefined}
                onMouseLeave={() => setHoveredKey(null)}
              >
                {projects.map((project) => {
                  const rowKey = `${project.id}::${copyIndex}`;

                  return (
                    <ProjectRow
                      key={rowKey}
                      index={project.index}
                      title={project.title}
                      year={project.year}
                      slug={project.slug}
                      thumbnails={project.thumbnails}
                      isHovered={hoveredKey === rowKey}
                      isDimmed={isHovering && hoveredKey !== rowKey}
                      decodeTrigger={decodeTrigger}
                      shouldDecode={copyIndex === MIDDLE_COPY}
                      onHover={() => setHoveredKey(rowKey)}
                    />
                  );
                })}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
