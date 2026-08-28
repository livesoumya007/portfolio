'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMotionValue, type MotionValue } from 'motion/react';
import { ACTIVE_SECTION_BAND } from '@/lib/hooks/useActiveSection';
import { HERO_ID } from './nav-links';

/* Hysteresis bounds for the condense transition. Two different thresholds on
   the same edge is exactly what an IntersectionObserver cannot express, which
   is why this is a scroll listener: a single IO threshold would flip back and
   forth every frame while the reader hovers on the boundary. */
const CONDENSE_AT = 0;
const EXPAND_AT = 80;

export type NavScroll = {
  /** True once the hero's bottom edge has passed the top of the viewport. */
  condensed: boolean;
  /** 0–1 reading progress, in section units. */
  progress: MotionValue<number>;
};

/**
 * One rAF-throttled passive scroll listener feeding both scroll-derived
 * outputs of the nav.
 *
 * `progress` is a MotionValue rather than state on purpose: the ring is
 * repainted on every scroll frame, and routing that through React would mean
 * a full re-render of the nav per frame. Writing into a MotionValue keeps it
 * on the compositor with zero re-renders.
 */
export function useNavScroll(
  sectionIds: readonly string[],
  activeIndex: number,
): NavScroll {
  const [condensed, setCondensed] = useState(false);
  const progress = useMotionValue(0);

  /* Read inside the scroll callback without re-subscribing the listener on
     every section change. */
  const activeIndexRef = useRef(activeIndex);

  const measureProgress = useCallback(() => {
    progress.set(readProgress(sectionIds, activeIndexRef.current));
  }, [sectionIds, progress]);

  /* The active section settles slightly AFTER the last scroll event — the
     observer callback lands, state updates, and by then no further scroll
     event is coming to recompute the ring. Without this the ring holds the
     previous section's value until the reader scrolls again. */
  useEffect(() => {
    activeIndexRef.current = activeIndex;
    measureProgress();
  }, [activeIndex, measureProgress]);

  useEffect(() => {
    let raf = 0;

    const measure = () => {
      raf = 0;

      const hero = document.getElementById(HERO_ID);
      if (hero) {
        const heroBottom = hero.getBoundingClientRect().bottom;
        setCondensed((prev) =>
          prev ? heroBottom < EXPAND_AT : heroBottom <= CONDENSE_AT,
        );
      }

      measureProgress();
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [measureProgress]);

  return { condensed, progress };
}

/**
 * Section-unit progress: each section owns an equal slice of the ring
 * regardless of how tall it is.
 *
 * Raw `scrollYProgress` would be misleading here — Hero and Contact are short
 * while Experience and Projects are tall, so the ring would crawl through the
 * middle of the page and lurch at both ends. Measuring in sections makes the
 * ring answer "how far through the story", which is what a reader reads it as.
 */
function readProgress(sectionIds: readonly string[], activeIndex: number): number {
  if (sectionIds.length === 0) return 0;

  /* The document can't scroll past its end, so without this the ring would
     stall short of full on any page whose last section is shorter than the
     viewport. */
  if (
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 2
  ) {
    return 1;
  }

  const el = document.getElementById(sectionIds[activeIndex]);
  if (!el) return activeIndex / sectionIds.length;

  const rect = el.getBoundingClientRect();
  const top = rect.top + window.scrollY;
  /* Same sight-line the scrollspy uses, so the ring and the lit item never
     disagree about which section you are in. */
  const line = window.scrollY + window.innerHeight * ACTIVE_SECTION_BAND;
  const within = clamp01((line - top) / Math.max(rect.height, 1));

  return (activeIndex + within) / sectionIds.length;
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}
