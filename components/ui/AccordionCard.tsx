"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { m, useInView } from "motion/react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { GlassSurface } from "./GlassSurface";
import styles from "./AccordionCard.module.css";

export type AccordionCardProps = {
  /** Always-visible content; becomes the label of the toggle button. */
  header: ReactNode;
  /** Optional leading column outside the toggle (e.g. a dot + vertical year). */
  rail?: ReactNode;
  /** Revealed body content. */
  children: ReactNode;
  /** Auto-open once this row scrolls into the reading band. Default true. */
  autoOpen?: boolean;
  /** Forces the initial state instead of waiting on autoOpen — the row then
   *  behaves as if the user had already toggled it. */
  defaultOpen?: boolean;
} & Omit<ComponentPropsWithoutRef<"div">, "children">;

/* A gentler curve than a typical ease-out: [0.22, 1, 0.36, 1] (quint-out)
   moves fast right out of the gate and only decelerates near the end, which
   reads as an abrupt "pop" the instant the row crosses the trigger line.
   [0.65, 0, 0.35, 1] ramps up and settles gradually at both ends, so the
   whole expand plays out as one smooth motion instead of a quick snap
   followed by a slow tail. Duration is also longer (0.75s vs 0.55s) so that
   gradual ramp has room to actually read as gradual. */
const EXPAND_TRANSITION = { duration: 0.75, ease: [0.65, 0, 0.35, 1] as const };
const REDUCED_TRANSITION = { duration: 0 };
/* Content fade-in starts this far into the height expansion, so the text
   settles in only once the row has mostly finished growing rather than
   racing the box open. Kept as a fraction of EXPAND_TRANSITION's duration
   so the two stay in proportion if the duration above ever changes. */
const REVEAL_DELAY = EXPAND_TRANSITION.duration * 0.68;

/**
 * A glass row that expands to reveal its body. Visually a sibling of Card
 * (same --card-* tokens, same diagonal glow) but structured for the
 * header-toggle / collapsible-body shape an accordion needs, which doesn't
 * fit Card's icon/title/description slots.
 *
 * Auto-open behaviour: each row watches its own scroll position and opens
 * once, the first time it crosses a line 40% down the viewport (`once: true`
 * in useInView latches that permanently). A manual toggle — before or after
 * — sets `userOpen`, which then wins over the automatic state forever: an
 * auto-opened row that's manually closed stays closed, and vice versa. No
 * shared state between rows; each is fully self-contained.
 */
export function AccordionCard({
  header,
  rail,
  children,
  autoOpen = true,
  defaultOpen,
  className,
  ...rest
}: AccordionCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  /* Margin collapses the observer's root to a single line pinned 40% down
     the viewport — not a band. rootMargin percentages are relative to the
     viewport, so this line sits at the same relative position on any screen
     size, and the card only auto-opens once its own box actually crosses
     it (not merely "has entered the viewport", which a wider/asymmetric
     band would trigger on well before the card reaches this line). */
  const inView = useInView(ref, { once: true, margin: "-35% 0px -65% 0px" });
  const [userOpen, setUserOpen] = useState<boolean | null>(defaultOpen ?? null);
  const open = userOpen ?? (autoOpen && inView);

  const reducedMotion = useReducedMotion();
  const transition = reducedMotion ? REDUCED_TRANSITION : EXPAND_TRANSITION;

  const headerId = useId();
  const bodyId = useId();

  /* The body's expanded height is measured, not assumed — this is what
     makes the animation correct for any amount of content (per spec).
     Motion's `height: 'auto'` target isn't itself animatable (there's
     nothing to tween from/to), so instead of animating TO the string
     'auto', we animate to this measured pixel value via the `animate`
     prop below.

     A ResizeObserver (not a `[children]`-keyed effect) drives the
     measurement: the content's natural height can change for reasons that
     have nothing to do with `children` changing — most commonly the text
     rewrapping to more lines at a narrower viewport. A dependency-keyed
     effect only re-measures when its deps change, so it goes stale on
     resize and silently clips whatever no longer fits (this shipped
     broken: chips were cut off on mobile because the height had been
     measured at a wider layout). ResizeObserver fires on every actual
     layout change to the observed element, which covers resize, content
     swaps, and font-load reflow in one mechanism. */
  const contentRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useLayoutEffect(() => {
    if (contentRef.current) setMeasuredHeight(contentRef.current.scrollHeight);
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() =>
      setMeasuredHeight(el.scrollHeight),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <GlassSurface
      ref={ref}
      radius="lg"
      glow="diagonal"
      data-open={open || undefined}
      className={cn(styles.row, open && styles.open, className)}
      {...rest}
    >
      {rail && <div className={styles.rail}>{rail}</div>}

      <div className={styles.content}>
        <button
          type="button"
          id={headerId}
          aria-expanded={open}
          aria-controls={bodyId}
          className={styles.header}
          onClick={() => setUserOpen(!open)}
        >
          <div className={styles.headerBody}>{header}</div>
          <span
            className={styles.chevron}
            data-open={open || undefined}
            aria-hidden
          >
            <ChevronIcon />
          </span>
        </button>

        {/* Animates to the measured pixel height (see the layout effect
            above), so this expands and collapses correctly no matter how
            much content the body holds. `inert` keeps keyboard focus and
            find-in-page out of a collapsed row without removing its content
            from the DOM (unlike unmounting it would). */}
        <m.div
          id={bodyId}
          role="region"
          aria-labelledby={headerId}
          inert={!open}
          initial={false}
          animate={{ height: open ? measuredHeight : 0 }}
          transition={transition}
          style={{ overflow: "hidden" }}
        >
          <m.div
            ref={contentRef}
            animate={{ opacity: open ? 1 : 0, y: open ? 0 : 12 }}
            transition={
              reducedMotion
                ? REDUCED_TRANSITION
                : {
                    opacity: { duration: 0.5, delay: open ? REVEAL_DELAY : 0 },
                    y: {
                      duration: 0.55,
                      delay: open ? REVEAL_DELAY : 0,
                      ease: [0.22, 1, 0.36, 1],
                    },
                  }
            }
            className={styles.body}
          >
            <div className={styles.divider} />
            {children}
          </m.div>
        </m.div>
      </div>
    </GlassSurface>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
