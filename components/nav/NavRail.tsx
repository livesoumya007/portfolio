'use client';

import type { MouseEvent } from 'react';
import { m, type MotionValue } from 'motion/react';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { LinkButton } from '@/components/ui/LinkButton';
import { ProgressRing } from './ProgressRing';
import {
  CONTACT_HREF,
  HERO_ID,
  LINKS,
  MORPH_DURATION,
  MORPH_EASE,
} from './nav-links';
import styles from './NavRail.module.css';

export type NavRailProps = {
  activeId: string;
  condensed: boolean;
  progress: MotionValue<number>;
  reducedMotion: boolean;
  onSelect: (id: string, smooth: boolean) => void;
};

/**
 * Tablet and desktop share this component because a rail is just the
 * condensed variant of the bar — tablet pins `condensed`, desktop derives it
 * from the hero's bottom edge.
 *
 * There is deliberately ONE tree here, never a full version and a condensed
 * version swapped at a breakpoint: `data-condensed` on the root drives every
 * difference through CSS transitions, so the bar reads as a single element
 * resizing rather than one element replacing another.
 */
export function NavRail({
  activeId,
  condensed,
  progress,
  reducedMotion,
  onSelect,
}: NavRailProps) {
  const handle = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    onSelect(id, !reducedMotion);
  };

  return (
    <GlassSurface
      as="nav"
      radius="full"
      glow="subtle"
      aria-label="Main navigation"
      data-condensed={condensed || undefined}
      className={styles.rail}
    >
      <a
        href={`#${HERO_ID}`}
        onClick={handle(HERO_ID)}
        className={styles.brand}
        title="Back to top"
      >
        {/* Both wordmark forms live in this one element and cross-fade —
            swapping between two separate elements would break the "one
            element resizing" reading of the morph. */}
        <span className={styles.wordmark}>
          <span className={styles.brace}>{'{'}</span>
          soumya
          <span className={styles.dot}>.dev</span>
          <span className={styles.brace}>{'}'}</span>
        </span>
        <span className={styles.monogram}>
          <ProgressRing progress={progress}>S</ProgressRing>
        </span>
      </a>

      <span className={styles.divider} aria-hidden />

      <ul className={styles.links}>
        {LINKS.map(({ id, label, Icon }) => {
          const isActive = id === activeId;
          return (
            <li key={id} className={styles.item}>
              <a
                href={`#${id}`}
                onClick={handle(id)}
                title={label}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={styles.link}
              >
                {isActive && (
                  <m.span
                    data-nav-indicator
                    /* Omitted rather than paired with layout={false}:
                       layoutId implies projection, so the only way to truly
                       disable the slide is to not declare it. The indicator
                       then remounts at the new position — an instant jump —
                       while its CSS style transitions still run. */
                    layoutId={reducedMotion ? undefined : 'nav-indicator'}
                    /* Inline so Motion's projection can correct the radius
                       while the box is being transformed. */
                    style={{ borderRadius: 999 }}
                    transition={{ duration: MORPH_DURATION, ease: MORPH_EASE }}
                    className={styles.indicator}
                  />
                )}
                <Icon size={16} stroke={1.8} className={styles.icon} />
                <span className={styles.label}>{label}</span>
              </a>
            </li>
          );
        })}
      </ul>

      <span className={styles.divider} aria-hidden />

      {/* The filled-pill look, elevation and hover all come from LinkButton's
          `primary` variant; this only retunes the box to nav scale. */}
      <LinkButton
        href={CONTACT_HREF}
        variant="primary"
        onClick={handle('contact')}
        title="Go to contact section"
        aria-label="Go to contact section"
        className={styles.cta}
      >
        <MailIcon />
        <span className={styles.ctaLabel}>Let&apos;s talk</span>
      </LinkButton>
    </GlassSurface>
  );
}

/* The CTA keeps the design's envelope rather than reusing the Contact link's
   Tabler icon — side by side in the condensed rail, two identical glyphs
   would read as the same control twice. */
function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.icon}
      aria-hidden
      focusable="false"
    >
      <path d="M4 5h16v14H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}
