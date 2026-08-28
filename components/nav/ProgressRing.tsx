'use client';

import { m, type MotionValue } from 'motion/react';
import styles from './ProgressRing.module.css';

export type ProgressRingProps = {
  /** 0–1 reading progress, written on the scroll frame. */
  progress: MotionValue<number>;
  /** Monogram rendered inside the ring. */
  children: string;
};

/**
 * The condensed-state monogram, wrapped in a page-progress ring.
 *
 * `pathLength` is fed the MotionValue directly rather than through state, so
 * the stroke repaints on the scroll frame without re-rendering the nav. Motion
 * normalises pathLength to 0–1 and drives strokeDasharray under the hood, so
 * no dash arithmetic is needed here.
 */
export function ProgressRing({ progress, children }: ProgressRingProps) {
  return (
    <span className={styles.ring}>
      <svg viewBox="0 0 100 100" className={styles.svg} aria-hidden focusable="false">
        <circle cx="50" cy="50" r="46" className={styles.track} />
        <m.circle
          cx="50"
          cy="50"
          r="46"
          className={styles.fill}
          style={{ pathLength: progress }}
        />
      </svg>
      <span className={styles.mark}>{children}</span>
    </span>
  );
}
