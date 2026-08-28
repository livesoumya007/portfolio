import { useCallback, useEffect, useRef, useState } from 'react';

/* The observer root is squeezed to a thin band across the middle of the
   viewport, so "active" means "the section the reader is actually looking
   at" rather than "the section that happens to be on screen".

   THRESHOLD MUST STAY 0. These margins leave a root box only 5% of the
   viewport tall; any non-zero threshold asks a section to fit some fraction
   of ITSELF inside that band, which no real section is short enough to do —
   the callback then never reports an intersection and the active id never
   changes. That was the bug in the previous implementation (-20%/-70% with
   threshold 0.5), where the nav was permanently stuck on the initial seed. */
export const ACTIVE_SECTION_ROOT_MARGIN = '-45% 0px -50% 0px';
export const ACTIVE_SECTION_THRESHOLD = 0;

/** Matches the band's upper edge, so the ring and the lit item agree. */
export const ACTIVE_SECTION_BAND = 0.45;

/** Fallback release for the post-click observer lock, when `scrollend` is
 *  unavailable. */
const SUPPRESS_FALLBACK_MS = 600;
/** Hard ceiling, so a scroll that never settles can't lock the spy forever. */
const SUPPRESS_MAX_MS = 1500;

export type ActiveSection = {
  activeId: string;
  activeIndex: number;
  /** Light the target immediately, then scroll to it without the observer
   *  fighting the in-flight scroll. */
  select: (id: string, smooth: boolean) => void;
};

export function useActiveSection(ids: readonly string[]): ActiveSection {
  const [activeId, setActiveId] = useState<string>(() => resolveByGeometry(ids));

  /* Which sections currently touch the band. The observer reports deltas,
     not the full picture, so we accumulate. */
  const intersecting = useRef<Set<string>>(new Set());
  /* Set while a click-driven scroll is in flight. */
  const suppressed = useRef(false);
  const releaseTimers = useRef<number[]>([]);

  const resolve = useCallback(() => {
    if (suppressed.current) return;

    /* Several sections can touch a 5%-tall band at once. Document order is
       the stable tiebreak — intersection ratios are meaningless at this band
       height, since every ratio is a rounding artefact of the same sliver. */
    if (!isAtPageBottom()) {
      const next = ids.find((id) => intersecting.current.has(id));
      if (next) {
        setActiveId(next);
        return;
      }
    }

    /* Two cases land here: the page can't scroll any further (so the band
       is frozen and the observer will never fire again), or nothing is in
       the band at all. Both are answered by geometry — the last section the
       sight-line has passed. Deliberately NOT "force the last section": at
       the end of a page whose final section is short, that would light
       Contact while the reader is still looking at Projects. */
    setActiveId(resolveByGeometry(ids));
  }, [ids]);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) intersecting.current.add(entry.target.id);
          else intersecting.current.delete(entry.target.id);
        }
        resolve();
      },
      {
        rootMargin: ACTIVE_SECTION_ROOT_MARGIN,
        threshold: ACTIVE_SECTION_THRESHOLD,
      },
    );

    elements.forEach((el) => observer.observe(el));

    /* The bottom-of-page clamp above can't be driven by the observer: once
       the footer is parked below the band, nothing intersects and nothing
       fires. A rAF-throttled read of two numbers covers it. */
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        resolve();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ids, resolve]);

  /* Keep the URL in step without moving the page. Skipped on mount so a
     fresh load doesn't rewrite the address bar before the reader has
     scrolled anywhere. */
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    /* replaceState, never `location.hash =` — assigning the hash jumps the
       page and would also stack history entries on every scroll. */
    window.history.replaceState(null, '', `#${activeId}`);
  }, [activeId]);

  const select = useCallback((id: string, smooth: boolean) => {
    const el = document.getElementById(id);
    if (!el) return;

    releaseTimers.current.forEach(clearTimeout);
    releaseTimers.current = [];

    setActiveId(id);
    suppressed.current = true;

    const release = () => {
      suppressed.current = false;
      window.removeEventListener('scrollend', release);
    };

    /* A flat timer is the wrong shape here: a Home → Contact jump is still
       travelling long after any sensible fixed delay, and the observer would
       drag the indicator through every section on the way. `scrollend` fires
       exactly when the scroll settles; the timers only exist for browsers
       that lack it, and as a ceiling. */
    if (supportsScrollEnd()) {
      window.addEventListener('scrollend', release);
      releaseTimers.current.push(
        window.setTimeout(release, SUPPRESS_MAX_MS),
      );
    } else {
      releaseTimers.current.push(
        window.setTimeout(release, SUPPRESS_FALLBACK_MS),
      );
    }

    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  }, []);

  useEffect(() => {
    const timers = releaseTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const activeIndex = Math.max(0, ids.indexOf(activeId));
  return { activeId, activeIndex, select };
}

/* `'onscrollend' in window` would narrow `window` to never in TS, since the
   DOM lib doesn't declare the handler property yet. */
function supportsScrollEnd(): boolean {
  return 'onscrollend' in (window as object);
}

function isAtPageBottom(): boolean {
  return (
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 2
  );
}

/* Purely geometric answer to "which section is the reader in": the last one
   whose top edge the sight-line has crossed. Used for the first paint (so a
   mid-page reload lights the right item immediately rather than flashing
   Home) and as the fallback whenever the observer can't answer. */
function resolveByGeometry(ids: readonly string[]): string {
  if (typeof window === 'undefined') return ids[0];

  const line = window.scrollY + window.innerHeight * ACTIVE_SECTION_BAND;
  let best = ids[0];
  let bestTop = -Infinity;

  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const top = el.getBoundingClientRect().top + window.scrollY;
    if (top <= line && top > bestTop) {
      bestTop = top;
      best = id;
    }
  }
  return best;
}
