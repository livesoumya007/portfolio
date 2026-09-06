'use client';

import { LayoutGroup } from 'motion/react';
import { useActiveSection } from '@/lib/hooks/useActiveSection';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { NavRail } from './NavRail';
import { useNavScroll } from './useNavScroll';
import { SECTION_IDS } from './nav-links';

import styles from './Navbar.module.css';

const DESKTOP_UP = '(min-width: 1024px)';

/**
 * Orchestrator. Owns the scroll state and renders NavRail as the single nav
 * component. Below 1024px the rail is permanently condensed (icon-only with
 * one active label); on desktop it stays in full view.
 */
export function Navbar() {
  const { activeId, activeIndex, select } = useActiveSection(SECTION_IDS);
  const { progress } = useNavScroll(SECTION_IDS, activeIndex);
  const isDesktopUp = useMediaQuery(DESKTOP_UP);
  const reducedMotion = useReducedMotion();

  return (
    <>
      <div className={styles.scrim} aria-hidden="true" />
      <LayoutGroup id="nav">
        <NavRail
          activeId={activeId}
          condensed={!isDesktopUp}
          progress={progress}
          reducedMotion={reducedMotion}
          onSelect={select}
        />
      </LayoutGroup>
    </>
  );
}

