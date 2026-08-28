'use client';

import { LayoutGroup } from 'motion/react';
import { useActiveSection } from '@/lib/hooks/useActiveSection';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { NavMobile } from './NavMobile';
import { NavRail } from './NavRail';
import { useNavScroll } from './useNavScroll';
import { SECTION_IDS } from './nav-links';

/* Project breakpoints: sm 600, md 1023. */
const TABLET_UP = '(min-width: 600px)';
const DESKTOP_UP = '(min-width: 1024px)';

/**
 * Orchestrator. Owns the scroll state and picks which of the two nav trees
 * is mounted.
 *
 * The two trees are CONDITIONALLY RENDERED, never both mounted and toggled
 * with CSS: the rail's active indicator is a `layoutId` element, and two live
 * elements sharing a layoutId fight over projection. One mounted tree makes
 * "exactly one indicator" structural rather than something to remember.
 */
export function Navbar() {
  const { activeId, activeIndex, select } = useActiveSection(SECTION_IDS);
  const { condensed, progress } = useNavScroll(SECTION_IDS, activeIndex);
  const isTabletUp = useMediaQuery(TABLET_UP);
  const isDesktopUp = useMediaQuery(DESKTOP_UP);
  const reducedMotion = useReducedMotion();

  return (
    <LayoutGroup id="nav">
      {isTabletUp ? (
        <NavRail
          activeId={activeId}
          /* Below 1024px there is no room for the full bar, so the rail is
             condensed from load and the hero trigger never applies. */
          condensed={!isDesktopUp || condensed}
          progress={progress}
          reducedMotion={reducedMotion}
          onSelect={select}
        />
      ) : (
        <NavMobile
          activeId={activeId}
          reducedMotion={reducedMotion}
          onSelect={select}
        />
      )}
    </LayoutGroup>
  );
}
