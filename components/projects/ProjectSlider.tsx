"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { Pill } from "@/components/ui/Pill";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { PROJECTS, type Project } from "./projects-data";
import styles from "./ProjectSlider.module.css";

/** Pointer travel past this many px counts as a drag, not a click — the
 *  reference design lacks this guard, so releasing a drag over a CTA fires
 *  it as a click. */
const DRAG_THRESHOLD = 5;

export function ProjectSlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startLeft: number;
    dragging: boolean;
  } | null>(null);
  const draggedRef = useRef(false);
  const reducedMotion = useReducedMotion();

  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  /* Trailing spacer so every card — including the last — has its own
     reachable scroll position. Without it: at desktop/tablet widths,
     several cards are visible at once, so the browser clamps `scrollLeft`
     at `scrollWidth - clientWidth` long before the later cards' natural
     offsetLeft is reached — e.g. with 3 ~400px cards in a ~1040px track,
     the real max scroll is ~200px, while the last card sits at ~840px.
     Dot 2 (`scrollToIndex(1)`) and dot 3 both clamp to the SAME position,
     so clicking dot 2 visibly activates dot 3 instead. Padding the track
     with (trackWidth - cardWidth) of empty trailing space makes the last
     card's position exactly reachable, which — since every earlier card
     needs less scroll than the last — makes all of them independently
     reachable too. Re-measured via ResizeObserver so it stays correct
     across breakpoints and orientation changes. */
  const [spacerWidth, setSpacerWidth] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      setSpacerWidth(Math.max(0, el.clientWidth - card.getBoundingClientRect().width));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let raf = 0;
    // Active card = whichever one's start edge is closest to the track's
    // current scroll position — NOT `scrollLeft / cardWidth`. That uniform
    // step assumes every card gets its own independent scroll position,
    // which only holds when exactly one card is visible at a time (narrow
    // viewports). On desktop/tablet, several cards are visible at once, so
    // the browser clamps `scrollLeft` at `scrollWidth - clientWidth` before
    // the later cards ever reach that assumed position — a fixed step
    // either never reaches the last index or misassigns it to an earlier
    // one. Position-based matching is correct regardless of how many cards
    // fit in view.
    const updateActive = () => {
      raf = 0;
      // el.children's last entry is the trailing spacer, not a card.
      const children = (Array.from(el.children) as HTMLElement[]).slice(0, PROJECTS.length);
      if (!children.length) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      let index = children.length - 1;
      if (maxScroll > 0 && el.scrollLeft < maxScroll - 1) {
        let closest = Infinity;
        children.forEach((child, i) => {
          const dist = Math.abs(child.offsetLeft - el.offsetLeft - el.scrollLeft);
          if (dist < closest) {
            closest = dist;
            index = i;
          }
        });
      }

      if (index !== activeIndexRef.current) {
        activeIndexRef.current = index;
        setActiveIndex(index);
      }
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(updateActive);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    // Resizing (breakpoint change, orientation change) can change how many
    // cards are visible without firing a scroll event — re-evaluate then too.
    window.addEventListener("resize", onScroll);
    updateActive();
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = trackRef.current;
      const card = el?.children[index] as HTMLElement | undefined;
      if (!el || !card) return;
      el.scrollTo({
        left: card.offsetLeft - el.offsetLeft,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    },
    [reducedMotion],
  );

  // Mouse/pen drag-to-scroll. Touch is left to native momentum scrolling.
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "touch") return;
      const el = trackRef.current;
      if (!el) return;
      dragRef.current = {
        startX: e.clientX,
        startLeft: el.scrollLeft,
        dragging: false,
      };
      draggedRef.current = false;
      el.setPointerCapture(e.pointerId);
      el.style.scrollSnapType = "none";
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const state = dragRef.current;
      const el = trackRef.current;
      if (!state || !el) return;
      const delta = e.clientX - state.startX;
      if (!state.dragging && Math.abs(delta) > DRAG_THRESHOLD) {
        state.dragging = true;
        draggedRef.current = true;
        el.classList.add(styles.dragging);
      }
      if (state.dragging) el.scrollLeft = state.startLeft - delta;
    },
    [],
  );

  const endDrag = useCallback(() => {
    const el = trackRef.current;
    dragRef.current = null;
    if (el) {
      el.style.scrollSnapType = "x mandatory";
      el.classList.remove(styles.dragging);
    }
  }, []);

  // Capture-phase: swallow the click that would otherwise fire on a CTA
  // released at the end of a drag.
  const handleClickCapture = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (draggedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        draggedRef.current = false;
      }
    },
    [],
  );

  return (
    <div>
      <div
        ref={trackRef}
        className={styles.track}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={handleClickCapture}
      >
        {PROJECTS.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
        <div aria-hidden style={{ flex: "none", width: spacerWidth }} />
      </div>

      <div className={styles.dots} role="tablist" aria-label="Projects">
        {PROJECTS.map((project, i) => (
          <button
            key={project.title}
            type="button"
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Go to ${project.title}`}
            data-active={i === activeIndex || undefined}
            className={styles.dot}
            onClick={() => scrollToIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const hasCta = Boolean(project.liveUrl || project.repoUrl);

  return (
    <Card
      className={styles.card}
      eyebrow={
        <>
          <span>{project.index}</span>
          <span>{project.year}</span>
        </>
      }
      title={project.title}
      description={project.description}
      footer={
        hasCta && (
          <>
            {project.liveUrl && (
              <LinkButton
                href={project.liveUrl}
                variant="primary"
                external
                className={styles.cta}
              >
                Live site →
              </LinkButton>
            )}
            {project.repoUrl && (
              <LinkButton
                href={project.repoUrl}
                variant="ghost"
                external
                className={styles.cta}
              >
                GitHub
              </LinkButton>
            )}
          </>
        )
      }
    >
      <div className={styles.chips}>
        {project.stack.map((tech) => (
          <Pill key={tech} radius="sm" className={styles.chip}>
            {tech}
          </Pill>
        ))}
      </div>
    </Card>
  );
}
