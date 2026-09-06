"use client";

import {
  useCallback,
  useEffect,
  useMemo,
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

  const [activePage, setActivePage] = useState(0);
  const activePageRef = useRef(0);

  const [cardsPerView, setCardsPerView] = useState(1);

  /* Measure how many full cards fit in the visible track. */
  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      const cardW = card.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      const trackW = el.clientWidth;
      const visible = Math.max(1, Math.floor((trackW + gap) / (cardW + gap)));
      setCardsPerView(visible);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(PROJECTS.length / cardsPerView)),
    [cardsPerView],
  );

  /* Track scroll position → active page. */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let raf = 0;
    const updateActive = () => {
      raf = 0;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      // Map scroll progress (0 → 1) to page index (0 → pageCount-1).
      const scrollFraction = Math.min(el.scrollLeft / maxScroll, 1);
      const page = Math.round(scrollFraction * (pageCount - 1));

      if (page !== activePageRef.current) {
        activePageRef.current = page;
        setActivePage(page);
      }
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(updateActive);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateActive();
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [cardsPerView, pageCount]);

  /* Scroll to the first card of the given page. */
  const scrollToPage = useCallback(
    (page: number) => {
      const el = trackRef.current;
      if (!el) return;
      const cardIndex = Math.min(page * cardsPerView, PROJECTS.length - 1);
      const card = el.children[cardIndex] as HTMLElement | undefined;
      if (!card) return;
      el.scrollTo({
        left: card.offsetLeft - el.offsetLeft,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    },
    [reducedMotion, cardsPerView],
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
      </div>

      {pageCount > 1 && (
        <div className={styles.dots} role="tablist" aria-label="Projects">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activePage}
              aria-label={`Go to page ${i + 1}`}
              data-active={i === activePage || undefined}
              className={styles.dot}
              onClick={() => scrollToPage(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const hasCta = Boolean(project.liveUrl || project.repoUrl);

  return (
    <Card
      className={styles.card}
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
                Live Site
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
